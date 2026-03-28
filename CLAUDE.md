# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

ASKO — repair management platform. A pnpm + Turborepo monorepo with microservice architecture using NestJS, Next.js, gRPC, RabbitMQ, and shared packages.

Communication patterns:

* **REST + WebSocket** — web ↔ api gateway
* **gRPC** — api gateway ↔ all microservices
* **RabbitMQ** — async event-driven communication between services (payment events, image processing)

Each microservice owns its own PostgreSQL database. Services never share database tables.

---

## Monorepo Structure

```
apps/
  api/                    # REST + WebSocket gateway (:4000)
  user-service/           # Auth, users, invitations (:5000, gRPC)
  payment-service/        # Payments, providers, webhooks (:5001, gRPC + RabbitMQ publisher)
  file-service/           # Images, video, storage (:5002, gRPC + RabbitMQ publisher/consumer)
  repair-service/         # Repairs, dealers, devices, certificates (:5003, gRPC)
  notification-service/   # Notifications (:5004, gRPC + RabbitMQ consumer)
  chat-service/           # Chat, presence, messaging (:5005, gRPC + RabbitMQ publisher/consumer)
  content-service/        # Articles, views, recommendations (:5010, gRPC)
  web/                    # Next.js frontend (:3000)

packages/
  proto/                  # gRPC .proto files + generated TS types (@asko/proto)
  shared/                 # DTOs, types, enums, utils (@asko/shared)
  ui/                     # React component library (@asko/ui)

scripts/
  build.sh               # Full monorepo build in dependency order
  dev.sh                  # Start dev environment (docker infra + all services)
  openapi.sh              # Regenerate OpenAPI spec + frontend types
  setup-dev.sh            # Create PostgreSQL databases + run migrations
```

---

## Commands

### Root-level (from repo root)

```bash
pnpm install
turbo run build
turbo run typecheck
turbo run lint
turbo run clean
```

### Scripts

```bash
./scripts/build.sh           # Build: shared → proto → ui → services + api
./scripts/dev.sh             # Start docker-compose.dev.yml + all services (excluding web)
./scripts/openapi.sh         # Regenerate OpenAPI spec + frontend types
./scripts/setup-dev.sh       # Create PostgreSQL databases, run migrations, create DB user
```

### Per-app commands

All NestJS apps (api, user-service, payment-service, file-service, repair-service, notification-service, content-service):

```bash
pnpm run start:dev           # Dev mode with watch
pnpm run start:prod          # Production mode
pnpm run build
pnpm run lint
```

API-specific:

```bash
pnpm run openapi:generate    # Generate openapi.json from controllers
pnpm run test                # Run tests
```

Web-specific:

```bash
pnpm run dev                 # Next.js dev (turbopack, :3000)
pnpm run build
pnpm run typecheck
pnpm run api:generate        # Generate TS types from openapi.json
```

Packages (proto, shared, ui):

```bash
pnpm run build
```

### Database migrations

Each service that owns a DB runs migrations independently from its directory:

```bash
npx mikro-orm migration:create
npx mikro-orm migration:up
```

Databases (user: almagest_root):

```
apps/api              → asko_rws_misc_db
apps/user-service     → asko_rws_users_db
apps/payment-service  → asko_rws_payment_db
apps/file-service     → asko_rws_files_db
apps/repair-service   → asko_rws_db
apps/notification-service → asko_rws_notify_db
apps/chat-service         → asko_rws_chat_db
apps/content-service      → asko_rws_content_db
```

---

## Apps

### API Gateway (`apps/api`)

Main backend entrypoint. REST gateway + WebSocket server. Delegates all domain logic to microservices via gRPC.

**Owns** (local entities):

* Cursor
* WSchedule

**Delegates via gRPC**:

| Domain | gRPC Client Module | Target Service |
|---|---|---|
| Auth / Users / Invitations | UserClientModule | user-service |
| Payments | PaymentClientModule | payment-service |
| File uploads / Images / Video | FileClientModule | file-service |
| Repairs | RepairClientModule | repair-service |
| Dealers | DealerClientModule | repair-service |
| Devices | DeviceClientModule | repair-service |
| Certificates | CertificateClientModule | repair-service |
| Repairers | RepairerClientModule | repair-service |
| Notifications | NotificationClientModule | notification-service |
| Chat / Messaging / Presence | ChatClientModule | chat-service |
| Articles / Views / Recommendations | ContentClientModule | content-service |

