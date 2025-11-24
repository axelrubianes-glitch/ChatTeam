// server/src/api/firebase/admin.ts

import admin from "firebase-admin";
import fs from "fs";
import path from "path";

type ServiceAccount = admin.ServiceAccount;

// ===============================
//  Carga de credenciales
//  - En Render: desde env FIREBASE_SERVICE_ACCOUNT
//  - En local: desde serviceAccountKey.json
// ===============================
let serviceAccount: ServiceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Entorno de producción (Render): viene como JSON en una variable de entorno
  serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT
  ) as ServiceAccount;
} else {
  // Entorno local: lee el archivo físico
  const serviceAccountPath = path.join(
    __dirname,
    "..",
    "..",
    "serviceAccountKey.json"
  );

  const fileContent = fs.readFileSync(serviceAccountPath, "utf8");
  serviceAccount = JSON.parse(fileContent) as ServiceAccount;
}

// Inicializar Firebase Admin una sola vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Firebase Admin Auth instance.
 * Use this to manage users (create, update, delete, generate links).
 */
export const auth = admin.auth();

/**
 * Firebase Admin Firestore instance.
 * Use this to read/write server-side documents.
 */
export const db = admin.firestore();

export default admin;
