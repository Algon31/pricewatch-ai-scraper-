# WebPulse

> **Competitor Price Intelligence & Monitoring System Powered by Bright Data**

Built for the **Into the Scrape-Verse Hackathon** presented by **WeMakeDevs** and **Bright Data**.

---

## 📌 Problem

In e-commerce, product prices change constantly due to algorithmic pricing, inventory levels, flash promotions, and marketplace competition. 

A one-time price comparison gives only a temporary snapshot. To maintain competitive pricing, businesses, e-commerce sellers, and market analysts need ongoing price monitoring across multiple competitor stores (such as Amazon, specialized retailers like Kamal Imaging, and official brand stores like Fujifilm X India).

Without regular multi-retailer tracking, teams face three core problems:
1. **Missed Market Shifts**: Competitors discount or raise prices without notice, causing lost sales or eroded margins.
2. **Fragile Scraper Maintenance**: Traditional web scrapers break when retailer websites update their HTML structure or DOM selectors.
3. **No Historical Visibility**: Without systematic snapshot storage, there is no historical record to analyze price trends, volatility, or competitor discounting patterns over time.

---

## 💡 Solution

**WebPulse** is a competitor price monitoring and intelligence platform. Instead of just performing a one-time lookup, WebPulse creates persistent **Product Monitors** that can be re-checked on demand, storing historical snapshots and detecting changes over time.

- **Automated Collector Routing**: Analyzes submitted URLs and automatically dispatches scraping requests to the matching Bright Data Scraper Studio collector.
- **Historical Price Snapshots**: Stores timestamped price and stock snapshots in MongoDB for every retailer on each run.
- **Change & Delta Detection**: Automatically calculates price changes (drops and increases), stock availability shifts, and lowest-price movements between checks.
- **Resilient Scraping with Bright Data**: Uses Bright Data Scraper Studio with enterprise proxy rotation, anti-bot mitigation, and AI-assisted Self-Healing to handle selector changes.
- **Interactive Monitoring Dashboard**: Built with React 19, Vite, Recharts, and Tailwind CSS to give teams a real-time terminal for price spreads, historical trend lines, and change logs.

---

## 🔄 How It Works

```
1. Add Competitor URLs ──▶ 2. Route to Collector ──▶ 3. Scrape & Normalize
                                                              │
7. Emit Change Events ◀── 6. Compare with Prev ◀── 5. Save Snapshots ◀── 4. Create Monitor
```

1. **User Provides Competitor URLs**: The user sets up a product monitor (e.g., *Fujifilm X-H2S*) and inputs competitor URLs from supported retailers (Amazon, Kamal Imaging, Fujifilm X India).
2. **Collector Routing**: The backend inspects each domain and dispatches scraping requests in parallel to the appropriate Bright Data Scraper Studio collector.
3. **Scrape & Normalize**: Bright Data extracts raw product data (pricing, original MRP, stock status, ratings, images), and the backend normalizes it into a standardized schema.
4. **Create Monitor & Baseline**: The product monitor is saved in MongoDB with calculated baseline metrics: Lowest Price, Highest Price, Max Spread, and Cheapest Source.
5. **Store Price Snapshots**: A timestamped `PriceSnapshot` record is created for every competitor source.
6. **Compare on Re-Check**: When a monitor is checked (via "Check Now" or API calls), the system scrapes fresh data and compares it against the latest stored snapshots.
7. **Generate Change Events**: If prices or stock change, the engine generates structured `ChangeEvent` records (`PRICE_DROP`, `PRICE_INCREASE`, `AVAILABILITY_CHANGE`, `NEW_LOWEST_PRICE`, `SOURCE_FAILURE`) to maintain an audit trail.

---

## ✨ Key Features

- **Multi-Source Competitor Comparison**: Compare live prices, original list prices, discounts, and availability side-by-side across multiple retailers.
- **Persistent Product Monitors**: Save and manage ongoing multi-retailer product monitors from a central terminal.
- **Historical Price Snapshots**: Track the price curve of each retailer over time with MongoDB-backed timestamped snapshots.
- **Price Drop & Increase Detection**: Automatically calculates exact price difference amounts ($\Delta$) and percentage changes ($\%\Delta$) on every check.
- **Availability Change Detection**: Identifies stock status transitions (e.g., In Stock, Out of Stock, or Promotional Bundles).
- **Lowest-Price & Arbitrage Detection**: Identifies the cheapest seller, calculates the maximum price spread across retailers, and logs when a new market-low price is reached.
- **Source Failure Resilience**: Handles individual retailer scrape failures gracefully by logging source-specific errors without crashing the monitor.
- **Automated Bright Data Collector Routing**: Automatically matches domains to custom collectors:
  - **Amazon India** (`amazon.in`, `amzn.in`) $\rightarrow$ Collector `c_mt0gyz9d11g1yi8p98`
  - **Kamal Imaging** (`kamalimaging.com`) $\rightarrow$ Collector `c_mt1bz3s5tdc173nng`
  - **Fujifilm X India** (`fujifilmxindia.com`) $\rightarrow$ Collector `c_mt1cchzkfvyuvi8tm`
