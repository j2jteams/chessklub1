# Firebase App Hosting Deployment Guide

This guide will help you deploy your Chess Klub Next.js application to Firebase App Hosting for production.

## Prerequisites

1. **Firebase CLI installed**: If not installed, run:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project created**: Make sure you have a Firebase project set up at [Firebase Console](https://console.firebase.google.com/)

3. **GitHub repository**: Your code should be in a GitHub repository

## Step 1: Login to Firebase

```bash
firebase login
```

## Step 2: Initialize Firebase in Your Project

```bash
firebase init
```

Select:
- **App Hosting** (if available)
- Your Firebase project
- Follow the prompts

## Step 3: Set Up Firebase Secrets

Since your Firebase configuration contains sensitive information, you need to store them as secrets in Firebase Secret Manager.

### Option A: Using Firebase CLI (Recommended)

Run these commands to set up your secrets:

```bash
# Set Firebase API Key
firebase apphosting:secrets:set firebase-api-key --project YOUR_PROJECT_ID

# Set Auth Domain
firebase apphosting:secrets:set firebase-auth-domain --project YOUR_PROJECT_ID

# Set Project ID
firebase apphosting:secrets:set firebase-project-id --project YOUR_PROJECT_ID

# Set Storage Bucket
firebase apphosting:secrets:set firebase-storage-bucket --project YOUR_PROJECT_ID

# Set Messaging Sender ID
firebase apphosting:secrets:set firebase-messaging-sender-id --project YOUR_PROJECT_ID

# Set App ID
firebase apphosting:secrets:set firebase-app-id --project YOUR_PROJECT_ID
```

When prompted, enter the values from your `.env.local` file:
- `firebase-api-key`: Your `NEXT_PUBLIC_FIREBASE_API_KEY` value
- `firebase-auth-domain`: Your `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` value
- `firebase-project-id`: Your `NEXT_PUBLIC_FIREBASE_PROJECT_ID` value
- `firebase-storage-bucket`: Your `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` value
- `firebase-messaging-sender-id`: Your `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` value
- `firebase-app-id`: Your `NEXT_PUBLIC_FIREBASE_APP_ID` value

### Option B: Using Google Cloud Console

1. Go to [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager)
2. Create secrets with the names:
   - `firebase-api-key`
   - `firebase-auth-domain`
   - `firebase-project-id`
   - `firebase-storage-bucket`
   - `firebase-messaging-sender-id`
   - `firebase-app-id`
3. Grant access to App Hosting:
   ```bash
   firebase apphosting:secrets:grantaccess --project YOUR_PROJECT_ID
   ```

## Step 4: Create App Hosting Backend

### Using Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Build** → **App Hosting**
4. Click **Create backend** (or **Get started** if it's your first backend)
5. Follow the prompts:
   - **Connect GitHub repository**: Link your GitHub repo
   - **App root directory**: `/` (root of your project)
   - **Live branch**: `main` or `ui-changes` (your production branch)
   - **Automatic rollouts**: Enable for automatic deployments
   - **Backend name**: Give it a name (e.g., "chessklub-production")

### Using Firebase CLI:

```bash
firebase apphosting:backends:create --project YOUR_PROJECT_ID
```

Follow the prompts to configure your backend.

## Step 5: Deploy Your App

Once the backend is created, Firebase App Hosting will automatically:
1. Build your Next.js app
2. Deploy it to production
3. Provide you with a live URL

### Manual Deployment (if needed):

```bash
firebase deploy --only apphosting
```

## Step 6: Verify Deployment

1. Check the deployment status in Firebase Console
2. Visit your live URL (provided after deployment)
3. Test the login functionality
4. Verify all features are working

## Configuration Details

The `apphosting.yaml` file is configured with:

- **Environment Variables**: All Firebase config values are stored as secrets
- **Build Command**: Auto-detected for Next.js (`next build`)
- **Run Command**: Auto-detected for Next.js (`next start`)
- **Output Files**: Optimized for Next.js (includes `.next`, `public`, `node_modules`)
- **Runtime Config**: 
  - CPU: 1 core
  - Memory: 512Mi
  - Concurrency: 80 requests
  - Max Instances: 10
  - Min Instances: 0 (for cost optimization)

## Customization

You can adjust the runtime configuration in `apphosting.yaml`:

```yaml
runConfig:
  cpu: 2              # Increase for better performance
  memory: 1Gi         # Increase for larger apps
  maxInstances: 20    # Scale up for high traffic
  minInstances: 1     # Keep warm for faster response
```

## Troubleshooting

### Build Failures
- Check build logs in Firebase Console
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Environment Variables Not Loading
- Verify secrets are created in Secret Manager
- Check secret names match in `apphosting.yaml`
- Ensure secrets have proper permissions

### Deployment Issues
- Check GitHub connection in Firebase Console
- Verify branch name matches your live branch
- Review deployment logs for specific errors

## Resources

- [Firebase App Hosting Documentation](https://firebase.google.com/docs/app-hosting)
- [App Hosting Configuration Reference](https://firebase.google.com/docs/app-hosting/configure)
- [Next.js on Firebase](https://firebase.google.com/docs/hosting/frameworks/nextjs)

