# PayprAPI - Pay-Per-Use AI API Marketplace

> Decentralized, pay-per-request AI API marketplace powered by **PayprAPI micropayments** and **Algorand blockchain**.

## 🏗️ Architecture

```
Frontend (Next.js :3000) → Gateway (Node.js :8000) → AI Services (FastAPI :8001)
                                     ↕
                            Algorand Testnet (AlgoNode)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm

### 1️⃣ Install Dependencies

```bash
# AI Services (Python)
cd backend/ai-services
pip install -r requirements.txt

# Gateway (Node.js)
cd backend/gateway
npm install

# Frontend (Next.js)
cd frontend
npm install
```

### 2️⃣ Start All Services

**Option A — PowerShell (Windows):**
```powershell
.\start-all.ps1
```

**Option B — Manual (3 terminals):**

Terminal 1 — AI Services:
```bash
cd backend/ai-services
python main.py
```

Terminal 2 — Gateway:
```bash
cd backend/gateway
npm run dev
```

Terminal 3 — Frontend:
```bash
cd frontend
npm run dev
```

### 3️⃣ Open the App

- **Marketplace**: http://localhost:3000
- **Explore APIs**: http://localhost:3000/explore
- **Dashboard**: http://localhost:3000/dashboard
- **Analytics**: http://localhost:3000/analytics
- **Agent Console**: http://localhost:3000/agent-console
- **API Docs**: http://localhost:8001/docs
- **Gateway API**: http://localhost:8000

## 💳 X402 Payment Flow

```
1. Client → GET /api/translate (no auth)
2. Gateway → 402 Payment Required {amount: 0.001 ALGO, recipient: WALLET}
3. Client → sends ALGO tx on Algorand testnet
4. Client → GET /api/translate + X-Payment: txid:ABCDEF...
5. Facilitator → validates txId on Algorand
6. AI Service → returns translation result
```

## 🧪 Simulation Mode

By default, `SIMULATION_MODE=true` — no real blockchain needed!

Any transaction ID (≥10 chars, not starting with "FAIL") is accepted. Use the **"Auto-Generate TX ID"** button in the Explore page or Agent Console.

## 🔌 Available AI Services

| Service | Endpoint | Price |
|---------|----------|-------|
| Translation | POST /api/translate | 0.001 ALGO |
| Summarization | POST /api/summarize | 0.002 ALGO |
| Sentiment Analysis | POST /api/sentiment | 0.001 ALGO |
| Image Generation | POST /api/image/generate | 0.005 ALGO |

## 🌐 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts, Framer Motion
- **Gateway**: Node.js, Express, algosdk, SQLite (better-sqlite3)
- **AI Services**: Python, FastAPI, TextBlob, deep-translator, Pillow
- **Blockchain**: Algorand Testnet via AlgoNode public endpoints
- **Protocol**: X402 HTTP 402 Payment Required
