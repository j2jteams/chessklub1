# Firebase Setup Instructions

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Email/Password Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Enable **Email/Password** and click **Save**

## Step 3: Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. If you don't have a web app, click **</>** (Web icon) to add one
5. Copy the configuration values

## Step 4: Create Environment Variables

Create a `.env.local` file in the root of your project with the following:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the placeholder values with your actual Firebase configuration values.

## Step 5: Restart Your Development Server

After creating the `.env.local` file, restart your Next.js development server:

```bash
npm run dev
```

## Access the Login Page

Navigate to: `http://localhost:3000/login`

## Features

- ✅ Sign in with email and password
- ✅ Sign up (create new account)
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ Matches Chess Klub branding

