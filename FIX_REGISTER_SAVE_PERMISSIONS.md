# Fix for Register/Save Event Permissions Error

## Problem
Users were getting "Missing or insufficient permissions" error when trying to register for or save events.

## Root Cause
1. **Firestore security rules** didn't allow regular users to update event documents (only owners/admins could)
2. **User document updates** weren't allowed for regular users
3. The functions were trying to update both event and user documents, but security rules blocked these updates

## Solution Applied

### 1. Updated Firestore Security Rules (`FIRESTORE_RULES_COMPLETE.txt`)

**For Events Collection:**
- Added rule to allow authenticated users to update `registeredUsers` and `savedByUsers` arrays
- Rule verifies that critical fields (title, date, location, price, status, etc.) haven't changed
- This prevents users from modifying event details while allowing registration/saving

**For Users Collection:**
- Updated rule to allow users to update their own documents
- Users can update `registeredEvents` and `savedEvents` arrays
- Users cannot change their own `role` (only owners can)

### 2. Updated Event Functions (`src/lib/events.ts`)
- `registerUserForEvent()` now updates both event and user documents
- `unregisterUserFromEvent()` now updates both documents
- `saveEvent()` now updates both documents
- `unsaveEvent()` now updates both documents

### 3. Improved Error Handling (`src/app/events/[id]/page.tsx`)
- Added console.error for debugging
- Reloads event after registration/save to get latest state
- Better error messages

### 4. UI Improvement
- Status field now only shows to admins/owners (not regular users)

## Action Required

### ⚠️ IMPORTANT: Update Firestore Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chessklub1-b65a1**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the entire content from `FIRESTORE_RULES_COMPLETE.txt`
5. Paste it into the rules editor
6. Click **Publish** to save the rules

### The Updated Rules Allow:
- ✅ Regular users to register for events (updates `registeredUsers` array)
- ✅ Regular users to save events (updates `savedByUsers` array)
- ✅ Regular users to update their own `registeredEvents` and `savedEvents` arrays
- ✅ Protection against users modifying event details (title, date, price, etc.)
- ✅ Protection against users changing their own role

## Testing

After updating the rules:

1. **Test Registration:**
   - Login as a regular user
   - Go to an event detail page
   - Click "Register Now"
   - Should see "✓ Registered" button
   - Check that registration count increases

2. **Test Saving:**
   - Click "Save for Later"
   - Should see "✓ Saved" button
   - Check user dashboard to see saved event

3. **Test Unregister/Unsave:**
   - Click "✓ Registered" to unregister
   - Click "✓ Saved" to unsave
   - Should work without errors

## About "Approved" Status

**Why regular users see "approved" status:**
- This is **correct behavior** - approved events are published and visible to everyone
- Only approved events are shown on the public pages
- Regular users can register for approved events

**Change Made:**
- Status field is now **hidden** from regular users in the Quick Info section
- Only admins and owners can see the status field
- This reduces confusion for regular users

---

**Status:** ✅ Code updated, rules need to be published in Firebase Console

