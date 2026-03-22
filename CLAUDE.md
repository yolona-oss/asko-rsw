# CLOUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASKO repair management platform — a pnpm + Turborepo monorepo with microservice architecture using NestJS, Next.js, gRPC, and shared packages.

Main change:
Auth, user management, and invitations are handled by a dedicated microservice (`apps/user-service`).
Payment processing is handled by a dedicated microservice (`apps/payment-service`).
gRPC contracts are stored in `packages/proto`.

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
pnpm run test
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

### Web (`apps/web`)

```bash
pnpm run dev
pnpm run build
pnpm run typecheck
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

* .proto files
* generated TS types
* grpc constants
* service names
* message types

```bash
pnpm run build
```

---

### Database migrations

Only services that own DB use migrations.

Example:

apps/api → own DB tables
apps/user-service → own DB tables
apps/payment-service → own DB tables

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

---

### Package dependencies

```
web → ui + shared/client
api → shared + proto
user-service → shared + proto
payment-service → shared + proto
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
* Repairs
* Certificates
* Devices
* Media
* Reviews
* Dealer profiles
* Redis cache
* File uploads

Does NOT handle:

* auth
* users
* invitations
* payment processing (delegated to payment-service)

Auth must be requested via gRPC from user-service.
Payment operations must be requested via gRPC from payment-service (PaymentClientModule/PaymentClientService).

---

### API stack

* NestJS v11
* MikroORM v6
* PostgreSQL
* Redis
* Socket.io
* Nodemailer
* PaymentClientModule (gRPC client to payment-service)
* FileModule

---

### Env

.env.dev
.env.prod

Loaded using AppConfig.

---

### Pagination

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
* Axios

API client located in:

```
src/lib/api/client.ts
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

* DTOs
* constants
* enums
* utils
* regex patterns

Exports:

```
@asko/shared
@asko/shared/client
@asko/shared/server
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
```

Use turborepo prune.