**Static file serving**:

* `/images` → images directory (jpg, jpeg, png, gif, svg, ico)
* `/videos` → images/videos directory (mp4, webm, mov)

**Stack**: NestJS v11, MikroORM v6, PostgreSQL, Redis, Socket.io, Nodemailer, gRPC clients, @nestjs/swagger

**Env**: `.env.dev` / `.env.prod`, loaded via AppConfig. Service URLs: `USER_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `FILE_SERVICE_URL`, `REPAIR_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, `CHAT_SERVICE_URL`, `CONTENT_SERVICE_URL`.

---

### User Service (`apps/user-service`)

Auth, user management, invitations, JWT, password hashing, email verification.

**Entities**: User, Session, InvitationLink, UserAddress

**Services**: UserService, AuthService (JWT RS256, argon2), InviteService, LoginThrottleService (Redis), CryptoService

**gRPC controller**: UserGrpcController

**Bootstrap**: Creates default super admin on startup from config.

**Stack**: NestJS, MikroORM, PostgreSQL, gRPC, argon2, passport, @nestjs/jwt, ioredis

**Transport**: gRPC only

---

### Payment Service (`apps/payment-service`)

Payment processing, provider management, webhook handling, event emission.

**Entities**: PaymentEntity

**Services**: PaymentService, PaymentDomainService, PaymentEventService, PaymentProviderService

**Providers**: DummyProvider, YookassaProvider, TbankProvider

**gRPC controller**: PaymentGrpcController

**RabbitMQ publisher** — queue: `notification_queue` (durable). Events emitted:

* `payment.created`
* `payment.paid`
* `payment.failed`
* `payment.refunded`
* `withdraw.created`
* `withdraw.paid`

**Stack**: NestJS, MikroORM, PostgreSQL, gRPC, amqplib, amqp-connection-manager

**Transport**: gRPC + RabbitMQ (publisher)

---

### File Service (`apps/file-service`)

File uploads, image processing, video management, storage providers.

**Entities**: Image, Video

**Services**: ImageService, VideoService, ImageProcessingService, ImageResizeService, CloudinaryService, LocalStorageService

**Storage providers**: Local storage or Cloudinary (factory pattern, controlled by `config.fileStorageMode`)

**Video support**: Upload to local (repair-request-videos, review-videos) or cloudinary. VideoTypeEnum (RepairRequest, Review, etc.)

**gRPC controller**: FileGrpcController

**RabbitMQ** — queue: `image_resize_queue` (durable). ImageResizeConsumer listens for image processing events.

**Stack**: NestJS, MikroORM, PostgreSQL, gRPC, sharp, cloudinary, amqplib, amqp-connection-manager

**Transport**: gRPC + RabbitMQ (publisher + consumer for image processing)

---

### Repair Service (`apps/repair-service`)

Core business logic: repairs, dealers, devices, certificates, repairers, reviews, points.

**Entities** (13): RepairRequest, Device, UserDevice, Address, Certificate, Repairer, Review, WorkStep, DealerProfile, DealerClient, PointsTransaction, PointsWithdrawal, DevicePart, BrokenPart

**Services**: DeviceService, AddressService, CertificateService, ExternalCertValidationService, RepairerService, ReviewService, RepairRequestService, WorkStepService, DealerService, BrokenPartService

**gRPC controllers** (5): DeviceGrpcController, CertificateGrpcController, RepairerGrpcController, RepairGrpcController, DealerGrpcController

**Imports**: PaymentClientModule, FileClientModule (calls payment-service and file-service via gRPC)

**Stack**: NestJS, MikroORM, PostgreSQL, gRPC

**Transport**: gRPC only

---

### Notification Service (`apps/notification-service`)

Notification persistence, event consumption, lifecycle management.

**Entities**: NotificationEntity

**Services**: NotificationService

**gRPC controller**: NotificationGrpcController (create, list, mark read, delete, unread count)

**RabbitMQ consumers**:

* PaymentEventConsumer — listens: `payment.paid`, `payment.failed` → creates notifications
* RepairEventConsumer — listens: repair status change events

**Stack**: NestJS, MikroORM, PostgreSQL, gRPC, amqplib, amqp-connection-manager

**Transport**: gRPC (CRUD) + RabbitMQ (event consumption via @EventPattern)

---

### Chat Service (`apps/chat-service`)

Real-time chat, conversations, messaging, user presence, activity statuses.

