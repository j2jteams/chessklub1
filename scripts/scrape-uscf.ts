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
 * Extract rating from a specific section - simplified and more robust
 */
function extractRatingFromSection(sectionText: string, minRating: number = 100, maxRating: number = 3000): { rating?: string; floor?: string; games?: string } {
  // Normalize the section text
  const normalized = sectionText.replace(/\s+/g, ' ').trim();
  
  // Pattern 1: Look for "number ... FLOOR ... number" (rating before FLOOR, floor after)
  const patternWithFloor = /(\d{3,4})\s*(?:\/\s*(\d+))?\s*[^\d]*?FLOOR[^\d]*?(\d{1,3})/i;
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
  
  // Pattern 2: Look for "number" that's not followed by FLOOR (might be rating only)
  // Find all numbers in the section
  const allNumbers = normalized.match(/\b(\d{3,4})\b/g);
  if (allNumbers) {
    for (const numStr of allNumbers) {
      const num = parseInt(numStr);
      if (num >= minRating && num <= maxRating) {
        // Check if this number is followed by FLOOR - if so, it's the rating
        const numIndex = normalized.indexOf(numStr);
        const afterNum = normalized.substring(numIndex + numStr.length, numIndex + numStr.length + 50);
        
        // If FLOOR appears after, this is the rating
        if (afterNum.match(/FLOOR/i)) {
          // Extract floor value
          const floorMatch = afterNum.match(/FLOOR[^\d]*?(\d{1,3})/i);
          return {
            rating: numStr,
            floor: floorMatch ? floorMatch[1] : undefined
          };
        }
        
        // If no FLOOR nearby and it's a reasonable rating, use it
        if (!afterNum.match(/FLOOR/i) && num >= minRating) {
          // Check for game count pattern "rating / games"
          const gamesMatch = normalized.match(new RegExp(`${numStr}\\s*/\\s*(\\d+)`, 'i'));
          return {
            rating: numStr,
            games: gamesMatch ? gamesMatch[1] : undefined
          };
        }
      }
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
  
  // Extract text content safely - avoid page.evaluate() with complex code
  // Use simple string evaluation to avoid TypeScript compilation issues
  const bodyText = await page.evaluate(() => {
    return document.body ? (document.body.innerText || document.body.textContent || '') : '';
  });
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
  
  // Extract ratings using simpler, more direct patterns
  // Regular Rating - look for REGULAR followed by a 4-digit number
  const regularMatch = ratingsSection.match(/REGULAR[^\d]*?(\d{4})(?![^\d]*FLOOR)[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i);
  if (regularMatch) {
    const ratingNum = parseInt(regularMatch[1]);
    if (ratingNum >= 1000 && ratingNum <= 3000) {
      result.regular = regularMatch[1];
      if (regularMatch[2] && parseInt(regularMatch[2]) <= 500) {
        result.regularFloor = regularMatch[2];
      }
    }
  }
  
  // Quick Rating - look for QUICK followed by a 4-digit number
  const quickMatch = ratingsSection.match(/QUICK[^\d]*?(\d{4})(?![^\d]*FLOOR)[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i);
  if (quickMatch) {
    const ratingNum = parseInt(quickMatch[1]);
    if (ratingNum >= 1000 && ratingNum <= 3000) {
      result.quick = quickMatch[1];
      if (quickMatch[2] && parseInt(quickMatch[2]) <= 500) {
        result.quickFloor = quickMatch[2];
      }
    }
  }
  
  // Blitz Rating - can be 3 or 4 digits
  const blitzMatch = ratingsSection.match(/BLITZ[^\d]*?(\d{3,4})(?![^\d]*FLOOR)[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i);
  if (blitzMatch) {
    const ratingNum = parseInt(blitzMatch[1]);
    if (ratingNum >= 500 && ratingNum <= 3000) {
      result.blitz = blitzMatch[1];
      if (blitzMatch[2] && parseInt(blitzMatch[2]) <= 500) {
        result.blitzFloor = blitzMatch[2];
      }
    }
  }
  
  // Online Regular - format: "838 / 20" (rating / games)
  const onlineRegularMatch = ratingsSection.match(/ONLINE[\s-]?REGULAR[^\d]*?(\d{3,4})(?:\s*\/\s*(\d+))?[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i);
  if (onlineRegularMatch) {
    const ratingNum = parseInt(onlineRegularMatch[1]);
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
  const onlineQuickMatch = ratingsSection.match(/ONLINE[\s-]?QUICK[^\d]*?(\d{3,4})[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i);
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
  const onlineBlitzMatch = ratingsSection.match(/ONLINE[\s-]?BLITZ[^\d]*?(\d{3,4})[^\d]*?(?:FLOOR[^\d]*?(\d{1,3}))?/i);
  if (onlineBlitzMatch) {
    const ratingNum = parseInt(onlineBlitzMatch[1]);
    if (ratingNum >= 100 && ratingNum <= 3000) {
      result.onlineBlitz = onlineBlitzMatch[1];
      if (onlineBlitzMatch[2] && parseInt(onlineBlitzMatch[2]) <= 500) {
        result.onlineBlitzFloor = onlineBlitzMatch[2];
      }
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
  
  // Log what we extracted for debugging
  console.log('Extracted data:', JSON.stringify(result, null, 2));
  
  return result;
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

