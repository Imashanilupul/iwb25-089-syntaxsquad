# Civic Blockchain Platform - Server

Express.js backend API for the Civic Blockchain Platform.

## 🚀 Development

```bash
# Install dependencies
pnpm install

# Start development server (with nodemon)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run database migrations
pnpm migrate

# Run tests
pnpm test
```

## 📁 Structure

```
src/
├── routes/              # API route handlers
├── controllers/         # Business logic controllers
├── models/              # Database models
├── middleware/          # Express middleware
├── services/            # External service integrations
├── blockchain/          # Blockchain integration
├── database/            # Database configuration & seeds
├── utils/               # Utility functions
└── config/              # Configuration files
```

## 🔧 Configuration

Create `.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://username:password@localhost:5432/civic_blockchain
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-here
BLOCKCHAIN_RPC_URL=your-blockchain-rpc-url
```

## 📦 Key Dependencies

- Express.js
- TypeScript
- Prisma (Database ORM)
- JWT (Authentication)
- Winston (Logging)
- Ethers/Web3 (Blockchain)
