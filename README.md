# Civic Blockchain Platform

A comprehensive civic transparency and governance platform built with Next.js 15 and React 19.

## Features

- 🏛️ **Government Administration Portal** - Multiple dashboard types for different government levels
- 📊 **Spending Tracker** - Monitor government expenditures and budget allocation
- 🗳️ **Voting System** - Secure digital voting platform
- 📝 **Policy Hub** - Policy management and public engagement
- 🔍 **Whistleblowing System** - Anonymous reporting system
- ⛓️ **Blockchain Visualization** - Transparent transaction tracking
- 📱 **Responsive Design** - Mobile-first approach with modern UI

## Tech Stack

- **Framework**: Next.js 15.2.4
- **Frontend**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theme**: Next Themes (Dark/Light mode)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd civic-blockchain-platform
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Project Structure

```
civic-blockchain-platform/
├── app/                          # Next.js App Router
│   ├── admin/                   # Government admin pages
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
├── components/                   # React components
│   ├── admin/                   # Admin dashboard components
│   │   ├── admin-dashboard.tsx
│   │   ├── ministry-dashboard.tsx
│   │   ├── oversight-dashboard.tsx
│   │   ├── provincial-dashboard.tsx
│   │   ├── system-admin-dashboard.tsx
│   │   └── treasury-dashboard.tsx
│   ├── ui/                      # Reusable UI components
│   ├── blockchain-visualization.tsx
│   ├── policy-hub.tsx
│   ├── spending-tracker.tsx
│   ├── voting-system.tsx
│   └── whistleblowing-system.tsx
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions
└── public/                      # Static assets
```

## Government Administration Features

The platform includes specialized dashboards for different levels of government:

- **System Admin Dashboard** - Overall system management
- **Ministry Dashboard** - Department-specific administration
- **Treasury Dashboard** - Financial oversight and budget management
- **Provincial Dashboard** - Regional government administration
- **Oversight Dashboard** - Compliance and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
