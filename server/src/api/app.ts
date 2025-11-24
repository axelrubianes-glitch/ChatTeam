import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes";
import meetingRoutes from "./routes/meeting.routes";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(cors());
app.use(express.json());

// User routes
app.use("/api/users", userRoutes);

// Meeting routes
app.use("/api/meetings", meetingRoutes);

// Test route
app.get("/", (_, res) => {
  res.json({ message: "ChatTeam Backend is running 🔥" });
});

export default app;

