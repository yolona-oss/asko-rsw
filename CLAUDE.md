# CLAUDE.md

## Project Overview

ASKO — repair management platform. pnpm + Turborepo monorepo: NestJS microservices, Next.js frontend, gRPC, RabbitMQ, shared packages.

Communication: REST+WebSocket (web↔gateways), gRPC (gateways↔services), RabbitMQ (async events). Each microservice owns its own PostgreSQL database.

## Structure

```
apps/
  auth-gateway/           # Auth REST gateway (:4001) — login, OAuth, invitations
  api/                    # Main REST+WS gateway (:4000) — domain endpoints, no auth controllers
  user-service/           # Auth, users, invitations (:5000, gRPC+RMQ)
  payment-service/        # Payments, providers (:5001, gRPC+RMQ)
  file-service/           # Images, video, storage (:5002, gRPC+RMQ)
  repair-service/         # Repairs, dealers, devices, certs, schedules (:5003, gRPC+RMQ)
  notification-service/   # Notifications, email (:5004, gRPC+RMQ+BullMQ)
  chat-service/           # Chat, presence (:5005, gRPC+RMQ)
  content-service/        # Articles, recommendations (:5010, gRPC)
  web/                    # Next.js frontend (:3000)
packages/
  proto/                  # .proto files + TS interfaces (@asko/proto, no build step)
  shared/                 # DTOs, types, enums, AppError system, slugify (@asko/shared)
  ui/                     # React components (@asko/ui)
  observability/          # Prometheus metrics + Pino logger (@asko/observability)
  gateway-common/         # Shared gateway infrastructure (@asko/gateway-common)
monitoring/
  prometheus/             # prometheus.yml + alerts.yml
  grafana/                # Dashboards + provisioning
nginx/
  nginx.conf              # Routes /auth/+/invite/ → auth-gateway, rest → api
```

## Commands

```bash
pnpm install && turbo run build          # Install + build all
./scripts/build.sh                        # Build in dependency order (6 steps)
./scripts/dev.sh                          # Docker infra + all services (excl web)
./scripts/openapi.sh                      # Regenerate OpenAPI spec + frontend types
./scripts/setup-dev.sh                    # Create DBs + run migrations
```

## Gateway Architecture

Two gateways, both sharing JWT public key for local token validation:

**Auth Gateway** (:4001) — `/auth/*`, `/invite/*`. Login, register, OAuth (Google/VK/Yandex), MFA, phone verification, password reset, session, invitations. Talks to user-service only via gRPC.

**Main API Gateway** (:4000) — all domain routes. Devices, repairs, chat, payments, files, certificates, articles, schedules, notifications. Talks to all services via gRPC. WebSocket for chat.

Nginx routes traffic by URL prefix. Frontend sees one URL.

## Packages

### `@asko/shared`
DTOs, types, enums, constants shared across all apps. AppError system (base class + common error types). `slugify()` utility. Subpath exports: `@asko/shared` (full), `@asko/shared/client` (web-safe), `@asko/shared/server` (server-only). Must `pnpm run build` after changes.

### `@asko/gateway-common`
Shared infrastructure for all gateways: JwtGuard (with `GATEWAY_CONFIG` injection token), decorators (`@JwtAuthUser`, `@Public`, `@OptionalAuth`, `@RequiredRoles`), GlobalExceptionFilter, gRPC utilities (`grpcCall`), CORS/Helmet config, UserClientModule + UserClientService, shared response DTOs. Must `pnpm run build` after changes.

### `@asko/proto`
gRPC .proto files + hand-written TS interfaces. No build step. 11 proto files.

### `@asko/ui`
React component library. Tailwind only. Must `pnpm run build` after changes.

### `@asko/observability`
Prometheus metrics + Pino logger. `collectDefaultMetrics()` in constructor.

## Services

