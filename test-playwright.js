const { chromium } = require('playwright');

async function testUSCF() {
  const uscfId = '15442517';
  const url = `https://ratings.uschess.org/player/${uscfId}`;
  
  console.log('Launching browser...');
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { 
      waitUntil: "networkidle",
      timeout: 30000
    });
    
    console.log('Waiting for content...');
    await page.waitForTimeout(5000); // Wait longer for JS to execute
    
    // Try to wait for specific elements
    try {
      await page.waitForSelector('body', { timeout: 10000 });
      console.log('Page loaded');
    } catch (e) {
      console.log('Selector wait timeout, continuing...');
    }
    
    // Get the actual rendered content
    const pageData = await page.evaluate(() => {
      // Look for ratings in various ways
      const allText = document.body.innerText || '';
      const html = document.documentElement.outerHTML;
      
      // Try to find rating numbers
      const ratingMatches = allText.match(/\d{3,4}/g) || [];
      
      return {
        text: allText.substring(0, 2000),
        ratingNumbers: ratingMatches.slice(0, 10),
        htmlLength: html.length,
        hasRegular: allText.includes('Regular') || allText.includes('REGULAR'),
        hasQuick: allText.includes('Quick') || allText.includes('QUICK'),
        hasBlitz: allText.includes('Blitz') || allText.includes('BLITZ'),
      };
    });
    
    console.log('\n=== Page Analysis ===');
    console.log('Has Regular:', pageData.hasRegular);
    console.log('Has Quick:', pageData.hasQuick);
    console.log('Has Blitz:', pageData.hasBlitz);
    console.log('Rating numbers found:', pageData.ratingNumbers);
    console.log('\n=== Sample Text ===');
    console.log(pageData.text.substring(0, 1500));
    
    console.log('\nExtracting full HTML...');
    const html = await page.content();
    console.log(`HTML length: ${html.length} characters`);
    
    await browser.close();
    
    // Now test DeepSeek API
    console.log('\n=== Testing DeepSeek API ===');
    const openRouterApiKey = "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";
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "user",
            content: `Extract ONLY the following details from this HTML of a USCF player profile page:

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
${html.substring(0, 200000)}`
          }
        ],
        temperature: 0.1,
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error:', errorText);
      return;
    }
    
    const data = await response.json();
    const extracted = data.choices?.[0]?.message?.content;
    
    console.log('\n=== DeepSeek Response ===');
    console.log(extracted);
    
    // Try to parse JSON
    try {
      const jsonMatch = extracted.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       extracted.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        console.log('\n=== Parsed JSON ===');
        console.log(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
    
  } catch (error) {
    await browser.close();
    console.error('Error:', error);
    throw error;
  }
}

testUSCF().catch(console.error);

