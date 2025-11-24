import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes";
import meetingRoutes from "./routes/meeting.routes";

const app = express();

/**
 * Express application for ChatTeam API.
 *
 * Middlewares:
 * - CORS configured for the frontend origin
 * - JSON body parsing
 *
 * Routes mounted:
 * - /api/users
 * - /api/meetings
 *
 * @module app
 */
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cors());
app.use(express.json());

// User routes
app.use("/api/users", userRoutes);

// Meeting routes
app.use("/api/meetings", meetingRoutes);

/**
 * Health check route.
 * @name GET /
 * @returns {Object} JSON status message
 */
app.get("/", (_, res) => {
  res.json({ message: "ChatTeam Backend is running 🔥" });
});

export default app;

