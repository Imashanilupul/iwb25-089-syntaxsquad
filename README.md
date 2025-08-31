# Transparent Governance Platform — README 🏛️

A full-stack civic governance platform built with Next.js 15, React 19, and Ballerina. This document shows how to set up and run the project locally on Windows (PowerShell). It includes safe example configuration files — **do NOT commit real secrets**.

---

## Quick checklist ✅

- [ ] Install prerequisites: Node.js 18+, pnpm, Ballerina, Java (if required by Ballerina), Git
- [ ] Create local config files from examples and fill in credentials
- [ ] Install dependencies in root, `client/`, `chatbot/`, `server` and `smart-contracts/`
- [ ] Start development servers and run any smart-contract scripts you need

## 1) Prerequisites 🧰

- **Node.js 18+** — https://nodejs.org
- **pnpm** (recommended):

```powershell
npm install -g pnpm
```

- **Git**
- **Ballerina SDK** (server) — https://ballerina.io
- **Optional**: Hardhat & Ethereum tooling for `smart-contracts/`

## 2) Repository layout 📁

- `client/` — Next.js frontend (pnpm)
- `server/` — Ballerina backend (uses `Config.toml`)
- `smart-contracts/` — Hardhat contracts & scripts (uses `.env`)
- `chatbot/` — AI chatbot service (uses `.env`)
- `shared/` — shared TS packages
- `auth-service/` — authentication service

## 3) Config files & secrets 🔐

**Never commit real API keys, private keys, or secrets.** Copy the example files provided and populate values locally.

### Copy example files (PowerShell)

```powershell
Copy-Item .\server\Config.example.toml .\server\Config.toml
Copy-Item .\smart-contracts\.env.example .\smart-contracts\.env
Copy-Item .\client\.env.local.example .\client\.env.local
Copy-Item .\chatbot\.env.example .\chatbot\.env
```

### Environment variable formats

#### Server (`server/Config.toml`)
```toml
# Server Configuration
port = 8080
petitionPort = 8000

# Supabase Configuration
supabaseUrl = ""

# API Keys - CORRECTLY CONFIGURED ✅
# anon public key (for client-side use):
# 

# service_role secret key (for server-side use with full permissions):
supabaseServiceRoleKey = ""
```

#### Client (`client/.env.local`)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3002

# Note: If localhost:3000/api/auth/callback is not registered in Asgardeo,
# try using a different port like 3001 or update Asgardeo console

# Asgardeo Authentication Configuration
NEXT_PUBLIC_ASGARDEO_BASE_URL=""
NEXT_PUBLIC_ASGARDEO_CLIENT_ID=""
ASGARDEO_CLIENT_SECRET=""
NEXT_PUBLIC_ASGARDEO_SCOPES=""

# Humanode Biometric Authentication Configuration
NEXT_PUBLIC_HUMANODE_ENDPOINT=
NEXT_PUBLIC_HUMANODE_API_KEY=# For testing purposes - replace with actual Humanode network endpoints
# Testnet: https://testnet-rpc.humanode.io
# Mainnet: https://mainnet-rpc.humanode.io

# Note: In production, you would get proper API credentials from Humanode.io
# This is currently set up for demonstration purposes
```

#### Chatbot (`chatbot/.env`)
```env
GEMINI_API_KEY=""
CHROMA_API_KEY=""
SUPABASE_URL=""
```

#### Smart Contracts (`smart-contracts/.env`)
```env
SEPOLIA_RPC_URL=
PRIVATE_KEY=
```

## 4) Setup & install ▶️

### Root dependencies
```powershell
# Install root deps (workspace tooling uses pnpm)
pnpm install
```

### Client (Next.js)
```powershell
cd .\client
pnpm install
pnpm dev
```

### Server (Ballerina)
```powershell
cd .\server
# Ensure you have created server/Config.toml from the example
bal deps
bal run
```

### Chatbot service
```powershell
cd .\chatbot
npm install
# Start the chatbot service (check package.json for start script)
npm start
```

### FastAPI server
```powershell
cd .\fastapi-server
# Install Python dependencies (assuming requirements.txt or pyproject.toml)
pip install -r requirements.txt
# Start FastAPI server
uvicorn main:app --port 8001
# Or use uvicorn
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Express server
```powershell
cd .\express-server
npm install
# Start Express server
npm start
# Or if using nodemon
npm run dev
```

### Smart contracts
```powershell
cd .\smart-contracts
npm install
# Example script (adjust network as needed)
npx hardhat run --network sepolia scripts/app.js
```

## 5) Environment variables guide 📋

