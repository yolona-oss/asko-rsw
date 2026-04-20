# CLAUDE.md

## Project Overview

ASKO — repair management platform. pnpm + Turborepo monorepo: NestJS microservices, Next.js frontend, gRPC, RabbitMQ, shared packages.

Communication: REST+WebSocket (web↔gateways), gRPC (gateways↔services), RabbitMQ (async events). Each microservice owns its own PostgreSQL database.

## Structure

```
apps/
  auth-gateway/           # Auth REST gateway (:4001) — login, OAuth, invitations
  repair-gateway/         # Repair REST gateway (:4002) — devices, repairs, certs, payments, dealers, schedules
  media-gateway/          # Media REST gateway (:4003) — file uploads, access-controlled serving
  realtime-gateway/       # Realtime gateway (:4004) — chat, notifications, WebSocket/Socket.IO
  content-gateway/        # Content REST gateway (:4005) — articles, public user profiles
  user-service/           # Auth, users, invitations (:5000, gRPC+RMQ)
  payment-service/        # Payments, providers (:5001, gRPC+RMQ)
  file-service/           # Images, video, storage (:5002, gRPC+RMQ)
  repair-service/         # Repairs, devices, certificates, schedules (:5003, gRPC+RMQ)
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
deploy/
  docker/                 # docker-compose.yml (profiles), .env.example
  nginx/                  # nginx.app.conf (VPS host nginx for SSL + gateway routing)
monitoring/
  prometheus/             # prometheus.yml + alerts.yml
  grafana/                # Dashboards + provisioning
scripts/
  build.sh                # Build all in dependency order
  dev.sh                  # Docker infra + all services (excl web)
  openapi.sh              # Regenerate OpenAPI spec + frontend types
  setup-dev.sh            # Create DBs + run migrations
  env-pull.sh             # Pull .env.prod files from VPS via SSH
  env-push.sh             # Push .env.prod files to VPS (supports selective: ./env-push.sh auth-gateway web)
  nginx-push.sh           # Push nginx config to VPS and reload
```

## Commands

```bash
pnpm install && turbo run build          # Install + build all
./scripts/build.sh                        # Build in dependency order
./scripts/dev.sh                          # Docker infra + all services (excl web)
./scripts/openapi.sh                      # Regenerate OpenAPI spec + frontend types
./scripts/setup-dev.sh                    # Create DBs + run migrations
./scripts/env-push.sh [app...]            # Push .env.prod to VPS
./scripts/nginx-push.sh                   # Push nginx.app.conf to VPS + reload
```

## Gateway Architecture

Five gateways, all sharing JWT public key for local token validation. Host nginx (VPS) routes by URL prefix — frontend sees one domain.

**Auth Gateway** (:4001) — `/auth/*`, `/invite/*`, `/users/*`. Login, register, OAuth (Google/VK/Yandex), MFA, phone verification, password reset, session, invitations, user profile CRUD, admin user management. Also hosts `POST /auth/users/:userId/avatar` (avatar upload, self-or-admin). Talks to user-service, file-service.

**Repair Gateway** (:4002) — `/repair-requests/*`, `/devices/*`, `/user-devices/*`, `/device-categories/*`, `/certificates/*`, `/repairers/*`, `/dealers/*`, `/reviews/*`, `/schedule/*`, `/address/*`, `/payment/*`, `/parts/*`. Also hosts per-domain file uploads: `POST /repair-requests/:id/{images,videos,documents}`, `POST /reviews/:id/{images,videos}`, `POST /devices/:id/{images,videos}`, `POST /parts/:id/images`, `POST /repair-requests/broken-parts/:partId/{images,documents}`, and `DELETE /repair-requests/documents/:documentId`. Ownership enforced via `RepairAccessService` (`assertRepairRequestParticipant`, `assertReviewOwner`, `assertBrokenPartAccess`). Talks to repair-service, payment-service, file-service, user-service.

**Media Gateway** (:4003) — `/file-upload/*`, `/files/*`. Only generic admin image/video/document uploads (`POST /file-upload/{image,video,document}/upload`), admin-only image/video attach/unattach/delete/from-url, `GET /file-upload/{image,video,document}/attached` lookups, and access-controlled file serving via FileAccess visibility checks. **Per-domain file uploads live on their owning gateways** (auth/repair/content) so media-gateway has no dependency on repair-service or content-service. Local files served from shared Docker volume; Cloudinary URLs redirected. Nginx caches `/images/*` and `/videos/*` with 7d expiry.

