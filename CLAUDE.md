# CLAUDE.md

## Project Overview

ASKO — repair management platform. pnpm + Turborepo monorepo: NestJS microservices, Next.js frontend, gRPC, RabbitMQ, shared packages.

Communication: REST+WebSocket (web↔api), gRPC (api↔services), RabbitMQ (async events). Each microservice owns its own PostgreSQL database.

## Structure

```
apps/
  api/                    # REST+WS gateway (:4000), pure proxy, no DB
  user-service/           # Auth, users, invitations (:5000, gRPC+RMQ)
  payment-service/        # Payments, providers (:5001, gRPC+RMQ)
  file-service/           # Images, video, storage (:5002, gRPC+RMQ)
  repair-service/         # Repairs, dealers, devices, certs (:5003, gRPC+RMQ)
  notification-service/   # Notifications, email (:5004, gRPC+RMQ+BullMQ)
  chat-service/           # Chat, presence (:5005, gRPC+RMQ)
  content-service/        # Articles, recommendations (:5010, gRPC)
  web/                    # Next.js frontend (:3000)
packages/
  proto/                  # .proto files + TS interfaces (@asko/proto, no build step)
  shared/                 # DTOs, types, enums (@asko/shared)
  ui/                     # React components (@asko/ui)
  observability/          # Prometheus metrics + Pino logger (@asko/observability)
monitoring/
  prometheus/             # prometheus.yml + alerts.yml
  grafana/                # Dashboards + provisioning
```

## Commands

```bash
pnpm install && turbo run build          # Install + build all
./scripts/dev.sh                          # Docker infra + all services (excl web)
./scripts/openapi.sh                      # Regenerate OpenAPI spec + frontend types
./scripts/setup-dev.sh                    # Create DBs + run migrations
npx mikro-orm migration:create/up         # Per-service migrations
```

## Services

### API Gateway (`apps/api` :4000)
REST+WebSocket proxy. No database. Delegates all logic to microservices via gRPC. Handles auth guards, validation, pagination normalization, Swagger docs. Static files: `/images`, `/videos`. WebSocket chat via ChatGateway (`/chat` namespace). Env: `*_SERVICE_URL` vars for each microservice.

### User Service (`apps/user-service` :5000)
Auth, users, invitations, JWT RS256, argon2. Entities: User, Session, InvitationLink, UserAddress. Creates default super admin on startup. Publishes `email.send` to RMQ (never sends email directly). gRPC + RMQ publisher.

### Payment Service (`apps/payment-service` :5001)
Payments, webhooks. Entities: PaymentEntity. Providers: Dummy, Yookassa, Tbank. Publishes payment.*/withdraw.* events. gRPC + RMQ publisher.

### File Service (`apps/file-service` :5002)
Image/video upload + processing. Entities: Image, Video. Storage: local or Cloudinary (factory). Consumes image_resize_queue for async processing. gRPC + RMQ pub+con.

### Repair Service (`apps/repair-service` :5003)
Core business: repairs, dealers, devices, certificates, repairers, reviews, points, schedules. 16 entities (RepairRequest, Device, DeviceCategory, UserDevice, Address, Certificate, Repairer, Review, WorkStep, DealerProfile, DealerClient, PointsTransaction, PointsWithdrawal, DevicePart, BrokenPart, WSchedule). 5 gRPC controllers. Calls payment-service + file-service via gRPC. gRPC + RMQ pub+con.

### Notification Service (`apps/notification-service` :5004)
Notifications + email delivery. Entities: NotificationEntity. Consumes payment.*, repair.*, chat.*, email.send from RMQ. Email via BullMQ queue (5 retries, exponential backoff, priority). gRPC + RMQ consumer + BullMQ.

### Chat Service (`apps/chat-service` :5005)
Conversations, messages, presence. Entities: Conversation, ConversationParticipant, Message, UserPresence. Types: direct/group conversations, text/image/video/system messages, online/offline presence, typing/uploading activity. Publishes chat.* events. gRPC + RMQ pub+con.

### Content Service (`apps/content-service` :5010)
Articles (Lexical JSON), view analytics, tag-based recommendations. Entities: Article, ArticleView, ArticleEdge, ArticleTag. Weighted article graph (tag overlap 40% + co-view Jaccard 60% + manual links). YouTube-style view tracking (5s threshold, 5min dedup, bot filtering, race-safe SQL counter). gRPC only.

## RabbitMQ Queues

