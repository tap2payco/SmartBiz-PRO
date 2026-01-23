# SmartBiz Pro ERP

**Modern, Offline-First ERP for Retail & Wholesale Businesses**

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.0.0 ([Install Bun](https://bun.sh))
- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Supabase CLI** ([Installation Guide](./SUPABASE_CLI_INSTALL.md))

### Installation

```bash
# Install dependencies
pnpm install

# Initialize Supabase (if not already done)
supabase init
supabase start

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

## 📁 Project Structure

```
SmartBiz PRO/
├── apps/
│   ├── web/              # Next.js PWA (Frontend)
│   ├── api/              # Bun + Hono API (Backend)
│   └── worker/           # Background jobs (future)
├── packages/
│   ├── ui/               # Shared UI components (shadcn/ui)
│   ├── db/               # Drizzle ORM schema & migrations
│   ├── shared/           # Shared types, schemas, utils
│   ├── sync/             # Offline sync protocol
│   └── config/           # Shared configs (ESLint, TypeScript)
├── supabase/             # Supabase migrations & config
└── docs/                 # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **Tailwind CSS** + **shadcn/ui**
- **React Query** (server state)
- **Zustand** (UI state)
- **Dexie.js** (IndexedDB for offline)

### Backend
- **Bun** runtime
- **Hono** framework
- **Drizzle ORM**
- **Zod** validation
- **Supabase** (Postgres + Auth + Storage)

## 📝 Available Scripts

```bash
# Development
pnpm dev                  # Start all apps in development mode
pnpm dev:web              # Start web app only
pnpm dev:api              # Start API only

# Build
pnpm build                # Build all apps
pnpm build:web            # Build web app only
pnpm build:api            # Build API only

# Database
pnpm db:generate          # Generate Drizzle schema
pnpm db:migrate           # Run migrations
pnpm db:studio            # Open Drizzle Studio

# Testing
pnpm test                 # Run all tests
pnpm test:unit            # Run unit tests
pnpm test:integration     # Run integration tests
pnpm test:e2e             # Run E2E tests

# Code Quality
pnpm lint                 # Lint all packages
pnpm format               # Format code with Prettier
pnpm type-check           # TypeScript type checking
```

## 🌐 Development URLs

After running `supabase start` and `pnpm dev`:

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323
- **Supabase API**: http://localhost:54321

## 📚 Documentation

- [Implementation Plan](./brain/implementation_plan.md)
- [Task Breakdown](./brain/task.md)
- [Project Details](./projectt%20details%20file/project%20dtails.md)
- [Funding Proposal](./projectt%20details%20file/SmartBiz_Pro_Funding_Proposal.md)

## 🎯 Core Features

- ✅ **Offline-First**: Complete POS and inventory operations work without internet
- ✅ **Smart Sync**: Automatic conflict resolution with manual review for critical data
- ✅ **Multi-Tenant**: Secure organization isolation with Row Level Security
- ✅ **Real-Time**: Live updates across devices
- ✅ **Modular**: Enable only the modules you need
- ✅ **Compliant**: Tanzania VAT/PAYE ready

## 🏗️ Development Phases

### Phase 1: Foundation (Weeks 1-8) - IN PROGRESS
- [x] Project setup & monorepo
- [ ] Authentication & RBAC
- [ ] Offline infrastructure
- [ ] Shared packages

### Phase 2: Core Retail (Weeks 9-20)
- [ ] Stakeholder management
- [ ] Inventory management
- [ ] Point of Sale (POS)
- [ ] Purchase management
- [ ] Financial management

### Phase 3: Advanced Features (Weeks 21-32)
- [ ] Budget management
- [ ] Reporting & analytics
- [ ] Conflict resolution UI

### Phase 4: Retail Enhancements (Weeks 33-40)
- [ ] Loyalty & promotions
- [ ] Multi-store support
- [ ] Hardware integration

## 🤝 Contributing

This is a private project. For team members:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add some feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create a Pull Request

## 📄 License

Proprietary - All rights reserved

## 👥 Team

- **Project Manager**: TBD
- **Tech Lead**: TBD
- **Frontend Developers**: TBD
- **Backend Developers**: TBD
- **DevOps Engineer**: TBD
- **QA Engineer**: TBD

---

**Built with ❤️ for Retail & Wholesale Businesses**
