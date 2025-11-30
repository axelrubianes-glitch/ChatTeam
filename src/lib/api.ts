// src/lib/api.ts
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
console.log("API BASE = ", import.meta.env.VITE_API_BASE_URL);
