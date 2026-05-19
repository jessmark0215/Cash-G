// ==========================================================================
// FIREBASE CONFIGURATION - Cash-G E-Wallet
// ==========================================================================
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (e.g., "cash-g-wallet")
// 3. Add a Web App and copy the firebaseConfig object below
// 4. Enable "Realtime Database" (Build → Realtime Database → Create Database)
//    - Start in TEST mode for development
// 5. Replace the placeholder values below with your real config
// ==========================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, set, get, child, update, remove, push, onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// 🔑 REPLACE THIS WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB_3N1PTkMsOAdR2wlP2g86ZKS77YdN9PY",
  authDomain: "ias-db.firebaseapp.com",
  databaseURL: "https://ias-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ias-db",
  storageBucket: "ias-db.firebasestorage.app",
  messagingSenderId: "394891861557",
  appId: "1:394891861557:web:0d20999d07851b54659b7c",
  measurementId: "G-L642F8ZPTP"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ==========================================================================
// SECURITY UTILITIES
// ==========================================================================

// SHA-256 hashing using browser-native Web Crypto API (NOT plain text)
export async function hashPassword(password) {
  const enc  = new TextEncoder().encode(password);
  const buf  = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
              .map(b => b.toString(16).padStart(2, "0"))
              .join("");
}

// Strong-password validator
export function validatePassword(pwd) {
  const errors = [];
  if (pwd.length < 8)          errors.push("at least 8 characters");
  if (!/[A-Z]/.test(pwd))      errors.push("an uppercase letter");
  if (!/[a-z]/.test(pwd))      errors.push("a lowercase letter");
  if (!/[0-9]/.test(pwd))      errors.push("a number");
  return { valid: errors.length === 0, errors };
}

// Input sanitiser — strips dangerous characters
export function sanitize(input) {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>"']/g, "");
}

// Activity logger
export async function logActivity(username, action, status) {
  const logsRef = ref(db, "logs");
  await push(logsRef, {
    username, action, status,
    timestamp: new Date().toISOString()
  });
}

// ==========================================================================
// SEED DEFAULT ADMIN  (runs once — only if /admins is empty)
// Admins are stored in /admins (SEPARATE from /users) so regular users
// querying /users cannot see admin accounts. This is a hard separation
// enforced at the database structure level.
// ==========================================================================
export async function seedDefaultAdmin() {
  const snap = await get(child(ref(db), "admins"));
  if (snap.exists()) return;

  const adminHash  = await hashPassword("Admin@123");
  const answerHash = await hashPassword("blue");

  await set(ref(db, "admins/admin"), {
    username:       "admin",
    passwordHash:   adminHash,
    role:           "admin",
    fullName:       "System Administrator",
    email:          "[email protected]",
    securityQ:      "What is your favorite color?",
    securityAhash:  answerHash,
    createdAt:      new Date().toISOString()
  });

  console.log("✅ Default admin seeded in /admins → user: admin / pass: Admin@123 / answer: blue");
}

// ==========================================================================
// LOOK UP AN ACCOUNT (checks /admins first, then /users)
// Returns { data, path } or null.
// ==========================================================================
export async function lookupAccount(username) {
  // Try admins first
  const adminSnap = await get(child(ref(db), `admins/${username}`));
  if (adminSnap.exists()) {
    return { data: adminSnap.val(), path: `admins/${username}` };
  }
  // Then users
  const userSnap = await get(child(ref(db), `users/${username}`));
  if (userSnap.exists()) {
    return { data: userSnap.val(), path: `users/${username}` };
  }
  return null;
}

export { db, ref, set, get, child, update, remove, push, onValue };
