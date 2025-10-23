# FX Trading Web Dashboard

Web-based frontend for the Multi-Pair Forex Trading System (XAUUSD + GBPUSD).

## Features

- Real-time trading signals for Gold (XAU/USD) and GBP/USD
- Smart Confluence System with proven win rates
- Responsive web interface
- Auto-refresh every 3 minutes
- Manual scan capability

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_BACKEND_URL to your backend URL
```

3. Run development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variable: `NEXT_PUBLIC_BACKEND_URL` to your backend URL
4. Deploy

## Environment Variables

- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL (default: http://localhost:8002)

## License

Private - All Rights Reserved
