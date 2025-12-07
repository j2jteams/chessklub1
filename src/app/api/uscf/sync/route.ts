import { NextResponse } from "next/server";

/**
 * API route to fetch HTML from USCF player page using Scraper API
 * This only returns the HTML - DeepSeek extraction happens in frontend
 */
export async function POST(req: Request) {
  try {
    const { uscfId } = await req.json();
    
    if (!uscfId) {
      return NextResponse.json({ error: "Missing uscfId" }, { status: 400 });
    }

    // Validate USCF ID format (should be numeric)
    if (!/^\d+$/.test(uscfId)) {
      return NextResponse.json({ error: "Invalid USCF ID format" }, { status: 400 });
    }

    const url = `https://ratings.uschess.org/player/${uscfId}`;
    const scraperApiKey = "8bd9398ec4a31d85f064e5429319714e";

    // Use ScraperAPI to fetch the page HTML
    // Common scraper API patterns:
    // ScraperAPI: http://api.scraperapi.com/?api_key={key}&url={url}
    // ScrapingBee: https://app.scrapingbee.com/api/v1/?api_key={key}&url={url}
    // Trying ScraperAPI format first (most common)
    const scraperUrl = `http://api.scraperapi.com/?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render=true`;

    try {
      console.log("Fetching HTML from ScraperAPI...");
      console.log("URL:", scraperUrl);
      
      const response = await fetch(scraperUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ScraperAPI Error Response:", errorText);
        console.error("Status:", response.status);
        console.error("Status Text:", response.statusText);
        
        // If ScraperAPI format doesn't work, try ScrapingBee format
        console.log("Trying ScrapingBee format...");
        const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}&render_js=true`;
        console.log("ScrapingBee URL:", scrapingBeeUrl);
        
        const beeResponse = await fetch(scrapingBeeUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        console.log("ScrapingBee Response status:", beeResponse.status);

        if (!beeResponse.ok) {
          const beeErrorText = await beeResponse.text();
          console.error("ScrapingBee Error Response:", beeErrorText);
          return NextResponse.json(
            { error: "Failed to fetch USCF page via scraper API", details: `ScraperAPI: ${errorText}, ScrapingBee: ${beeErrorText}` },
            { status: 500 }
          );
        }

        const html = await beeResponse.text();
        console.log("HTML received from ScrapingBee, length:", html.length);

        return NextResponse.json({ 
          success: true, 
          html: html 
        });
      }

      const html = await response.text();
      console.log("HTML received from ScraperAPI, length:", html.length);
      
      // Check if we got an error page instead of HTML
      if (html.length < 1000 && (html.includes('error') || html.includes('Error') || html.includes('403') || html.includes('401'))) {
        console.error("Received error page instead of HTML:", html.substring(0, 500));
        return NextResponse.json(
          { error: "Scraper API returned an error page", details: html.substring(0, 500) },
          { status: 500 }
        );
      }

      // Return only the HTML - DeepSeek processing happens in frontend
      return NextResponse.json({ 
        success: true, 
        html: html 
      });

    } catch (scraperError: any) {
      console.error("Scraper API Exception:", scraperError);
      console.error("Error stack:", scraperError.stack);
      return NextResponse.json(
        { error: "Failed to load USCF page via scraper API", details: scraperError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("USCF Sync Error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

