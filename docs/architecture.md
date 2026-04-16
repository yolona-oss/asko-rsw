# Architecture Overview

High-level architecture of the ASKO repair management platform. For domain-specific details see the [docs index](./README.md).

## Topology

```mermaid
flowchart TB
    subgraph Client
        Web[Next.js web :3000]
        Mobile[Mobile clients]
    end

    subgraph Nginx [Host nginx SSL + routing]
        direction LR
        R1[/auth/*/]
        R2[/repair-requests/*, /schedule/*, /payment/*/]
        R3[/files/*, /file-upload/*/]
        R4[/chat/*, /notifications/*, /socket.io/*/]
        R5[/articles/*, /users/*/]
    end

    Web --> Nginx
    Mobile --> Nginx

    subgraph Gateways
        Auth[auth-gateway :4001]
        Repair[repair-gateway :4002]
        Media[media-gateway :4003]
        Realtime[realtime-gateway :4004]
        Content[content-gateway :4005]
    end

    R1 --> Auth
    R2 --> Repair
    R3 --> Media
    R4 --> Realtime
    R5 --> Content

    subgraph Services
        User[user-service :5000]
        Payment[payment-service :5001]
        File[file-service :5002]
        RepairSvc[repair-service :5003]
        Notif[notification-service :5004]
        Chat[chat-service :5005]
        ContentSvc[content-service :5010]
    end

    Auth -->|gRPC| User
    Repair -->|gRPC| RepairSvc
    Repair -->|gRPC| Payment
    Repair -->|gRPC| File
    Repair -->|gRPC| User
    Media -->|gRPC| File
    Realtime -->|gRPC| Chat
    Realtime -->|gRPC| Notif
    Realtime -->|gRPC| User
    Content -->|gRPC| ContentSvc
    Content -->|gRPC| File

    subgraph Infrastructure
        PG[(PostgreSQL per service)]
        RMQ[(RabbitMQ)]
        Redis[(Redis)]
    end

    Services --> PG
    Services <--> RMQ
    Realtime <--> Redis
```

## Communication Patterns

- **REST + WebSocket**: web/mobile ↔ gateways
- **gRPC**: gateways ↔ services (synchronous)
- **RabbitMQ**: cross-service events (asynchronous — payments, notifications, file uploads, schedule events)

## Service Ownership

Each microservice owns its own PostgreSQL database. No cross-service table access. Cross-domain data flows through gRPC or RabbitMQ only.

| Service | Owns |
|---|---|
| user-service | Users, auth, invitations, sessions, OAuth, MFA |
| payment-service | Payments, providers, refunds |
| file-service | File uploads, images, video processing, access control |
| **repair-service** | **Repair requests, devices, certificates, repairers, schedules, AVR** ([docs](../apps/repair-service/README.md)) |
| notification-service | Notifications, email (BullMQ) |
| chat-service | Conversations, messages, presence |
| content-service | Articles (Lexical JSON), view analytics |

## Frontend

Single Next.js app (`apps/web`). One domain — nginx routes different URL prefixes to different gateways, so the frontend sees one origin.

## Shared Packages

- `@asko/proto` — .proto files + TS interfaces (no build step)
- `@asko/shared` — DTOs, enums, AppError system, shared utilities
- `@asko/ui` — React components
- `@asko/observability` — Prometheus metrics + Pino logger
- `@asko/gateway-common` — shared gateway infra (guards, decorators, filters, gRPC utils)

See [CLAUDE.md](../CLAUDE.md) for detailed conventions.
