// server/src/api/routes/user.routes.ts
import { Router } from "express";
import {
  registerUser,
  updateUserProfile,
  deleteUser,
  sendPasswordReset,
} from "../controllers/user.controller";

const router = Router();

/**
 * /api/users routes
 *
 * POST /register         -> registerUser
 * PUT  /update/:uid      -> updateUserProfile
 * DELETE /delete/:uid    -> deleteUser
 * POST /reset-password   -> sendPasswordReset
 */
router.post("/register", registerUser);
router.put("/update/:uid", updateUserProfile);
router.delete("/delete/:uid", deleteUser);
router.post("/reset-password", sendPasswordReset);

export default router;
