import dotenv from "dotenv";
import app from "./api/app";

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🔥 ChatTeam API running on port ${PORT}`);
});