| Service | Role | Queue | Events |
|---|---|---|---|
| user-service | Pub | notification_queue | email.send |
| payment-service | Pub | notification_queue, repair_queue | payment.*, withdraw.* |
| file-service | Pub+Con | image_resize_queue | image processing |
| repair-service | Pub+Con | notification_queue, payment_queue, address_validation_queue | repair.* |
| notification-service | Con | notification_queue | payment.*, repair.*, chat.*, email.send → BullMQ |
| chat-service | Pub+Con | notification_queue, chat_queue | chat.* |

## Web App (`apps/web`)

Next.js App Router. Communicates with API gateway only.

**Stack**: Next.js v16, React 19, Redux Toolkit v2, React Query v5, Tailwind v4, Socket.io-client, Axios, Framer Motion, Lexical, lucide-react

**API clients**: Client-side Axios (`src/lib/api/client.ts`) for `'use client'` components. Server-side fetch (`src/lib/api/server-fetch.ts`) for server components. Types auto-generated in `api.gen.d.ts`.

**Env**: `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`), `NEXT_PUBLIC_YM_ID` (Yandex Metrika, optional)

## Monitoring

`@asko/observability` — each service registers `MetricsModule.register({ serviceName })` + `createMetricsServer(metricsService, port)`. Metrics: `http_request_duration_seconds`, `http_requests_total`, `grpc_call_duration_seconds`, `grpc_calls_total` + default Node.js metrics. `collectDefaultMetrics()` runs in constructor (not `onModuleInit`).

Metrics ports: API 4000, user 9100, payment 9101, file 9102, repair 9103, notification 9104, chat 9105, content 9110, RabbitMQ 15692, Redis 9121 (redis_exporter sidecar).

Prometheus scrapes all targets. Grafana dashboard (`asko-services-overview`) with `$service` variable. Alerts in `alerts.yml`.

## UI Design Rules

* **No border-radius** — sharp corners everywhere. Only `rounded-full` for avatars/circles and status badges.
* **Icons via lucide-react** — never inline `<svg>` for standard icons. Inline SVG only for charts/animated framer-motion paths.
* **DataGrid for all tables** — column definitions with `key`, `header`, `width`, `render`, `mobileLabel`. Column sizing: `minmax(<minWidth>px, 1fr)` default 100px.
* **ViewSwitcher is standalone** — placed above data view, not inside `DataToolbar`. `DataToolbar` has search, filters, actions only.
* **No separate row components** — cell rendering lives in column `render` functions.
* Tailwind only — no CSS files, no styled-components.
* Must run `pnpm run build` after changes to packages.

## Account Layout

* Full-width adaptive — no max-width cap.
* Sidebar: 200px, `bg-[#fff]`, `sticky top-0 h-screen overflow-y-auto`.
* Header avatar: `DropdownMenu` with "Профиль" + "Выйти".
* Dashboard typography: big numbers `text-[82px] leading-[86px]`, titles `text-[24px] leading-[28px]`, text `text-[14px] leading-[18px]`.

## Rules

**Architecture**:
* API gateway is a pure proxy — no database, no domain logic. Delegates via gRPC.
* Each microservice owns its DB and entities. No cross-service table access.
* Microservices communicate via gRPC or RabbitMQ events only.
* Exception: repair-service calls payment-service + file-service via gRPC.
* Email: publish `email.send` to RabbitMQ → notification-service handles delivery via BullMQ.
* WebSocket chat handled at API gateway level (ChatGateway).

**Code**:
* Russian UI strings. TypeScript strict. ESM. ES2022.
* MikroORM v6. class-validator on all DTOs. argon2 for passwords. JWT RS256.
* `.proto` files in `packages/proto/`. TS interfaces hand-written, kept in sync manually.
* `@asko/shared` for DTOs/types, `@asko/shared/client` for web, `@asko/shared/server` for server-only utils.
* Swagger CLI plugin auto-adds `@ApiProperty`. Manual only for array props in paginated responses.
* Paginated gRPC responses: normalize `data: result.data ?? []`.
* `@Public()` bypasses JWT. `@OptionalAuth()` tries JWT silently.
* DeviceCategory is a table, not enum. Article tags in junction table, not JSONB.

**Frontend**:
* `'use client'` components: Axios client from `src/lib/api/client.ts`. Never raw `fetch()`.
* Server components: `serverGet()` from `src/lib/api/server-fetch.ts`. Never Axios.
* Never edit `api.gen.d.ts`. Run `./scripts/openapi.sh` after backend changes.
* Pagination in server components: `hrefPattern` string, not `getHref` function.
* No backward compatibility unless requested — migrate consumers, delete old code.
* DataGrid only — no legacy DataTable components.

**Docker**: One Dockerfile per app at repo root. `docker-compose.yml` (prod) and `docker-compose.dev.yml` (dev) include all services + Prometheus + Grafana + redis-exporter. Turborepo prune for builds.
