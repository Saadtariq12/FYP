import { Router } from "express";
import { search_employees } from "../controllers/recruiter.controller.js";
import { isRecruiter, verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/postJob").post(verifyJWT, isRecruiter, search_employees)
export default router