// server/src/api/firebase/admin.ts

import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

// Path to the service account JSON for Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, "../../serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Initialize admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

/**
 * Firebase Admin Auth instance.
 * Use this to manage users (create, update, delete, generate links).
 * @type {import('firebase-admin').auth.Auth}
 */
export const auth = admin.auth();

/**
 * Firebase Admin Firestore instance.
 * Use this to read/write server-side documents.
 * @type {import('firebase-admin').firestore.Firestore}
 */
export const db = admin.firestore();

export default admin;