**Realtime Gateway** (:4004) — `/chat/*`, `/notifications/*`, `/socket.io/*`. WebSocket with sticky sessions. Talks to chat-service, notification-service, user-service. Redis adapter for cross-pod WebSocket.

**Content Gateway** (:4005) — `/articles/*`. Article CRUD and public article endpoints. Also hosts `POST /articles/:id/{images,videos}` (admin-only article media uploads). Talks to content-service, file-service.

## Packages

All packages use `@asko/` prefix. All services use `@asko/service-name` in package.json.

### `@asko/shared`
DTOs, types, enums, constants. AppError system. `slugify()`. `getEnvFilePath()` — returns `.env.prod`/`.env.dev` path or undefined (falls back to process.env). Subpath exports: `@asko/shared` (full), `@asko/shared/client` (web-safe), `@asko/shared/server` (server-only). Must build after changes.

### `@asko/authorization`
Centralized authorization: `Permission` enum, `ROLE_PERMISSIONS` static map, `@Permissions()` decorator + `PermissionGuard`, `@CheckPolicy()` decorator + `PolicyGuard`, `Policy` interface for ownership/entity checks. Role-check utils (`isStaff`, `isAdmin`, `isSelf`, `assertSelfOrStaff`). Import via `AuthorizationModule.forRoot()` in each gateway. Must build after changes.

### `@asko/gateway-common`
Shared gateway infra: JwtGuard (`GATEWAY_CONFIG` injection token), decorators (`@JwtAuthUser`, `@Public`, `@OptionalAuth`), GlobalExceptionFilter, `grpcCall()`, CORS/Helmet config, UserClientModule, FileClientModule, shared response DTOs. Must build after changes.

### `@asko/proto`
gRPC .proto files + hand-written TS interfaces. No build step.

### `@asko/ui`
React component library. Tailwind only. DataGrid, DataToolbar, DataFilter, ViewSwitcher, DataCardView, Pagination, Modal, etc. Must build after changes.

### `@asko/observability`
Prometheus metrics + Pino logger. `collectDefaultMetrics()` in constructor.

## Services

- **user-service** (:5000) — auth, users, invitations, JWT RS256, MFA, OAuth, phone/email verification. gRPC+RMQ.
- **payment-service** (:5001) — payments, webhooks, providers (Dummy/Yookassa/Tbank). gRPC+RMQ.
- **file-service** (:5002) — image/video upload+processing+resize, FileAccess table (public/private/role_restricted/participants_only). Local (`FILE_STORAGE_MODE=local`) or Cloudinary storage. `PUBLIC_URL` used for stored URLs. gRPC+RMQ.
- **repair-service** (:5003) — repairs, devices, user-devices, certificates, repairers, reviews, points, schedules. gRPC+RMQ.
- **notification-service** (:5004) — notifications, email via BullMQ. Consumes payment/repair/chat/schedule events. gRPC+RMQ+BullMQ.
- **chat-service** (:5005) — conversations, messages, presence. Message status (sending/delivered/seen). gRPC+RMQ.
- **content-service** (:5010) — articles (Lexical JSON), view analytics, weighted article graph. gRPC only.

## UI Design Rules

* **Theme tokens only** — never hard-code colors (no `bg-white`, `bg-gray-*`, `bg-green-50`, `text-red-500`, `border-gray-200`, etc.). Use semantic tokens defined in `apps/web/src/styles/globals.css`: surfaces (`page-bg`, `surface`, `surface-hover`, `surface-secondary`), text (`text-main`, `text-sub`, `text-on-dark`, `text-on-brand`), borders (`border`, `border-light`, `border-divider`), brand (`brand-red`, `primary-50..900`), status (`success`, `success-deep`, `warning`, `error`, `info`), icons (`icon`, `icon-active`), skeleton (`skeleton`). The app toggles `.dark` on `<html>` via `ThemeProvider` in `apps/web/src/lib/theme.tsx` (persists to localStorage, honors `prefers-color-scheme`); every token has a dark override in `globals.css`, so semantic classes swap automatically. Hard-coded palette colors break the dark theme — always extend `globals.css` with a new token (plus its dark override) instead.
* **No border-radius** — sharp corners. Only `rounded-full` for avatars/circles and status badges.
* **Icons via lucide-react** — never inline `<svg>` for standard icons.
* **DataGrid** for tables — auto-sized columns via content length + `weight`. Mobile: full-bleed (`-mx-4 lg:mx-0`), border-y only. `onRowClick` (detail modal), `onRowDoubleClick` (edit), auto "Подробнее" in context menu.
* **DataToolbar** filters are horizontally scrollable with hidden scrollbar (`scrollbar-hide` class). FilterSelect uses borderless native `<select>` with ChevronDown overlay.
* **ViewSwitcher** standalone above data view, not inside DataToolbar.
* **File URLs** — all via access-controlled endpoint `/files/image/:id` or `/files/video/:id`. Use `getImageUrl(id)`/`getVideoUrl(id)` from `@/lib/file-url`.
* Tailwind only. Must build packages after changes.

