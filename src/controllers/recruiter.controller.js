import { job_seeker } from "../models/job_seeker.model.js";
import { recruiter } from "../models/recruiter.model.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

const eligibility_criteria = async (req_skills) => {
  const match_results = await job_seeker.aggregate([
    {
      // 1. Find the specific job seeker profile
      $match: {
        skills: { $in: req_skills },
      },
    },
    {
      // 2. Project only the dynamic mathematical size of the intersecting array elements
      $project: {
        _id: 0,
        total_skills_matched: {
          $size: { $setIntersection: ["$skills", req_skills] },
        },
      },
    },
  ]);
  // 3. Extract the clean number from the aggregation array response
  // If a match is found, return the number. If no match, fallback to 0.
  const matched_skills_count = match_results[0].total_skills_matched;
  const total_skills = req_skills.length;
  const score = (matched_skills_count / total_skills) * 100;
  return `${score}%`
};
const search_employees = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    throw new APIError(400, "Please provide an array of skills to search for.");
  }
  const add_entry = await recruiter.create({
    user_id: req.user._id,
    skills_req: skills,
  });
  await recruiter.findByIdAndUpdate(req.user._id, {
    $addToSet: { skills_req: { $each: skills } },
  });
  const employees = await job_seeker.aggregate([
    {
      $match: {
        skills: { $in: skills },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id", //ref field in job_seeker
        foreignField: "_id", //The matching field in User schema
        as: "employee_details",
      },
    },
    {
      $unwind: "$employee_details",
    },
    {
      $project: {
        _id: 0,
        email: "$employee_details.email",
        username: "$employee_details.username",
      },
    },
  ]);
  if (!employees || employees.length === 0) {
    return res
    .status(200)
    .json(
      new APIresponse("sorry, we could not find any employees to match your requirement. We'll notify you once we find one")
    )
  }
  console.log("calculating eligibility")
  const eligiblity = await eligibility_criteria(skills);
  console.log(eligiblity)
  return res.status(201).json(
    new APIresponse(201, "following employees match your requirements:", {
      employees,
      eligiblity,
    }),
  );
});

export {search_employees}