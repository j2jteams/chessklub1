import { chromium, Browser, Page } from 'playwright';
import * as admin from 'firebase-admin';
import { USCFRatings } from '../src/lib/types';

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

interface ScrapedUSCFData {
  // Standard Ratings
  regular?: string;
  regularFloor?: string;
  quick?: string;
  quickFloor?: string;
  blitz?: string;
  blitzFloor?: string;
  
  // Online Ratings
  onlineRegular?: string;
  onlineRegularGames?: string;
  onlineRegularFloor?: string;
  onlineQuick?: string;
  onlineQuickFloor?: string;
  onlineBlitz?: string;
  onlineBlitzFloor?: string;
  
  // Rankings
  overallRank?: string;
  overallTotal?: string;
  overallPercentile?: string;
  stateRank?: string;
  stateTotal?: string;
  statePercentile?: string;
  stateName?: string;
  
  // Membership Info
  membershipId?: string;
  status?: string;
  gender?: string;
  expires?: string;
  updated?: string;
  fideId?: string;
  fideCountry?: string;
}

/**
 * Scrape USCF player page using Playwright
 */
async function scrapeUSCFPage(page: Page, uscfId: string): Promise<ScrapedUSCFData> {
  const url = `https://ratings.uschess.org/player/${uscfId}`;
  console.log(`Navigating to: ${url}`);
  
  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });
  
  // Wait for page to fully load
  await page.waitForTimeout(3000);
  
  // Get HTML content and parse in Node.js (avoids browser context issues)
  const html = await page.content();
  // Extract text content safely - use simple string evaluation
  const bodyText = await page.evaluate(() => {
    return document.body ? document.body.innerText || document.body.textContent || '' : '';
  });
  
  // Parse data from HTML/text in Node.js context
  const result: ScrapedUSCFData = {};
  
  // Extract membership info from text
  const membershipMatch = bodyText.match(/ID:\s*(\d+).*?Status:\s*[•·]\s*(Active|Expired|Inactive).*?Gender:\s*([MF]).*?Expires:\s*(\d{4}-\d{2}-\d{2}).*?Updated:\s*(\d{4}-\d{2}-\d{2})/is);
  if (membershipMatch) {
    result.membershipId = membershipMatch[1];
    result.status = membershipMatch[2];
    result.gender = membershipMatch[3];
    result.expires = membershipMatch[4];
    result.updated = membershipMatch[5];
  }
  
  // Extract FIDE info
  const fideMatch = bodyText.match(/FIDE:\s*(\d+)\s+([A-Z]{2,3})/i);
  if (fideMatch) {
    result.fideId = fideMatch[1];
    result.fideCountry = fideMatch[2];
  }
  
  // Extract ratings - look for patterns in the text
  // Regular Rating
  const regularMatch = bodyText.match(/REGULAR[\s\S]{0,200}?(\d{3,4})(?:\s+FLOOR[\s:]*(\d{3,4}))?/i);
  if (regularMatch) {
    result.regular = regularMatch[1];
    if (regularMatch[2]) result.regularFloor = regularMatch[2];
  }
  
  // Quick Rating
  const quickMatch = bodyText.match(/QUICK[\s\S]{0,200}?(\d{3,4})(?:\s+FLOOR[\s:]*(\d{3,4}))?/i);
  if (quickMatch) {
    result.quick = quickMatch[1];
    if (quickMatch[2]) result.quickFloor = quickMatch[2];
  }
  
  // Blitz Rating
  const blitzMatch = bodyText.match(/BLITZ[\s\S]{0,200}?(\d{3,4})(?:\s+FLOOR[\s:]*(\d{3,4}))?/i);
  if (blitzMatch) {
    result.blitz = blitzMatch[1];
    if (blitzMatch[2]) result.blitzFloor = blitzMatch[2];
  }
  
  // Online Regular
  const onlineRegularMatch = bodyText.match(/ONLINE-REGULAR[\s\S]{0,200}?(\d{3,4})\s*\/\s*(\d+)(?:\s+FLOOR[\s:]*(\d{3,4}))?/i);
  if (onlineRegularMatch) {
    result.onlineRegular = onlineRegularMatch[1];
    result.onlineRegularGames = onlineRegularMatch[2];
    if (onlineRegularMatch[3]) result.onlineRegularFloor = onlineRegularMatch[3];
  }
  
  // Online Quick
  const onlineQuickMatch = bodyText.match(/ONLINE-QUICK[\s\S]{0,200}?(\d{3,4})(?:\s+FLOOR[\s:]*(\d{3,4}))?/i);
  if (onlineQuickMatch) {
    result.onlineQuick = onlineQuickMatch[1];
    if (onlineQuickMatch[2]) result.onlineQuickFloor = onlineQuickMatch[2];
  }
  
  // Online Blitz
  const onlineBlitzMatch = bodyText.match(/ONLINE-BLITZ[\s\S]{0,200}?(\d{3,4})(?:\s+FLOOR[\s:]*(\d{3,4}))?/i);
  if (onlineBlitzMatch) {
    result.onlineBlitz = onlineBlitzMatch[1];
    if (onlineBlitzMatch[2]) result.onlineBlitzFloor = onlineBlitzMatch[2];
  }
  
  // Extract Rankings
  const rankingPattern = /(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/g;
  const rankingMatches = Array.from(bodyText.matchAll(rankingPattern));
  
  if (rankingMatches.length > 0) {
    // First match is usually overall
    const overallContext = bodyText.substring(Math.max(0, rankingMatches[0].index! - 100), rankingMatches[0].index! + 200);
    if (overallContext.toUpperCase().includes('OVERALL')) {
      result.overallRank = rankingMatches[0][1].replace(/,/g, '');
      result.overallTotal = rankingMatches[0][2].replace(/,/g, '');
    } else {
      // Try to find overall in a different way
      const overallSection = bodyText.match(/OVERALL[\s\S]{0,300}?(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/i);
      if (overallSection) {
        result.overallRank = overallSection[1].replace(/,/g, '');
        result.overallTotal = overallSection[2].replace(/,/g, '');
      } else if (rankingMatches[0]) {
        result.overallRank = rankingMatches[0][1].replace(/,/g, '');
        result.overallTotal = rankingMatches[0][2].replace(/,/g, '');
      }
    }
    
    // Second match or state-specific match
    if (rankingMatches.length > 1) {
      const stateContext = bodyText.substring(Math.max(0, rankingMatches[1].index! - 100), rankingMatches[1].index! + 200);
      const stateNameMatch = stateContext.match(/([A-Z\s]{3,30})\s+(\d{1,3}(?:,\d{3})*)\s+out of/i);
      if (stateNameMatch && !stateNameMatch[1].includes('OVERALL')) {
        result.stateName = stateNameMatch[1].trim();
        result.stateRank = rankingMatches[1][1].replace(/,/g, '');
        result.stateTotal = rankingMatches[1][2].replace(/,/g, '');
      }
    }
  }
  
  // Extract percentiles
  const percentilePattern = /(\d{1,2})(?:st|nd|rd|th)\s+percentile/gi;
  const percentileMatches = Array.from(bodyText.matchAll(percentilePattern));
  if (percentileMatches.length > 0) {
    result.overallPercentile = percentileMatches[0][1];
  }
  if (percentileMatches.length > 1) {
    result.statePercentile = percentileMatches[1][1];
  }
  
  const data = result;
  
  // If direct extraction didn't work well, use DeepSeek as fallback
  if (!data.regular && !data.quick && !data.blitz) {
    console.log('Direct extraction failed, using DeepSeek fallback...');
    const html = await page.content();
    const htmlSnippet = html.substring(0, 200000);
    
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (openRouterApiKey) {
      try {
        const prompt = `Extract ALL the following details from this HTML of a USCF player profile page:

RATINGS (current rating numbers, not floors):
- Regular Rating
- Quick Rating  
- Blitz Rating
- Online-Regular Rating (format: "rating / games")
- Online-Quick Rating
- Online-Blitz Rating

RANKINGS:
- Overall rank (number)
- Overall total (total players)
- Overall percentile
- State name
- State rank (number)
- State total (total players in state)
- State percentile

MEMBERSHIP:
- Membership ID
- Status (Active/Expired/Inactive)
- Gender (M/F)
- Expires date (YYYY-MM-DD)
- Updated date (YYYY-MM-DD)
- FIDE ID
- FIDE Country code

Return ONLY valid JSON in this exact format, no explanation or markdown:
{
  "regular": "1717",
  "regularFloor": "1500",
  "quick": "1695",
  "quickFloor": "1500",
  "blitz": "1260",
  "blitzFloor": "1200",
  "onlineRegular": "838",
  "onlineRegularGames": "20",
  "onlineRegularFloor": "100",
  "onlineQuick": "",
  "onlineQuickFloor": "",
  "onlineBlitz": "",
  "onlineBlitzFloor": "",
  "overallRank": "6997",
  "overallTotal": "83133",
  "overallPercentile": "92",
  "stateName": "SOUTH CAROLINA",
  "stateRank": "56",
  "stateTotal": "684",
  "statePercentile": "92",
  "membershipId": "30025270",
  "status": "Active",
  "gender": "M",
  "expires": "2026-07-31",
  "updated": "2025-10-01",
  "fideId": "39974847",
  "fideCountry": "USA"
}

If any field is not available, use empty string "" for strings.

HTML:
${htmlSnippet}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-chat',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
          }),
        });
        
        if (response.ok) {
          const deepseekData = await response.json();
          const extractedContent = deepseekData.choices?.[0]?.message?.content;
          
          if (extractedContent) {
            const jsonMatch = extractedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                             extractedContent.match(/(\{[\s\S]*\})/);
            
            if (jsonMatch) {
              const extractedJson = JSON.parse(jsonMatch[1]);
              return { ...data, ...extractedJson };
            }
          }
        }
      } catch (error) {
        console.error('DeepSeek fallback failed:', error);
      }
    }
  }
  
  return data;
}

/**
 * Sync USCF ratings for a single user
 */
async function syncUserUSCFRatings(uid: string, uscfId: string, browser: Browser): Promise<void> {
  const page = await browser.newPage();
  
  try {
    console.log(`Syncing USCF ratings for user ${uid} (USCF ID: ${uscfId})`);
    
    const scrapedData = await scrapeUSCFPage(page, uscfId);
    
    // Convert to USCFRatings format
    const uscfRatings: USCFRatings = {
      ...scrapedData,
      lastSynced: new Date(),
    };
    
    // Update Firestore
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      uscfRatings: {
        ...uscfRatings,
        lastSynced: admin.firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`Successfully synced USCF ratings for user ${uid}`);
  } catch (error) {
    console.error(`Error syncing USCF ratings for user ${uid}:`, error);
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Main function to sync USCF ratings for all users
 */
async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    // Get all users with USCF IDs
    const usersSnapshot = await db.collection('users')
      .where('uscfId', '!=', null)
      .get();
    
    console.log(`Found ${usersSnapshot.size} users with USCF IDs`);
    
    // Filter users that need syncing (no ratings or ratings older than 7 days)
    const usersToSync: Array<{ uid: string; uscfId: string }> = [];
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const uscfId = data.uscfId;
      const uscfRatings = data.uscfRatings;
      
      if (!uscfId) return;
      
      // Check if sync is needed
      let needsSync = !uscfRatings || !uscfRatings.lastSynced;
      
      if (!needsSync && uscfRatings.lastSynced) {
        // Handle both Firestore Timestamp and Date objects
        let lastSyncedMillis = 0;
        if (uscfRatings.lastSynced.toMillis) {
          // Firestore Timestamp
          lastSyncedMillis = uscfRatings.lastSynced.toMillis();
        } else if (uscfRatings.lastSynced.toDate) {
          // Firestore Timestamp (alternative)
          lastSyncedMillis = uscfRatings.lastSynced.toDate().getTime();
        } else if (uscfRatings.lastSynced instanceof Date) {
          // Date object
          lastSyncedMillis = uscfRatings.lastSynced.getTime();
        } else if (typeof uscfRatings.lastSynced === 'number') {
          // Unix timestamp
          lastSyncedMillis = uscfRatings.lastSynced;
        }
        
        needsSync = lastSyncedMillis < sevenDaysAgo;
      }
      
      if (needsSync) {
        usersToSync.push({ uid: doc.id, uscfId });
      }
    });
    
    console.log(`Syncing ${usersToSync.length} users...`);
    
    // Sync each user with rate limiting
    for (const user of usersToSync) {
      try {
        await syncUserUSCFRatings(user.uid, user.uscfId, browser);
        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to sync user ${user.uid}:`, error);
        // Continue with next user even if one fails
      }
    }
    
    console.log('USCF ratings sync completed');
  } finally {
    await browser.close();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main, scrapeUSCFPage, syncUserUSCFRatings };

