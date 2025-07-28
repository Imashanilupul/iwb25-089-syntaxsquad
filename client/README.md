# Civic Blockchain Platform - Client

React/Next.js frontend application for the Civic Blockchain Platform.

## 🚀 Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   └── admin/           # Admin-specific components
├── pages/               # Next.js pages
├── services/            # API service layer
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── styles/              # CSS/styling files
```

## 🔧 Configuration

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 📦 Key Dependencies

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI
- Axios (API calls)