**Entities** (4): Conversation, ConversationParticipant, Message, UserPresence

**Services**: ConversationService, MessageService, PresenceService

**gRPC controller**: ChatGrpcController

**RabbitMQ**: Publisher to `notification_queue` (for notification-service integration). Consumer on `chat_queue`.

**Conversation types**: direct, group

**Message types**: text, image, video, system

**Presence statuses**: online, offline

**Activity statuses**: idle, typing, uploading_image, uploading_video

**WebSocket**: Handled at API gateway level (`/chat` namespace). ChatGateway manages:
* Connection auth via JWT
* Online/offline presence tracking
* Real-time message delivery
* Typing, uploading image/video indicators
* Conversation room join/leave
* Mark as read events

**Stack**: NestJS, MikroORM, PostgreSQL, gRPC, amqplib, amqp-connection-manager

**Transport**: gRPC (CRUD) + RabbitMQ (publisher for notifications, consumer for future events)

---

### Content Service (`apps/content-service`)

Article management, rich content (Lexical editor), view analytics, tag-based recommendations.

**Entities** (2): Article, ArticleView

**Services**: ContentService (CRUD, slug generation, plain-text extraction from Lexical JSON, view tracking with hourly dedup, tag-based related articles, reading-history recommendations)

**gRPC controller**: ContentGrpcController (9 methods: CreateArticle, UpdateArticle, DeleteArticle, DeleteAllArticles, FindAllArticles, FindArticleBySlug, RecordView, FindRelatedArticles, FindRecommendedArticles)

**Article content**: Stored as Lexical editor state JSON in `content` (JSONB) column. Plain text auto-extracted to `text` column for search/preview/SEO. Backward compatible with legacy plain-text articles.

**View tracking**: ArticleView entity records views per user/session, deduplicated to 1 per hour. Denormalized `viewCount` on Article for fast sorting.

**Recommendations**: Authenticated users get tag-based recommendations from reading history. Anonymous users get popularity-based (viewCount). Related articles computed by tag overlap.

**Stack**: NestJS, MikroORM, PostgreSQL, gRPC

**Transport**: gRPC only

---

### Web (`apps/web`)

Next.js App Router frontend. Communicates with API gateway only. Never calls microservices directly.

**Stack**: Next.js v16, React 19, Redux Toolkit v2, React Query v5, Tailwind v4, Socket.io-client, openapi-fetch, Axios (legacy), Framer Motion, Lexical (rich text editor)

**API clients**:

* Legacy Axios client: `src/lib/api/client.ts` — auto-attaches access token, auto-refreshes on 401
* Typed openapi-fetch client: `src/lib/api/openapi-client.ts` — for new code
* Generated types: `src/lib/api/api.gen.d.ts` — auto-generated, do NOT edit

**State management**: Redux Toolkit for auth state, React Query for server state.

**Rich text editor**: Lexical (Meta) for article content creation. Editor components in `src/components/account/admin/article-form/`. Server-side HTML generation via `@lexical/headless` in `src/lib/lexical/generate-html.ts`.

**Analytics**: Yandex Metrika integration via `src/components/YandexMetrika.tsx`. Configured with `NEXT_PUBLIC_YM_ID` env var.

**Env**: `NEXT_PUBLIC_API_URL` — API gateway URL (default: `http://localhost:4000`), `NEXT_PUBLIC_YM_ID` — Yandex Metrika counter ID (optional)

**Generating API types** after backend changes:

```bash
./scripts/openapi.sh
```

Or manually:

```bash
cd apps/api && pnpm run openapi:generate
cp apps/api/openapi.json apps/web/openapi.json
cd apps/web && pnpm run api:generate
```

---

## Packages

### Proto (`packages/proto` / `@asko/proto`)

gRPC contracts shared between all backend services.

**.proto files** (11): user, payment, file, device, repairer, certificate, repair, dealer, notification, chat, content

**Exports per service**: `XXXX_PROTO_PATH`, `XXXX_PACKAGE_NAME`, `XXXX_SERVICE_NAME` + generated TS interfaces.

**Rules**:

* All `.proto` files must live in `packages/proto/src/`
* Generated types must be exported from `@asko/proto`
* Never duplicate DTOs between services — use proto types for gRPC communication
* Never import entities through proto — only transport types

---

### Shared (`packages/shared` / `@asko/shared`)

DTOs, types, enums, constants, utilities shared across the monorepo.