- **user-service** (:5000) — auth, users, invitations, JWT RS256, MFA, OAuth (UserOAuthLink entity), phone/email verification. gRPC+RMQ.
- **payment-service** (:5001) — payments, webhooks, providers (Dummy/Yookassa/Tbank). gRPC+RMQ.
- **file-service** (:5002) — images/video upload+processing, FileAccess table for per-file visibility control (public/private/role_restricted/participants_only). Local or Cloudinary storage. gRPC+RMQ.
- **repair-service** (:5003) — repairs, devices, certificates, repairers, reviews, points, schedules (WSchedule with work/vacation/sick_leave/overtime/extra_day types + approval flow). gRPC+RMQ.
- **notification-service** (:5004) — notifications, email delivery via BullMQ. Consumes payment/repair/chat/schedule events. gRPC+RMQ+BullMQ.
- **chat-service** (:5005) — conversations, messages, presence. Message status (sending/delivered/seen). Conversation avatarUrl. gRPC+RMQ.
- **content-service** (:5010) — articles (Lexical JSON), view analytics, weighted article graph. gRPC only.

## UI Design Rules

* **No border-radius** — sharp corners. Only `rounded-full` for avatars/circles and status badges.
* **Icons via lucide-react** — never inline `<svg>` for standard icons.
* **DataGrid** for all tables — auto-sized columns via content length + `weight` coefficient. `onRowClick` (detail modal), `onRowDoubleClick` (edit), auto "Подробнее" in context menu.
* **ViewSwitcher** standalone above data view, not inside DataToolbar.
* **File URLs** — all via access-controlled endpoint `/files/image/:id` or `/files/video/:id`. Use `getImageUrl(id)`/`getVideoUrl(id)` from `@/lib/file-url`. Legacy `/images/*` static serving kept for backward compat.
* Tailwind only. Must `pnpm run build` after package changes.

## Account Layout

* Full-width adaptive, no max-width cap.
* Sidebar: 200px, `bg-[#fff]`, `sticky top-0 h-screen`.
* Dashboard typography: numbers `text-[82px] leading-[86px]`, titles `text-[24px] leading-[28px]`, text `text-[14px] leading-[18px]`.
* Avatar dropdown with "Профиль" + "Выйти".
* OAuth buttons on login/register forms. Profile page has OAuth link/unlink.

## Rules

**Architecture**:
* Gateways are pure proxies — no database, no domain logic. Delegate via gRPC.
* Each microservice owns its DB and entities. No cross-service table access.
* Microservices communicate via gRPC or RabbitMQ only.
* Email: publish `email.send` to RMQ → notification-service delivers via BullMQ.
* File access: all files go through FileAccessController with visibility checks. FileAccess table (separate from Image/Video entities).
* AppError base in `@asko/shared`, domain-specific error extensions in each service's local `common/error/`.
* Gateway shared code in `@asko/gateway-common` — never duplicate guards/decorators/filters/gRPC utils between gateways.

**Code**:
* Russian UI strings. TypeScript strict. ESM. ES2022.
* MikroORM v6. class-validator on all DTOs. argon2 for passwords. JWT RS256.
* `@Public()` bypasses JWT. `@OptionalAuth()` tries JWT silently. Use `@JwtAuthUser()` decorator — never `(req as any).user`.
* User preferences lazy-loaded. Use `findByIdWithPreferences()` when preferences needed. Never call `@CreateRequestContext()` method from within another — use `this.em.findOne()` directly.
* `slugify()` from `@asko/shared` — single canonical implementation.

**Frontend**:
* `'use client'`: Axios from `src/lib/api/client.ts`. Server: `serverGet()` from `server-fetch.ts`.
* File uploads: use `fileUploadApi.uploadXxxImage(file, ownerId)` target-specific helpers. No domain-specific upload methods on other API modules.
* OAuth: server-side redirect flow via `/auth/oauth/:provider`. Callback page at `/auth/callback` with Suspense boundary.
* No backward compatibility unless requested — migrate consumers, delete old code.

**Docker**: One Dockerfile per app. `docker-compose.yml` includes all services + auth-gateway + Prometheus + Grafana + redis-exporter. Nginx config in `nginx/nginx.conf`. Turborepo prune for builds.
