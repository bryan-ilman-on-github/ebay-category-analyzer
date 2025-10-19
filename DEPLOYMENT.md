# Deployment Guide

Zero-cost deployment using Render (API) and Vercel (Frontend).

## Architecture

```
Frontend (Vercel) → API (Render) → eBay Browse API
```

## Prerequisites

1. GitHub account
2. Render account (render.com)
3. Vercel account (vercel.com)
4. eBay Developer credentials (EBAY_APP_ID, EBAY_CERT_ID)

## Step 1: Deploy API to Render

1. Push code to GitHub
2. Go to render.com → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - Name: `trendspotter-api`
   - Region: `Oregon (US West)`
   - Branch: `main`
   - Root Directory: `packages/api`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add Environment Variables:
   - `EBAY_APP_ID`: Your eBay App ID
   - `EBAY_CERT_ID`: Your eBay Cert ID
   - `EBAY_MARKETPLACE`: `EBAY_US`
   - `CACHE_DURATION`: `24`
6. Click "Create Web Service"
7. Wait for deployment (5-10 min)
8. Copy your API URL (e.g., `https://trendspotter-api.onrender.com`)

Note: Free tier spins down after 15min inactivity. First request after spin-down takes ~30s.

## Step 2: Deploy Frontend to Vercel

1. Go to vercel.com → Add New → Project
2. Import your GitHub repo
3. Configure:
   - Framework Preset: `Vite`
   - Root Directory: `packages/web`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: Your Render API URL from Step 1
5. Click "Deploy"
6. Wait for deployment (2-3 min)
7. Your site is live at `https://your-project.vercel.app`

## Step 3: Update API CORS

After deploying frontend, update API to allow your Vercel domain:

1. Edit `packages/api/server.js`
2. Update CORS config:
```javascript
app.use(cors({
  origin: ['https://your-project.vercel.app', 'http://localhost:5173']
}));
```
3. Commit and push
4. Render will auto-redeploy

## Local Development

```bash
# Install all dependencies
npm install

# Terminal 1: Run API
npm run dev:api

# Terminal 2: Run Frontend
npm run dev:web
```

API runs on `http://localhost:3001`
Frontend runs on `http://localhost:5173`

## Costs

- Render Free Tier: 750 hours/month (always-on)
- Vercel Free Tier: Unlimited bandwidth, 100GB storage
- eBay API: 5,000 calls/day free

Total: $0/month

## Monitoring

- Render Dashboard: View API logs, restarts, health
- Vercel Analytics: View frontend traffic, performance
- Cache hits reduce API calls (24-hour TTL)

## Troubleshooting

### API not responding
- Check Render logs for errors
- Verify environment variables are set
- Free tier spins down after 15min idle (first request slow)

### Frontend can't connect to API
- Verify VITE_API_URL matches Render URL
- Check CORS configuration in server.js
- Look for HTTPS/HTTP mismatch

### eBay API errors
- Verify credentials in Render dashboard
- Check rate limits (5,000 calls/day)
- Ensure Production API keys (not sandbox)