**Subpath exports**:

```
@asko/shared           # full export (backend services)
@asko/shared/client    # client-safe export (web app) — type-only DTOs, no server utils
@asko/shared/server    # server-only export — full DTOs + server utils
```

**Structure**:

* `constants/` — pagination, password, refresh-token, regex, default-user-role
* `dto/` — organized by domain: auth, user, payment, image, video, repair, device, dealer, certificate, repairer, review, notification, address, article, wschedule, common (PaginationDto)
* `types/` — domain interfaces: user, image, video, repair, payment, device, dealer, repairer, certificate, review, notification, currency, roles, week-schedule, util
* `utils/` — extractDomain, httpUtils, isDefined, toURL, nodeEnv, toAuthUser, extractToken, currentUrl, envFile
* `lang/` — i18n/localization

---

### UI (`packages/ui` / `@asko/ui`)

React component library. Tailwind classes only — no CSS files, no styled-components.

**Components**: badge, button, card, container, crop-modal, data-table, dialog, email-input, form-field, input, key-value-editor, modal, name-input, password-input, pattern-input, phone-input, section, and more.

Must run `pnpm run build` after any change.

---

## Microservices Rules

* Each microservice owns its own database. No cross-service table access.
* API gateway must NOT access any microservice database directly.
* API gateway communicates with microservices exclusively via gRPC.
* Microservices must NOT call each other directly without proto or RabbitMQ events.
* Exception: repair-service imports PaymentClientModule and FileClientModule (calls via gRPC).
* Each microservice owns its entities — no shared entities between services.
* All domain logic lives in the owning microservice, not in the API gateway.
* API must NOT access chat tables directly — must call chat-service via gRPC.
* chat-service owns Conversation, ConversationParticipant, Message, UserPresence entities.
* chat-service publishes events to RabbitMQ for notification-service.
* WebSocket for chat is handled at the API gateway level (ChatGateway).
* API gateway handles REST serialization, auth guards, pagination normalization, and Swagger docs.

**Entity ownership**:

| Service | Entities |
|---|---|
| api | Cursor, WSchedule |
| user-service | User, Session, InvitationLink, UserAddress |
| payment-service | PaymentEntity |
| file-service | Image, Video |
| repair-service | RepairRequest, Device, UserDevice, Address, Certificate, Repairer, Review, WorkStep, DealerProfile, DealerClient, PointsTransaction, PointsWithdrawal, DevicePart, BrokenPart |
| notification-service | NotificationEntity |
| chat-service | Conversation, ConversationParticipant, Message, UserPresence |
| content-service | Article, ArticleView |

---

## gRPC Rules

* All `.proto` definitions must be in `packages/proto/src/*.proto`
* Proto files (11): user, payment, file, device, repairer, certificate, repair, dealer, notification, chat, content
* Generated TS types are exported from `@asko/proto`
* Never duplicate DTOs between services — always use proto types for gRPC
* Never import entities through proto — only transport types
* Each proto file exports constants: `XXXX_PROTO_PATH`, `XXXX_PACKAGE_NAME`, `XXXX_SERVICE_NAME`

### Connecting a gRPC client in the API gateway

```typescript
// Create a client module in apps/api/src/modules/<domain>/
@Module({
  imports: [
    ClientsModule.register([
      {
        name: '<SERVICE_NAME>',
        transport: Transport.GRPC,
        options: {
          package: XXXX_PACKAGE_NAME,
          protoPath: XXXX_PROTO_PATH,
          url: config.<service>.url,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class XxxxClientModule {}
```

### Exposing a gRPC service in a microservice

```typescript
// Create a gRPC controller in the microservice
@Controller()
export class XxxxGrpcController {
  @GrpcMethod('XxxxService', 'MethodName')
  async methodName(data: RequestType): Promise<ResponseType> {
    // ...
  }
}
```

---

## RabbitMQ Rules

RabbitMQ is used for async event-driven communication. Not all services use it.

**Services with RabbitMQ**:

| Service | Role | Queue | Events |
|---|---|---|---|
| payment-service | Publisher | notification_queue | payment.created, payment.paid, payment.failed, payment.refunded, withdraw.created, withdraw.paid |
| file-service | Publisher + Consumer | image_resize_queue | Image processing tasks |
| notification-service | Consumer | notification_queue | payment.paid, payment.failed, repair status changes |
| chat-service | Publisher + Consumer | notification_queue (pub), chat_queue (sub) | Chat message events for notifications |

