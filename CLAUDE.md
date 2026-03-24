# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASKO repair management platform — a pnpm + Turborepo monorepo with microservice architecture using NestJS, Next.js, gRPC, and shared packages.

Microservices:
Auth, user management, and invitations are handled by `apps/user-service`.
Payment processing is handled by `apps/payment-service`.
File uploads and image management are handled by `apps/file-service`.
Repairs, dealers, devices, certificates, repairers, and reviews are handled by `apps/repair-service`.
Notifications are handled by `apps/notification-service` (gRPC + RabbitMQ hybrid).
gRPC contracts are stored in `packages/proto`.
RabbitMQ is used for async event-driven communication between services.

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
./scripts/build.sh          # Full monorepo build in dependency order
./scripts/dev.sh             # Start all services in dev mode (excluding web)
./scripts/openapi.sh         # Regenerate OpenAPI spec + frontend types
```

---

### API Gateway (`apps/api`)

Main backend entrypoint.
Works as REST gateway + WebSocket server.
Communicates with microservices via gRPC.

```bash
pnpm run start:dev
pnpm run start:prod
pnpm run build
pnpm run test
pnpm run lint
pnpm run openapi:generate   # Generate openapi.json from controllers
```

---

### User Service (`apps/user-service`)

Microservice responsible for:

* authentication
* user management
* invitations
* JWT issuing
* refresh tokens
* password hashing
* email verification

Runs as NestJS microservice with gRPC transport.

```bash
pnpm run start:dev
pnpm run start:prod
pnpm run build
pnpm run lint
```

---

### Payment Service (`apps/payment-service`)

Microservice responsible for:

* payment processing
* payment provider management (dummy, yookassa, tbank)
* webhook handling from external providers
* payment status management
* payment lifecycle events

Runs as NestJS microservice with gRPC transport.

```bash
pnpm run start:dev
pnpm run start:prod
pnpm run build
pnpm run lint
```

---

### File Service (`apps/file-service`)

Microservice responsible for:

* file uploads (cloudinary / local storage)
* image processing (thumbnails, multiple sizes)
* image entity management (CRUD, attach/unattach, reorder)

Runs as NestJS microservice with gRPC transport.

```bash
pnpm run start:dev
pnpm run start:prod
pnpm run build
pnpm run lint
```

---

### Notification Service (`apps/notification-service`)

Microservice responsible for:

* notification persistence and CRUD
* RabbitMQ event consumption (payment, repair events)
* notification lifecycle (create, list, mark read, delete)

Runs as NestJS hybrid microservice with gRPC + RabbitMQ transport.

```bash
pnpm run start:dev
pnpm run start:prod
pnpm run build
pnpm run lint
```

---

### Repair Service (`apps/repair-service`)

Microservice responsible for:

* repairs and repair requests
* dealers and dealer profiles
* devices and user devices
* certificates
* repairers
* reviews
* points transactions and withdrawals
* work steps

Runs as NestJS microservice with gRPC transport.

```bash
pnpm run start:dev
pnpm run start:prod
pnpm run build
pnpm run lint
```

---

### Web (`apps/web`)

```bash
pnpm run dev
pnpm run build
pnpm run typecheck
pnpm run api:generate        # Generate TS types from openapi.json
```

---

### UI Package (`packages/ui`)

```bash
pnpm run build
```

---

### Shared Package (`packages/shared`)

```bash
pnpm run build
```

---

### Proto Package (`packages/proto`)

gRPC contracts shared between services.

Package name: `@asko/proto`

Contains:

* .proto files (user, payment, file, repair, dealer, device, certificate, repairer)
* generated TS interfaces
* grpc constants (proto paths, package names, service names)

```bash
pnpm run build
```

---

### Database migrations

Only services that own DB use migrations.

```
apps/api → own DB tables (article, cursor, wschedule)
apps/user-service → own DB tables
apps/payment-service → own DB tables
apps/file-service → own DB tables
apps/repair-service → own DB tables
apps/notification-service → own DB tables
```

```bash
npx mikro-orm migration:create
npx mikro-orm migration:up
```

---

## Architecture

### Monorepo layout

```
apps/api
apps/user-service
apps/payment-service
apps/file-service
apps/repair-service
apps/notification-service
apps/web

