/**
 * Migration script to move uscfRatings from users collection to playerRatings collection
 * Run with: tsx scripts/migrate-ratings.ts
 */

import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    path.join(process.cwd(), 'firebase-service-account.json');
  
  let serviceAccountJson: admin.ServiceAccount;
  
  if (serviceAccountEnv) {
    // Try parsing as JSON string first (from environment variable)
    try {
      serviceAccountJson = JSON.parse(serviceAccountEnv);
    } catch (error) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT must be a valid JSON string');
    }
  } else if (fs.existsSync(serviceAccountPath)) {
    // Try reading from file
    serviceAccountJson = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  } else {
    throw new Error('Firebase service account not found. Please set FIREBASE_SERVICE_ACCOUNT environment variable or place firebase-service-account.json in the project root.');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson as admin.ServiceAccount),
  });
}

const db = admin.firestore();

async function migrateRatings() {
  console.log('Starting migration of uscfRatings to playerRatings collection...\n');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users in the database\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const uscfRatings = userData.uscfRatings;

      if (!uscfRatings) {
        console.log(`Skipping user ${userId}: No uscfRatings data`);
        skippedCount++;
        continue;
      }

      // Check if playerRatings document already exists
      const playerRatingsRef = db.collection('playerRatings').doc(userId);
      const existingRatings = await playerRatingsRef.get();

      if (existingRatings.exists) {
        console.log(`Skipping user ${userId}: playerRatings already exists`);
        skippedCount++;
        continue;
      }

      // Prepare the data for playerRatings
      const playerRatingsData: any = {
        userId: userId,
        uschessRatings: {
          ...uscfRatings,
        },
      };

      // Handle lastSynced if it exists
      if (uscfRatings.lastSynced) {
        if (uscfRatings.lastSynced.toDate) {
          playerRatingsData.lastSynced = {
            uschess: uscfRatings.lastSynced.toDate(),
          };
        } else if (uscfRatings.lastSynced instanceof Date) {
          playerRatingsData.lastSynced = {
            uschess: uscfRatings.lastSynced,
          };
        } else {
          playerRatingsData.lastSynced = {
            uschess: admin.firestore.FieldValue.serverTimestamp(),
          };
        }
      } else {
        playerRatingsData.lastSynced = {
          uschess: admin.firestore.FieldValue.serverTimestamp(),
        };
      }

      // Remove lastSynced from uschessRatings as it's now in the parent lastSynced object
      if (playerRatingsData.uschessRatings.lastSynced) {
        delete playerRatingsData.uschessRatings.lastSynced;
      }

      // Create the playerRatings document
      await playerRatingsRef.set(playerRatingsData);

      console.log(`✓ Migrated ratings for user ${userId}`);
      migratedCount++;
    }

    console.log(`\n=== Migration Complete ===`);
    console.log(`Migrated: ${migratedCount} users`);
    console.log(`Skipped: ${skippedCount} users`);
    console.log(`Total: ${usersSnapshot.size} users`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateRatings()
  .then(() => {
    console.log('\nMigration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });

