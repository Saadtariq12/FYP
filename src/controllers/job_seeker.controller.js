import { job_seeker } from "../models/job_seeker.model.js";
import { recruiter } from "../models/recruiter.model.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { PdfReader } from "pdfreader";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const parsePdfText = (buffer) => {
  return new Promise((resolve, reject) => {
    let rows = {};
    let fullText = "";

    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) return reject(err);
      if (!item) {
        const sortedYCoords = Object.keys(rows).sort(
          (a, b) => parseFloat(a) - parseFloat(b),
        );
        sortedYCoords.forEach((y) => {
          const lineItems = rows[y].sort((a, b) => a.x - b.x);
          const lineText = lineItems.map((i) => i.text).join(" ");
          fullText += lineText + "\n";
        });
        return resolve(fullText);
      }
      if (item.text) {
        const yKey = item.y.toFixed(2);
        if (!rows[yKey]) rows[yKey] = [];
        rows[yKey].push(item);
      }
    });
  });
};
const upload_resume = asyncHandler(async (req,res) => {
    try {
      if (!req.file || req.file.mimetype !== "application/pdf") {
        return res
          .status(400)
          .json({ error: "Please upload a valid PDF file." });
      }

      // console.log(`Processing file: ${req.file.originalname}`);
      const rawPdfText = await parsePdfText(req.file.buffer);

      console.log("PDF text extracted. Sending payload to Gemini API...");

      // calling the Gemini API to intelligently extract and format the skills
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an expert ATS (Applicant Tracking System) parser. Analyze the following resume text and extract all technical skills, programming languages, frameworks, databases, developer tools, and technical methodologies. Clean up any version numbers (e.g., turn "JavaScript (ES6+)" into just "JavaScript"). Return them as a flat list. Resume Text:\n${rawPdfText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
      });

      // parse Gemini's JSON string output into a native JavaScript Array
      const standardizedSkillsArray = JSON.parse(response.text);
      const add_to_schema = await job_seeker.create({
        user_id: req.user._id,
        skills: standardizedSkillsArray
      })
      console.log("\n--- Flawless AI-Extracted Skills Array ---");
      console.log(standardizedSkillsArray);
      console.log("-----------------------------------------\n");

      return res.status(200).json(
        new APIresponse(
          200,
          "Skills extracted and standardized via Gemini AI successfully.",
          {
            skillsCount: standardizedSkillsArray.length,
            skills: standardizedSkillsArray,
          },
        ),
      );
    } catch (error) {
      console.error("Processing failed:", error);
      return res.status(500).json({
        error: "An error occurred during AI processing.",
        details: error.message,
      });
    }
})

const find_recruiter = asyncHandler(async (req,res) => {
    const user = req.user._id;
    const profile = await job_seeker
      .findOne({ user_id: user })
      .select("skills");
    if(!profile){
        throw new APIError(404,"could not find any skills")
    }
    const skills = profile.skills
    const active_recruiters = await recruiter.aggregate([
      {
        $match: {
          skills_req: { $in: skills },
        },
      },

      {
        $lookup: {
          from: "users", //exact name of users schema
          localField: "user_id", 
          foreignField: "_id", 
          as: "userDetails", // temporary array name where the joined data will sit
        },
      },

      // to convert the userDetails array into a single flat object
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          _id: 0,
          email: "$userDetails.email", 
          username: "$userDetails.username",
        },
      },
    ]);
    if(!active_recruiters || active_recruiters.length===0){
        throw new APIError(404, "sorry, we couldnt find any active recruiters hiring for your skills/expertise. We'll notify you once we find one");
    }
    return res
      .status(200)
      .json(
        new APIresponse(
          200,
          "the following recruiters are found",
          active_recruiters,
        ),
      );
})
// 1. Helper function at the top of your controller file to generate vectors using the new @google/genai SDK
// async function getEmbedding(text) {
//   const response = await ai.models.embedContent({
//     model: "gemini-embedding-2", // <-- Set this to the current, supported embedding engine
//     contents: text,
//     config: {
//       // Optimizes the mathematical generation specifically for database retrieval queries
//       taskType: "RETRIEVAL_QUERY",
//     },
//   });

//   // Grabs the generated floating-point array values safely
//   return response.embeddings[0].values;
// } 

// // 2. Inside your find_recruiter controller, replace the query logic with this:
// const find_recruiter = asyncHandler(async (req, res) => {
//     const user = req.user._id;
    
//     const profile = await job_seeker.findOne({ user_id: user }).select("skills");
//     if (!profile || !profile.skills || profile.skills.length === 0) {
//         throw new APIError(404, "Could not find any skills for this user profile.");
//     }
    
//     // Convert the user's skills array into a single string line for the embedding model
//     const skillsString = profile.skills.join(", ");
    
//     console.log("🤖 Generating GenAI Semantic Vector Embedding for skills...");
//     const userSkillsVector = await getEmbedding(skillsString);

//     console.log("🔍 Running MongoDB Atlas Vector Search...");
//     const active_recruiters = await recruiter.aggregate([
//       {
//         $vectorSearch: {
//           index: "vector_index",              // The name of the index you create in Atlas
//           path: "requirements_vector",        // The vector field inside your Recruiter documents
//           queryVector: userSkillsVector,      // The target vector we just generated for the job seeker
//           numCandidates: 50,                  // How many nearby clusters to test
//           limit: 5                            // Max number of matching recruiters to return
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           email: 1,
//           username: 1,
//           // Optional: Includes a match score calculated by the AI (closer to 1.0 means a perfect fit)
//           matchScore: { $meta: "vectorSearchScore" } 
//         },
//       },
//     ]);

//     if (!active_recruiters || active_recruiters.length === 0) {
//         throw new APIError(404, "Sorry, we couldn't find any active recruiters semantically matching your profile.");
//     }

//     return res
//       .status(200)
//       .json(
//          new APIresponse(200, active_recruiters, "Semantically matched recruiters found successfully.")
//       );
// });

export {upload_resume, find_recruiter}