### Required for basic functionality:
- **Supabase**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client)
- **Asgardeo**: `NEXT_PUBLIC_ASGARDEO_CLIENT_ID`, `ASGARDEO_CLIENT_SECRET`, `NEXT_PUBLIC_ASGARDEO_BASE_URL`

### Required for chatbot:
- **Gemini API**: `GEMINI_API_KEY` — Get from Google AI Studio
- **Chroma DB**: `CHROMA_API_KEY` — For vector database functionality

### Required for blockchain features:
- **Ethereum**: `SEPOLIA_RPC_URL` (Alchemy/Infura), `PRIVATE_KEY` (funded testnet account)
- **Humanode**: `NEXT_PUBLIC_HUMANODE_ENDPOINT`, `NEXT_PUBLIC_HUMANODE_API_KEY`

### Optional APIs:
- `ALCHEMY_API_KEY`, `INFURA_API_KEY`, `ETHERSCAN_API_KEY`

## 6) Quick run commands 🚀

### Start all services:
```powershell
# Terminal 1 - Client
cd .\client && npm run dev

# Terminal 2 - Ballerina Server  
cd .\server && bal run

# Terminal 3 - Chatbot
cd .\chatbot && uvicorn main:app --port 8001

# Terminal 4 - Smart contracts (if needed)
cd .\smart-contracts && npx hardhat run --network sepolia scripts/app.js
```

## 7) Project overview — Civic Blockchain Platform 🧭

Transparent Governance Platform is a comprehensive civic transparency and governance platform built with Next.js 15 and React 19. It provides a complete environment for public administration, budgeting, voting, and policy management.

### Key features:
- 🏛️ **Government Administration Portal** — Multiple dashboard types for different government levels
- 📊 **Spending Tracker** — Monitor government expenditures and budget allocation
- 🗳️ **Voting System** — Secure digital voting platform with blockchain verification
- 📝 **Policy Hub** — Policy management and public engagement
- 🔍 **Whistleblowing System** — Anonymous reporting system
- ⛓️ **Blockchain Visualization** — Transparent transaction tracking
- 🤖 **AI Chatbot** — Intelligent assistance powered by Gemini AI
- 📱 **Responsive Design** — Mobile-first approach with modern UI

### Tech stack:
- **Framework**: Next.js 15.2.4
- **Frontend**: React 19
- **Backend**: Ballerina, FastAPI (Python), Express.js (Node.js)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Database**: PostgreSQL
- **Authentication**: Asgardeo 
- **Blockchain**: Ethereum (Hardhat)
- **AI**: Google Gemini API
- **Vector DB**: Chroma Cloud
- **Form Handling**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React


## 8) Platform URLs 🌐

After starting all services:
- **Client**: http://localhost:3000
- **Ballerina Server**: http://localhost:8080
- **FastAPI Server**: http://localhost:8001
- **Express Server**: http://localhost:8000
- **Auth Service**: http://localhost:3002
- **Chatbot**: Check `chatbot/package.json` for port configuration

## 9) Tests & useful scripts 🧪

There are several PowerShell and shell scripts for testing and migrations in the repo root and `server/scripts/` (e.g., `test-voting-system.ps1`, `server/scripts/run_voting_migration.ps1`). **Inspect them before running** — they may modify databases.

### Server tests:
```powershell
cd .\server
bal test
```

## 10) Troubleshooting & notes 🛠️

- If the server reports `Config.toml` missing, copy the example and fill in your DB/Supabase credentials
- For smart-contract deployment, ensure `.env` has a funded testnet private key and RPC URL
- Client `NEXT_PUBLIC_` variables are readable in the browser; don't commit real secrets
- If ports are already in use, check for existing processes or modify port numbers in config files
- For Humanode integration issues, refer to `client/` integration guides

## 11) Security reminders 🔒

- **Never commit** real API keys, private keys, or database credentials
- Use **testnet** private keys only for development
- Keep `SUPABASE_SERVICE_ROLE_KEY` secure — it has full database permissions
- `ASGARDEO_CLIENT_SECRET` should never be exposed to the client-side
- Test with small amounts on testnets before deploying to mainnet

## 12) Where to find more details 📚

- `server/docs/` — server setup guides, database docs, API docs
- `client/` — integration guides, biometrics troubleshooting, Humanode notes
- `smart-contracts/scripts/` — blockchain deployment and helpers
- `chatbot/` — AI chatbot configuration and vector database setup

---

**Ready to contribute to transparent governance? 🌟** Start by setting up your local environment and exploring the different modules. Each service can be developed independently, making it easy to focus on specific features.
