# Civic Blockchain Platform - Shared

Shared types, interfaces, and utilities used across client and server.

## 📁 Structure

```
├── types/               # TypeScript type definitions
├── constants/           # Application constants
├── utils/               # Shared utility functions
└── interfaces/          # Validation schemas and interfaces
```

## 🔧 Usage

This package is used by both client and server applications:

```typescript
// Import shared types
import { User, VotingProposal } from "@/shared/types"

// Import constants
import { API_ENDPOINTS } from "@/shared/constants"

// Import utilities
import { formatCurrency } from "@/shared/utils"

// Import validation schemas
import { CreateUserSchema } from "@/shared/interfaces/validation"
```

## 📦 Key Dependencies

- Zod (Validation schemas)
- TypeScript
