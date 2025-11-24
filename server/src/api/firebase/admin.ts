// server/src/api/firebase/admin.ts

import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

// Ruta al archivo de credenciales del SDK Admin
const serviceAccountPath = path.join(__dirname, "../../serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Evitar doble inicialización
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Exportar con los nombres correctos
export const auth = admin.auth();
export const db = admin.firestore();

export default admin;
