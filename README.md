# TrendSpotter - eBay Category Analyzer

A command-line application for analyzing trending products across eBay categories. Fetches real-time market data from eBay's official Finding API to identify hot products, price trends, and market velocity.

## Features

- **Real-time eBay data** via official Finding API
- **12 major categories** including Electronics, Fashion, Home & Garden, Collectibles
- **Trend indicators** based on watchers, listing velocity, and seller quality
- **Market analysis** comparing active listings with recently sold items
- **Smart caching** to reduce API calls and improve performance
- **Source attribution** with direct links to eBay listings for verification

## Architecture

```
src/
├── api/          # eBay Finding API client
├── utils/        # Trend analysis, formatting, caching
├── constants/    # Category definitions
└── index.js      # CLI application entry point
```

## Prerequisites

- Node.js 18+ (ES modules support)
- eBay Developer Account (free)
- Internet connection

## Setup

### 1. Clone Repository

```bash
git clone https://github.com/bryan-ilman-on-github/ebay-category-analyzer.git
cd ebay-category-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Get eBay API Credentials

1. Go to [eBay Developers Program](https://developer.ebay.com/signin)
2. Sign in or create a free account
3. Navigate to "Get an App ID"
4. Select "Production Keys" (free tier available)
5. Copy your **App ID (Client ID)**

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
EBAY_APP_ID=YourAppIDHere
EBAY_SITE_ID=EBAY-US
EBAY_API_VERSION=1.13.0
CACHE_DURATION=24
```

## Usage

### Start Application

```bash
npm start
```

### Interactive Mode

The CLI presents a category selection menu:

```
? Select an eBay category to analyze:
  Consumer Electronics - Cameras, TV, Audio, GPS, Smart Home
  Women's Clothing - Dresses, Tops, Activewear, Shoes
  Men's Clothing - Shirts, Pants, Shoes, Accessories
  ...
```

### Output

For each category, the application displays:

- **Market Overview**: Total listings, average price, price range, watchers
- **Top 20 Trending Products**: Ranked by trend score
  - Product name and eBay link
  - Current price
  - Number of watchers
  - Trend indicator (🔥 Hot | 📈 Rising | ➡️ Stable | 📉 Declining)
  - Seller rating and badges
  - Listing age
- **Market Health**: Price comparison with recently sold items
- **Data Source Metadata**: API version, timestamp, authenticity markers

### Example Output

```
═══════════════════════════════════════════════════════════════════
  CATEGORY: CONSUMER ELECTRONICS
═══════════════════════════════════════════════════════════════════

Market Overview:
  • Total Active Listings: 12,543
  • Average Price: $156.34
  • Price Range: $9.99 - $2,499.00
  • Total Watchers: 3,421
  • Avg Watchers/Item: 15.2

Data Source:
  • API: eBay Finding API (Official)
  • Status: Success
  • Fetched: 10/18/2025, 2:30:15 PM
  • Showing top 20 of 628 pages available

───────────────────────────────────────────────────────────────────

1. 🔥 Sony WH-1000XM5 Wireless Noise Cancelling Headphones...
   ├─ Price: USD 298.00
   ├─ Watchers: 87 | Trend: Hot
   ├─ Seller: 15432 feedback (99.2%) ⭐ Top Rated
   ├─ Listed: 2 days ago
   └─ Link: https://www.ebay.com/itm/...
      eBay ID: 155234567890
```

## API Limits

eBay Finding API free tier:

- **5,000 calls/day** per App ID
- **Rate limit**: Approx. 5 calls/second
- This application uses **1-2 calls per category analysis**
- Caching reduces API usage significantly

## Configuration

### Cache Duration

Adjust `CACHE_DURATION` in `.env` (hours):

```env
CACHE_DURATION=24  # Refresh data daily
```

### Categories

To modify categories, edit `src/constants/categories.js`. Category IDs must match [eBay's official category list](https://developer.ebay.com/DevZone/finding/CallRef/Enums/categoryIdList.html).

## Data Authenticity

All product data is fetched directly from eBay's servers. To verify:

1. Click any product link in the output
2. Compare prices, watchers, and seller info
3. Check API metadata timestamps

The application includes:
- Direct eBay product URLs
- API response metadata
- Timestamp of data fetch
- eBay item IDs

## Troubleshooting

### "EBAY_APP_ID is required"

Ensure `.env` file exists with valid `EBAY_APP_ID`.

### "Failed to fetch data from eBay"

- Verify internet connection
- Check eBay API status: https://developer.ebay.com/support/api-status
- Confirm App ID is active

### "No completed items data"

Some categories don't provide sold items history. The application will skip market comparison for these categories.

## Technical Details

### Dependencies

- **axios**: HTTP client for API requests
- **inquirer**: Interactive CLI prompts
- **chalk**: Terminal styling
- **dotenv**: Environment variable management

### Trend Score Calculation

Trend scores (0-1) are calculated using:

- **40%** Watchers (normalized against category)
- **20%** Seller quality (feedback score and rating)
- **20%** Listing velocity (newer listings score higher)
- **20%** Price competitiveness (vs category average)

Products are classified as:
- **Hot** (🔥): score ≥ 0.7
- **Rising** (📈): score ≥ 0.4
- **Stable** (➡️): score ≥ 0.2
- **Declining** (📉): score < 0.2

### Caching

File-based cache stored in `data/` directory:
- Cache files: `category_{id}.json`
- Automatic expiration based on `CACHE_DURATION`
- Includes metadata for validation

## Development

```bash
# Run with auto-reload
npm run dev
```

## License

MIT

## Support

For issues related to:
- **This application**: Open a GitHub issue
- **eBay API**: https://developer.ebay.com/support
- **eBay Developer Program**: https://developer.ebay.com/support/contact

## Disclaimer

This application uses eBay's official Finding API. All product data, prices, and listings are provided by eBay. The application does not guarantee data accuracy. Always verify information directly on eBay.com before making purchasing decisions.
