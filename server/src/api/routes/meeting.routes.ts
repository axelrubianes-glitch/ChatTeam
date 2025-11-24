import { Router } from "express";
import { createMeeting, getMeetings } from "../controllers/meeting.controller";

const router = Router();

router.post("/create", createMeeting);
router.get("/all", getMeetings);

export default router;
