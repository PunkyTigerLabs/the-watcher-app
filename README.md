# The Watcher

Stablecoin capital flow intelligence for iOS.

The Watcher is a mobile product focused on one question: **where is liquidity moving right now?**
It tracks **USDC (Superman)** and **USDT (Bizarro)** across key chains, normalizes treasury and whale activity into a common event model, computes a composite signal, and surfaces the moves that matter.

## Product idea

The app is designed to answer, quickly:
- Is money entering or leaving the system?
- Who is moving it?
- Where is it going?
- Do USDC and USDT agree or diverge?
- What deserves attention right now?

### Product framing
- **USDC = Superman** → institutional, transparent, regulated, visible capital
- **USDT = Bizarro** → underground, OTC, TRON-heavy, harder-to-see capital
- **Signal** → a single composite score built from both worlds
- **Intel** → filtered narrative layer: news, sentiment, patterns, analyst context

## Current repository structure

This repo currently contains two main parts:

```text
.
├── app/                    # Expo Router app screens
├── assets/                 # Static assets
├── src/                    # Frontend theme, API client, hooks, UI components
├── the-watcher-backend/    # Express + TypeScript backend
├── app.json
├── eas.json
├── package.json
└── tsconfig.json
```

## Frontend

Expo / React Native app using Expo Router.

### Main tabs
- **USDC**
- **USDT**
- **Signal**
- **Intel**

### Frontend stack
- Expo SDK 55
- React 19
- React Native 0.83
- Expo Router
- Reanimated
- SVG-based custom UI components

### Key frontend directories
- `app/(tabs)/index.tsx` → USDC tab
- `app/(tabs)/usdt.tsx` → USDT tab
- `app/(tabs)/signal.tsx` → Signal tab
- `app/(tabs)/intel.tsx` → Intel tab
- `src/api/watcher.ts` → API client
- `src/api/hooks.ts` → fetch/refresh hooks
- `src/components/` → cards, charts, paywall, signal UI, loading states
- `src/theme.ts` → color system and gradients

## Backend

Express + TypeScript backend that ingests and serves stablecoin flow intelligence.

### Backend stack
- Node.js
- Express
- TypeScript
- SQLite via `better-sqlite3`
- `node-cron` for scheduled polling
- Railway-oriented deployment files included

### Backend directories
- `the-watcher-backend/src/index.ts` → server bootstrap
- `the-watcher-backend/src/cron.ts` → scheduled ingestion and signal jobs
- `the-watcher-backend/src/db.ts` → SQLite schema and queries
- `the-watcher-backend/src/routes/` → API routes
- `the-watcher-backend/src/services/` → external data source clients
- `the-watcher-backend/src/engine/` → signal, patterns, headlines, divergence, decisions
- `the-watcher-backend/src/normalize/` → raw data normalization + wallet resolution
- `the-watcher-backend/src/data/wallets.json` → wallet labels

## Data sources currently integrated

Backend code currently includes integrations for:
- Etherscan
- Basescan
- TronGrid
- Solana
- CoinGecko
- DefiLlama
- Binance
- Fear & Greed
- News sources

## Current backend capabilities

### Public endpoints
- `GET /health`
- `GET /usdc/overview`
- `GET /usdt/overview`
- `GET /market/supply`
- `GET /market/exchange`
- `GET /signal` (basic)

### Protected / PRO-style endpoints
- `GET /signal?full=true`
- `GET /signal/history`
- `GET /whales`
- `GET /intel/news`
- `GET /intel/feargreed`
- `GET /analyst`

Protected endpoints currently rely on `x-watcher-key` in production mode.

## Signal model

The backend computes a composite signal from weighted subscores:
- USDC flow
- USDT flow
- Whale activity
- Divergence
- Sentiment

The result is mapped to labels such as:
- `STRONG ACCUMULATION`
- `ACCUMULATION`
- `NEUTRAL`
- `DISTRIBUTION`
- `STRONG DISTRIBUTION`

## Pattern detection

The backend includes pattern detection infrastructure for things like:
- treasury activity
- divergence
- supply shocks
- exchange concentration
- whale clusters
- unusual quiet periods

## Database model

SQLite stores:
- canonical events
- signal history
- patterns
- snapshots / cached state
- supply data
- news cache
- analyst cache

This keeps the app serving from local state instead of depending on live third-party API latency on every user request.

## Local development

### Frontend
From repo root:

```bash
npm install
npm run start
```

Other scripts:

```bash
npm run ios
npm run android
npm run web
```

### Backend
From `the-watcher-backend/`:

```bash
npm install
npm run dev
```

Build / typecheck:

```bash
npm run typecheck
npm run build
npm start
```

## Environment variables

### Frontend
Current frontend API client uses:
- local dev: `http://localhost:3000`
- production fallback: Railway URL in `src/api/watcher.ts`

Recommended next step is to move this fully to Expo public env variables, e.g.:
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_WATCHER_KEY` (only if intentionally used for controlled internal builds)

### Backend
See `the-watcher-backend/.env.example`.

Important variables include:
- `PORT`
- `NODE_ENV`
- `WATCHER_API_KEY`
- `ETHERSCAN_API_KEY`
- `BASESCAN_API_KEY`
- `TRONGRID_API_KEY`
- `CRYPTOPANIC_API_KEY`
- `SOLSCAN_API_KEY`
- `ANTHROPIC_API_KEY`
- `ENABLE_ANALYST`

## Deployment

### Mobile app
The repo includes:
- `app.json`
- `eas.json`

This indicates Expo / EAS build and OTA workflow.

### Backend
The backend includes Railway-oriented files:
- `railway.toml`
- `nixpacks.toml`

## Current project status

This is **not a mock-only repo anymore**.

The codebase already contains:
- a real Expo client
- a real backend
- scheduled ingestion jobs
- event normalization
- signal computation
- pattern detection infrastructure
- snapshots / fallback caching
- PRO gating shell

### What is strong already
- Clear product concept
- Good frontend direction
- Real backend foundation
- Useful separation between ingestion, normalization, engine, and routes
- Fast MVP-friendly operational stack

### What still needs alignment
- Some frontend and backend response shapes still need contract cleanup
- API auth / subscription model is still lightweight
- OTA / release workflow should be documented and validated end-to-end
- More tests and observability would improve reliability
- App Store-ready purchase / activation flows are not finished yet

## Recommended next milestones

1. **Align frontend ↔ backend contracts completely**
   - normalize response shapes
   - remove stale assumptions in client components
   - ensure all tabs render real backend data consistently

2. **Finalize FREE vs PRO boundaries**
   - what is visible without auth
   - what is previewed
   - what is locked

3. **Harden production config**
   - env-based API URL
   - no local-only assumptions
   - stronger auth handling

4. **Complete release path**
   - EAS build validation
   - OTA policy per channel
   - internal TestFlight loop

5. **Ship product features that increase retention**
   - push alerts
   - better pattern surfacing
   - activation / restore flow
   - richer analyst summaries

## Repo notes

- Main branch: `main`
- Mobile app and backend currently live in the same repository
- Backend uses SQLite for MVP simplicity and low operational overhead

## Philosophy

The Watcher should feel curated, not noisy.

Not every transfer matters.
Not every headline matters.
The value is in turning raw stablecoin movement into **decision-grade attention**.

---

Built by Punky Tiger Labs.
