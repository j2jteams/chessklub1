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
 * Known US state names for validation
 */
const US_STATES = new Set([
  'ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO',
  'CONNECTICUT', 'DELAWARE', 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO',
  'ILLINOIS', 'INDIANA', 'IOWA', 'KANSAS', 'KENTUCKY', 'LOUISIANA',
  'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN', 'MINNESOTA', 'MISSISSIPPI',
  'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA', 'NEW HAMPSHIRE', 'NEW JERSEY',
  'NEW MEXICO', 'NEW YORK', 'NORTH CAROLINA', 'NORTH DAKOTA', 'OHIO', 'OKLAHOMA',
  'OREGON', 'PENNSYLVANIA', 'RHODE ISLAND', 'SOUTH CAROLINA', 'SOUTH DAKOTA',
  'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON',
  'WEST VIRGINIA', 'WISCONSIN', 'WYOMING', 'DISTRICT OF COLUMBIA'
]);

/**
 * Extract rating from a specific section using DOM-aware extraction
 */
function extractRatingFromSection(sectionText: string, ratingType: string, minRating: number = 100, maxRating: number = 3000): { rating?: string; floor?: string; games?: string } {
  // Normalize the section text - remove extra whitespace
  const normalized = sectionText.replace(/\s+/g, ' ').trim();
  
  // Pattern 1: Look for "RATING_TYPE ... number ... FLOOR ... number"
  // This is the most reliable pattern - rating comes before FLOOR
  const patternWithFloor = new RegExp(`${ratingType}[^\\d]*?(\\d{3,4})\\s*(?:/\\s*(\\d+))?[^\\d]*?FLOOR[^\\d]*?(\\d{1,3})`, 'i');
  const matchWithFloor = normalized.match(patternWithFloor);
  
  if (matchWithFloor) {
    const ratingNum = parseInt(matchWithFloor[1]);
    const floorNum = parseInt(matchWithFloor[3]);
    
    // Validate: rating should be in valid range, floor should be small
    if (ratingNum >= minRating && ratingNum <= maxRating && floorNum >= 50 && floorNum <= 500) {
      return {
        rating: matchWithFloor[1],
        floor: matchWithFloor[3],
        games: matchWithFloor[2] || undefined
      };
    }
  }
  
  // Pattern 2: Look for "RATING_TYPE ... number" (no floor mentioned)
  // Must be a reasonable rating number
  const patternNoFloor = new RegExp(`${ratingType}[^\\d]*?(\\d{3,4})(?:\\s*/\\s*(\\d+))?(?!\\s*FLOOR)`, 'i');
  const matchNoFloor = normalized.match(patternNoFloor);
  
  if (matchNoFloor) {
    const ratingNum = parseInt(matchNoFloor[1]);
    
    // Validate: must be a reasonable rating (not a floor value)
    if (ratingNum >= minRating && ratingNum <= maxRating) {
      // Additional check: if it's a 3-digit number starting with 1, it might be a floor
      // Floors are typically 100-200, so if it's 100-299, be more cautious
      if (ratingNum >= 100 && ratingNum < 300) {
        // Check if there's a FLOOR mentioned nearby - if so, this might be the floor
        const contextAfter = normalized.substring(normalized.indexOf(matchNoFloor[0]) + matchNoFloor[0].length, normalized.indexOf(matchNoFloor[0]) + matchNoFloor[0].length + 50);
        if (contextAfter.match(/FLOOR/i)) {
          // This is likely a floor, skip it
          return {};
        }
      }
      
      return {
        rating: matchNoFloor[1],
        games: matchNoFloor[2] || undefined
      };
    }
  }
  
  return {};
}

