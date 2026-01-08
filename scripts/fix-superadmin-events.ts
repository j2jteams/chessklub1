/**
 * Script to fix Super Admin events that are incorrectly in pendingApproval status
 * 
 * This script:
 * 1. Fetches all events with status 'pendingApproval'
 * 2. Checks if the creator is a Super Admin
 * 3. Updates those events to 'approved' status
 * 
 * Run with: npm run fix-superadmin-events
 * 
 * Requires FIREBASE_SERVICE_ACCOUNT environment variable
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is required');
  }
  
  let serviceAccountJson: admin.ServiceAccount;
  try {
    // Try parsing as JSON string first
    serviceAccountJson = JSON.parse(serviceAccount);
  } catch (error) {
    // If parsing fails, assume it's already an object (shouldn't happen but handle gracefully)
    throw new Error('FIREBASE_SERVICE_ACCOUNT must be a valid JSON string');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson as admin.ServiceAccount),
  });
}

const db = admin.firestore();

async function fixSuperAdminEvents() {
  try {
    console.log('🔍 Fetching all pendingApproval events...');
    
    // Get all events with pendingApproval status
    const pendingEventsSnapshot = await db.collection('events')
      .where('status', '==', 'pendingApproval')
      .get();
    
    console.log(`📋 Found ${pendingEventsSnapshot.size} events with pendingApproval status`);
    
    if (pendingEventsSnapshot.empty) {
      console.log('✅ No events to fix!');
      return;
    }
    
    let fixedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    
    // Process each event
    for (const eventDoc of pendingEventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;
      const createdBy = eventData.createdBy;
      
      if (!createdBy) {
        console.warn(`⚠️  Event ${eventId} has no createdBy field, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Check if creator is Super Admin
      try {
        const userDoc = await db.collection('users').doc(createdBy).get();
        
        if (!userDoc.exists) {
          console.warn(`⚠️  User ${createdBy} not found for event ${eventId}, skipping...`);
          skippedCount++;
          continue;
        }
        
        const userData = userDoc.data();
        const userRole = userData?.role;
        
        if (userRole === 'superAdmin') {
          // Update event to approved
          await db.collection('events').doc(eventId).update({
            status: 'approved',
            updatedAt: new Date(),
          });
          
          console.log(`✅ Fixed event "${eventData.title || eventData.name || eventId}" (${eventId}) - Super Admin: ${userData?.email || createdBy}`);
          fixedCount++;
        } else {
          console.log(`⏭️  Skipping event ${eventId} - Creator role: ${userRole || 'unknown'}`);
          skippedCount++;
        }
      } catch (error: any) {
        const errorMsg = `❌ Error processing event ${eventId}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} events`);
    console.log(`   ⏭️  Skipped: ${skippedCount} events`);
    console.log(`   ❌ Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => console.log(`   ${err}`));
    }
    
    if (fixedCount > 0) {
      console.log(`\n✅ Successfully updated ${fixedCount} Super Admin events to approved status!`);
    }
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
fixSuperAdminEvents()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

