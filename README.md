# SmartBiz PRO - Industrial-Level ERP

SmartBiz PRO is a comprehensive, offline-first ERP solution designed for Retail and Wholesale businesses. It features a robust multi-tenant architecture, real-time sync capabilities, and advanced business intelligence modules.

## 🚀 Key Modules

- **POS (Point of Sale)**: Fast, offline-first checkout with barcode support and split payments.
- **Inventory Management**: Event-sourced stock tracking with locations, categories, and automated reorder alerts.
- **Project Management**: Industrial-level task board with employee assignments and progress tracking.
- **Retail Loyalty**: Automated customer reward points system (1% back on sales).
- **Advanced Analytics**: Interactive dashboards for sales trends and inventory turnover.
- **HR & Payroll**: Employee management with automated payroll generation.
- **Finance**: Multi-currency support, bank reconciliation, and automated P&L reporting.

## 🏗️ Architecture

- **Monorepo**: Powered by [Turborepo](https://turbo.build/).
- **Frontend**: [Next.js](https://nextjs.org/) with [Tailwind CSS](https://tailwindcss.com/) and [Shadcn UI](https://ui.shadcn.com/).
- **Backend**: [Hono](https://hono.dev/) on Edge Runtime.
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/).
- **Local DB**: [Dexie.js](https://dexie.org/) for offline-first experience.
- **Cloud**: [Supabase](https://supabase.com/) for Auth and Real-time data.

## 🛠️ Development

### Prerequisites
- Node.js 20+
- PNPM or NPM

### Setup
1. Clone the repository.
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`.
4. Run migrations: `npm run db:generate && npm run db:migrate`
5. Start development server: `npm run dev`

### Project Structure
- `apps/api`: Hono API (Backend)
- `apps/web`: Next.js Dashboard (Frontend)
- `packages/db`: Drizzle Schema and Migrations
- `packages/shared`: Shared Types and Utilities

## 🛡️ Security & Performance
- **Organization Scoping**: Strict multi-tenant isolation at the database and API levels.
- **Database Indexing**: Optimized for high-volume transactions.
- **Offline Sync**: Robust conflict-resolution for mobile and web apps.

## 📜 License
Industrial Grade - Tap2Pay Co.
