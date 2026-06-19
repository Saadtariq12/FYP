import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { APIError } from "../utils/APIerror.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Get token from cookies OR Authorization header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new APIError(401, "Unauthorized request - No token found");
    }

    // 2. Decode the token using your Secret Key
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Find user in DB (excluding sensitive data like password)
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new APIError(401, "Invalid Access Token");
    }

    // 4. ATTACH USER TO REQ OBJECT
    req.user = user;

    // 5. Pass control to the next function (the controller)
    next();
  } catch (error) {
    throw new APIError(401, error?.message || "Invalid access token");
  }
});
//job seeker auth
export const isJobSeeker = asyncHandler(async (req, res, next) => {
  // 1. Ensure verifyJWT ran successfully and attached the user profile
  if (!req.user) {
    throw new APIError(401, "Authentication required. Please log in first.");
  }

  // 2. Check the user's role property (matches the string in your User schema)
  if (req.user.role !== "job seeker") {
    throw new APIError(
      403,
      "Access denied. Only job seekers are allowed to look for jobs or upload resumes.",
    );
  }

  // 3. If validation succeeds, move directly forward
  next();
});

// recruiter auth
export const isRecruiter = asyncHandler(async (req, res, next) => {
  // 1. Ensure verifyJWT ran successfully and attached the user profile
  if (!req.user) {
    throw new APIError(401, "Authentication required. Please log in first.");
  }

  // 2. Check if the user is authorized as a recruiter
  if (req.user.role !== "recruiter") {
    throw new APIError(
      403,
      "Access denied. Only authorized recruiters are permitted to use employee search mechanics.",
    );
  }

  // 3. Validation passed, safely proceed to the controller
  next();
});