import { USCFRatings } from './types';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface USCFData {
  regular: string;
  quick: string;
  blitz: string;
  status: string;
  expires: string;
}

/**
 * Sync USCF ratings data for a user (Frontend implementation)
 * Uses Playwright API route + DeepSeek directly from frontend
 * @param uid - User's UID
 * @param uscfId - USCF ID to sync
 * @returns USCF ratings data
 */
export async function syncUSCFRatings(uid: string, uscfId: string): Promise<USCFRatings> {
  try {
    // Step 1: Call Playwright API route to get HTML
    const playwrightResponse = await fetch('/api/uscf/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uscfId }),
    });

    if (!playwrightResponse.ok) {
      const errorData = await playwrightResponse.json();
      throw new Error(errorData.error || 'Failed to fetch USCF page');
    }

    const playwrightResult = await playwrightResponse.json();
    
    if (!playwrightResult.success) {
      throw new Error(playwrightResult.error || 'Failed to fetch USCF page');
    }
    
    const html = playwrightResult.html;

    if (!html) {
      throw new Error('No HTML content received from Playwright');
    }
    
    console.log('HTML received, length:', html.length);
    
    // Limit HTML size to avoid token limits (200k chars should be enough)
    const htmlSnippet = html.substring(0, 200000);
    console.log('Sending HTML snippet to DeepSeek, length:', htmlSnippet.length);
    
    // Step 2: Send HTML to DeepSeek via OpenRouter (from frontend)
    const openRouterApiKey = "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";
    
    const prompt = `Extract ONLY the following details from this HTML of a USCF player profile page:

- Regular Rating (current rating number, not floor)
- Quick Rating (current rating number, not floor)
- Blitz Rating (current rating number, not floor)
- Membership Status (Active/Expired/Inactive)
- Membership Expiry Date (format: YYYY-MM-DD)

Return ONLY valid JSON in this exact format, no explanation or markdown:
{
  "regular": "1517",
  "quick": "1408",
  "blitz": "1300",
  "status": "Active",
  "expires": "2023-04-30"
}

If any field is not available, use empty string "" for strings.

HTML:
${htmlSnippet}`;

    console.log('Sending request to DeepSeek...');
    const deepseekResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Chess Tourneys USCF Sync"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
      })
    });
    
    console.log('DeepSeek response status:', deepseekResponse.status);

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error("DeepSeek API Error:", errorText);
      console.error("Status:", deepseekResponse.status);
      throw new Error(`Failed to extract data from USCF page: ${errorText}`);
    }

    const deepseekData = await deepseekResponse.json();
    console.log("DeepSeek response structure:", {
      hasChoices: !!deepseekData.choices,
      choicesLength: deepseekData.choices?.length,
      firstChoice: deepseekData.choices?.[0],
    });
    
    const extractedContent = deepseekData.choices?.[0]?.message?.content;

    if (!extractedContent) {
      console.error("DeepSeek full response:", JSON.stringify(deepseekData, null, 2));
      throw new Error("No data extracted from DeepSeek response. Check console for details.");
    }
    
    console.log("Extracted content from DeepSeek:", extractedContent.substring(0, 500));

    // Parse JSON from DeepSeek response
    let extractedJson: USCFData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = extractedContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       extractedContent.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        console.log("Found JSON in markdown block");
        extractedJson = JSON.parse(jsonMatch[1]);
      } else {
        console.log("Parsing JSON directly");
        extractedJson = JSON.parse(extractedContent);
      }
      console.log("Parsed JSON:", extractedJson);
    } catch (parseError: any) {
      console.error("JSON Parse Error:", parseError);
      console.error("Extracted Content (full):", extractedContent);
      throw new Error(`Failed to parse extracted data: ${parseError.message}`);
    }

    // Validate and clean the extracted data
    const uscfData: USCFRatings = {
      regular: extractedJson.regular || "",
      quick: extractedJson.quick || "",
      blitz: extractedJson.blitz || "",
      status: extractedJson.status || "",
      expires: extractedJson.expires || "",
      lastSynced: new Date(),
    };

    // Store in Firestore
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      uscfRatings: {
        ...uscfData,
        lastSynced: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });

    return uscfData;
  } catch (error: any) {
    console.error('Error syncing USCF ratings:', error);
    throw error;
  }
}

