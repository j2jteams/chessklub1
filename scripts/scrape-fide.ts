import { chromium, Browser, Page } from 'playwright';
import * as admin from 'firebase-admin';
import { FIDERatings } from '../src/lib/types';

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
    throw new Error('FIREBASE_SERVICE_ACCOUNT must be a valid JSON string');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountJson as admin.ServiceAccount),
  });
}

const db = admin.firestore();

interface ScrapedFIDEData {
  standard?: string;
  rapid?: string;
  blitz?: string;
  worldRankActive?: string;
  worldRankAll?: string;
  nationalRankName?: string;
  nationalRankActive?: string;
  nationalRankAll?: string;
  continentRankName?: string;
  continentRankActive?: string;
  continentRankAll?: string;
}

/**
 * Extract page text content for DeepSeek processing
 */
async function extractPageText(page: Page): Promise<string> {
  return await page.evaluate(() => {
    // Get all text content, excluding scripts and styles
    const body = document.body;
    if (!body) return '';
    
    // Clone body to avoid modifying the original
    const clone = body.cloneNode(true) as HTMLElement;
    
    // Remove script and style elements
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());
    
    return clone.innerText || clone.textContent || '';
  });
}

/**
 * Extract FIDE data using DeepSeek
 */
async function extractWithDeepSeek(textSnippet: string): Promise<ScrapedFIDEData> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    console.error('OPENROUTER_API_KEY environment variable is not set.');
    return {};
  }

  const prompt = `Extract ALL the following details from this FIDE player profile page text:

1. RATINGS (three ratings displayed prominently):
   - Standard rating (number)
   - Rapid rating (number)
   - Blitz rating (number)

2. RANKINGS (three ranking cards/windows):
   - World Rank:
     * Active players (number)
     * All players (number)
   - National Rank [COUNTRY_CODE]:
     * The country code/name (e.g., "IND", "FRA", "USA")
     * Active players (number)
     * All players (number)
   - Continent Rank [CONTINENT_NAME]:
     * The continent name (e.g., "Asia", "Europe", "Americas")
     * Active players (number)
     * All players (number)

IMPORTANT:
- Extract the exact country code/name and continent name as shown on the page
- Return ONLY valid JSON, no explanations
- Use empty strings "" for missing values, not null or undefined

Return JSON in this exact format:
{
  "standard": "1489",
  "rapid": "1502",
  "blitz": "1540",
  "worldRankActive": "185173",
  "worldRankAll": "463257",
  "nationalRankName": "IND",
  "nationalRankActive": "11508",
  "nationalRankAll": "33986",
  "continentRankName": "Asia",
  "continentRankActive": "37942",
  "continentRankAll": "125806"
}

Page text:
${textSnippet}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/j2jteams/chessklub1',
        'X-Title': 'ChessKlub FIDE Scraper'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction assistant. Extract structured data from FIDE player profile pages and return ONLY valid JSON, no explanations.'
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

    // Convert to ScrapedFIDEData format
    const result: ScrapedFIDEData = {
      standard: extractedJson.standard || undefined,
      rapid: extractedJson.rapid || undefined,
      blitz: extractedJson.blitz || undefined,
      worldRankActive: extractedJson.worldRankActive || undefined,
      worldRankAll: extractedJson.worldRankAll || undefined,
      nationalRankName: extractedJson.nationalRankName || undefined,
      nationalRankActive: extractedJson.nationalRankActive || undefined,
      nationalRankAll: extractedJson.nationalRankAll || undefined,
      continentRankName: extractedJson.continentRankName || undefined,
      continentRankActive: extractedJson.continentRankActive || undefined,
      continentRankAll: extractedJson.continentRankAll || undefined,
    };

    return result;
  } catch (error) {
    console.error('DeepSeek extraction failed:', error);
    return {};
  }
}

/**
 * Scrape FIDE player page
 */
async function scrapeFIDEPage(page: Page, fideId: string): Promise<ScrapedFIDEData> {
  const url = `https://ratings.fide.com/profile/${fideId}`;
  console.log(`Navigating to: ${url}`);
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait for content to load
  await page.waitForTimeout(2000);
  
  // Extract page text
  const pageText = await extractPageText(page);
  console.log(`Extracted page text (${pageText.length} characters)`);
  
  if (pageText.length < 100) {
    console.error('Page text too short, might not have loaded correctly');
    return {};
  }
  
  // Send to DeepSeek for extraction
  console.log('Sending page text to DeepSeek for extraction...');
  const extractedData = await extractWithDeepSeek(pageText);
  
  return extractedData;
}

