# Firestore Events Setup & Troubleshooting Guide

## Common Errors When Creating Events

### Error 1: "Missing or insufficient permissions"
**Cause**: Firestore security rules are blocking the create operation.

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chessklub1-b65a1**
3. Navigate to **Firestore Database** → **Rules** tab
4. Make sure you have the correct security rules (see below)
5. Click **Publish**

### Error 2: "The query requires an index"
**Cause**: Firestore needs composite indexes for queries with multiple filters.

**Solution**:
1. When you see the error, click the link in the error message
2. It will take you to Firebase Console to create the index automatically
3. Or manually create these indexes:

**Required Indexes:**
- Collection: `events`
  - Fields: `status` (Ascending) + `createdAt` (Descending)
- Collection: `events`
  - Fields: `createdBy` (Ascending) + `createdAt` (Descending)

### Error 3: "Failed to upload image" or Storage errors
**Cause**: Firebase Storage is not set up or rules are blocking uploads.

**Solution**:
1. Go to **Storage** in Firebase Console
2. Click **Get started** if not already set up
3. Set up Storage security rules (see below)
4. Make sure Storage is enabled for your project

## Step-by-Step Setup

### Step 1: Verify Firestore Database Exists

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **chessklub1-b65a1**
3. Click **Firestore Database** in left sidebar
4. If you see "Create database", click it and:
   - Choose **Start in production mode**
   - Select a location (e.g., `us-east1`)
   - Click **Enable**

### Step 2: Set Up Firestore Security Rules

Go to **Firestore Database** → **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to get user role (with null check)
    function getUserRole() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return userDoc != null ? userDoc.data.role : null;
    }
    
    function isOwner() {
      return request.auth != null && getUserRole() == 'owner';
    }
    
    function isAdminOrOwner() {
      let role = getUserRole();
      return request.auth != null && role in ['admin', 'owner'];
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own data, owners can read all
      allow read: if request.auth != null && 
        (request.auth.uid == userId || isOwner());
      
      // Users can create their own document on signup
      allow create: if request.auth != null && 
        (request.auth.uid == userId);
      
      // Only owners can update user roles
      allow update: if request.auth != null && isOwner();
      allow delete: if request.auth != null && isOwner();
    }
    
    // Events collection
    match /events/{eventId} {
      // Public can read approved events
      // Owners and admins can read all events
      allow read: if resource == null || 
        resource.data.status == 'approved' || 
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

Click **Publish** to save.

### Step 3: Set Up Firebase Storage (for Image Uploads)

1. Go to **Storage** in Firebase Console
2. Click **Get started** if not already set up
3. Choose **Start in production mode**
4. Select a location (same as Firestore if possible)
5. Click **Done**

### Step 4: Set Up Storage Security Rules

Go to **Storage** → **Rules** tab and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Events flyer images
    match /events/flyers/{imageId} {
      // Allow authenticated users (admins/owners) to upload
      allow write: if request.auth != null;
      // Allow public read
      allow read: if true;
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Click **Publish**.

### Step 5: Verify User Role

1. Make sure you're logged in
2. Go to **Firestore Database** → **users** collection
3. Find your user document (document ID = your Firebase Auth UID)
4. Verify the document has:
   ```json
   {
     "uid": "YOUR_UID",
     "email": "your@email.com",
     "role": "owner" or "admin",
     "savedEvents": [],
     "registeredEvents": [],
     "createdAt": timestamp,
     "updatedAt": timestamp
   }
   ```
5. If `role` is missing or `null`, set it to `"owner"` or `"admin"`

### Step 6: Create Required Indexes

1. Try creating an event
2. If you see an index error, click the link in the error
3. Or go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Create these indexes:

**Index 1:**
- Collection ID: `events`
- Fields to index:
  - `status` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

**Index 2:**
- Collection ID: `events`
- Fields to index:
  - `createdBy` (Ascending)
  - `createdAt` (Descending)
- Query scope: Collection

## Testing

1. **Login** as an owner or admin
2. Navigate to `/admin/events/create`
3. Fill out the form:
   - Title: "Test Event"
   - Date: Select a future date
   - Time: "10:00 AM - 5:00 PM" (optional)
   - Location: "Test Location"
   - Price: "$50"
   - Description: "Test description"
   - Upload a flyer image
4. Click **Create Event**
5. If successful, you should be redirected to `/admin/events`

## Troubleshooting Checklist

- [ ] Firestore Database is created
- [ ] Firestore security rules are published
- [ ] Firebase Storage is set up
- [ ] Storage security rules are published
- [ ] User document exists in `users` collection
- [ ] User has `role` set to `"owner"` or `"admin"`
- [ ] Required indexes are created
- [ ] User is logged in
- [ ] Browser console shows no errors

## Common Error Messages

### "Permission denied"
- Check Firestore rules are published
- Verify user role in Firestore
- Make sure user is logged in

### "The query requires an index"
- Click the link in the error to create index automatically
- Or create manually in Firebase Console

### "Storage: User does not have permission"
- Check Storage rules are published
- Verify Storage is enabled

### "Failed to upload image"
- Check Storage is set up
- Verify file size is under 5MB
- Check file is an image type (jpg, png, webp)

## Need Help?

If you're still having issues:
1. Check browser console for detailed error messages
2. Check Firebase Console → Firestore → Usage tab for errors
3. Verify all steps above are completed
4. Make sure you're using the correct Firebase project

