import { Router } from "express";
import {
  login,
  registerUser,
  choose_role,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();
router.route("/register").post(registerUser);
router.route("/login").post(login);
router.route("/role").post(verifyJWT,choose_role);
export default router;
