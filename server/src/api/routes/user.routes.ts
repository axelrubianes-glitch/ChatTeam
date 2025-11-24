// server/src/api/routes/user.routes.ts
import { Router } from "express";
import {
  registerUser,
  updateUserProfile,
  deleteUser,
  sendPasswordReset,
} from "../controllers/user.controller";

const router = Router();

// Register
router.post("/register", registerUser);

// Update user
router.put("/update/:uid", updateUserProfile);

// Delete user
router.delete("/delete/:uid", deleteUser);

// Send reset password email
router.post("/reset-password", sendPasswordReset);

export default router;