- **Interactive Visualizations**: Multi-line price history charts and competitor comparison bar charts built with Recharts.
- **Monitor Management**: Complete CRUD support, including cascading deletion of monitors, snapshots, and event logs.

---

## 📸 Screenshots

### 1. Competitor Monitoring Terminal (Portfolio Overview)
![Competitor Monitoring Terminal](frontend/src/assets/images/Dashboard.png)

### 2. Monitor Detail View & Historical Snapshot Graphs
![Monitor Detail View](frontend/src/assets/images/Monitor%20Deatiled%20View.png)

![Historical Snapshot Graphs](frontend/src/assets/images/Historical%20Snapshot%20Graphs.png)

### 3. Multi-Retailer URL Ingestion & Comparison Deck
![Multi-Retailer URL Ingestion](frontend/src/assets/images/URL%20Ingestion.png)



---

## 🛠️ Bright Data Scraper Studio & Self-Healing

WebPulse utilizes **Bright Data Scraper Studio** to extract structured product information from protected e-commerce sites:

1. **DCA Triggering (`POST /dca/trigger`)**: Scrapes are initiated asynchronously with URL payloads:
   ```http
   POST https://api.brightdata.com/dca/trigger?collector=COLLECTOR_ID&queue_override_incompatible_schema=1
   Authorization: Bearer YOUR_BRIGHT_DATA_API_KEY
   Content-Type: application/json

   [ { "url": "https://www.amazon.in/dp/B0B2F5VHLM" } ]
   ```
2. **Polling Engine (`GET /dca/dataset`)**: The backend tracks job IDs and polls the Bright Data dataset endpoint with status handling (`collecting`, `building`, `running`, `processing`) until the dataset is ready.
3. **AI-Assisted Self-Healing**: When a target website alters its DOM layout or CSS classes, Bright Data Scraper Studio detects selector failures, analyzes the target DOM, and proposes resilient updated selectors. Once accepted, scrapers continue functioning without backend code updates.

---

## 🛡️ Reliability & Extraction Validation Layer

To safeguard against dynamic DOM alterations, missing data attributes, network timeouts, or intermittent collector anomalies, WebPulse includes an automated **Extraction Validation & Self-Recovery Engine**:

```
Collector Output ──▶ Strict Validation ──┬─▶ [Valid] ──▶ Persist Catalog & Save Valid Snapshot
                                        │
                                        └─▶ [Invalid / Timeout] ──▶ Auto-Retry (Attempt 2) ──┬─▶ [Success] ──▶ Save Snapshot
                                                                                             │
                                                                                             └─▶ [Exhausted] ──▶ Emit SOURCE_FAILURE & Log Error
```

### 1. Multi-Field Extraction Validation Rules
Every scraped and normalized product is subjected to strict type and presence assertions before being utilized:
- **`source`**: Must be a non-empty string and cannot equal `'Unknown'`.
- **`productTitle`**: Must be a non-empty string with valid title text.
- **`productUrl`**: Must be a valid non-empty string matching the target retailer.
- **`currentPrice`**: Must be a strictly valid positive number (`typeof price === 'number' && !isNaN(price) && price > 0`).
- **Optional Metadata**: `originalPrice`, `image`, `sku`, `rating`, `reviewCount`, `discount`, and `availability` are treated as optional to support varying retailer schemas without rejecting valid price extractions.

### 2. Automated Per-Source Retry (`MAX_SCRAPE_ATTEMPTS = 2`)
When a retailer scrape encounters an HTTP error, network timeout, missing required DOM fields, or an invalid price (`null`/`NaN`/`<= 0`):
- The engine automatically isolates the failing source and retries **one additional time** (`MAX_SCRAPE_ATTEMPTS = 2`, `RETRY_DELAY_MS = 1500`).
- Successful retailers are not re-scraped, ensuring minimal latency and optimal Bright Data quota efficiency.

