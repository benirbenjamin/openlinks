# BenixSpaceTools (`tools.benix.space`)

**BenixSpaceTools** is a modern, high-performance web platform built with a **React 18 frontend** and **Node.js/Express backend** connected to **PostgreSQL (Neon Serverless)**. It allows developers to:
1. **Download PostgreSQL Databases into self-contained `.sql` backup files** simply by pasting the database connection string.
2. **Automate link visits with the OpenLinks Multi-URL Opener System** with customizable duration countdown timers and live status checks (powered by [`benirbenjamin/openlinks`](https://github.com/benirbenjamin/openlinks)).
3. **Monetize with Google AdSense** across all views and a mandatory **3-Ad Video Monetization Download Gate** before file downloads.
4. **Discoverable by Google and AI crawlers** (ChatGPT, Claude, Perplexity, Bing) via rich SEO metadata, canonical tags, `sitemap.xml`, `robots.txt`, and Schema.org JSON-LD structured data.

---

## 🚀 Key Features

### 1. PostgreSQL Database to SQL Backup Downloader
- **Zero permanent credential storage**: Connection strings are processed in memory and never saved to disk or logs.
- **Full schema extraction**:
  - `CREATE SCHEMA IF NOT EXISTS` for all custom schemas.
  - Custom extensions (`uuid-ossp`, `pgcrypto`, `vector`, etc.).
  - Custom PostgreSQL types & `ENUM` declarations.
  - Sequences and their live sequence states (`setval`).
  - Tables with data types, defaults, and NOT NULL constraints.
  - Primary keys, unique keys, and check constraints.
  - Table data batched as multi-row `INSERT` statements with adaptive memory handling for binary/bytea payloads.
  - Secondary indexes and foreign key constraints ordered to prevent cyclic dependency errors on restore.
- **One-click inspection**: Inspect database schemas, total tables, and row counts before exporting.

### 2. OpenLinks Screen Grid Multi-URL Opener (Permanent Tabs)
- Integrated from [`benirbenjamin/openlinks`](https://github.com/benirbenjamin/openlinks).
- **Tabs Count Control**: Allows entering 1 to 100 tabs (e.g. 10 tabs, 20 tabs) with automatic cycling of input URLs.
- **Pure Grid Layout**: All tabs are tiled across the display in an organized grid:
  - **10 Tabs**: 5 columns &times; 2 rows screen grid.
  - **20 Tabs**: 5 columns &times; 4 rows small screen grid.
- **Permanent Open (No Auto-close Timer)**: Windows stay open permanently after launch. The auto-closing timer has been removed completely.
- **In-Page Screen Grid Canvas Visualizer**: Displays all tabs in their exact grid coordinates (`Row X : Col Y`) with HTTP status codes and latency.
- **Manual "Close All Opened Tabs" Control**: If the user desires to close all opened tabs at once, a single button closes them together.
- **Popup Blocker Detection**: Proactively detects browser popup restrictions and provides one-click guidance and retry.
- **Neon PostgreSQL Auditing**: Audits visited links, response codes, and latencies.

### 3. Monetization System (Google AdSense + 3-Ad Video Gate)
- **Official AdSense Publisher**: `ca-pub-4078466828008985`
- **Ad Slot**: `7034214536`
- **3-Ad Monetization Download Gate Modal**:
  - **Ad 1**: Sponsored Leaderboard Ad (Google AdSense Slot 7034214536).
  - **Ad 2**: High-Impact Interactive Video Ad with a 6-second countdown timer, mute/unmute toggle, and sponsor CTA.
  - **Ad 3**: Reward Confirmation Interstitial unlocking the verified download.
  - Download file button remains locked until the user views the ads.

### 4. SEO & AI Crawler Discoverability
- **Canonical domain**: `https://tools.benix.space/`
- **Dynamic Sitemap**: Accessible at `/sitemap.xml`
- **AI-friendly robots.txt**: Accessible at `/robots.txt` explicitly allowing `GPTBot`, `ClaudeBot`, `PerplexityBot`, and `Google-Extended`.
- **Schema.org Structured Data**:
  - `WebApplication` schema
  - `SoftwareApplication` schema for PostgreSQL Dumper and OpenLinks
  - `FAQPage` schema with structured answers for Google Rich Snippets

### 5. Modular Tool Architecture
- Designed to easily add new developer tools (e.g. `pg-to-mysql`, `sql-formatter`).
- Tool catalog API endpoint at `/api/tools`.
- Neon PostgreSQL analytics tracking tool usage and export statistics.

---

## 🛠️ Project Structure

```
BenixSpaceTools/
├── data/
│   └── backups/             # Temporary storage for generated .sql backup files
├── public/
│   ├── css/
│   │   └── style.css        # Responsive glassmorphism UI & modal styling
│   ├── js/
│   │   └── app.js           # React 18 frontend & 3-Ad Video Modal
│   └── index.html           # Main HTML with SEO metadata, JSON-LD, AdSense
├── services/
│   ├── neonDb.js            # Neon PostgreSQL client, migration tables & stats
│   ├── openLinksService.js  # Multi-URL verification, latency & history service
│   └── postgresDumper.js    # PostgreSQL inspector and streamed .sql exporter
├── package.json             # Express, CORS, pg, compression
├── server.js                # Express web server & API routes
└── README.md                # Documentation
```

---

## 🚦 Getting Started Locally

### Prerequisites
- Node.js (v18.0.0 or later)
- An active PostgreSQL database (e.g. Neon)

### Installation
1. Navigate to the project folder:
   ```bash
   cd BenixSpaceTools
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set your Neon database connection string in `.env` or system environment (optional, default provided):
   ```bash
   export DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
   ```
4. Start the server:
   ```bash
   node server.js
   ```
5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🌐 Production Deployment (tools.benix.space)

### Deploying to Render, Railway, or VPS
1. Set the environment variable:
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://neondb_owner:npg_j9q1UhnxgTrl@ep-soft-hill-b4t6y52i-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
2. Add a custom domain in your cloud host pointing to `tools.benix.space`.
3. Configure your DNS CNAME record:
   ```
   tools.benix.space -> your-app.onrender.com (or Railway / Vercel domain)
   ```
4. Start process with PM2:
   ```bash
   pm2 start server.js --name "BenixSpaceTools"
   ```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Serves the React 18 SPA frontend |
| `GET` | `/robots.txt` | Search engine & AI crawler directive |
| `GET` | `/sitemap.xml` | XML sitemap with daily change frequency |
| `GET` | `/api/tools` | List of active and upcoming developer tools |
| `GET` | `/api/stats` | Platform statistics (backups, rows, links) |
| `POST` | `/api/database/inspect` | Inspect table counts, schemas, and version |
| `POST` | `/api/database/export` | Generate streamed `.sql` backup file |
| `GET` | `/api/database/download/:token` | Stream the downloadable `.sql` backup |
| `POST` | `/api/links/open` | OpenLinks multi-URL opener with duration |
| `POST` | `/open-link` | OpenLinks backward-compatible endpoint |
| `GET` | `/api/links/history` | Recent links history from Neon DB |

---

## 📜 License
MIT License. Built with ❤️ for the Benix Space community.
