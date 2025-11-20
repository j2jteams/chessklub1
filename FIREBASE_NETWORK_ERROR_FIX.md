# Fixing Firebase auth/network-request-failed Error

## Common Causes

The `auth/network-request-failed` error in production typically occurs due to:

1. **Authorized Domains Not Configured** (Most Common)
2. **Environment Variables Not Loading**
3. **Invalid Firebase Configuration**
4. **CORS Issues**

## Solution Steps

### Step 1: Add App Hosting Domain to Firebase Authorized Domains

**This is the most common fix!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chessklub1-b65a1**
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your App Hosting domain: `chessklub1--chessklub1-b65a1.us-east4.hosted.app`
6. Also add the base domain: `chessklub1--chessklub1-b65a1.us-east4.hosted.app` (without any path)
7. Click **Add**

**Important:** Firebase requires the exact domain to be in the authorized domains list. The App Hosting URL format is: `{backend-name}--{project-id}.{region}.hosted.app`

### Step 2: Verify Secrets Are Accessible

1. Go to [Google Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager?project=chessklub1-b65a1)
2. Verify all 6 secrets exist:
   - `firebase-api-key`
   - `firebase-auth-domain`
   - `firebase-project-id`
   - `firebase-storage-bucket`
   - `firebase-messaging-sender-id`
   - `firebase-app-id`
3. For each secret, check **Permissions** tab
4. Ensure the App Hosting service account has **Secret Manager Secret Accessor** role

### Step 3: Verify Secret Values

Make sure the secret values match your Firebase project configuration:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → General tab
3. Scroll to "Your apps" section
4. Compare the values with your secrets

### Step 4: Trigger a New Deployment

After making changes:

1. Go to Firebase Console → **App Hosting** → **Backend chessklub1**
2. Click **Create rollout** to trigger a new deployment
3. Wait for the build to complete
4. Test the login page again

### Step 5: Check Browser Console

Open the browser console (F12) on the login page and check for:

1. **Firebase Config Debug** messages - Should show config values (partially masked)
2. **Error messages** - Will indicate which config value is missing
3. **Network tab** - Check if requests to Firebase are being blocked

## Debugging

The updated code now includes debug logging. Check the browser console for:

```
🔍 Firebase Config Debug: {
  apiKey: "AIzaSyASW...",
  authDomain: "chessklub1-b65a1.firebaseapp.com",
  projectId: "chessklub1-b65a1",
  ...
}
```

If you see "MISSING" for any value, that secret is not loading properly.

## Quick Checklist

- [ ] App Hosting domain added to Firebase Authorized Domains
- [ ] All 6 secrets exist in Secret Manager
- [ ] App Hosting service account has access to secrets
- [ ] Secret values match Firebase project configuration
- [ ] New deployment triggered after changes
- [ ] Browser console checked for debug messages

## Still Having Issues?

1. **Check Firebase Console → Authentication → Settings → Authorized domains**
   - Ensure your App Hosting domain is listed
   
2. **Verify Email/Password is enabled:**
   - Firebase Console → Authentication → Sign-in method
   - Ensure "Email/Password" is enabled

3. **Check Network Tab in Browser:**
   - Look for failed requests to `identitytoolkit.googleapis.com`
   - Check if requests are being blocked by CORS

4. **Verify Secret Format:**
   - Secrets should NOT have trailing whitespace or newlines
   - Use `firebase apphosting:secrets:set` to update if needed

