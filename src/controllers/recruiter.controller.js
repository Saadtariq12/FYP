import { job_seeker } from "../models/job_seeker.model.js";
import { recruiter } from "../models/recruiter.model.js";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

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
    throw new APIError(
      404,
      "no employees found currently that match your requirements, we will notify you once we found one",
    );
  }
  return res
    .status(201)
    .json(
      new APIresponse(
        201,
        "following employees match your requirements:",
        employees,
      ),
    );
});

export {search_employees}