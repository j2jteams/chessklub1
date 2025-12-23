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
  
  // Extract data from the page
  const data = await page.evaluate(() => {
    const result: ScrapedUSCFData = {};
    
    // Helper function to get text content
    const getText = (selector: string): string | undefined => {
      const element = document.querySelector(selector);
      return element?.textContent?.trim();
    };
    
    // Helper function to get all text content
    const getAllText = (selector: string): string[] => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).map(el => el.textContent?.trim() || '');
    };
    
    // Extract membership info
    const membershipSection = document.querySelector('[class*="membership"], [class*="Membership"]');
    if (membershipSection) {
      const membershipText = membershipSection.textContent || '';
      
      // Extract ID
      const idMatch = membershipText.match(/ID:\s*(\d+)/i);
      if (idMatch) result.membershipId = idMatch[1];
      
      // Extract Status
      const statusMatch = membershipText.match(/Status:\s*[•·]\s*(Active|Expired|Inactive)/i);
      if (statusMatch) result.status = statusMatch[1];
      
      // Extract Gender
      const genderMatch = membershipText.match(/Gender:\s*([MF])/i);
      if (genderMatch) result.gender = genderMatch[1];
      
      // Extract Expires
      const expiresMatch = membershipText.match(/Expires:\s*(\d{4}-\d{2}-\d{2})/i);
      if (expiresMatch) result.expires = expiresMatch[1];
      
      // Extract Updated
      const updatedMatch = membershipText.match(/Updated:\s*(\d{4}-\d{2}-\d{2})/i);
      if (updatedMatch) result.updated = updatedMatch[1];
      
      // Extract FIDE ID
      const fideMatch = membershipText.match(/FIDE:\s*(\d+)/i);
      if (fideMatch) result.fideId = fideMatch[1];
      
      // Extract FIDE Country
      const fideCountryMatch = membershipText.match(/FIDE:\s*\d+\s+([A-Z]{2,3})/i);
      if (fideCountryMatch) result.fideCountry = fideCountryMatch[1];
    }
    
    // Extract Ratings - Look for rating boxes/cards
    const ratingBoxes = document.querySelectorAll('[class*="rating"], [class*="Rating"], [class*="card"]');
    ratingBoxes.forEach((box) => {
      const text = box.textContent || '';
      const boxText = text.toLowerCase();
      
      // Regular Rating
      if (boxText.includes('regular') && !boxText.includes('online')) {
        const ratingMatch = text.match(/(\d{3,4})/);
        if (ratingMatch) result.regular = ratingMatch[1];
        const floorMatch = text.match(/floor[:\s]*(\d{3,4})/i);
        if (floorMatch) result.regularFloor = floorMatch[1];
      }
      
      // Quick Rating
      if (boxText.includes('quick') && !boxText.includes('online')) {
        const ratingMatch = text.match(/(\d{3,4})/);
        if (ratingMatch) result.quick = ratingMatch[1];
        const floorMatch = text.match(/floor[:\s]*(\d{3,4})/i);
        if (floorMatch) result.quickFloor = floorMatch[1];
      }
      
      // Blitz Rating
      if (boxText.includes('blitz') && !boxText.includes('online')) {
        const ratingMatch = text.match(/(\d{3,4})/);
        if (ratingMatch) result.blitz = ratingMatch[1];
        const floorMatch = text.match(/floor[:\s]*(\d{3,4})/i);
        if (floorMatch) result.blitzFloor = floorMatch[1];
      }
      
      // Online Regular
      if (boxText.includes('online-regular') || (boxText.includes('online') && boxText.includes('regular'))) {
        const ratingMatch = text.match(/(\d{3,4})\s*\/\s*(\d+)/);
        if (ratingMatch) {
          result.onlineRegular = ratingMatch[1];
          result.onlineRegularGames = ratingMatch[2];
        }
        const floorMatch = text.match(/floor[:\s]*(\d{3,4})/i);
        if (floorMatch) result.onlineRegularFloor = floorMatch[1];
      }
      
      // Online Quick
      if (boxText.includes('online-quick') || (boxText.includes('online') && boxText.includes('quick'))) {
        const ratingMatch = text.match(/(\d{3,4})/);
        if (ratingMatch) result.onlineQuick = ratingMatch[1];
        const floorMatch = text.match(/floor[:\s]*(\d{3,4})/i);
        if (floorMatch) result.onlineQuickFloor = floorMatch[1];
      }
      
      // Online Blitz
      if (boxText.includes('online-blitz') || (boxText.includes('online') && boxText.includes('blitz'))) {
        const ratingMatch = text.match(/(\d{3,4})/);
        if (ratingMatch) result.onlineBlitz = ratingMatch[1];
        const floorMatch = text.match(/floor[:\s]*(\d{3,4})/i);
        if (floorMatch) result.onlineBlitzFloor = floorMatch[1];
      }
    });
    
    // Extract Rankings
    const rankingSection = document.querySelector('[class*="ranking"], [class*="Ranking"]');
    if (rankingSection) {
      const rankingText = rankingSection.textContent || '';
      
      // Overall Ranking
      if (rankingText.includes('OVERALL') || rankingText.includes('Overall')) {
        const overallMatch = rankingText.match(/(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/i);
        if (overallMatch) {
          result.overallRank = overallMatch[1].replace(/,/g, '');
          result.overallTotal = overallMatch[2].replace(/,/g, '');
        }
        const percentileMatch = rankingText.match(/(\d{1,2})(?:st|nd|rd|th)\s+percentile/i);
        if (percentileMatch) result.overallPercentile = percentileMatch[1];
      }
      
      // State Ranking - look for state name patterns
      const stateMatch = rankingText.match(/([A-Z\s]+)\s+(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/i);
      if (stateMatch && !stateMatch[1].includes('OVERALL')) {
        result.stateName = stateMatch[1].trim();
        result.stateRank = stateMatch[2].replace(/,/g, '');
        result.stateTotal = stateMatch[3].replace(/,/g, '');
        
        // Find percentile for state
        const statePercentileMatch = rankingText.match(/(\d{1,2})(?:st|nd|rd|th)\s+percentile/i);
        if (statePercentileMatch) result.statePercentile = statePercentileMatch[1];
      }
    }
    
    // Alternative: Try to find rankings by looking for large numbers with "out of" pattern
    const allText = document.body.textContent || '';
    const rankingPattern = /(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/g;
    const matches = Array.from(allText.matchAll(rankingPattern));
    
    if (matches.length > 0 && !result.overallRank) {
      result.overallRank = matches[0][1].replace(/,/g, '');
      result.overallTotal = matches[0][2].replace(/,/g, '');
    }
    
    if (matches.length > 1 && !result.stateRank) {
      result.stateRank = matches[1][1].replace(/,/g, '');
      result.stateTotal = matches[1][2].replace(/,/g, '');
    }
    
    // Extract percentile from text
    const percentileMatches = Array.from(allText.matchAll(/(\d{1,2})(?:st|nd|rd|th)\s+percentile/gi));
    if (percentileMatches.length > 0 && !result.overallPercentile) {
      result.overallPercentile = percentileMatches[0][1];
    }
    if (percentileMatches.length > 1 && !result.statePercentile) {
      result.statePercentile = percentileMatches[1][1];
    }
    
    return result;
  });
  
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

