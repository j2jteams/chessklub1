# Deployment & Setup Guide

Single reference for deploying the Next.js app, Cloud Functions (SendGrid), and first-time setup.

---

## Part 1: Deploy Next.js app (Firebase App Hosting)

### Prerequisites

- Firebase CLI: `npm install -g firebase-tools`
- Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Code in a GitHub repository

### Steps

1. **Login:** `firebase login`
2. **Init:** `firebase init` → select App Hosting, choose project
3. **Secrets:** Store Firebase config as App Hosting secrets (API key, auth domain, project ID, storage bucket, messaging sender ID, app ID). Use `firebase apphosting:secrets:set <name> --project YOUR_PROJECT_ID` or [Secret Manager](https://console.cloud.google.com/security/secret-manager)
4. **Create backend:** Firebase Console → Build → App Hosting → Create backend; connect GitHub repo, set app root and live branch
5. **Deploy:** `firebase deploy --only apphosting` (or rely on automatic deploys from the live branch)
6. **Verify:** Check deployment status and test the live URL

Runtime and build are configured in `apphosting.yaml`. See [Firebase App Hosting docs](https://firebase.google.com/docs/app-hosting) for details.

---

## Part 2: Deploy Cloud Functions & SendGrid

### Prerequisites

- Firebase CLI, Firestore enabled, SendGrid account with API key, Node.js 20

### Steps

1. **Install:** `cd functions && npm install`
2. **Secret:** `firebase functions:secrets:set SENDGRID_API_KEY` (paste API key when prompted)
3. **Optional config:**  
   `firebase functions:config:set app.url="https://yoursite.com"`  
   `firebase functions:config:set app.support_email="hello@yoursite.com"`  
   (or use env vars for local dev)
4. **Template IDs:** Create Firestore document `config/emailTemplates` with SendGrid dynamic template IDs, e.g.:

```json
{
  "WELCOME_EMAIL": "d-...",
  "CREATOR_SUBMISSION_RECEIPT": "d-...",
  "CREATOR_APPROVAL_EMAIL": "d-...",
  "TOURNAMENT_REGISTRATION_CONFIRMATION": "d-...",
  "REMINDER_24H": "d-...",
  "REMINDER_2H": "d-...",
  "TOURNAMENT_UPDATED_NOTIFICATION": "d-...",
  "PAYMENT_RECEIPT": "d-...",
  "PAYMENT_FAILED": "d-...",
  "ADMIN_REQUEST_SUBMITTED": "d-...",
  "ADMIN_REQUEST_APPROVED": "d-...",
  "ADMIN_REQUEST_REJECTED": "d-...",
  "PASSWORD_RESET": "d-..."
}
```

5. **Build:** `npm run build` (inside `functions`)
6. **Deploy:** `firebase deploy --only functions`
7. **Verify:** `firebase functions:log`; test welcome email, tournament flows, and password reset

### Local development

- `.env` in `functions/`: `SENDGRID_API_KEY`, `APP_URL`, `SUPPORT_EMAIL`
- Run: `firebase emulators:start --only functions,firestore,auth`

### Security

- Do not commit secrets; use Firebase Secret Manager.
- Payment webhook: implement `x-webhook-signature` verification for production.

---

## Part 3: First-time setup (assign first owner)

1. **Sign up** on the site (or use an existing account).
2. **Firebase Console** → your project → **Firestore** → `users` collection.
3. Find the document with the user’s UID (or create it; document ID = Auth UID).  
   Required fields: `uid`, `email`, `role` (set to `owner`), `createdAt`, `updatedAt`.
4. **Logout and login** so the app picks up the new role.
5. **Test:** Admin link in header, create event at `/admin/events/create` (auto-approved as owner).
6. **Optional:** In `/admin`, use “Make Admin” for another user to allow them to create events.

### Troubleshooting

- No Admin link → logout/login again; confirm `users/<uid>` has `role: "owner"`.
- Permission errors → check Firestore rules and that you’re logged in as that user.
- Indexes → see `FIREBASE_INDEXES_NEEDED.md` and `FIRESTORE_INDEXES.md` if queries fail.

---

## Other docs

- **FIREBASE_SETUP.md** – Firebase project and Auth setup
- **FIRESTORE_SETUP.md** / **FIRESTORE_EVENTS_SETUP.md** – Firestore and events schema
- **FIREBASE_INDEXES_NEEDED.md** / **FIRESTORE_INDEXES.md** – Required indexes
- **BACKEND_CONNECTION_CHECKLIST.md** – Backend connectivity checklist
- **functions/README.md** – Functions overview
