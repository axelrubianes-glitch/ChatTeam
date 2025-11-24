// server/src/api/controllers/user.controller.ts
import { Request, Response } from "express";
import { auth } from "../firebase/admin";

/**
 * Register or update a user record using Firebase Admin Auth.
 * Expects `uid`, `email` and optional `name` in the request body.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON result or error
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { uid, email, name } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ message: "UID and email are required." });
    }

    await auth.updateUser(uid, {
      displayName: name || "",
    });

    return res.json({ message: "User registered successfully." });
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Update basic profile fields for a user.
 * Path param: :uid
 * Body: { displayName?: string, photoURL?: string }
 *
 * @param {Request} req
 * @param {Response} res
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { displayName, photoURL } = req.body;

    await auth.updateUser(uid, { displayName, photoURL });

    return res.json({ message: "Profile updated." });
  } catch (error) {
    console.error("[UPDATE ERROR]", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Delete a user by UID (Firebase Auth).
 * Path param: :uid
 *
 * @param {Request} req
 * @param {Response} res
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    await auth.deleteUser(uid);

    return res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("[DELETE ERROR]", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Generate a password reset link for an email using Firebase Admin.
 * Expects `{ email }` in the request body.
 *
 * @param {Request} req
 * @param {Response} res
 */
export const sendPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const resetLink = await auth.generatePasswordResetLink(email);

    return res.json({
      message: "Password reset link generated.",
      resetLink,
    });
  } catch (error) {
    console.error("[RESET PASSWORD ERROR]", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