/**
 * Scrape USCF player page using Playwright with intelligent extraction
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
  
  // Extract structured data using DOM selectors for better accuracy
  const pageData = await page.evaluate(() => {
    const getTextContent = (element: Element | null): string => {
      return element ? (element.textContent || element.innerText || '').trim() : '';
    };
    
    // Get all text content
    const bodyText = document.body ? (document.body.innerText || document.body.textContent || '') : '';
    
    // Try to find rating sections by looking for specific text patterns
    // This is more reliable than pure regex on the entire body
    
    return {
      bodyText,
      html: document.documentElement.outerHTML.substring(0, 50000) // First 50KB for context
    };
  });
  
  const bodyText = pageData.bodyText;
  const result: ScrapedUSCFData = {};
  
  // Extract membership info - use more specific pattern
  const membershipSection = bodyText.match(/ID:[\s\S]{0,500}?Updated:[\s\S]{0,200}/i);
  if (membershipSection) {
    const memText = membershipSection[0];
    const idMatch = memText.match(/ID:\s*(\d+)/i);
    const statusMatch = memText.match(/Status:\s*[•·\s]*([A-Za-z]+)/i);
    const genderMatch = memText.match(/Gender:\s*([MF])/i);
    const expiresMatch = memText.match(/Expires:\s*(\d{4}-\d{2}-\d{2})/i);
    const updatedMatch = memText.match(/Updated:\s*(\d{4}-\d{2}-\d{2})/i);
    
    if (idMatch) result.membershipId = idMatch[1];
    if (statusMatch) result.status = statusMatch[1];
    if (genderMatch) result.gender = genderMatch[1];
    if (expiresMatch) result.expires = expiresMatch[1];
    if (updatedMatch) result.updated = updatedMatch[1];
  }
  
  // Extract FIDE info
  const fideMatch = bodyText.match(/FIDE:\s*(\d+)\s+([A-Z]{2,3})/i);
  if (fideMatch) {
    result.fideId = fideMatch[1];
    result.fideCountry = fideMatch[2];
  }
  
  // Extract ratings using section-aware extraction
  // Find the RATINGS section first to avoid cross-contamination
  const ratingsSectionMatch = bodyText.match(/(?:RATINGS?|Rating)[\s\S]{0,2000}?(?=(?:RANKING|Ranking|OVERALL|Membership|FIDE)|$)/i);
  const ratingsSection = ratingsSectionMatch ? ratingsSectionMatch[0] : bodyText;
  
  // Extract each rating type from the ratings section only
  // This prevents Regular from matching Quick's number and vice versa
  
  // Regular Rating - must be in the ratings section, must be 4 digits typically
  const regularSection = ratingsSection.match(/REGULAR[\s\S]{0,200}?(?=(?:QUICK|BLITZ|ONLINE|RANKING|$))/i);
  if (regularSection) {
    const regularData = extractRatingFromSection(regularSection[0], 'REGULAR', 1000, 3000);
    if (regularData.rating) {
      result.regular = regularData.rating;
      if (regularData.floor) result.regularFloor = regularData.floor;
    }
  }
  
  // Quick Rating - must be after Regular, before Blitz
  const quickSection = ratingsSection.match(/QUICK[\s\S]{0,200}?(?=(?:BLITZ|ONLINE|RANKING|$))/i);
  if (quickSection) {
    const quickData = extractRatingFromSection(quickSection[0], 'QUICK', 1000, 3000);
    if (quickData.rating) {
      result.quick = quickData.rating;
      if (quickData.floor) result.quickFloor = quickData.floor;
    }
  }
  
  // Blitz Rating - can be 3 or 4 digits, lower threshold
  const blitzSection = ratingsSection.match(/BLITZ[\s\S]{0,200}?(?=(?:ONLINE|RANKING|$))/i);
  if (blitzSection) {
    const blitzData = extractRatingFromSection(blitzSection[0], 'BLITZ', 500, 3000);
    if (blitzData.rating) {
      result.blitz = blitzData.rating;
      if (blitzData.floor) result.blitzFloor = blitzData.floor;
    }
  }
  
  // Online Regular - format: "838 / 20" (rating / games)
  const onlineRegularSection = ratingsSection.match(/ONLINE[\s-]?REGULAR[\s\S]{0,200}?(?=(?:ONLINE[\s-]?QUICK|ONLINE[\s-]?BLITZ|RANKING|$))/i);
  if (onlineRegularSection) {
    const onlineRegularData = extractRatingFromSection(onlineRegularSection[0], 'ONLINE[\s-]?REGULAR', 100, 3000);
    if (onlineRegularData.rating) {
      result.onlineRegular = onlineRegularData.rating;
      if (onlineRegularData.games) result.onlineRegularGames = onlineRegularData.games;
      if (onlineRegularData.floor) result.onlineRegularFloor = onlineRegularData.floor;
    }
  }
  
  // Online Quick
  const onlineQuickSection = ratingsSection.match(/ONLINE[\s-]?QUICK[\s\S]{0,200}?(?=(?:ONLINE[\s-]?BLITZ|RANKING|$))/i);
  if (onlineQuickSection) {
    const onlineQuickData = extractRatingFromSection(onlineQuickSection[0], 'ONLINE[\s-]?QUICK', 100, 3000);
    if (onlineQuickData.rating) {
      result.onlineQuick = onlineQuickData.rating;
      if (onlineQuickData.floor) result.onlineQuickFloor = onlineQuickData.floor;
    }
  }
  
  // Online Blitz
  const onlineBlitzSection = ratingsSection.match(/ONLINE[\s-]?BLITZ[\s\S]{0,200}?(?=(?:RANKING|$))/i);
  if (onlineBlitzSection) {
    const onlineBlitzData = extractRatingFromSection(onlineBlitzSection[0], 'ONLINE[\s-]?BLITZ', 100, 3000);
    if (onlineBlitzData.rating) {
      result.onlineBlitz = onlineBlitzData.rating;
      if (onlineBlitzData.floor) result.onlineBlitzFloor = onlineBlitzData.floor;
    }
  }
  
  // Extract Rankings - find RANKING section first
  const rankingSectionMatch = bodyText.match(/(?:RANKING|Ranking)[\s\S]{0,2000}?(?=(?:Membership|FIDE|$))/i);
  const rankingSection = rankingSectionMatch ? rankingSectionMatch[0] : bodyText;
  
  // Overall Ranking - must be in ranking section
  const overallMatch = rankingSection.match(/OVERALL[\s\S]{0,300}?(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/i);
  if (overallMatch) {
    result.overallRank = overallMatch[1].replace(/,/g, '');
    result.overallTotal = overallMatch[2].replace(/,/g, '');
    
    // Extract percentile - look in the overall section context
    const overallContext = rankingSection.substring(
      Math.max(0, rankingSection.indexOf(overallMatch[0]) - 50),
      rankingSection.indexOf(overallMatch[0]) + overallMatch[0].length + 100
    );
    const percentileMatch = overallContext.match(/(\d{1,2})(?:st|nd|rd|th)\s+percentile/i);
    if (percentileMatch) {
      result.overallPercentile = percentileMatch[1];
    }
  }
  
  // State Ranking - use validated state names
  // First, find all "X out of Y" patterns in ranking section
  const allRankingPattern = /(\d{1,3}(?:,\d{3})*)\s+out of\s+(\d{1,3}(?:,\d{3})*)/g;
  const allRankings = Array.from(rankingSection.matchAll(allRankingPattern));
  
  if (allRankings.length >= 2) {
    // Second match should be the state ranking (first is overall)
    const stateRankMatch = allRankings[1];
    const stateContextStart = Math.max(0, stateRankMatch.index! - 300);
    const stateContextEnd = stateRankMatch.index! + stateRankMatch[0].length + 100;
    const stateContext = rankingSection.substring(stateContextStart, stateContextEnd);
    
    // Extract state name - look for known state names only
    let stateName: string | undefined;
    for (const state of US_STATES) {
      // Check if state name appears in context before the ranking
      const stateIndex = stateContext.toUpperCase().indexOf(state);
      const rankIndex = stateContext.indexOf(stateRankMatch[0]);
      if (stateIndex !== -1 && stateIndex < rankIndex) {
        stateName = state;
        break;
      }
    }
    
    // If no full state name found, try to find it with pattern but validate it
    if (!stateName) {
      const stateNamePattern = /([A-Z]{2,}\s+[A-Z]{2,}|[A-Z]{3,})/g;
      const stateNameMatches = Array.from(stateContext.matchAll(stateNamePattern));
      
      for (const match of stateNameMatches) {
        const candidate = match[1].trim().toUpperCase();
        // Validate: must be a known state, not OVERALL, not a rating type
        if (US_STATES.has(candidate) && 
            !candidate.includes('OVERALL') && 
            !['REGULAR', 'QUICK', 'BLITZ', 'FLOOR'].includes(candidate)) {
          stateName = candidate;
          break;
        }
      }
    }
    
    if (stateName) {
      result.stateName = stateName;
      result.stateRank = stateRankMatch[1].replace(/,/g, '');
      result.stateTotal = stateRankMatch[2].replace(/,/g, '');
      
      // Extract percentile
      const percentileMatch = stateContext.match(/(\d{1,2})(?:st|nd|rd|th)\s+percentile/i);
      if (percentileMatch) {
        result.statePercentile = percentileMatch[1];
      }
    }
  }
  
  // Fallback: If we have state rank but no name, try state abbreviation
  if (result.stateRank && !result.stateName) {
    const stateAbbrMap: { [key: string]: string } = {
      'SC': 'SOUTH CAROLINA', 'NC': 'NORTH CAROLINA', 'CA': 'CALIFORNIA',
      'NY': 'NEW YORK', 'TX': 'TEXAS', 'FL': 'FLORIDA', 'IL': 'ILLINOIS',
      'GA': 'GEORGIA', 'VA': 'VIRGINIA', 'PA': 'PENNSYLVANIA', 'OH': 'OHIO',
      'MI': 'MICHIGAN', 'MA': 'MASSACHUSETTS', 'WA': 'WASHINGTON', 'OR': 'OREGON'
    };
    
    const stateAbbrMatch = bodyText.match(/ID:\s*\d+\s+([A-Z]{2})\b/);
    if (stateAbbrMatch && stateAbbrMap[stateAbbrMatch[1]]) {
      result.stateName = stateAbbrMap[stateAbbrMatch[1]];
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

