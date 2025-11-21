# Required Firestore Indexes

## ✅ Index 1: Events by Status and Created Date (ALREADY CREATED)
**Collection:** `events`
**Fields:**
- `status` (Ascending)
- `createdAt` (Descending)
**Query Scope:** Collection

**Used by:** `getApprovedEvents()`, `getPendingEvents()`, `getEventsByStatus()`

---

## ❌ Index 2: Events by Creator and Created Date (MISSING - NEEDS TO BE CREATED)
**Collection:** `events`
**Fields:**
- `createdBy` (Ascending)
- `createdAt` (Descending)
**Query Scope:** Collection

**Used by:** `getEventsCreatedBy()` - **This is the one causing your current error!**

**This index is required for:**
- Admin Dashboard to show "Total Events" count
- Admin Dashboard to show "Your Events" list
- Owner/Admin to see their own created events

## How to Create Indexes

### Option 1: Click the Link in the Error
When you see the error, click the link provided. It will take you directly to Firebase Console to create the index.

### Option 2: Manual Creation (For Index 2: createdBy + createdAt)

**You already have Index 1 (status + createdAt). Now create Index 2:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **chessklub1-b65a1**
3. Go to **Firestore Database** → **Indexes** tab
4. Click **Create Index**
5. Fill in:
   - **Collection ID:** `events`
   - **Fields to index:**
     - Field 1: `createdBy` (Ascending) ⚠️ **Make sure this is `createdBy`, NOT `status`**
     - Field 2: `createdAt` (Descending)
   - **Query scope:** Collection
6. Click **Create**

**Important:** This is a DIFFERENT index from the one you already created. The first one uses `status`, this one uses `createdBy`.

The index will take a few minutes to build. Once it's ready (status shows "Enabled"), refresh your admin dashboard page and the event count should update.

