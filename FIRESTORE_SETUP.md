# Firestore Database Setup Guide

## Overview

The role-based access control system requires Firestore to store:
- User roles and metadata
- Events data

Firebase Authentication handles user accounts, but Firestore stores the additional role information.

## Step 1: Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chessklub1-b65a1**
3. In the left sidebar, click **Firestore Database**
4. Click **Create database**
5. Choose your security rules:
   - **Start in test mode** (for development) - Allows read/write for 30 days
   - **Start in production mode** (recommended) - Requires security rules
6. Choose a location:
   - Select a region close to your users (e.g., `us-east1` or `us-central`)
   - Click **Enable**

## Step 2: Set Up Security Rules

After creating the database, go to the **Rules** tab and paste these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user role
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function isOwner() {
      return request.auth != null && getUserRole() == 'owner';
    }
    
    function isAdminOrOwner() {
      return request.auth != null && getUserRole() in ['admin', 'owner'];
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own data, owners can read all
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isOwner());
      
      // Only owners can write user roles
      allow create: if request.auth != null && 
        (request.auth.uid == userId || isOwner());
      
      allow update: if request.auth != null && isOwner();
      allow delete: if request.auth != null && isOwner();
    }
    
    // Events collection
    match /events/{eventId} {
      // Public can read approved events
      // Owners and admins can read all events
      allow read: if resource.data.status == 'approved' || 
        (request.auth != null && isAdminOrOwner());
      
      // Owners and admins can create events
      allow create: if request.auth != null && isAdminOrOwner();
      
      // Owners can update any event
      // Admins can only update their own events
      allow update: if request.auth != null && 
        (isOwner() || 
         (getUserRole() == 'admin' && resource.data.createdBy == request.auth.uid));
      
      // Owners can delete any event
      // Admins can only delete their own events
      allow delete: if request.auth != null && 
        (isOwner() || 
         (getUserRole() == 'admin' && resource.data.createdBy == request.auth.uid));
    }
  }
}
```

Click **Publish** to save the rules.

## Step 3: Create Indexes (if needed)

If you see errors about missing indexes when querying events, Firebase will prompt you to create them. Click the link in the error message to create the required indexes automatically.

Common indexes needed:
- `events` collection: `status` (Ascending) + `createdAt` (Descending)

## Step 4: Assign First Owner

After Firestore is set up:

1. Sign up a user account (or use an existing one)
2. Go to Firestore Database → `users` collection
3. Find the user document (document ID is the user's UID from Firebase Auth)
4. If the document doesn't exist, create it with:
   ```json
   {
     "uid": "USER_UID_HERE",
     "email": "user@example.com",
     "role": "owner",
     "createdAt": "2024-01-01T00:00:00Z",
     "updatedAt": "2024-01-01T00:00:00Z"
   }
   ```
5. If the document exists, edit it and set `role: "owner"`

## Step 5: Verify Setup

1. Login as the owner
2. Navigate to `/admin` - you should see the admin management page
3. Try creating an event at `/admin/events/create`
4. The event should be automatically approved (since you're owner)

## Troubleshooting

### Error: "Firestore database not set up yet"
- Make sure you've created the Firestore database in Firebase Console
- Check that you've selected the correct Firebase project

### Error: "Missing or insufficient permissions"
- Check that your security rules are published
- Verify the user document exists in Firestore
- Make sure the user has the correct role assigned

### Users can sign up but roles don't work
- Check Firestore is created and accessible
- Verify the `users` collection exists
- Check browser console for Firestore errors

### Can't create events
- Verify Firestore security rules allow create operations
- Check that user has `admin` or `owner` role in Firestore
- Make sure the `events` collection is accessible

## Current Status

- ✅ Firebase Authentication is set up (users can sign up/login)
- ⚠️ Firestore Database needs to be created
- ⚠️ User roles need to be assigned manually after Firestore is set up

Once Firestore is created, the role-based system will work automatically!