**Rules**:

* RabbitMQ queues must be durable.
* Event names follow `domain.action` pattern (e.g., `payment.paid`).
* Consumers use `@EventPattern` decorator from `@nestjs/microservices`.
* Publishers register a `ClientsModule` with `Transport.RMQ`.
* Never use RabbitMQ for synchronous request/response — use gRPC for that.

### Publishing events

```typescript
// Register RMQ client in module
ClientsModule.register([{
  name: 'EVENTS_SERVICE',
  transport: Transport.RMQ,
  options: {
    urls: [config.rabbitmq.url],
    queue: 'notification_queue',
    queueOptions: { durable: true },
  },
}])

// Emit from service
@Inject('EVENTS_SERVICE') private readonly eventsClient: ClientProxy;
this.eventsClient.emit('payment.paid', payload);
```

### Consuming events

```typescript
@Controller()
export class PaymentEventConsumer {
  @EventPattern('payment.paid')
  async handlePaymentPaid(data: PaymentEventPayload) {
    // ...
  }
}
```

---

## Shared Code Rules

* Shared DTOs, types, enums, and constants live in `packages/shared`.
* Backend services import from `@asko/shared` (full export).
* Web app imports from `@asko/shared/client` (type-only, no server deps).
* Server-only utilities import from `@asko/shared/server`.
* DTOs organized by domain in `packages/shared/src/dto/<domain>/`.
* Types organized by domain in `packages/shared/src/types/<domain>/`.
* Never put service-specific logic in shared — only transport types and validation.
* Must run `pnpm run build` after changes.

---

## UI Package Rules

* Tailwind classes only — no CSS files, no styled-components.
* All components export from `packages/ui/src/components/`.
* Must run `pnpm run build` after changes.
* Used only by `apps/web`.

---

## Adding New Service

1. Create directory: `apps/<service-name>/`
2. Initialize NestJS app with gRPC transport.
3. Add `package.json` with deps: `@asko/shared`, `@asko/proto`, MikroORM, PostgreSQL driver.
4. Create `.proto` file in `packages/proto/src/<service>.proto`.
5. Export constants from `@asko/proto`: `XXXX_PROTO_PATH`, `XXXX_PACKAGE_NAME`, `XXXX_SERVICE_NAME`.
6. Create gRPC client module in `apps/api/src/modules/<domain>/`.
7. Register the client module in `apps/api/src/app.module.ts`.
8. Create a `Dockerfile.<service-name>` at repo root using turborepo prune.
9. Add service to `docker-compose.yml`.
10. Create the PostgreSQL database in `scripts/setup-dev.sh`.
11. Run `turbo run build` to verify.

---

## Adding New Package

1. Create directory: `packages/<package-name>/`
2. Add `package.json` with name `@asko/<package-name>`.
3. Configure `tsconfig.json` extending root config.
4. Add build script.
5. Reference from consuming apps via workspace dependency: `"@asko/<package-name>": "workspace:*"`.
6. Add to build order in `scripts/build.sh` if needed.

---

## Coding Rules

* Language: Russian UI strings
* TypeScript strict mode
* ESM modules
* Decorators enabled
* ES2022 target
* class-validator for DTO validation
* argon2 for password hashing
* JWT RS256 algorithm
* Redis optional (used for caching, throttling)
* `.env` files not committed to git
* Docker uses turborepo prune

---

## NestJS Rules

* All microservices use NestJS with gRPC transport.
* API gateway uses NestJS with Express adapter.
* Modules must be self-contained — declare providers, controllers, imports, exports.
* gRPC controllers use `@GrpcMethod` decorator.
* REST controllers use standard NestJS decorators.
* Guards, interceptors, and pipes are app-specific — not shared between services.
* MikroORM v6 for all database operations.
* `@Public()` decorator bypasses JWT entirely. `@OptionalAuth()` tries JWT silently — attaches user if valid, allows request without user if not. Use `@OptionalAuth()` for endpoints that work for both authenticated and anonymous users (e.g., personalized recommendations).

---

## DTO / Entity Rules

**DTOs** (Data Transfer Objects):

