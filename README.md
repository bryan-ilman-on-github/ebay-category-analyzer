# TrendSpotter - eBay Category Analyzer

Web application and CLI for analyzing trending products across eBay categories. Fetches real-time data from eBay's official Browse API with AWS-style corporate UI.

## Features

- **Web Interface**: AWS-style corporate UI with data tables, stats, and professional design
- **REST API**: Express backend with caching and rate limiting
- **CLI Tool**: Interactive command-line interface for terminal use
- **Real-time Data**: Official eBay Browse API with OAuth 2.0
- **13 Categories**: Motors, Electronics, Collectibles, Clothing, and more
- **Smart Caching**: 24-hour cache to reduce API calls
- **Zero Cost**: Deploy free on Render + Vercel

## Architecture

```
packages/
├── web/          # React frontend (Vite + AWS-style UI)
├── api/          # Express REST API + CLI
└── shared/       # Shared constants (categories)
```

## Live Demo

- **Frontend**: [Deploy to Vercel](https://vercel.com)
- **API**: [Deploy to Render](https://render.com)
- See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step guide

## Prerequisites

- Node.js 18+
- eBay Developer Account (free)
- GitHub account (for deployment)

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

1. Go to [eBay Developers Program](https://developer.ebay.com/my/keys)
2. Sign in or create account
3. Create a new App (select "Production")
4. Copy **App ID** (Client ID) and **Cert ID** (Client Secret)

### 4. Configure Environment

```bash
# API environment
cd packages/api
cp .env.example .env
```

Edit `packages/api/.env`:

```env
EBAY_APP_ID=YourAppIDHere
EBAY_CERT_ID=YourCertIDHere
EBAY_MARKETPLACE=EBAY_US
CACHE_DURATION=24
```

## Local Development

```bash
# Terminal 1: Run API
npm run dev:api

# Terminal 2: Run Web
npm run dev:web
```

- API: http://localhost:3001
- Web: http://localhost:5173

## Usage

### Web Interface

1. Open http://localhost:5173
2. Select category from sidebar
3. View trending products in data table
4. Click product IDs to verify on eBay.com

### CLI

```bash
cd packages/api
npm run cli
```

Interactive menu shows 13 categories. Select one to see:

- Market overview (total listings, avg price, watchers)
- Top 100 trending products (Best Match algorithm)
- Price discounts, seller ratings, engagement metrics
- Direct eBay links for verification

### API Endpoints

```
GET /api/categories          # List all categories
GET /api/category/:id        # Get trending items for category
GET /api/health              # Health check
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete zero-cost deployment guide:

1. Deploy API to Render (free tier: 750 hours/month)
2. Deploy Frontend to Vercel (free tier: unlimited)
3. Configure environment variables
4. Update CORS settings

## API Limits

eBay Browse API free tier:

- 5,000 calls/day per App ID
- This app uses 21 calls per category (1 search + 20 item details)
- Caching reduces usage to ~1 analysis per day per category

## Data Authenticity

All data is fetched from official eBay Browse API:

- Direct product URLs for verification
- Seller ratings and feedback scores
- Real-time watch counts and sales data
- Cache timestamps showing data freshness

## Technical Stack

### Frontend

- React 19 with Vite
- AWS-style corporate UI (inspired by AWS Console)
- Responsive data tables
- Zero animations, data-dense design

### Backend

- Express.js REST API
- OAuth 2.0 client credentials flow
- File-based caching (24-hour TTL)
- eBay Browse API integration

### Shared

- Category definitions
- TypeScript-ready structure

## Troubleshooting

### API not starting

- Verify `.env` has valid EBAY_APP_ID and EBAY_CERT_ID
- Check eBay Developer dashboard for key status
- Ensure credentials are Production keys (not Sandbox)

### Frontend can't connect to API

- Verify API is running on port 3001
- Check browser console for CORS errors
- Ensure VITE_API_URL matches API URL

### eBay API errors

- Verify credentials are correct
- Check rate limits (5,000 calls/day)
- Confirm internet connection

## License

MIT

## Support

- Application issues: [GitHub Issues](https://github.com/bryan-ilman-on-github/ebay-category-analyzer/issues)
- eBay API: [Developer Support](https://developer.ebay.com/support)