packages/shared
packages/ui
packages/proto
```

---

### Microservice rules

* API must NOT access user tables directly
* API must call user-service via gRPC
* user-service owns User entity
* user-service owns auth logic
* user-service owns invitations
* user-service owns refresh tokens
* API must NOT access payment tables directly
* API must call payment-service via gRPC
* payment-service owns PaymentEntity
* payment-service owns payment provider logic
* payment-service owns webhook handling
* payment-service emits events for domain side effects
* API must NOT access image tables directly
* API must call file-service via gRPC
* file-service owns Image entity
* file-service owns storage provider logic
* file-service owns image processing
* API must NOT access repair/dealer/device/certificate/repairer/review tables directly
* API must call repair-service via gRPC
* repair-service owns Repair, Dealer, Device, Certificate, Repairer, Review entities
* repair-service owns repair workflow logic
* repair-service owns dealer profiles
* repair-service owns points transactions
* API must NOT access notification tables directly
* API must call notification-service via gRPC
* notification-service owns Notification entity
* notification-service consumes events from RabbitMQ
* payment-service publishes events to RabbitMQ

---

### Package dependencies

```
web → ui + shared/client
api → shared + proto
user-service → shared + proto
payment-service → shared + proto
file-service → shared + proto
repair-service → shared + proto
notification-service → shared + proto
proto → standalone
ui → standalone
shared → standalone
```

---

## gRPC rules

All gRPC definitions must be inside:

```
packages/proto/src/*.proto
```

Proto files: user, payment, file, repair, dealer, device, certificate, repairer.

Generated types must be exported from:

```
@asko/proto
```

Never duplicate DTOs between services.

Always use proto types for gRPC communication.

---

## API (`apps/api`)

Gateway service.

Responsibilities:

* REST API
* WebSocket
* Redis cache
* Notifications
* Task scheduling
* Articles
* Work schedules

Delegates to microservices via gRPC:

* auth / users / invitations → user-service (UserClientModule)
* payments → payment-service (PaymentClientModule)
* file uploads / images → file-service (FileClientModule)
* repairs → repair-service (RepairClientModule)
* dealers → repair-service (DealerClientModule)
* devices → repair-service (DeviceClientModule)
* certificates → repair-service (CertificateClientModule)
* repairers → repair-service (RepairerClientModule)
* notifications → notification-service (NotificationClientModule)

---

### API stack

* NestJS v11
* MikroORM v6
* PostgreSQL
* Redis
* Socket.io
* Nodemailer
* gRPC clients to all microservices
* @nestjs/swagger (OpenAPI documentation)

---

### OpenAPI / Swagger

The API gateway uses `@nestjs/swagger` with the CLI plugin for automatic OpenAPI spec generation.

Configuration:

* Swagger CLI plugin enabled in `apps/api/nest-cli.json` (`classValidatorShim`, `introspectComments`)
* Swagger UI available at `/doc` (all environments)
* OpenAPI JSON spec at `/doc/openapi.json`
* Standalone spec generator: `apps/api/src/generate-openapi.ts`

Response DTOs:

* Located in `apps/api/src/common/dto/responses/`
* Mirror proto `*Record` interfaces as classes for Swagger schema generation
* CLI plugin auto-adds `@ApiProperty()` to typed class properties in `*.dto.ts` files
* Manual `@ApiProperty({ type: [RecordDto] })` only needed on array properties in paginated responses

Rules for controllers:

* Every controller must have `@ApiTags('...')` for grouping
* Every endpoint must have a response decorator:
  * `@ApiOkResponse({ type: X })` for GET, PUT, PATCH, DELETE
  * `@ApiCreatedResponse({ type: X })` for POST
  * `@ApiResponse({ status: N, type: X })` for controllers using `@Res()`
* Response DTO must match what the controller actually returns (some unwrap gRPC wrappers)
* Avoid `@Res()` in controllers — it prevents Swagger auto-detection of return types

When adding a new endpoint:

1. Create or reuse a response DTO class in `apps/api/src/common/dto/responses/`
2. Add the appropriate `@ApiOkResponse`/`@ApiCreatedResponse` decorator
3. Run `./scripts/openapi.sh` to regenerate the spec and frontend types

---

### Env

.env.dev
.env.prod

Loaded using AppConfig.

---

### Pagination

All paginated gRPC responses may omit the `data` field when the array is empty (protobuf3 default behavior). Controllers must normalize:

```typescript
const result = await this.someClient.findAll(pagination);
return { ...result, data: result.data ?? [] };
```

Must use:

```
PaginationDto
PaginatedResponseDto
```

from `@asko/shared`

---

## User Service (`apps/user-service`)

Owns:

* User entity
* Auth
* JWT
* Refresh tokens
* Invitations
* Password hashing
* Email confirmation

Stack:

* NestJS
* MikroORM
* PostgreSQL
* gRPC transport
* argon2
* passport
* jwt

Service must expose gRPC endpoints.

---

## Payment Service (`apps/payment-service`)

Owns:

* PaymentEntity
* Payment providers (dummy, yookassa, tbank)
* Payment status state machine
* Webhook handling
* Payment event emission

Stack:

* NestJS
* MikroORM
* PostgreSQL
* gRPC transport

Service must expose gRPC endpoints.
API gateway calls payment-service via `PaymentClientModule`.

---

## File Service (`apps/file-service`)

Owns:

* Image entity
* Storage providers (cloudinary, local)
* Image processing (thumbnails, sizes)

Stack:

* NestJS
* MikroORM
* PostgreSQL
* gRPC transport
* cloudinary

Service must expose gRPC endpoints.
API gateway calls file-service via `FileClientModule`.

---

## Repair Service (`apps/repair-service`)

Owns:

* RepairRequest entity
* DealerProfile / DealerClient entities
* Device / UserDevice entities
* Certificate entity
* Repairer entity
* Review entity
* PointsTransaction / PointsWithdrawal entities
* WorkStep entity
* Address entity

Stack:

* NestJS
* MikroORM
* PostgreSQL
* gRPC transport

Service must expose gRPC endpoints.
API gateway calls repair-service via `RepairClientModule`, `DealerClientModule`, `DeviceClientModule`, `CertificateClientModule`, `RepairerClientModule`.

---

## Notification Service (`apps/notification-service`)

Owns:

* Notification entity

Hybrid transport:

* gRPC — CRUD (create, list, mark read, delete, unread count)
* RabbitMQ — event consumption (payment.paid, payment.failed, repair.status_changed, etc.)

Stack:

* NestJS
* MikroORM
* PostgreSQL
* gRPC transport
* RabbitMQ transport

Service must expose gRPC endpoints.
API gateway calls notification-service via `NotificationClientModule`.
Consumes events published by payment-service and repair-service via RabbitMQ.

---

## Web (`apps/web`)

Next.js App Router.

Uses API gateway only.

Never calls microservices directly.

Stack:

* Next.js v16
* React 19
* Redux Toolkit
* React Query v5
* Tailwind v4
* Axios (legacy client)
* openapi-fetch (typed client)

### API clients

Legacy axios client (used by existing code):

```
src/lib/api/client.ts
```

Typed openapi-fetch client (for new code):

```
src/lib/api/openapi-client.ts
```

Generated OpenAPI types:

```
src/lib/api/api.gen.d.ts     # auto-generated, do not edit
```

### Generating API types

After changing backend endpoints or response types:

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

## UI (`packages/ui`)

Component library.

Rules:

* Tailwind classes only
* no CSS files
* no styled-components
* must build after change

```bash
pnpm run build
```

---

## Shared (`packages/shared`)

Contains:

* DTOs (request validation)
* constants
* enums
* utils
* regex patterns
* type interfaces (API contract types)

Exports:

```
@asko/shared           # full export (backend services)
@asko/shared/client    # client-safe export (web app)
@asko/shared/server    # server-only export
```

---

## Proto (`packages/proto`)

Contains:

* proto files
* generated types
* grpc tokens
* service names

Used by:

* api
* user-service
* payment-service
* file-service
* repair-service
* notification-service

Never import entities through proto.

Only transport types.

---

## Conventions

* Language: Russian UI
* TypeScript strict
* ESM modules
* decorators enabled
* ES2022 target
* class-validator for DTO
* argon2 for passwords
* JWT RS256
* Redis optional
* env not committed
* docker uses turbo prune

---

## Docker

Dockerfiles at root:

```
Dockerfile.api
Dockerfile.web
Dockerfile.user-service
Dockerfile.payment-service
Dockerfile.file-service
Dockerfile.repair-service
Dockerfile.notification-service
```

docker-compose.yml also includes `rabbitmq` service (rabbitmq:3-management-alpine).

Use turborepo prune.