* Live in `packages/shared/src/dto/<domain>/` — shared across all services.
* **Every** DTO property **must** have `class-validator` decorators (`@IsString()`, `@IsNumber()`, `@IsBoolean()`, `@IsEmail()`, `@IsEnum()`, `@IsOptional()`, etc.). The API gateway uses `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` — properties without decorators are silently stripped and undecorated DTOs will break at runtime.
* Swagger CLI plugin auto-adds `@ApiProperty()` to typed class properties in `*.dto.ts` files.
* Manual `@ApiProperty({ type: [RecordDto] })` only needed on array properties in paginated responses.
* Must use `PaginationDto` and `PaginatedResponseDto` from `@asko/shared`.

**Entities**:

* Live in the owning microservice only: `apps/<service>/src/entities/`.
* Never share entities between services.
* Never import entities through `@asko/proto`.
* Use MikroORM decorators (`@Entity`, `@Property`, `@ManyToOne`, etc.).

**Response DTOs** (API gateway only):

* Live in `apps/api/src/common/dto/responses/`.
* Mirror proto `*Record` interfaces as classes for Swagger schema generation.

---

## OpenAPI / Swagger

The API gateway uses `@nestjs/swagger` with the CLI plugin.

**Configuration**:

* Swagger CLI plugin enabled in `apps/api/nest-cli.json` (`classValidatorShim`, `introspectComments`)
* Swagger UI at `/doc` (all environments)
* OpenAPI JSON spec at `/doc/openapi.json`
* Standalone spec generator: `apps/api/src/generate-openapi.ts`

**Rules for controllers**:

* Every controller must have `@ApiTags('...')` for grouping.
* Every endpoint must have a response decorator:
  * `@ApiOkResponse({ type: X })` for GET, PUT, PATCH, DELETE
  * `@ApiCreatedResponse({ type: X })` for POST
  * `@ApiResponse({ status: N, type: X })` for controllers using `@Res()`
* Response DTO must match what the controller actually returns.
* Avoid `@Res()` in controllers — it prevents Swagger auto-detection of return types.

**When adding a new endpoint**:

1. Create or reuse a response DTO class in `apps/api/src/common/dto/responses/`.
2. Add the appropriate `@ApiOkResponse`/`@ApiCreatedResponse` decorator.
3. Run `./scripts/openapi.sh` to regenerate the spec and frontend types.

---

## Pagination

All paginated gRPC responses may omit the `data` field when the array is empty (protobuf3 default behavior). Controllers must normalize:

```typescript
const result = await this.someClient.findAll(pagination);
return { ...result, data: result.data ?? [] };
```

Must use `PaginationDto` and `PaginatedResponseDto` from `@asko/shared`.

---

## Package Dependencies

```
web         → ui + shared/client
api         → shared + proto
user-service → shared + proto
payment-service → shared + proto
file-service → shared + proto
repair-service → shared + proto + (calls payment-service + file-service via gRPC)
notification-service → shared + proto
chat-service → shared + proto
content-service → shared + proto
proto       → standalone
ui          → standalone
shared      → standalone
```

---

## Docker

Dockerfiles at root (one per app):

```
Dockerfile.api
Dockerfile.web
Dockerfile.user-service
Dockerfile.payment-service
Dockerfile.file-service
Dockerfile.repair-service
Dockerfile.notification-service
Dockerfile.chat-service
Dockerfile.content-service
```

**docker-compose.yml** — production: all services + RabbitMQ, network_mode: host, shared `images-data` volume.

**docker-compose.dev.yml** — development: RabbitMQ (amqp://guest:guest@localhost:5672) + Redis (localhost:6379).

All Docker builds use turborepo prune.

---

## IMPORTANT Restrictions

* API gateway must NEVER access microservice databases directly — always use gRPC.
* Microservices must NEVER expose REST endpoints — only gRPC (and RabbitMQ where applicable).
* Web app must NEVER call microservices directly — only the API gateway.
* Never duplicate DTOs between services — use `@asko/shared` and `@asko/proto`.
* Never share entities between services — each service owns its own.
* Never import entities through `@asko/proto` — only transport types.
* Never put service-specific logic in `packages/shared`.
* Never use CSS files or styled-components in `packages/ui` — Tailwind classes only.
* API must NEVER access chat-service database directly — always use gRPC.
* API must NEVER access content-service database directly — always use gRPC.
* content-service owns Article and ArticleView entities.
* Never edit `apps/web/src/lib/api/api.gen.d.ts` — it is auto-generated.
* Always run `./scripts/openapi.sh` after changing backend endpoints or response types.
* Always run `pnpm run build` in packages after changes.
* `.env` files must never be committed to git.
