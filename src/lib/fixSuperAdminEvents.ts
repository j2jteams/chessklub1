/**
 * Client-side function to fix Super Admin events that are incorrectly in pendingApproval status
 * 
 * This can be called from:
 * 1. Browser console (when logged in as Super Admin)
 * 2. An admin page
 * 
 * Usage:
 * import { fixSuperAdminEvents } from '@/lib/fixSuperAdminEvents';
 * await fixSuperAdminEvents();
 */

import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getUserRole } from './userRoles';

export async function fixSuperAdminEvents(): Promise<{
  fixed: number;
  skipped: number;
  errors: string[];
}> {
  const results = {
    fixed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    console.log('🔍 Fetching all pendingApproval events...');

    // Get all events with pendingApproval status
    const pendingEventsQuery = query(
      collection(db, 'events'),
      where('status', '==', 'pendingApproval')
    );

    const pendingEventsSnapshot = await getDocs(pendingEventsQuery);

    console.log(`📋 Found ${pendingEventsSnapshot.size} events with pendingApproval status`);

    if (pendingEventsSnapshot.empty) {
      console.log('✅ No events to fix!');
      return results;
    }

    // Process each event
    for (const eventDoc of pendingEventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;
      const createdBy = eventData.createdBy;

      if (!createdBy) {
        console.warn(`⚠️  Event ${eventId} has no createdBy field, skipping...`);
        results.skipped++;
        continue;
      }

      // Check if creator is Super Admin
      try {
        const userRole = await getUserRole(createdBy);

        if (userRole === 'superAdmin') {
          // Update event to approved
          await updateDoc(doc(db, 'events', eventId), {
            status: 'approved',
            updatedAt: serverTimestamp(),
          });

          const eventTitle = eventData.title || eventData.name || eventId;
          console.log(`✅ Fixed event "${eventTitle}" (${eventId})`);
          results.fixed++;
        } else {
          console.log(`⏭️  Skipping event ${eventId} - Creator role: ${userRole || 'unknown'}`);
          results.skipped++;
        }
      } catch (error: any) {
        const errorMsg = `❌ Error processing event ${eventId}: ${error.message}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${results.fixed} events`);
    console.log(`   ⏭️  Skipped: ${results.skipped} events`);
    console.log(`   ❌ Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((err) => console.log(`   ${err}`));
    }

    if (results.fixed > 0) {
      console.log(`\n✅ Successfully updated ${results.fixed} Super Admin events to approved status!`);
    }

    return results;
  } catch (error: any) {
    const errorMsg = `❌ Fatal error: ${error.message}`;
    console.error(errorMsg);
    results.errors.push(errorMsg);
    throw error;
  }
}



