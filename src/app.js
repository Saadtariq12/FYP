import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Allow your frontend to talk to your backend
// app.use(
//   cors({
//     origin: "http://localhost:5173", // Replace with your exact frontend URL (Devin's dev server port)
//   }),
// );

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routers/user.routes.js";
app.use("/api/v1/user", userRouter); // when /api/v1/users, pass onto userRouter(its path is defined)

import jobSeeker from "./routers/job_seeker.routes.js";
app.use("/findJob", jobSeeker);

import recruiter from "./routers/recruiter.routes.js";
app.use("/recruit", recruiter);
export { app };
