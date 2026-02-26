/**
 * One-time script: writes template IDs from template-ids.json to Firestore config/emailTemplates.
 * Run from project root: node functions/scripts/set-email-templates.js
 * Requires: copy template-ids.json.example to template-ids.json and fill in real IDs.
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const CONFIG_COLLECTION = "config";
const CONFIG_DOC_ID = "emailTemplates";

// Project root: script lives in functions/scripts/
const projectRoot = path.join(__dirname, "..", "..");
const firebasercPath = path.join(projectRoot, ".firebaserc");

function getProjectId() {
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GCP_PROJECT) return process.env.GCP_PROJECT;
  if (fs.existsSync(firebasercPath)) {
    const firebaserc = JSON.parse(fs.readFileSync(firebasercPath, "utf8"));
    return firebaserc.projects?.default || null;
  }
  return null;
}

const projectId = getProjectId();
if (!projectId) {
  console.error("Could not detect Firebase project. Run from project root or set GCLOUD_PROJECT=your-project-id");
  process.exit(1);
}

// Resolve template-ids.json from functions folder
const templateIdsPath = path.join(__dirname, "..", "template-ids.json");

if (!fs.existsSync(templateIdsPath)) {
  console.error("Missing template-ids.json. Copy template-ids.json.example to template-ids.json and add your template IDs.");
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(templateIdsPath, "utf8"));
// Trim all values so whitespace doesn't break validation or get stored in Firestore
const templateIds = Object.fromEntries(
  Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
);

const required = [
  "WELCOME_EMAIL",
  "CREATOR_SUBMISSION_RECEIPT",
  "CREATOR_APPROVAL_EMAIL",
  "TOURNAMENT_REGISTRATION_CONFIRMATION",
  "REMINDER_24H",
  "REMINDER_2H",
  "TOURNAMENT_UPDATED_NOTIFICATION",
  "PAYMENT_RECEIPT",
  "PAYMENT_FAILED",
  "ADMIN_REQUEST_APPROVED",
  "ADMIN_REQUEST_REJECTED",
  "ADMIN_REQUEST_SUBMITTED",
  "PASSWORD_RESET",
];

// Real SendGrid template IDs look like d-<uuid> (e.g. d-1a2b3c4d-5e6f-7890-abcd-ef1234567890)
const PLACEHOLDER = "d-xxxxxxxxxxxxxxxxxxxxxxxx";
function isPlaceholder(id) {
  const s = String(id).trim();
  return !s || s === PLACEHOLDER || s.length < 30 || !/^d-[a-f0-9-]{30,}$/i.test(s);
}

for (const key of required) {
  if (isPlaceholder(templateIds[key])) {
    console.error(`Invalid or placeholder template ID for ${key}. Use real SendGrid template IDs (e.g. d-1a2b3c4d-5e6f-7890-abcd-ef1234567890).`);
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const db = admin.firestore();

db.collection(CONFIG_COLLECTION)
  .doc(CONFIG_DOC_ID)
  .set(templateIds)
  .then(() => {
    console.log("Template IDs written to config/emailTemplates.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
