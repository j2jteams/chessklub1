import { NextResponse } from "next/server";
import { chromium } from "playwright";

/**
 * API route to fetch HTML from USCF player page using Playwright
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

    // Launch Playwright browser
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // For server environments
    });
    
    const page = await browser.newPage();

    try {
      // Navigate to USCF player page and wait for full load
      await page.goto(url, { 
        waitUntil: "networkidle",
        timeout: 30000 // 30 second timeout
      });

      // Wait longer for JavaScript to fully render the page
      await page.waitForTimeout(5000);
      
      // Ensure page is fully loaded
      try {
        await page.waitForSelector('body', { timeout: 10000 });
      } catch (e) {
        // Continue even if selector wait times out
      }

      // Get full rendered HTML
      const html = await page.content();

      await browser.close();

      // Return only the HTML - DeepSeek processing happens in frontend
      return NextResponse.json({ 
        success: true, 
        html: html 
      });

    } catch (playwrightError: any) {
      await browser.close();
      console.error("Playwright Error:", playwrightError);
      return NextResponse.json(
        { error: "Failed to load USCF page", details: playwrightError.message },
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

