# Role-Based Access Control Setup Guide

## Overview

The application now supports two roles:
- **Owner**: Can create events, manage admins, and approve events posted by admins
- **Admin**: Can create and edit events (requires owner approval)

## Initial Setup: Creating the First Owner

When users sign up, they get **no role** by default. To create the first owner:

### Option 1: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chessklub1-b65a1**
3. Navigate to **Firestore Database**
4. Find the `users` collection
5. Locate the user document you want to make an owner
6. Edit the document and set the `role` field to `"owner"`
7. Save the changes

### Option 2: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set the owner role (replace USER_UID with actual user UID)
firebase firestore:set users/USER_UID '{"role":"owner","email":"user@example.com","createdAt":"2024-01-01T00:00:00Z","updatedAt":"2024-01-01T00:00:00Z"}'
```

### Option 3: Programmatically (One-time script)

You can create a temporary page or script to assign the first owner:

```typescript
import { updateUserRole } from '@/lib/userRoles';

// Run this once to set the first owner
await updateUserRole('USER_UID_HERE', 'owner');
```

## User Flow

### Sign Up
- New users sign up with email/password
- A user document is created in Firestore with `role: null`
- They have no special permissions

### Owner Actions
- **Manage Admins**: Go to `/admin` to promote users to admin or remove roles
- **Create Events**: Events created by owners are automatically approved
- **Approve Events**: Review and approve/reject events created by admins
- **Edit Events**: Can edit any event

### Admin Actions
- **Create Events**: Events are created with `status: 'pending'` and require owner approval
- **Edit Events**: Can edit their own events (goes back to pending after edit)
- **View Events**: Can see all events in the admin panel

## Routes

- `/login` - Login/Sign up page
- `/admin` - Admin management (Owner only)
- `/admin/events` - Events management (Owner & Admin)
- `/admin/events/create` - Create new event (Owner & Admin)
- `/admin/events/edit/[id]` - Edit event (Owner can edit any, Admin can edit own)

## Firestore Collections

### `users` Collection
```typescript
{
  uid: string;
  email: string;
  role: 'owner' | 'admin' | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### `events` Collection
```typescript
{
  title: string;
  date: string;
  location: string;
  price: string;
  description?: string;
  image?: string;
  createdBy: string; // User UID
  createdByEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string; // Owner UID
  approvedAt?: Date;
}
```

## Security Rules (Firestore)

Make sure to set up Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data, owners can read all
    match /users/{userId} {
      allow read: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner';
    }
    
    // Events: public read for approved, owners/admins can create/edit
    match /events/{eventId} {
      allow read: if resource.data.status == 'approved' || 
        (request.auth != null && 
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin']));
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['owner', 'admin'];
      allow update: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner' ||
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' && 
          resource.data.createdBy == request.auth.uid));
      allow delete: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'owner' ||
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' && 
          resource.data.createdBy == request.auth.uid));
    }
  }
}
```

## Testing

1. **Create test accounts**:
   - Sign up as regular user (no role)
   - Sign up as admin candidate
   - Sign up as owner candidate

2. **Assign roles**:
   - Set one user as owner (via Firebase Console)
   - Login as owner and promote another user to admin

3. **Test permissions**:
   - Owner: Create event (should auto-approve)
   - Admin: Create event (should be pending)
   - Owner: Approve admin's event
   - Admin: Try to edit event (should work)
   - Admin: Try to delete event (should work for own events)

