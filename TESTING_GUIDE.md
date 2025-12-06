# Testing Guide - Chess Tourneys Role System

## Prerequisites

1. **Development server running**: `npm run dev` (should be running on http://localhost:3000)
2. **Firebase Console access**: You'll need to access Firebase Console to manually set the first Super Admin
3. **Multiple test accounts**: Create or use existing accounts for testing different roles

---

## Step 1: Initial Setup - Create First Super Admin

Since the system needs a Super Admin to assign roles, you need to manually create the first one:

### Option A: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chessklub1-b65a1**
3. Navigate to **Firestore Database**
4. Find the `users` collection
5. Locate the user document you want to make Super Admin (or create one if it doesn't exist)
6. Edit the document and set the `role` field to `"superAdmin"`
7. **Important**: Remove the `isGodOwner` field if it exists (it's no longer used)
8. Save the changes

### Option B: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set the super admin role (replace USER_UID with actual user UID)
firebase firestore:set users/USER_UID '{"role":"superAdmin","email":"user@example.com","createdAt":"2024-01-01T00:00:00Z","updatedAt":"2024-01-01T00:00:00Z","savedEvents":[],"registeredEvents":[]}'
```

### Option C: Migration Script (if you have existing owners)

If you have existing users with `role: 'owner'`, they should automatically be migrated to `superAdmin` when the app reads their data. However, you may want to manually update them in Firebase Console to ensure consistency.

---

## Step 2: Test Role Migration

1. **Logout** and **Login** again with the Super Admin account
2. Check the dashboard - you should see:
   - Navigation shows "Super Admin Console" link
   - Role displayed as "superAdmin" (or "super admin" in UI)
3. Navigate to `/dashboard/super-admin` - you should see the Super Admin dashboard

---

## Step 3: Test Role Assignment (Super Admin)

### Test 1: Assign Franchisee Role

1. **Create a test account** (or use an existing one)
2. **As Super Admin**, go to `/dashboard/super-admin`
3. Scroll to "User Role Management" section
4. Find the test user in the list
5. Select "Franchisee" from the dropdown
6. Click "Update Role"
7. **Verify**: 
   - Success message appears
   - User's role shows as "franchisee" in the list
   - Logout and login as that user - should see "Admin Console" in navigation

### Test 2: Assign Standalone Admin Role

1. **Create another test account**
2. **As Super Admin**, assign "Standalone Admin" role
3. **Verify**:
   - Role updated successfully
   - User can access `/dashboard/admin`
   - User can create events

### Test 3: Assign Player Role

1. **As Super Admin**, change a user's role to "Player"
2. **Verify**:
   - Role updated successfully
   - User can only see "Overview" in dashboard navigation
   - User cannot access `/dashboard/admin` or `/dashboard/super-admin`

---

## Step 4: Test Event Creation

### Test 1: Super Admin Creates Event

1. **Login as Super Admin**
2. Go to `/dashboard/admin` or `/admin/events/create`
3. Create a new event
4. **Verify**:
   - Event is created with `status: 'approved'`
   - Event appears in the events list immediately
   - Event is visible to all users (including players)

### Test 2: Franchisee Creates Franchise Event

1. **Login as Franchisee**
2. Go to `/dashboard/admin` or `/admin/events/create`
3. Create a new event
4. **Verify**:
   - Event is created with `status: 'approved'` (auto-approved)
   - Event has `franchiseId` set to the franchisee's UID
   - Event appears in franchisee's dashboard
   - Event is visible to all users

### Test 3: Franchisee Creates Standalone Event

**Note**: Currently, franchisee events default to franchise events. To test standalone events:
- You can manually set `franchiseId: null` in Firebase Console for a test event
- Or wait for UI enhancement to add a toggle

1. **Login as Franchisee**
2. Create an event
3. **Manually in Firebase Console**: Set `franchiseId: null` for that event
4. **Verify**:
   - Event status changes to `pendingApproval`
   - Event appears in Super Admin's pending approvals

### Test 4: Standalone Admin Creates Event

1. **Login as Standalone Admin**
2. Create a new event
3. **Verify**:
   - Event is created with `status: 'approved'` (auto-approved)
   - Event has `franchiseId: null` (standalone)
   - Event appears in standalone admin's dashboard
   - Event is visible to all users

### Test 5: Player Cannot Create Events

1. **Login as Player**
2. Try to access `/admin/events/create`
3. **Verify**:
   - Should be redirected or see access denied
   - No "Create Event" button visible

---

## Step 5: Test Event Editing Permissions

### Test 1: Super Admin Can Edit All Events

1. **Login as Super Admin**
2. Go to `/dashboard/admin`
3. Find any event (created by anyone)
4. Click "Edit"
5. **Verify**: Can edit and save successfully

### Test 2: Franchisee Can Edit Their Franchise Events

1. **Login as Franchisee**
2. Go to `/dashboard/admin`
3. Find an event with `franchiseId` matching the franchisee's UID
4. Click "Edit"
5. **Verify**: Can edit and save successfully

### Test 3: Franchisee Cannot Edit Other Franchise Events

1. **Login as Franchisee A**
2. Try to edit an event created by Franchisee B (different `franchiseId`)
3. **Verify**: 
   - Should see error or be unable to edit
   - Or event doesn't appear in their dashboard

### Test 4: Standalone Admin Can Edit Own Events

1. **Login as Standalone Admin**
2. Go to `/dashboard/admin`
3. Find an event created by them (`createdBy` matches their UID)
4. Click "Edit"
5. **Verify**: Can edit and save successfully

### Test 5: Standalone Admin Cannot Edit Others' Events

1. **Login as Standalone Admin A**
2. Try to edit an event created by Standalone Admin B
3. **Verify**: Cannot edit (error or event not visible)

---

## Step 6: Test Event Approval Flow

### Test 1: Super Admin Approves Franchisee Standalone Event

1. **As Franchisee**: Create an event (or manually set one to `pendingApproval` with `franchiseId: null`)
2. **Login as Super Admin**
3. Go to `/dashboard/super-admin`
4. Find the event in "Pending Event Approvals" section
5. Click "Approve"
6. **Verify**:
   - Event status changes to `approved`
   - Event disappears from pending list
   - Event is now visible to all users

### Test 2: Super Admin Rejects Event

1. **As Super Admin**, find a pending event
2. Click "Reject"
3. **Verify**:
   - Event status changes to `rejected`
   - Event disappears from pending list
   - Event may not be visible to players (depending on your display logic)

---

## Step 7: Test Dashboard Navigation

### Test 1: Super Admin Navigation

1. **Login as Super Admin**
2. **Verify**:
   - Sees: "Overview", "Admin Console", "Super Admin Console"
   - Can access all three pages

### Test 2: Franchisee Navigation

1. **Login as Franchisee**
2. **Verify**:
   - Sees: "Overview", "Admin Console"
   - Cannot see "Super Admin Console"
   - Cannot access `/dashboard/super-admin` (redirects)

### Test 3: Standalone Admin Navigation

1. **Login as Standalone Admin**
2. **Verify**:
   - Sees: "Overview", "Admin Console"
   - Cannot see "Super Admin Console"
   - Cannot access `/dashboard/super-admin` (redirects)

### Test 4: Player Navigation

1. **Login as Player**
2. **Verify**:
   - Sees only: "Overview"
   - Cannot see "Admin Console" or "Super Admin Console"
   - Cannot access admin pages (redirects)

---

## Step 8: Test Event Visibility

### Test: All Users Can View All Events

1. **Login as Player**
2. Go to home page or events page
3. **Verify**: Can see all approved events (franchise and standalone)

4. **Login as any role**
5. **Verify**: Can see all approved events

---

## Step 9: Test Role Restrictions

### Test 1: Only Super Admin Can Assign Roles

1. **Login as Franchisee**
2. Try to access `/dashboard/super-admin`
3. **Verify**: Redirected or access denied

4. **Login as Standalone Admin**
5. Try to change another user's role (if UI exists)
6. **Verify**: Cannot change roles (error or no UI)

### Test 2: Role Assignment Validation

1. **Login as Super Admin**
2. Try to assign a role to yourself
3. **Verify**: Should work (but be careful!)

4. Try to assign invalid role
5. **Verify**: Error message or validation prevents it

---

## Step 10: Test Migration Compatibility

### Test: Old Roles Still Work (During Migration)

1. **In Firebase Console**, manually set a user's role to `"owner"` (old role)
2. **Login as that user**
3. **Verify**: 
   - System migrates `owner` → `superAdmin` automatically
   - User can access Super Admin features
   - Dashboard shows correct navigation

4. **Repeat with `"admin"` role**
5. **Verify**: System migrates `admin` → `standaloneAdmin` automatically

---

## Common Issues & Troubleshooting

### Issue 1: "Only Super Admin can assign roles" error

**Cause**: Trying to assign roles without Super Admin permission

**Solution**: 
- Make sure you're logged in as Super Admin
- Check Firebase Console - user's role should be `"superAdmin"`
- Logout and login again to refresh role

### Issue 2: Events not showing in dashboard

**Cause**: 
- Missing Firestore index
- Role filtering not working correctly

**Solution**:
- Check browser console for index errors
- Verify user's role in Firebase Console
- Check event's `franchiseId` matches user's UID (for franchisee)

### Issue 3: Cannot edit events

**Cause**: Permission check failing

**Solution**:
- Verify user's role
- Check event's `franchiseId` (for franchisee)
- Check event's `createdBy` (for standalone admin)
- Check browser console for error messages

### Issue 4: Role migration not working

**Cause**: Migration logic not being triggered

**Solution**:
- Logout and login again
- Check `fromFirestoreUser` function in `src/lib/userRoles.ts`
- Manually update roles in Firebase Console if needed

### Issue 5: Navigation links not showing

**Cause**: Role check in navigation not recognizing new roles

**Solution**:
- Check `src/app/dashboard/layout.tsx` navigation logic
- Verify role is being read correctly
- Check browser console for errors

---

## Testing Checklist

- [ ] Super Admin can access Super Admin dashboard
- [ ] Super Admin can assign all roles
- [ ] Franchisee can create franchise events (auto-approved)
- [ ] Franchisee can create standalone events (pending approval)
- [ ] Standalone Admin can create standalone events (auto-approved)
- [ ] Player cannot create events
- [ ] Super Admin can edit all events
- [ ] Franchisee can edit their franchise events only
- [ ] Standalone Admin can edit their own events only
- [ ] Super Admin can approve/reject pending events
- [ ] All users can view all approved events
- [ ] Navigation shows correct links based on role
- [ ] Role migration works (old roles → new roles)
- [ ] Permission checks prevent unauthorized actions

---

## Next Steps After Testing

1. **Update Firestore Security Rules**: Ensure rules match the new permission model
2. **Add UI Enhancements**: 
   - Toggle for Franchisee to choose franchise vs standalone events
   - Franchise selection for Super Admin when creating events
3. **Clean Up**: Remove old `isGodOwner` fields from Firestore (optional)
4. **Documentation**: Update any user-facing documentation

---

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Firebase Console for data consistency
3. Verify user roles in Firestore
4. Review the implementation in `USER_ROLES_AND_IMPLEMENTATION.md`