### 3. Graceful Failure & Fault Isolation
If a source fails after all retry attempts:
- **Zero Process Crashes**: Other retailer scrapes in the comparison or monitor continue processing uninterrupted.
- **`SOURCE_FAILURE` Audit Event**: For monitored products, a structured `SOURCE_FAILURE` record is emitted into the change log with the exact error message.
- **Source Health Tracking**: The retailer's `lastError` field is updated in MongoDB to give operators immediate visibility.
- **No Synthetic / Fake Data**: The engine never generates artificial fallback prices or dummy catalog records.

### 4. Self-Recovery & History Protection
- **No Bad Snapshots**: The database persistence layer (`createValidPriceSnapshot`) strictly rejects invalid or non-numeric prices, ensuring historical curves and charts in Recharts never suffer from zero-dips or corrupt records.
- **Automatic Error Clearing**: When a previously failed retailer succeeds on a subsequent check, `lastError` is cleared (`null`), and the monitor automatically returns to healthy status.
- **True Baseline Comparison**: Price delta algorithms (`PRICE_DROP` / `PRICE_INCREASE`) query against the **last verified valid snapshot** (`price > 0`), ensuring mathematical integrity even after intermediate retailer downtime.

---

## 🏗️ Architecture & Data Flow

```mermaid
flowchart TD
    User([👤 User / Browser])
    
    subgraph Frontend ["Frontend (React 19 + Vite + Tailwind CSS v4)"]
        Dashboard[Dashboard Monitor Terminal]
        Detail[Monitor Detail & Price History Charts]
        Compare[Competitor URL Ingestion Deck]
        Health[Scraper Health & Telemetry]
    end

    subgraph Backend ["Backend (Node.js + Express.js)"]
        Router[Express REST API]
        DomainRouter[Domain-to-Collector Matcher]
        PollingEngine[Bright Data Polling & Normalization Engine]
        ValidationLayer[Extraction Validation & Auto-Retry Layer]
        DeltaEngine[Price Delta & Change Event Engine]
    end

    subgraph Database ["Database (MongoDB)"]
        MonitorsCollection[(ProductMonitors)]
        SnapshotsCollection[(PriceSnapshots)]
        EventsCollection[(ChangeEvents)]
        ProductsCollection[(Products Catalog)]
    end

    subgraph BrightData ["Bright Data Cloud"]
        DCA_API[DCA Trigger & Dataset API]
        StudioAmazon[Amazon DCA Collector]
        StudioKamal[Kamal Imaging DCA Collector]
        StudioFujifilm[Fujifilm X India DCA Collector]
        SelfHealing[Bright Data AI Self-Healing]
    end

    subgraph Targets ["Target Retailers"]
        TargetAmazon[Amazon.in]
        TargetKamal[KamalImaging.com]
        TargetFujifilm[Fujifilmxindia.com]
    end

    User -->|Views / Checks / Manages Monitors| Dashboard
    Dashboard -->|GET /api/monitors & POST /check| Router
    Detail -->|GET /api/monitors/:id & DELETE| Router
    Compare -->|POST /api/monitors & POST /compare| Router

    Router --> DomainRouter
    DomainRouter -->|Trigger Parallel DCA Jobs| DCA_API
    
    DCA_API --> StudioAmazon
    DCA_API --> StudioKamal
    DCA_API --> StudioFujifilm

    StudioAmazon -->|Extract Data| TargetAmazon
    StudioKamal -->|Extract Data| TargetKamal
    StudioFujifilm -->|Extract Data| TargetFujifilm

    StudioAmazon -.->|DOM Analysis & Selector Repair| SelfHealing

    DCA_API -->|Poll Job Status & Fetch Output| PollingEngine
    PollingEngine -->|Raw Scraped Data| ValidationLayer
    ValidationLayer -->|"Retry on Failure (Max 2 Attempts)"| DCA_API
    ValidationLayer -->|Validated Standard Product Data| DeltaEngine
    
    DeltaEngine -->|Save Monitor & Analytics| MonitorsCollection
    DeltaEngine -->|Save Validated Snapshots Only| SnapshotsCollection
    DeltaEngine -->|Save Detected Change & Failure Events| EventsCollection
    DeltaEngine -->|Save Valid Product Catalog| ProductsCollection

    Router -->|JSON Responses with Reliability Status| Frontend
```

---

