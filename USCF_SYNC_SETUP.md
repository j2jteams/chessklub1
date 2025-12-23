# USCF Ratings Sync Setup Guide

This guide explains how to set up the automated USCF ratings scraping system using Playwright and GitHub Actions.

## Overview

The system automatically scrapes USCF player ratings and rankings from `ratings.uschess.org` and stores them in Firebase. It runs daily via GitHub Actions and can also be triggered manually.

## Architecture

1. **Playwright Script** (`scripts/scrape-uscf.ts`): Scrapes USCF player pages and extracts ratings/rankings
2. **GitHub Actions Workflow** (`.github/workflows/sync-uscf-ratings.yml`): Runs the scraping script on a schedule
3. **Firebase Firestore**: Stores the scraped data in user documents

## Setup Instructions

### 1. Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file (you'll need this for GitHub Secrets)

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

   - **`FIREBASE_SERVICE_ACCOUNT`**: 
     - Paste the entire contents of the Firebase service account JSON file
     - This should be a single-line JSON string
   
   - **`OPENROUTER_API_KEY`** (optional):
     - Your OpenRouter API key for DeepSeek fallback
     - Only needed if direct DOM extraction fails
     - Format: `sk-or-v1-...`

### 3. Install Dependencies

```bash
npm install
```

This will install:
- `playwright` - For web scraping
- `firebase-admin` - For Firebase Admin SDK
- `tsx` - For running TypeScript files directly

### 4. Install Playwright Browsers

```bash
npx playwright install chromium
```

## How It Works

### Automated Sync

The GitHub Actions workflow runs daily at 2 AM UTC and:
1. Queries Firestore for all users with `uscfId` set
2. Filters users who need syncing (no ratings or ratings older than 7 days)
3. For each user, navigates to their USCF profile page
4. Scrapes all ratings, rankings, and membership data
5. Updates Firestore with the new data

### Manual Sync

You can trigger the workflow manually:
1. Go to **Actions** tab in GitHub
2. Select **Sync USCF Ratings** workflow
3. Click **Run workflow**

### Local Testing

To test the script locally:

```bash
# Set environment variables
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
export OPENROUTER_API_KEY='sk-or-v1-...'

# Run the script
npm run sync-uscf
```

## Data Structure

The scraped data is stored in `users/{uid}/uscfRatings` with the following structure:

```typescript
{
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
  
  // Metadata
  lastSynced?: Date;
}
```

## Scraping Strategy

The script uses a two-tier approach:

1. **Direct DOM Extraction**: Tries to extract data directly from the page using Playwright selectors
2. **DeepSeek Fallback**: If direct extraction fails, sends HTML to DeepSeek API for parsing

This ensures maximum reliability even if the USCF website structure changes.

## Rate Limiting

The script includes a 2-second delay between user requests to avoid overwhelming the USCF website. This means:
- ~30 users per minute
- ~1,800 users per hour

## Error Handling

- Individual user failures don't stop the entire sync
- Errors are logged to GitHub Actions logs
- Failed users will be retried on the next scheduled run

## Dashboard Display

The dashboard automatically displays:
- Standard ratings (Regular, Quick, Blitz) with floors
- Online ratings with game counts
- Overall and state rankings with percentiles
- Membership information (ID, status, expiry, FIDE ID)

## Troubleshooting

### Workflow Fails to Start

- Check that GitHub Secrets are properly configured
- Verify the Firebase service account JSON is valid
- Ensure the workflow file is in `.github/workflows/` directory

### Scraping Fails

- Check GitHub Actions logs for specific errors
- Verify USCF website is accessible
- Check if USCF ID format is correct (should be numeric)

### Data Not Updating

- Verify user has `uscfId` set in Firestore
- Check `lastSynced` timestamp to see if sync ran
- Review GitHub Actions logs for errors

### Firebase Permission Errors

- Ensure service account has Firestore write permissions
- Check Firestore security rules allow admin writes
- Verify service account JSON is correct

## Security Notes

- Never commit Firebase service account keys to the repository
- Always use GitHub Secrets for sensitive data
- The service account should have minimal required permissions
- Consider using a separate Firebase project for development

## Cost Considerations

- GitHub Actions: Free tier includes 2,000 minutes/month
- Playwright: No additional cost (runs in GitHub Actions)
- Firebase: Firestore writes are charged per operation
- DeepSeek API: Pay-per-use (only used as fallback)

## Future Enhancements

Potential improvements:
- Webhook trigger from dashboard
- Real-time sync on user request
- Caching to reduce API calls
- Batch processing optimization
- Email notifications on sync failures

