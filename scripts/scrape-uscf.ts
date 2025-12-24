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
 * Call DeepSeek via OpenRouter to extract structured data from page text
 */
async function extractWithDeepSeek(pageText: string): Promise<ScrapedUSCFData> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  
  if (!openRouterApiKey) {
    console.log('OPENROUTER_API_KEY not found, skipping DeepSeek extraction');
    return {};
  }
  
  console.log('Sending page text to DeepSeek for extraction...');
  
  // Limit text length to avoid token limits (keep first 15000 chars which should contain all ratings/rankings)
  const textSnippet = pageText.substring(0, 15000);
  
  const prompt = `Extract ALL the following details from this USCF player profile page text:

RATINGS (current rating numbers, NOT floor values):
- Regular Rating (the main rating number, typically 1000-3000)
- Regular Floor (if mentioned, typically 100-200)
- Quick Rating (the main rating number, typically 1000-3000)
- Quick Floor (if mentioned, typically 100-200)
- Blitz Rating (the main rating number, can be 500-3000)
- Blitz Floor (if mentioned, typically 100-200)
- Online-Regular Rating (format: "rating" or "rating / games")
- Online-Regular Games (number of games if mentioned)
- Online-Regular Floor (if mentioned)
- Online-Quick Rating
- Online-Quick Floor (if mentioned)
- Online-Blitz Rating
- Online-Blitz Floor (if mentioned)

RANKINGS:
- Overall rank (number only, no commas)
- Overall total (total players, number only)
- Overall percentile (number only, e.g., "92" not "92th")
- State name (full name in ALL CAPS, e.g., "SOUTH CAROLINA")
- State rank (number only, no commas)
- State total (total players in state, number only)
- State percentile (number only)

MEMBERSHIP:
- Membership ID (number only)
- Status (Active/Expired/Inactive)
- Gender (M or F)
- Expires date (YYYY-MM-DD format)
- Updated date (YYYY-MM-DD format)
- FIDE ID (number only)
- FIDE Country code (2-3 letter code)

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

If any field is not available or not found, use empty string "" for strings or omit the field.
IMPORTANT: Extract the ACTUAL RATING numbers, not floor values. Ratings are typically 1000+ for Regular/Quick, 500+ for Blitz, 100+ for Online ratings.

Page text:
${textSnippet}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/j2jteams/chessklub1',
        'X-Title': 'ChessKlub USCF Scraper'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction assistant. Extract structured data from USCF player profile pages and return ONLY valid JSON, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return {};
    }
    
    const data = await response.json();
    const extractedContent = data.choices?.[0]?.message?.content;
    
    if (!extractedContent) {
      console.error('No content in DeepSeek response');
      return {};
    }
    
    // Extract JSON from response (might be wrapped in markdown code blocks)
    const jsonMatch = extractedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                     extractedContent.match(/(\{[\s\S]*\})/);
    
    if (!jsonMatch) {
      console.error('No JSON found in DeepSeek response');
      console.error('Response:', extractedContent.substring(0, 500));
      return {};
    }
    
    const extractedJson = JSON.parse(jsonMatch[1]);
    console.log('✓ DeepSeek extraction successful');
    console.log('Extracted data:', JSON.stringify(extractedJson, null, 2));
    
    // Convert to ScrapedUSCFData format
    const result: ScrapedUSCFData = {
      regular: extractedJson.regular || undefined,
      regularFloor: extractedJson.regularFloor || undefined,
      quick: extractedJson.quick || undefined,
      quickFloor: extractedJson.quickFloor || undefined,
      blitz: extractedJson.blitz || undefined,
      blitzFloor: extractedJson.blitzFloor || undefined,
      onlineRegular: extractedJson.onlineRegular || undefined,
      onlineRegularGames: extractedJson.onlineRegularGames || undefined,
      onlineRegularFloor: extractedJson.onlineRegularFloor || undefined,
      onlineQuick: extractedJson.onlineQuick || undefined,
      onlineQuickFloor: extractedJson.onlineQuickFloor || undefined,
      onlineBlitz: extractedJson.onlineBlitz || undefined,
      onlineBlitzFloor: extractedJson.onlineBlitzFloor || undefined,
      overallRank: extractedJson.overallRank || undefined,
      overallTotal: extractedJson.overallTotal || undefined,
      overallPercentile: extractedJson.overallPercentile || undefined,
      stateName: extractedJson.stateName || undefined,
      stateRank: extractedJson.stateRank || undefined,
      stateTotal: extractedJson.stateTotal || undefined,
      statePercentile: extractedJson.statePercentile || undefined,
      membershipId: extractedJson.membershipId || undefined,
      status: extractedJson.status || undefined,
      gender: extractedJson.gender || undefined,
      expires: extractedJson.expires || undefined,
      updated: extractedJson.updated || undefined,
      fideId: extractedJson.fideId || undefined,
      fideCountry: extractedJson.fideCountry || undefined,
    };
    
    return result;
  } catch (error) {
    console.error('DeepSeek extraction failed:', error);
    return {};
  }
}

/**
 * Scrape USCF player page using Playwright and DeepSeek
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
  
  // Extract text content - this is what we'll send to DeepSeek
  const bodyText = await page.evaluate(() => {
    return document.body ? (document.body.innerText || document.body.textContent || '') : '';
  });
  
  console.log(`Extracted page text (${bodyText.length} characters)`);
  
  // Use DeepSeek to extract structured data
  const result = await extractWithDeepSeek(bodyText);
  
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