## 💻 Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **HTTP Client**: [Axios](https://axios-http.com/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v18+)
- **Server Framework**: [Express.js](https://expressjs.com/)
- **Database ODM**: [Mongoose](https://mongoosejs.com/)
- **Configuration & CORS**: `dotenv`, `cors`, `axios`

### Database & Scraping
- **Database**: [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- **Scraping Infrastructure**: [Bright Data Scraper Studio & DCA API](https://brightdata.com/)

---

## 📁 Project Structure

```text
pricewatch-ai-scraper/
├── backend/
│   ├── models/
│   │   ├── ProductMonitor.js       # Monitored products with competitor URLs & metrics
│   │   ├── PriceSnapshot.js        # Timestamped price snapshots per source
│   │   ├── ChangeEvent.js          # Price drops, increases, stock changes, new lowest prices
│   │   └── Product.js              # Standalone product catalog records
│   ├── scripts/
│   │   ├── seed.js                 # Database seed script for Fujifilm camera monitors
│   │   ├── testReliability.js      # 8-scenario reliability, validation & retry test suite
│   │   └── testEndpoints.js        # Automated API & database verification test
│   ├── .env.example                # Sample environment template (no secrets)
│   ├── package.json                # Backend dependencies & scripts
│   └── server.js                   # Express server, DCA integration, & change detection
├── frontend/
│   ├── public/                     # Static assets
│   ├── src/
│   │   ├── assets/
│   │   │   └── images/             # Application screenshots & UI preview images
│   │   ├── api/
│   │   │   └── config.js           # API client methods (monitors, check, delete, compare)
│   │   ├── components/
│   │   │   ├── Header.jsx          # Top navigation bar
│   │   │   ├── DashboardView.jsx   # Monitoring terminal & portfolio summary cards
│   │   │   ├── MonitorDetailView.jsx # Single monitor telemetry & change events log
│   │   │   ├── MonitorHistoryChart.jsx # Recharts multi-line price history graph
│   │   │   ├── CompareForm.jsx     # URL ingestion form with demo presets
│   │   │   ├── ComparisonSummary.jsx # Price comparison summary metrics
│   │   │   ├── CompetitorGrid.jsx  # Multi-retailer competitor cards
│   │   │   ├── PriceComparisonChart.jsx # Retailer price comparison bar chart
│   │   │   ├── ScraperHealth.jsx   # Scraper status & collector telemetry
│   │   │   ├── ProductCard.jsx     # Single product card
│   │   │   └── ProductList.jsx     # Tracked catalog list
│   │   ├── App.jsx                 # Main state machine & view routing
│   │   ├── index.css               # Design system & Tailwind CSS v4 styling
│   │   └── main.jsx                # React DOM entry point
│   ├── index.html                  # HTML document template
│   ├── package.json                # Frontend dependencies
│   └── vite.config.js              # Vite configuration & proxy settings
├── .gitignore                      # Git ignore rules
├── SUBMISSION_CHECKLIST.md         # Hackathon submission checklist
└── README.md                       # Complete project documentation
```

---

## 🚀 Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string
- A **Bright Data** account with API credentials and custom Scraper Studio collectors

---

### 1. Clone Repository

```bash
git clone https://github.com/your-username/pricewatch-ai-scraper.git
cd pricewatch-ai-scraper
```

---

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create your .env file from template
cp .env.example .env
```

Configure your `backend/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/pricewatch
BRIGHT_DATA_API_KEY=your_actual_bright_data_api_key_here
BRIGHT_DATA_AMAZON_COLLECTOR_ID=your_amazon_collector_id
BRIGHT_DATA_KAMAL_COLLECTOR_ID=your_kamal_collector_id
BRIGHT_DATA_FUJIFILM_COLLECTOR_ID=your_fujifilm_collector_id
```

**Seed Initial Portfolio Data**:
```bash
# Seeds clean Fujifilm camera monitors (Fujifilm X-H2S & Fujifilm X-M5) with historical snapshots
npm run seed
```

**Run Automated Reliability & Extraction Validation Tests**:
```bash
# Executes 8-scenario test suite validating retries, snapshot protection, and fault recovery
npm test
```

**Start Backend Server**:
```bash
npm start
# Server runs at http://localhost:5000
```

---

### 3. Frontend Setup

In a separate terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Dashboard opens at http://localhost:5173
```

---

## ⚙️ Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port for the Express backend server | `5000` |
| `MONGODB_URI` | Connection URI for MongoDB database | `mongodb://127.0.0.1:27017/pricewatch` |
| `BRIGHT_DATA_API_KEY` | Bright Data account API authentication token | `Bearer token string` |
| `BRIGHT_DATA_AMAZON_COLLECTOR_ID` | Amazon Scraper Studio Collector ID | `c_mt0gyz9d11g1yi8p98` |
| `BRIGHT_DATA_KAMAL_COLLECTOR_ID` | Kamal Imaging Scraper Studio Collector ID | `c_mt1bz3s5tdc173nng` |
| `BRIGHT_DATA_FUJIFILM_COLLECTOR_ID` | Fujifilm X India Scraper Studio Collector ID | `c_mt1cchzkfvyuvi8tm` |
| `MAX_SCRAPE_ATTEMPTS` | *(Optional)* Maximum scrape retries per retailer | `2` |
| `RETRY_DELAY_MS` | *(Optional)* Backoff delay between retries in milliseconds | `1500` |

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Request Body / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, DB connectivity, & collector IDs | None |
| `GET` | `/api/monitors` | List all monitored products with latest arbitrage metrics | None |
| `POST` | `/api/monitors` | Create a new monitored product across competitor URLs | `{ "name": "Fujifilm X-H2S", "urls": [...] }` |
| `GET` | `/api/monitors/:id` | Fetch single monitor details, full price history, & change logs | `id` (MongoDB ObjectId) |
| `POST` | `/api/monitors/:id/check` | Re-scrape all competitor sources, record snapshots, & detect changes | `id` (MongoDB ObjectId) |
| `DELETE` | `/api/monitors/:id` | Delete monitor with cascading snapshots & change events | `id` (MongoDB ObjectId) |
| `POST` | `/api/products/compare` | One-time multi-source price comparison across URLs | `{ "urls": ["url1", "url2", "url3"] }` |
| `POST` | `/api/scrape` | Scrape a single product URL | `{ "url": "https://..." }` |
| `GET` | `/api/products` | Retrieve all tracked products from catalog | None |
| `GET` | `/api/products/:id` | Fetch single catalog product details by ID | `id` (MongoDB ObjectId) |

---

## 📄 Example Monitor API Response

```json
{
  "success": true,
  "monitor": {
    "_id": "6a88555c699e5238c283cf1a",
    "name": "Fujifilm X-H2S",
    "brand": "Fujifilm",
    "lowestPrice": 192990,
    "highestPrice": 197999,
    "priceDifference": 5009,
    "cheapestSource": "Kamal Imaging",
    "lastCheckedAt": "2026-08-21T13:40:44.000Z",
    "competitorUrls": [
      {
        "source": "Amazon",
        "url": "https://www.amazon.in/dp/B0B2F5VHLM",
        "productTitle": "Fujifilm X-H2S Mirrorless Camera Body - Black",
        "currentPrice": 197892,
        "originalPrice": 239999,
        "availability": "In stock"
      },
      {
        "source": "Kamal Imaging",
        "url": "https://kamalimaging.com/products/fujifilm-x-h2s-mirrorless-camera",
        "productTitle": "FUJIFILM X-H2S Mirrorless Camera",
        "currentPrice": 192990,
        "originalPrice": 239999,
        "availability": "Special Offer: BC W-235 | Carry Case"
      },
      {
        "source": "Fujifilm X India",
        "url": "https://fujifilmxindia.com/products/fujifilm-x-h2s-mirrorless",
        "productTitle": "FUJIFILM X-H2s MIRRORLESS",
        "currentPrice": 197999,
        "originalPrice": 239999,
        "availability": "In stock"
      }
    ]
  },
  "comparison": {
    "lowestPrice": 192990,
    "highestPrice": 197999,
    "priceDifference": 5009,
    "cheapestSource": "Kamal Imaging"
  },
  "recentChanges": [
    {
      "type": "NEW_LOWEST_PRICE",
      "source": "Kamal Imaging",
      "previousPrice": 195990,
      "currentPrice": 192990,
      "difference": -3000,
      "percentageChange": -1.53,
      "message": "New lowest market price discovered at Kamal Imaging: ₹1,92,990"
    }
  ]
}
```

---

## 🎥 Demo

- **Live Demo / Walkthrough Video**: [\[Insert Demo Video Link Here - YouTube / Loom / Drive\]](https://youtu.be/eyP_4fPuh5A)
- **Hackathon Submission**: Into the Scrape-Verse Hackathon (WeMakeDevs & Bright Data)

---

## 📜 License

This project is licensed under the **ISC License**.
