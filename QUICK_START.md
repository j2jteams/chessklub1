# Quick Start Guide - Assign First Owner

Now that Firestore is set up, follow these steps to get started:

## Step 1: Sign Up or Use Existing Account

1. Go to your website and click **Login**
2. Sign up with a new account (or use an existing one)
3. This creates the user in Firebase Authentication

## Step 2: Assign Owner Role

### Option A: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chessklub1-b65a1**
3. Navigate to **Firestore Database**
4. Click on the **users** collection
5. You should see a document with the user's UID (from Firebase Auth)
6. If the document doesn't exist:
   - Click **Start collection** (if it's the first time)
   - Collection ID: `users`
   - Document ID: Paste the user's UID (you can find it in Firebase Console → Authentication → Users)
   - Add these fields:
     - `uid` (string): The user's UID
     - `email` (string): The user's email
     - `role` (string): `owner`
     - `createdAt` (timestamp): Current date/time
     - `updatedAt` (timestamp): Current date/time
7. If the document exists:
   - Click on the document
   - Click **Edit document**
   - Change the `role` field to `owner`
   - Click **Update**

### Option B: Find User UID

If you need to find the user's UID:
1. Go to Firebase Console → **Authentication** → **Users**
2. Find the user by email
3. Copy the **User UID** (it's a long string)

## Step 3: Test the System

1. **Logout** and **Login** again (to refresh the role)
2. You should now see an **Admin** link in the header
3. Click **Admin** → You should see the admin management page
4. Try creating an event at `/admin/events/create`
5. The event should be automatically approved (since you're owner)

## Step 4: Create Your First Admin

1. Have another user sign up
2. Go to `/admin` (as owner)
3. Find the new user in the list
4. Click **Make Admin** button
5. That user can now create events (pending approval)

## Troubleshooting

### Can't see Admin link after assigning role
- **Logout and login again** - The role is cached
- Check browser console for errors
- Verify the user document exists in Firestore with `role: "owner"`

### Getting permission errors
- Check that security rules are published
- Verify the user document has the correct structure
- Make sure you're logged in with the correct account

### Events not showing
- Check that events are being created in Firestore
- Verify the `events` collection exists
- Check browser console for errors

## Next Steps

- ✅ Firestore database created
- ✅ Security rules published
- ⏳ Assign first owner (you are here)
- ⏳ Test admin features
- ⏳ Create first admin user
- ⏳ Start creating events!

