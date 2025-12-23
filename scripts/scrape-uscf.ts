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
  
  // Extract ratings - foolproof method: always get the FIRST number after the type name
  // The rating appears BEFORE "FLOOR", floor appears AFTER "FLOOR"
  // Ratings are typically 1000+, floors are typically 100-200
  const extractRating = (text: string, type: string): { rating?: string; floor?: string } => {
    // Look for pattern: TYPE ... [rating number] ... FLOOR [floor number]
    // The number BEFORE "FLOOR" is always the rating
    // The number AFTER "FLOOR" is always the floor
    const pattern = new RegExp(`${type}[^\\d]*?(\\d{3,4})(?![^\\d]*FLOOR)[^\\d]*?(?:FLOOR[^\\d]*?(\\d{1,3}))?`, 'i');
    const match = text.match(pattern);
    
    if (match) {
      const ratingNum = parseInt(match[1]);
      const floorNum = match[2] ? parseInt(match[2]) : null;
      
      // Validate: rating should be 1000+ (or at least 500+ for very low ratings)
      // Floor should be 100-200 (or at most 300)
      // If rating is less than 500, it's probably a floor value, skip it
      if (ratingNum >= 500) {
        // Only accept if it looks like a real rating
        return { 
          rating: match[1], 
          floor: floorNum && floorNum >= 50 && floorNum <= 500 ? match[2] : undefined 
        };
      }
    }
    
    // Alternative: Try to find rating in a more specific pattern
    // Look for: TYPE ... large number ... FLOOR ... small number
    const altPattern = new RegExp(`${type}[^\\d]*?(\\d{4})[^\\d]*?FLOOR[^\\d]*?(\\d{1,3})`, 'i');
    const altMatch = text.match(altPattern);
    if (altMatch) {
      const ratingNum = parseInt(altMatch[1]);
      const floorNum = parseInt(altMatch[2]);
      // If first number is 4 digits (1000+), it's definitely the rating
      if (ratingNum >= 1000 && floorNum <= 500) {
        return { rating: altMatch[1], floor: altMatch[2] };
      }
    }
    
    return {};
  };
  
  // Extract each rating type with more precise matching
  // Use a more specific approach: find the rating type, then the first large number after it
  
  // Regular Rating - be very specific
  const regularPattern = /REGULAR[^\d]*?(\d{4})[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i;
  const regularMatch = bodyText.match(regularPattern);
  if (regularMatch) {
    const ratingNum = parseInt(regularMatch[1]);
    if (ratingNum >= 1000) { // Ratings are typically 1000+
      result.regular = regularMatch[1];
      if (regularMatch[2] && parseInt(regularMatch[2]) <= 500) {
        result.regularFloor = regularMatch[2];
      }
    }
  }
  
  // Quick Rating
  const quickPattern = /QUICK[^\d]*?(\d{4})[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i;
  const quickMatch = bodyText.match(quickPattern);
  if (quickMatch) {
    const ratingNum = parseInt(quickMatch[1]);
    if (ratingNum >= 1000) {
      result.quick = quickMatch[1];
      if (quickMatch[2] && parseInt(quickMatch[2]) <= 500) {
        result.quickFloor = quickMatch[2];
      }
    }
  }
  
  // Blitz Rating - can be 3 or 4 digits
  const blitzPattern = /BLITZ[^\d]*?(\d{3,4})[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i;
  const blitzMatch = bodyText.match(blitzPattern);
  if (blitzMatch) {
    const ratingNum = parseInt(blitzMatch[1]);
    // Blitz ratings can be lower, but should still be at least 500+
    if (ratingNum >= 500 && ratingNum <= 3000) {
      result.blitz = blitzMatch[1];
      if (blitzMatch[2] && parseInt(blitzMatch[2]) <= 500) {
        result.blitzFloor = blitzMatch[2];
      }
    }
  }
  
  // Online Regular - format: "838 / 20" (rating / games) or just "838"
  const onlineRegularPattern = /ONLINE-REGULAR[^\d]*?(\d{3,4})(?:\s*\/\s*(\d+))?[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i;
  const onlineRegularMatch = bodyText.match(onlineRegularPattern);
  if (onlineRegularMatch) {
    const ratingNum = parseInt(onlineRegularMatch[1]);
    // Online ratings can be lower, but should be at least 100+
    if (ratingNum >= 100 && ratingNum <= 3000) {
      result.onlineRegular = onlineRegularMatch[1];
      if (onlineRegularMatch[2]) {
        result.onlineRegularGames = onlineRegularMatch[2];
      }
      if (onlineRegularMatch[3] && parseInt(onlineRegularMatch[3]) <= 500) {
        result.onlineRegularFloor = onlineRegularMatch[3];
      }
    }
  }
  
  // Online Quick
  const onlineQuickPattern = /ONLINE-QUICK[^\d]*?(\d{3,4})[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i;
  const onlineQuickMatch = bodyText.match(onlineQuickPattern);
  if (onlineQuickMatch) {
    const ratingNum = parseInt(onlineQuickMatch[1]);
    if (ratingNum >= 100 && ratingNum <= 3000) {
      result.onlineQuick = onlineQuickMatch[1];
      if (onlineQuickMatch[2] && parseInt(onlineQuickMatch[2]) <= 500) {
        result.onlineQuickFloor = onlineQuickMatch[2];
      }
    }
  }
  
  // Online Blitz
  const onlineBlitzPattern = /ONLINE-BLITZ[^\d]*?(\d{3,4})[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i;
  const onlineBlitzMatch = bodyText.match(onlineBlitzPattern);
  if (onlineBlitzMatch) {
    const ratingNum = parseInt(onlineBlitzMatch[1]);
    if (ratingNum >= 100 && ratingNum <= 3000) {
      result.onlineBlitz = onlineBlitzMatch[1];
      if (onlineBlitzMatch[2] && parseInt(onlineBlitzMatch[2]) <= 500) {
        result.onlineBlitzFloor = onlineBlitzMatch[2];
      }
    }
  }
  
  // Extract Rankings - be precise with OVERALL and STATE sections
  // Overall Ranking
  const overallMatch = bodyText.match(/OVERALL[^\d]*?(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/i);
  if (overallMatch) {
    result.overallRank = overallMatch[1].replace(/,/g, '');
    result.overallTotal = overallMatch[2].replace(/,/g, '');
    
    // Extract percentile for overall - look near the overall section
    const overallSection = bodyText.substring(
      Math.max(0, overallMatch.index! - 50),
      overallMatch.index! + overallMatch[0].length + 100
    );
    const overallPercentileMatch = overallSection.match(/(\d{1,2})(?:st|nd|rd|th)\s+percentile/i);
    if (overallPercentileMatch) {
      result.overallPercentile = overallPercentileMatch[1];
    }
  }
  
  // State Ranking - look for state name pattern (all caps, 2+ words)
  // Pattern: [STATE NAME] ... [rank] out of [total]
  // First try to find state name with ranking pattern
  const stateRankingPattern = /([A-Z]{2,}\s+[A-Z]{2,}|[A-Z]{3,})\s+(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/;
  const stateRankingMatch = bodyText.match(stateRankingPattern);
  
  if (stateRankingMatch && !stateRankingMatch[1].includes('OVERALL')) {
    result.stateName = stateRankingMatch[1].trim();
    result.stateRank = stateRankingMatch[2].replace(/,/g, '');
    result.stateTotal = stateRankingMatch[3].replace(/,/g, '');
    
    // Extract percentile for state - look near the state section
    const stateSection = bodyText.substring(
      Math.max(0, stateRankingMatch.index! - 50),
      stateRankingMatch.index! + stateRankingMatch[0].length + 100
    );
    const statePercentileMatch = stateSection.match(/(\d{1,2})(?:st|nd|rd|th)\s+percentile/i);
    if (statePercentileMatch) {
      result.statePercentile = statePercentileMatch[1];
    }
  } else {
    // Alternative: Look for ranking pattern after OVERALL section
    // Find all "X out of Y" patterns and the second one is usually the state
    const allRankingPattern = /(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/g;
    const allRankings = Array.from(bodyText.matchAll(allRankingPattern));
    
    if (allRankings.length >= 2) {
      // Second match is usually the state ranking
      const stateRankMatch = allRankings[1];
      const stateContext = bodyText.substring(
        Math.max(0, stateRankMatch.index! - 200),
        stateRankMatch.index! + stateRankMatch[0].length + 100
      );
      
      // Try to extract state name from context
      const stateNamePattern = /([A-Z]{2,}\s+[A-Z]{2,}|[A-Z]{3,})/;
      const stateNameMatch = stateContext.match(stateNamePattern);
      
      if (stateNameMatch && !stateNameMatch[1].includes('OVERALL')) {
        result.stateName = stateNameMatch[1].trim();
        result.stateRank = stateRankMatch[1].replace(/,/g, '');
        result.stateTotal = stateRankMatch[2].replace(/,/g, '');
        
        // Extract percentile
        const statePercentileMatch = stateContext.match(/(\d{1,2})(?:st|nd|rd|th)\s+percentile/i);
        if (statePercentileMatch) {
          result.statePercentile = statePercentileMatch[1];
        }
      }
    }
  }
  
  // Fallback: If we have state rank but no name, try to find it from membership section
  if (result.stateRank && !result.stateName) {
    // Check if we extracted state abbreviation from membership (e.g., "SC" in "ID: 30025270 SC")
    const membershipStateMatch = bodyText.match(/ID:\s*\d+\s+([A-Z]{2})/);
    if (membershipStateMatch) {
      const stateAbbr = membershipStateMatch[1];
      const stateNames: { [key: string]: string } = {
        'SC': 'SOUTH CAROLINA', 'NC': 'NORTH CAROLINA', 'CA': 'CALIFORNIA',
        'NY': 'NEW YORK', 'TX': 'TEXAS', 'FL': 'FLORIDA', 'IL': 'ILLINOIS',
        'GA': 'GEORGIA', 'VA': 'VIRGINIA', 'PA': 'PENNSYLVANIA', 'OH': 'OHIO',
        'MI': 'MICHIGAN', 'MA': 'MASSACHUSETTS', 'WA': 'WASHINGTON', 'OR': 'OREGON'
      };
      result.stateName = stateNames[stateAbbr] || stateAbbr;
    }
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
    
    // Sync ALL users with USCF IDs (no filtering by lastSynced)
    const usersToSync: Array<{ uid: string; uscfId: string }> = [];
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const uscfId = data.uscfId;
      
      if (!uscfId) return;
      
      // Add all users with USCF IDs to sync list
      usersToSync.push({ uid: doc.id, uscfId });
      console.log(`User ${doc.id} (USCF: ${uscfId}) - Added to sync list`);
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

