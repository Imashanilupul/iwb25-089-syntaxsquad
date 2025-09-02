# Civic Blockchain Platform - Separated Architecture

This directory structure represents the separated client-server architecture for the Civic Blockchain Platform. This structure should be used when the application complexity requires separation of frontend and backend concerns.

## 📁 Project Structure

```
civic-blockchain-platform/
├── client/                   # Frontend application (Next.js/React)
├── server/                   # Backend application (Node.js/Express)
├── shared/                   # Shared types and utilities
└── README-SEPARATION.md      # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL (for production)
- Redis (for caching)

### Development Setup

1. **Install dependencies for all packages:**

```bash
# From root directory
cd client && pnpm install
cd ../server && pnpm install
cd ../shared && pnpm install
```

2. **Set up environment variables:**

**Client (.env.local):**

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

**Server (.env):**

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@localhost:5432/civic_blockchain
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
BLOCKCHAIN_RPC_URL=your-blockchain-rpc-url
```

3. **Start the applications:**

**Terminal 1 (Server):**

```bash
cd server
pnpm dev
```

**Terminal 2 (Client):**

```bash
cd client
pnpm dev
```

The client will run on `http://localhost:3000` and the server on `http://localhost:5000`.

## 📦 Package Structure

### Client (`/client`)

- **Next.js 15** frontend application
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **API services** for backend communication

### Server (`/server`)

- **Express.js** REST API
- **TypeScript** for type safety
- **Prisma** for database management
- **JWT** authentication
- **Winston** logging
- **Blockchain integration** (Ethers/Web3)

### Shared (`/shared`)

- **Common types** and interfaces
- **Validation schemas** (Zod)
- **Utility functions**
- **Constants** and enums

## 🔧 Development Workflow

### 1. Adding New Features

When adding new features that require both frontend and backend changes:

1. **Define types in `/shared/types/`**
2. **Add validation schemas in `/shared/interfaces/`**
3. **Implement backend API in `/server/src/routes/`**
4. **Create frontend components in `/client/src/components/`**
5. **Add API service methods in `/client/src/services/`**

### 2. Database Changes

1. **Update Prisma schema in `/server/prisma/schema.prisma`**
2. **Run migrations:** `cd server && pnpm migrate`
3. **Update types in `/shared/types/`**

### 3. Testing

```bash
# Server tests
cd server && pnpm test

# Client tests
cd client && pnpm test

# Shared tests
cd shared && pnpm test
```

## 🚀 Deployment

### Production Build

```bash
# Build all packages
cd shared && pnpm build
cd ../server && pnpm build
cd ../client && pnpm build
```

### Docker Deployment (Future)

```yaml
# docker-compose.yml
version: "3.8"
services:
  client:
    build: ./client
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://server:5000

  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/civic_blockchain
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=civic_blockchain
      - POSTGRES_PASSWORD=password
```

## 📋 Migration from Monolith

If migrating from the current Next.js monolith:

1. **Move frontend code:** Copy `components/`, `app/`, `styles/` to `client/src/`
2. **Extract API logic:** Move API routes to `server/src/routes/`
3. **Separate types:** Move shared types to `shared/types/`
4. **Update imports:** Update all import paths to match new structure
5. **Configure environment:** Set up separate environment files
6. **Test thoroughly:** Ensure all functionality works across the separation

## 🔄 When to Use This Structure

Use this separated architecture when you need:

- **Independent scaling** of frontend and backend
- **Different deployment strategies** for client and server
- **Multiple frontend applications** (web, mobile, admin)
- **Microservices architecture**
- **Team separation** (frontend vs backend developers)
- **Complex backend logic** (blockchain integration, heavy processing)
- **Real-time features** (WebSocket connections)

## 📚 Key Benefits

- **Better separation of concerns**
- **Independent development and deployment**
- **Easier to scale specific parts**
- **Type safety across the stack**
- **Shared validation logic**
- **Consistent error handling**

## ⚠️ Considerations

- **More complex setup** compared to monolith
- **Additional network calls** between client and server
- **CORS configuration** required
- **Authentication complexity** (JWT tokens)
- **Deployment coordination** needed

---

For questions or issues with this architecture, please refer to the main README.md or create an issue in the project repository.
