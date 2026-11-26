import { Router } from "express";
import { loginUser, registerUser, getMe, forgotPassword, resetPassword, verifyResetCode } from "../controllers/authController.js";

import { protect } from "../middlewares/auth.js";

const authRouter = Router()

authRouter.post("/register", registerUser)
authRouter.post("/login", loginUser)
authRouter.post("/me", protect, getMe)
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-reset-code", verifyResetCode)
authRouter.post("/reset-password", resetPassword);

export default authRouter;