## Account Layout

* Full-width adaptive, no max-width cap. `min-w-[390px]`.
* Sidebar: 200px, `bg-[#fff]`, `sticky top-0 h-screen`, hidden on mobile.
* Main content: `overflow-x-hidden` to prevent horizontal scroll.
* Dashboard typography: numbers `text-[82px] leading-[86px]`, titles `text-[24px] leading-[28px]`, text `text-[14px] leading-[18px]`.
* Avatar dropdown with "Профиль" + "Выйти".
* OAuth buttons on login/register forms. Profile page has OAuth link/unlink.

## Rules

**Architecture**:
* Gateways are pure proxies — no database, no domain logic. Delegate via gRPC.
* Each microservice owns its DB and entities. No cross-service table access.
* Microservices communicate via gRPC or RabbitMQ only.
* RMQ events are HMAC-signed per group via `@SignedEvent`/`SignedEventPublisher` in `@asko/observability/event-bus`. Routing-key → group policy resolved from `EVENT_SIGNING_GROUPS` env (JSON). Groups can be enforced independently (e.g. payment enforced, default soft) to roll out cutover safely.
* Email: publish `email.send` to RMQ → notification-service delivers via BullMQ.
* File access: media-gateway serves local files directly (detects `/images/` or `/videos/` in storageUrl). Only Cloudinary URLs get redirected. FileAccess table for visibility control.
* AppError base in `@asko/shared`, domain-specific error extensions in each service's local `common/error/`.
* Gateway shared code in `@asko/gateway-common` — never duplicate guards/decorators/filters/gRPC utils between gateways.

**Code**:
* Russian UI strings. TypeScript strict. ESM. ES2022.
* MikroORM v6. class-validator on all DTOs. argon2 for passwords. JWT ES256.
* `@Public()` bypasses JWT. `@OptionalAuth()` tries JWT silently. Use `@JwtAuthUser()` decorator — never `(req as any).user`.
* `@Permissions(Permission.XXX)` for role-based access. `@CheckPolicy(XxxPolicy)` for ownership/entity checks. Both from `@asko/authorization`.
* User settings lazy-loaded (one-to-one to `user_settings` table). Use `findByIdWithSettings()` when settings needed. Never call `@CreateRequestContext()` method from within another — use `this.em.findOne()` directly.
* `slugify()` from `@asko/shared` — single canonical implementation.

**Frontend**:
* `'use client'`: Axios from `src/lib/api/client.ts`. Server: `serverGet()` from `server-fetch.ts`.
* **Response types from OpenAPI only** — frontend uses auto-generated types from `api.gen.d.ts` (via `./scripts/openapi.sh`) for all API response shapes. Never replace generated DTO types with manual interfaces from `@asko/shared`. Enums and request DTOs may be imported from `@asko/shared/client`.
* File uploads: use `fileUploadApi.uploadXxxImage(file, ownerId)` target-specific helpers. No domain-specific upload methods on other API modules.
* OAuth: server-side redirect flow via `/auth/oauth/:provider`. Callback page at `/auth/callback` with Suspense boundary.
* No backward compatibility unless requested — migrate consumers, delete old code.

**Docker & Deployment**:
* One Dockerfile per app. `turbo prune @asko/app-name --docker` for minimal builds.
* `deploy/docker/docker-compose.yml` with profiles: `all`, `data`, `services`, `gateways`, `frontend`, `monitoring`, `proxy`.
* `network_mode: host` for all containers. `env_file:` with `required: false` for runtime env loading.
* VPS host nginx handles SSL + path-based routing to 5 gateways. Docker nginx in `proxy` profile (not used on VPS).
* Gateway Dockerfiles must COPY `gateway-common` to both `node_modules/@asko/gateway-common` and `packages/gateway-common` (compiled imports use relative paths).
* VPS: `asko-rws@193.42.127.113` (key: `~/.ssh/asko_rws_vps_deploy_user`). Root: `root@193.42.127.113` (key: `~/.ssh/asko_rws_vps_beget`, default shell is fish — use `bash -c`).
