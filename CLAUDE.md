# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASKO repair management platform — a pnpm + Turborepo monorepo with a NestJS API, Next.js frontend, and shared packages.

## Commands

### Root-level (from repo root)
```bash
pnpm install                  # install all dependencies
turbo run build               # build everything (respects dependency graph)
turbo run typecheck           # type-check all packages
turbo run lint                # lint all packages
turbo run clean               # remove build artifacts
```

### API (`apps/api`)
```bash
pnpm run start:dev            # dev server with hot reload (port 4000)
pnpm run start:prod           # production server
pnpm run build                # nest build → dist/
pnpm run test                 # jest
pnpm run test:watch           # jest --watch
pnpm run test:cov             # jest --coverage
pnpm run lint                 # eslint --fix
pnpm run format               # prettier
```

### Web (`apps/web`)
```bash
pnpm run dev                  # next dev with turbopack (port 3000)
pnpm run build                # next build (standalone output)
pnpm run typecheck            # tsc --noEmit
```

### UI Package (`packages/ui`)
```bash
pnpm run build                # tsc → dist/  (must rebuild after changes for consumers to pick them up)
```

### Shared Package (`packages/shared`)
```bash
pnpm run build                # tsc to both ESM and CJS
```

### Database Migrations (`apps/api`)
MikroORM CLI — config at `apps/api/src/mikro-orm.config.ts`, migrations in `apps/api/migrations/`.
```bash
npx mikro-orm migration:create   # create migration from entity changes
npx mikro-orm migration:up       # run pending migrations
```

## Architecture

### Monorepo Layout
```
apps/api          — NestJS v11 backend (REST + WebSocket)
apps/web          — Next.js v16 frontend (App Router, React 19)
packages/shared   — Types, DTOs, constants, utilities (ESM + CJS dual build)
packages/ui       — React component library (ESM, Tailwind v4)
```

### Package Dependencies
`@asko/web` → `@asko/ui` + `@asko/shared/client`
`api` → `@asko/shared` (full, including server utils)
`@asko/ui` → standalone (React peer dep only)

### Shared Package Exports
- `@asko/shared` — full package (types only re-export from server)
- `@asko/shared/client` — client-safe: types, constants, enums (no server code)
- `@asko/shared/server` — server utilities (`getEnvFilePath`, `isProdEnv`, etc.)

### API (`apps/api`)
- **Framework**: NestJS v11 with module-based architecture
- **ORM**: MikroORM v6 with PostgreSQL driver
- **Auth**: JWT RS256 (access + refresh tokens), Passport strategies
- **Password hashing**: argon2
- **Caching**: Redis (ioredis)
- **File uploads**: Cloudinary
- **Payments**: Stripe
- **Email**: Nodemailer (SMTP)
- **Real-time**: Socket.io via `@nestjs/websockets`
- **Path aliases**: `@entities/...` → `src/entities/`, `modules/...` → `src/modules/`, `common/...` → `src/common/`
- **Entities**: ~23 MikroORM entities (User, RepairRequest, Device, Repairer, Review, DealerProfile, etc.)
- **Env files**: `.env.dev` / `.env.prod` loaded based on `NODE_ENV`

### Web (`apps/web`)
- **Routing**: App Router with route groups — `(auth)`, `(account)`, `(landing)`, `(product)`
- **Styling**: Tailwind CSS v4 with custom theme in `src/styles/globals.css`
- **State**: Redux Toolkit for client state, React Query v5 for server state
- **API client**: Axios (configured in `src/lib/api/client.ts`)
- **Transpiles**: `@asko/shared` and `@asko/ui` via `next.config.ts`
- **Output**: standalone (for Docker deployment)

### UI Package (`packages/ui`)
- Built with plain TypeScript compilation (no bundler)
- Components use Tailwind classes referencing theme tokens defined in the web app's `globals.css`
- Uses a custom `cn()` utility (not clsx) for class merging
- **Important**: After editing UI components, run `pnpm run build` in `packages/ui` before the web app can see changes (unless the web app's dev server handles transpilation)

## Key Conventions

- **Language**: UI text is in Russian
- **Module system**: ESM throughout (`"type": "module"` in all package.json files)
- **TypeScript**: Strict mode, decorators enabled, ES2022 target
- **Validation**: `class-validator` decorators on DTOs (server-side), password/name regex patterns in `packages/shared/src/constants/`
- **Env vars**: Never committed; `.env.dev` and `.env.prod` are gitignored; see `.env.example` for required variables
- **Docker**: Multi-stage builds using Turborepo pruning — `Dockerfile.api` and `Dockerfile.web` at repo root