/**
 * Remove undefined values from an object (recursively)
 */
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = removeUndefinedValues(obj[key]);
        if (value !== undefined) {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Sync FIDE ratings for a single user
 */
async function syncUserFIDERatings(uid: string, fideId: string, browser: Browser): Promise<void> {
  const page = await browser.newPage();
  
  try {
    console.log(`Syncing FIDE ratings for user ${uid} (FIDE ID: ${fideId})`);
    
    const scrapedData = await scrapeFIDEPage(page, fideId);
    
    // Convert to FIDERatings format (without lastSynced - it's stored separately)
    const fideRatings: FIDERatings = {
      ...scrapedData,
    };
    
    // Remove undefined values before saving to Firestore
    const cleanedRatings = removeUndefinedValues(fideRatings);
    
    // Update Firestore - Write to playerRatings collection
    const playerRatingsRef = db.collection('playerRatings').doc(uid);
    const playerRatingsDoc = await playerRatingsRef.get();
    
    if (playerRatingsDoc.exists) {
      // Update existing document
      await playerRatingsRef.update({
        fideRatings: cleanedRatings,
        'lastSynced.fide': admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new document
      await playerRatingsRef.set({
        userId: uid,
        fideRatings: cleanedRatings,
        lastSynced: {
          fide: admin.firestore.FieldValue.serverTimestamp(),
        },
      });
    }
    
    console.log(`Successfully synced FIDE ratings for user ${uid}`);
  } catch (error) {
    console.error(`Error syncing FIDE ratings for user ${uid}:`, error);
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Main function to sync FIDE ratings for all users
 */
async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    // Get all users with FIDE IDs
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} total users`);
    
    // Only sync users who don't have fideRatings in playerRatings collection
    const usersToSync: Array<{ uid: string; fideId: string }> = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // Get FIDE ID from profile or from uschessRatings
      const fideId = userData.fideId || userData.uscfRatings?.fideId;
      
      if (!fideId || fideId === '0' || fideId === '') {
        continue;
      }
      
      // Check if playerRatings document exists and has fideRatings
      const playerRatingsRef = db.collection('playerRatings').doc(userId);
      const playerRatingsDoc = await playerRatingsRef.get();
      
      if (playerRatingsDoc.exists) {
        const playerRatingsData = playerRatingsDoc.data();
        // Check if fideRatings exists and has data
        if (playerRatingsData?.fideRatings && 
            Object.keys(playerRatingsData.fideRatings).length > 0) {
          console.log(`User ${userId} (FIDE: ${fideId}) - Already has FIDE ratings, skipping`);
          continue;
        }
      }
      
      // User doesn't have FIDE ratings yet, add to sync list
      usersToSync.push({ uid: userId, fideId });
      console.log(`User ${userId} (FIDE: ${fideId}) - No FIDE ratings found, added to sync list`);
    }
    
    if (usersToSync.length === 0) {
      console.log('All users already have FIDE ratings. No sync needed.');
      return;
    }
    
    console.log(`Syncing ${usersToSync.length} users without FIDE ratings...`);
    
    // Sync each user with rate limiting
    for (const user of usersToSync) {
      try {
        await syncUserFIDERatings(user.uid, user.fideId, browser);
        // Rate limiting: wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to sync user ${user.uid}:`, error);
        // Continue with next user even if one fails
      }
    }
    
    console.log('FIDE ratings sync completed');
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

export { main, scrapeFIDEPage, syncUserFIDERatings };

