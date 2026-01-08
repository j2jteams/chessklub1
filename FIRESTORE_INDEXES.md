# Firestore Composite Indexes Required

This document lists the required Firestore composite indexes for the location-aware tournament discovery system.

## Required Indexes

### Collection: `events`

#### Index 1: Location-based queries with status and date
- **Fields:**
  - `status` (Ascending)
  - `startDate` (Ascending)
  - `structuredLocation.geo` (GeoPoint)
- **Purpose:** Query published tournaments by location and date
- **Query Example:**
  ```typescript
  query(
    collection(db, 'events'),
    where('status', '==', 'approved'),
    where('startDate', '>=', today),
    // Geo query would use geohash ranges
  )
  ```

#### Index 2: Country-based queries
- **Fields:**
  - `status` (Ascending)
  - `structuredLocation.countryCode` (Ascending)
  - `startDate` (Ascending)
- **Purpose:** Filter tournaments by country
- **Query Example:**
  ```typescript
  query(
    collection(db, 'events'),
    where('status', '==', 'approved'),
    where('structuredLocation.countryCode', '==', 'US'),
    where('startDate', '>=', today),
    orderBy('startDate', 'asc')
  )
  ```

#### Index 3: Region-based queries
- **Fields:**
  - `status` (Ascending)
  - `structuredLocation.regionTag` (Ascending)
  - `startDate` (Ascending)
- **Purpose:** Filter tournaments by region (e.g., "US-Southeast")
- **Query Example:**
  ```typescript
  query(
    collection(db, 'events'),
    where('status', '==', 'approved'),
    where('structuredLocation.regionTag', '==', 'US-Southeast'),
    where('startDate', '>=', today),
    orderBy('startDate', 'asc')
  )
  ```

#### Index 4: Legacy location queries (backward compatibility)
- **Fields:**
  - `status` (Ascending)
  - `country` (Ascending)
  - `startDate` (Ascending)
- **Purpose:** Support legacy tournaments without structuredLocation
- **Query Example:**
  ```typescript
  query(
    collection(db, 'events'),
    where('status', '==', 'approved'),
    where('country', '==', 'USA'),
    where('startDate', '>=', today),
    orderBy('startDate', 'asc')
  )
  ```

## How to Create Indexes

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database → Indexes
4. Click "Create Index"
5. Enter the collection name: `events`
6. Add fields in the order specified above
7. Click "Create"

### Option 2: Firebase CLI
Create a `firestore.indexes.json` file in your project root:

```json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" },
        { "fieldPath": "structuredLocation.geo", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "structuredLocation.countryCode", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "structuredLocation.regionTag", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "country", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

## Notes

- **GeoPoint Queries:** Firestore doesn't support native distance queries. We use geohash-based range queries for location filtering. The `structuredLocation.geo` field is included for future use with geohash libraries.

- **Backward Compatibility:** Legacy indexes (using `country` field) are maintained for tournaments created before the structured location system.

- **Performance:** These indexes are essential for efficient queries. Without them, Firestore will throw errors when attempting complex queries.

## Testing Indexes

After creating indexes, test queries in the Firebase Console:
1. Go to Firestore Database → Data
2. Use the query builder to test each index
3. Verify queries return results without errors

## Monitoring

Monitor index usage in Firebase Console:
- Firestore Database → Usage → Indexes
- Check for unused indexes that can be removed
- Monitor query performance

