import dotenv from "dotenv";
import app from "./api/app";

dotenv.config();

const PORT = process.env.PORT || 4000;

/**
 * Start HTTP server.
 * Logs a message when the server is listening.
 *
 * @example
 * // starts server on port 4000 (or PORT env)
 * node dist/index.js
 */
app.listen(PORT, () => {
  console.log(`🔥 ChatTeam API running on port ${PORT}`);
});
