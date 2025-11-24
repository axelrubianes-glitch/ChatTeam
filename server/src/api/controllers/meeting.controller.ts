import { Request, Response } from "express";
import { db } from "../firebase/admin";

/**
 * Create a new meeting document.
 * Body: { title: string, ownerUid: string }
 *
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const createMeeting = async (req: Request, res: Response) => {
  try {
    const { title, ownerUid } = req.body;

    const ref = await db.collection("meetings").add({
      title,
      ownerUid,
      createdAt: new Date(),
    });

    return res.json({ message: "Meeting created", id: ref.id });
  } catch (error) {
    console.error("[MEETING CREATE ERROR]", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * Return all meeting documents.
 *
 * @param {Request} _req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
export const getMeetings = async (_: Request, res: Response) => {
  try {
    const snap = await db.collection("meetings").get();
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.json(data);
  } catch (error) {
    console.error("[MEETING LIST ERROR]", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
