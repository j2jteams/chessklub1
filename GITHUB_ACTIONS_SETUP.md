# Complete GitHub Actions Setup Guide

## Step 1: Get Firebase Service Account Key

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project

2. **Navigate to Service Accounts**
   - Click the gear icon ⚙️ (top left)
   - Click **Project Settings**
   - Click the **Service Accounts** tab

3. **Generate Private Key**
   - Click **Generate New Private Key** button
   - A popup will appear - click **Generate Key**
   - A JSON file will download to your computer
   - **SAVE THIS FILE** - you'll need it in Step 2

4. **What's in the file?**
   The file looks like this:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "...",
     "client_id": "...",
     "auth_uri": "...",
     "token_uri": "...",
     ...
   }
   ```

## Step 2: Add GitHub Secrets

1. **Go to Your GitHub Repository**
   - Open your repo on GitHub (e.g., `github.com/yourusername/chessklub1`)

2. **Navigate to Secrets**
   - Click **Settings** (top menu bar)
   - In the left sidebar, click **Secrets and variables**
   - Click **Actions**

3. **Add FIREBASE_SERVICE_ACCOUNT Secret**
   - Click **New repository secret** button
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Secret**: Open the JSON file you downloaded in Step 1
     - Copy the ENTIRE contents of the file
     - Paste it into the Secret field
     - **IMPORTANT**: Paste it as ONE LINE (remove all line breaks)
     - Or keep it as multi-line - GitHub handles both
   - Click **Add secret**

4. **Add OPENROUTER_API_KEY Secret (Optional)**
   - Click **New repository secret** again
   - **Name**: `OPENROUTER_API_KEY`
   - **Secret**: Your OpenRouter API key (format: `sk-or-v1-...`)
   - Click **Add secret**
   - **Note**: This is optional - only needed if direct scraping fails

## Step 3: Verify GitHub Actions Workflow File Exists

1. **Check the workflow file exists**
   - In your repo, navigate to: `.github/workflows/sync-uscf-ratings.yml`
   - If it doesn't exist, make sure you've committed and pushed the file

2. **The workflow file should contain:**
   ```yaml
   name: Sync USCF Ratings
   on:
     schedule:
       - cron: '0 2 * * *'
     workflow_dispatch:
   ...
   ```

## Step 4: Test the Workflow

1. **Manually Trigger the Workflow**
   - Go to your GitHub repo
   - Click **Actions** tab (top menu)
   - You should see "Sync USCF Ratings" workflow
   - Click on it
   - Click **Run workflow** button (right side)
   - Click the green **Run workflow** button in the popup

2. **Watch It Run**
   - You'll see the workflow start running
   - Click on the running workflow to see logs
   - It will show:
     - ✅ Checkout code
     - ✅ Setup Node.js
     - ✅ Install dependencies
     - ✅ Install Playwright browsers
     - ✅ Run USCF ratings sync
     - ✅ Cleanup

3. **Check for Errors**
   - If it fails, click on the failed step to see error logs
   - Common issues:
     - Missing FIREBASE_SERVICE_ACCOUNT secret → Add it
     - Invalid JSON in secret → Check the JSON format
     - Firebase permissions → Check service account has Firestore write access

## Step 5: Verify Data in Firebase

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project

2. **Open Firestore Database**
   - Click **Firestore Database** in left sidebar
   - Click **Data** tab

3. **Check User Documents**
   - Navigate to `users` collection
   - Click on a user document that has a `uscfId`
   - You should see `uscfRatings` field with data like:
     ```
     uscfRatings: {
       regular: "1717"
       quick: "1695"
       overallRank: "6997"
       ...
     }
     ```

## Step 6: Verify Dashboard Shows Data

1. **Open Your App**
   - Go to your deployed app (or localhost if testing)
   - Log in as a user with a USCF ID

2. **Check Dashboard**
   - Navigate to `/dashboard`
   - You should see the USCF Ratings section
   - It should display:
     - Standard Ratings (Regular, Quick, Blitz)
     - Online Ratings (if available)
     - Rankings (Overall, State)
     - Membership Information

## Troubleshooting

### Workflow Fails with "FIREBASE_SERVICE_ACCOUNT not found"
- **Fix**: Make sure you added the secret with exact name `FIREBASE_SERVICE_ACCOUNT`
- Check spelling and capitalization

### Workflow Fails with "Invalid JSON"
- **Fix**: The service account JSON might have formatting issues
- Try copying the JSON file content again
- Make sure it's valid JSON (use a JSON validator)

### Workflow Fails with "Permission denied"
- **Fix**: The service account needs Firestore write permissions
- Go to Firebase Console → IAM & Admin
- Find your service account email
- Make sure it has "Cloud Datastore User" or "Firebase Admin" role

### No Data Appears in Firestore
- Check workflow logs for errors
- Make sure users have `uscfId` set in their Firestore documents
- Verify the scraping is working (check logs for "Successfully synced")

### Dashboard Shows "No USCF ratings data available"
- Check if the user has `uscfId` in their profile
- Check if `uscfRatings` field exists in Firestore for that user
- Verify the workflow ran successfully

## Schedule

The workflow runs automatically:
- **Daily at 2 AM UTC** (configured in the cron schedule)
- You can also trigger it manually anytime via **Actions** → **Run workflow**

## What Happens When It Runs

1. Gets all users from Firestore who have `uscfId`
2. Filters users who need syncing (no ratings or ratings older than 7 days)
3. For each user:
   - Opens browser with Playwright
   - Goes to `ratings.uschess.org/player/{uscfId}`
   - Scrapes all ratings and rankings
   - Updates Firestore with the data
4. Waits 2 seconds between each user (rate limiting)

## Security Notes

- ✅ Service account key is stored securely in GitHub Secrets
- ✅ Never commit the service account JSON file to your repo
- ✅ The key only has access to your Firebase project
- ✅ You can revoke/regenerate the key anytime from Firebase Console

