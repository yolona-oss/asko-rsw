# Notification Service

> Event-driven notification & transactional email microservice for the ASKO repair-management platform.

`notification-service` is the single source of truth for user-facing notifications. It consumes domain events from every other service over RabbitMQ, persists notifications to its own PostgreSQL database, pushes real-time deliveries through a Redis pub/sub channel, and dispatches transactional emails through a BullMQ-backed SMTP worker.

---

## Table of Contents

1. [At a Glance](#1-at-a-glance)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Component Model](#3-component-model)
4. [Data Model](#4-data-model)
5. [Public API (gRPC)](#5-public-api-grpc)
6. [Event Consumers](#6-event-consumers)
7. [Notification Lifecycle](#7-notification-lifecycle)
8. [Real-Time Push Pipeline](#8-real-time-push-pipeline)
9. [Email Pipeline (BullMQ)](#9-email-pipeline-bullmq)
10. [Reminder Watchdog](#10-reminder-watchdog)
11. [Deployment Topology](#11-deployment-topology)
12. [Configuration](#12-configuration)
13. [Error Model](#13-error-model)
14. [Observability](#14-observability)
15. [Notification & Target Type Catalog](#15-notification--target-type-catalog)
16. [Releases](#16-releases)

---

## 1. At a Glance

| Attribute        | Value                                                    |
|------------------|----------------------------------------------------------|
| Package          | `@asko/notification-service`                             |
| gRPC port        | `GRPC_PORT` (default **5004**)                           |
| Metrics port     | `METRICS_PORT` (default **9104**)                        |
| Database         | PostgreSQL — `asko_rws_notify_db`                        |
| Transports in    | gRPC (NestJS microservice) + RabbitMQ (`notification_queue`) |
| Transports out   | RabbitMQ (`chat_queue`), Redis Pub/Sub, SMTP (nodemailer), gRPC → user-service |
| Job queue        | BullMQ over Redis — queue name `email`                   |
| ORM              | MikroORM v6 (PostgreSQL driver)                          |
| Framework        | NestJS 11 (ESM, ES2022, TypeScript strict)               |

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'primaryColor':'#fde68a','primaryTextColor':'#1f2937','primaryBorderColor':'#b45309','lineColor':'#b45309'}}}%%
mindmap
  root((notification-service))
    Inbound
      gRPC RPCs
        CreateNotification
        ListUserNotifications
        MarkAsRead
        MarkAllAsRead
        GetUnreadCount
        DeleteNotification
      RabbitMQ events
        repair.*
        payment.*
        certificate.*
        chat.*
        schedule.*
        email.send
    Outbound
      Redis Pub/Sub
        notifications:push
      RabbitMQ
        notification.created → chat_queue
      SMTP
        nodemailer transport
      gRPC
        user-service.FindAllUsers
    Scheduling
      Reminder Watchdog
        @Cron sweep
        pg_try_advisory_lock
        skip-if-unread rule
      Reminder kinds
        payment_unpaid
        repair_assignment_pending
        repair_in_progress_stuck
    Storage
      PostgreSQL
        notification table
        reminder_job table
      Redis
        BullMQ email queue
        Pub/Sub channel
```

---

## 2. High-Level Architecture

The service sits behind the realtime-gateway for read/write RPCs and consumes events from every other domain service. Nothing calls its database directly — all interactions go through gRPC or RMQ.

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#dbeafe','primaryTextColor':'#0f172a','primaryBorderColor':'#1d4ed8','lineColor':'#1d4ed8','fontFamily':'Inter,ui-sans-serif'}}}%%
flowchart LR
    subgraph Clients["Clients & Gateways"]
        WEB["🌐 Next.js Web<br/>(apps/web)"]
        RG["🛰 Realtime Gateway<br/>:4004"]
    end

    subgraph Producers["Event Producers"]
        RS["🔧 repair-service"]
        PS["💳 payment-service"]
        CS["💬 chat-service"]
        US["👥 user-service"]
    end

    subgraph NS["🛎 notification-service"]
        direction TB
        GRPC["gRPC Controller"]
        CONS["RMQ Consumers"]
        SVC["NotificationService"]
        PUB["Event Publisher"]
        PUSH["Push Service"]
        EMAIL["Email Processor<br/>(BullMQ worker)"]
    end

    subgraph Infra["Infrastructure"]
        PG[("🐘 PostgreSQL<br/>asko_rws_notify_db")]
        REDIS[("🟥 Redis<br/>Pub/Sub + BullMQ")]
        RMQ[("🐇 RabbitMQ")]
        SMTP["📮 SMTP<br/>(smtp.gmail.com)"]
    end

    WEB -- WebSocket --> RG
    RG -- gRPC --> GRPC
    GRPC --> SVC

    RS -- repair.* --> RMQ
    PS -- payment.* --> RMQ
    CS -- chat.* --> RMQ
    RS -- schedule.* --> RMQ
    RS -- certificate.* --> RMQ
    PS -- email.send --> RMQ

    RMQ -- notification_queue --> CONS
    CONS --> SVC
    CONS -- email.send --> EMAIL

    SVC --> PG
    SVC --> PUSH
    SVC --> PUB

    PUSH -- publish --> REDIS
    REDIS -- notifications:push --> RG
    RG -- WebSocket --> WEB

    PUB -- notification.created --> RMQ
    RMQ -- chat_queue --> CS

    EMAIL --> SMTP
    EMAIL <--> REDIS

    CONS -- FindAllUsers --> US

    classDef svc fill:#fef3c7,stroke:#b45309,stroke-width:2px,color:#78350f;
    classDef infra fill:#e0e7ff,stroke:#4338ca,stroke-width:1.5px,color:#312e81;
    classDef ext fill:#dcfce7,stroke:#15803d,stroke-width:1.5px,color:#14532d;
    class NS,GRPC,CONS,SVC,PUB,PUSH,EMAIL svc;
    class PG,REDIS,RMQ,SMTP infra;
    class WEB,RG,RS,PS,CS,US ext;
```

---

## 3. Component Model

Internal NestJS modules and their dependencies.

```mermaid
%%{init: {'theme':'neutral','themeVariables':{'fontFamily':'JetBrains Mono,monospace'}}}%%
flowchart TB
    subgraph AppModule["AppModule"]
        direction TB

        subgraph Controllers
            GC["NotificationGrpcController"]
        end

        subgraph Consumers
            RC["RepairEventConsumer"]
            PC["PaymentEventConsumer"]
            CC["ChatEventConsumer"]
            SC["ScheduleEventConsumer"]
            EC["EmailEventConsumer"]
        end

        subgraph Services
            NSV["NotificationService"]
            NPS["NotificationPushService"]
            NEP["NotificationEventPublisher"]
            ETS["EmailTransportService"]
            EP["EmailProcessor<br/>@Processor('email')"]
        end

        subgraph SubModules["Sub-Modules"]
            DB["DatabaseModule<br/>MikroORM → Postgres"]
            EQ["EmailQueueModule<br/>BullMQ ← Redis"]
            UCM["UserClientModule<br/>gRPC → user-service"]
        end
    end

    GC --> NSV
    RC --> NSV
    PC --> NSV
    CC --> NSV
    SC --> NSV
    SC -. staff lookup .-> UCM
    EC --> EQ

    NSV --> DB
    NSV --> NPS
    NSV --> NEP

    EP --> ETS
    EP --> EQ

    classDef ctrl fill:#fee2e2,stroke:#b91c1c;
    classDef cons fill:#ede9fe,stroke:#6d28d9;
    classDef svc  fill:#fef3c7,stroke:#b45309;
    classDef mod  fill:#dcfce7,stroke:#15803d;
    class GC ctrl;
    class RC,PC,CC,SC,EC cons;
    class NSV,NPS,NEP,ETS,EP svc;
    class DB,EQ,UCM mod;
```

### Class Diagram — Service Layer

```mermaid
classDiagram
    direction LR

    class NotificationService {
        -em: EntityManager
        -pushService: NotificationPushService
        -eventPublisher: NotificationEventPublisher
        +createNotification(userId, type, title, body, targetType?, targetId?, metadata?) NotificationEntity
        +listUserNotifications(userId, page, limit, unreadOnly, sortBy?, sortOrder?) PaginatedResult
        +markAsRead(notificationId, userId) void
        +markAllAsRead(userId) void
        +getUnreadCount(userId) number
        +deleteNotification(notificationId, userId) void
    }

    class NotificationPushService {
        -redis: Redis
        -config: AppConfig
        +pushToUser(userId, notification) void
        +onModuleDestroy() void
    }

    class NotificationEventPublisher {
        -client: ClientProxy
        +onModuleInit() void
        +publishCreated(notification) void
    }

    class EmailTransportService {
        -transporter: nodemailer.Transporter
        +sendMail(opts: MailOptions) void
    }

    class EmailProcessor {
        <<WorkerHost>>
        -transport: EmailTransportService
        +process(job: Job~EmailJobData~) void
    }

    class UserClientService {
        <<gRPC client>>
        -client: UserServiceClient
        +onModuleInit() void
        +findAllUsers(opts) PaginatedUsersResponse
    }

    NotificationService --> NotificationPushService
    NotificationService --> NotificationEventPublisher
    EmailProcessor --> EmailTransportService
    NotificationService ..> NotificationEntity : manages
    NotificationPushService ..> Redis : publishes
    NotificationEventPublisher ..> RabbitMQ : emits
```

---

## 4. Data Model

### ER Diagram

```mermaid
erDiagram
    NOTIFICATION {
        varchar(255) id PK "uuid()"
        varchar(255) user_id "indexed"
        varchar(100) type
        varchar(500) title
        text body
        varchar(50) target_type "nullable"
        varchar(255) target_id "nullable"
        jsonb metadata "nullable"
        boolean is_read "default false, indexed"
        timestamptz read_at "nullable"
        datetime created_at "default now()"
    }

    REMINDER_JOB {
        varchar(255) id PK "uuid()"
        varchar(50) kind "payment_unpaid|repair_assignment_pending|repair_in_progress_stuck"
        varchar(50) target_type "indexed"
        varchar(255) target_id "indexed"
        jsonb recipient_user_ids
        varchar(100) notification_type
        varchar(500) title
        text body
        jsonb metadata "nullable"
        int interval_ms
        timestamptz next_fire_at "indexed"
        int max_fires
        int fire_count "default 0"
        varchar(20) status "active|cancelled|exhausted"
        varchar(255) cancel_reason "nullable"
        timestamptz created_at
        timestamptz updated_at
    }

    NOTIFICATION ||..o{ REMINDER_JOB : "skip-if-unread lookup by (user_id, target_type, target_id, is_read)"
```

- No foreign keys — `user_id`, `target_id`, `recipient_user_ids[]` are soft references owned by other services.
- `notification` indexes: `id`, `user_id`, `is_read`, and a composite `(target_type, target_id, is_read)` index (`idx_notification_target_unread`) that backs `ReminderService.hasUnreadForTarget()`.
- `reminder_job` indexes:
  - `idx_reminder_job_sweep` on `(status, next_fire_at)` — the hot path for the sweep query.
  - `idx_reminder_job_target` on `(target_type, target_id, status)` — supports `cancelReminder()`.
  - `idx_reminder_job_kind_target` on `(kind, target_type, target_id, status)` — supports dedupe in `scheduleReminder()`.
- `metadata` is free-form JSONB — consumers shape it per notification type (e.g. `{ messageId, senderId, conversationId, messageType }` for chat, `{ paymentId, amount, currency }` for reminders).
- The `NOTIFICATION ||..o{ REMINDER_JOB` line is *not* a DB relation — it's the logical join the sweep performs at fire time to implement the skip-if-unread rule.

### State Machine — Single Notification

```mermaid
stateDiagram-v2
    [*] --> Created: createNotification()
    Created --> Pushed: pushService.pushToUser()
    Pushed --> Persisted: em.persistAndFlush()
    Persisted --> Unread: initial state\n(isRead=false)
    Unread --> Read: markAsRead() / markAllAsRead()
    Read --> Deleted: deleteNotification()
    Unread --> Deleted: deleteNotification()
    Deleted --> [*]

    note right of Pushed
        Fire-and-forget:
        errors logged, never rethrown
    end note

    note right of Read
        Sets isRead=true, readAt=now()
    end note
```

---

## 5. Public API (gRPC)

Proto package: `notification` (source: `packages/proto/notification.proto`).
Controller: `src/controllers/notification.grpc.controller.ts`.

| RPC                     | Request                        | Response                        | Purpose                                  |
|-------------------------|--------------------------------|---------------------------------|------------------------------------------|
| `CreateNotification`    | `CreateNotificationRequest`    | `NotificationResponse`          | Create a notification for a user         |
| `ListUserNotifications` | `ListUserNotificationsRequest` | `PaginatedNotificationsResponse`| Paginated list, optional `unreadOnly`    |
| `MarkAsRead`            | `MarkAsReadRequest`            | `EmptyNotificationResponse`     | Flip a single notification to read       |
| `MarkAllAsRead`         | `MarkAllAsReadRequest`         | `EmptyNotificationResponse`     | Bulk mark all unread → read              |
| `GetUnreadCount`        | `GetUnreadCountRequest`        | `UnreadCountResponse`           | Count `isRead=false` for a user          |
| `DeleteNotification`    | `DeleteNotificationRequest`    | `EmptyNotificationResponse`     | Remove a single notification             |

### Error Mapping

`AppError.httpStatus` is mapped to gRPC status codes via `toGrpcError()`:

| HTTP | gRPC                    |
|------|-------------------------|
| 400  | `INVALID_ARGUMENT`      |
| 401  | `UNAUTHENTICATED`       |
| 403  | `PERMISSION_DENIED`     |
| 404  | `NOT_FOUND`             |
| 409  | `ALREADY_EXISTS`        |
| *    | `INTERNAL`              |

---

## 6. Event Consumers

Every consumer listens on the durable `notification_queue`, uses `@EventPattern()` to match a routing key, and **always ACKs** after handling (no DLQ). Payment and repair consumers additionally **schedule or cancel `ReminderJob` rows** on state transitions — see §10 for the full watchdog model.

```mermaid
flowchart TB
    RMQ[("🐇 RabbitMQ<br/>notification_queue")]

    subgraph Handlers
        direction LR
        R["repair-event.consumer.ts"]
        P["payment-event.consumer.ts"]
        C["chat-event.consumer.ts"]
        S["schedule-event.consumer.ts"]
        E["email-event.consumer.ts"]
    end

    RMQ -- "repair.*<br/>certificate.*" --> R
    RMQ -- "payment.*" --> P
    RMQ -- "chat.*" --> C
    RMQ -- "schedule.*" --> S
    RMQ -- "email.send" --> E

    R --> NS["NotificationService.createNotification()"]
    P --> NS
    C --> NS
    S --> NS
    S -. role=ADMIN/MANAGER .-> UC["UserClientService.findAllUsers()"]
    E --> BQ["BullMQ 'email' queue"]

    style RMQ fill:#fb923c,color:#fff,stroke:#9a3412
    style NS fill:#fde68a,stroke:#b45309
    style BQ fill:#fecaca,stroke:#b91c1c
```

### Routing Key → Notification Type

| Source           | Routing key                    | Notification `type`                           | Target             |
|------------------|--------------------------------|-----------------------------------------------|--------------------|
| repair-service   | `repair.status_changed`        | `REPAIR_STATUS_CHANGED`                       | `REPAIR_REQUEST`   |
| repair-service   | `repair.assigned`              | `REPAIR_ASSIGNED`                             | `REPAIR_REQUEST`   |
| repair-service   | `repair.completed`             | `REPAIR_COMPLETED`                            | `REPAIR_REQUEST`   |
| repair-service   | `repair.transferred`           | `REPAIR_TRANSFERRED_*` (up to 3)              | `REPAIR_REQUEST`   |
| repair-service   | `repair.diagnostics_declined`  | `REPAIR_DIAGNOSTICS_DECLINED`                 | `REPAIR_REQUEST`   |
| repair-service   | `certificate.expiring_soon`    | `CERTIFICATE_EXPIRING_SOON`                   | `CERTIFICATE`      |
| repair-service   | `certificate.expired`          | `CERTIFICATE_EXPIRED`                         | `CERTIFICATE`      |
| payment-service  | `payment.created`              | `INVOICE_CREATED`                             | `PAYMENT`          |
| payment-service  | `payment.paid`                 | `PAYMENT_PAID`                                | `PAYMENT`          |
| payment-service  | `payment.failed`               | `PAYMENT_FAILED`                              | `PAYMENT`          |
| payment-service  | `payment.refunded`             | `PAYMENT_REFUNDED`                            | `PAYMENT`          |
| chat-service     | `chat.message`                 | `CHAT_MESSAGE` (fan-out to `recipientIds[]`)  | `CONVERSATION`     |
| chat-service     | `chat.conversation_created`    | `CHAT_CONVERSATION_CREATED`                   | `CONVERSATION`     |
| chat-service     | `chat.participant_added`       | `CHAT_PARTICIPANT_ADDED`                      | `CONVERSATION`     |
| chat-service     | `chat.participant_removed`     | `CHAT_PARTICIPANT_REMOVED`                    | `CONVERSATION`     |
| repair-service   | `schedule.created`             | `SCHEDULE_CREATED` / `SCHEDULE_EXTRA_DAY_REQUESTED` | `SCHEDULE`   |
| repair-service   | `schedule.approved`            | `SCHEDULE_APPROVED` / `*_EXTRA_DAY_ACCEPTED`  | `SCHEDULE`         |
| repair-service   | `schedule.rejected`            | `SCHEDULE_REJECTED` / `*_EXTRA_DAY_REJECTED`  | `SCHEDULE`         |
| repair-service   | `schedule.updated`             | `SCHEDULE_UPDATED`                            | `SCHEDULE`         |
| repair-service   | `schedule.deleted`             | `SCHEDULE_DELETED`                            | `SCHEDULE`         |
| repair-service   | `schedule.pattern_*`           | `SCHEDULE_PATTERN_*`                          | `SCHEDULE`         |
| any              | `email.send`                   | *(enqueued as BullMQ job, not a notification)*| —                  |

### Reminder hooks inside consumers

| Routing key                    | Reminder action                                                                                                       |
|--------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `payment.created`              | **Schedule** `payment_unpaid` reminder (interval+max from config)                                                     |
| `payment.paid` / `.failed` / `.refunded` | **Cancel** `payment_unpaid` reminder with reason `payment.<event>`                                         |
| `repair.assigned`              | **Schedule** `repair_assignment_pending` reminder for `repairerUserId`                                                |
| `repair.status_changed`        | `oldStatus=assigned` → cancel `repair_assignment_pending`; `newStatus=in_progress` → schedule `repair_in_progress_stuck` (repairer + staff fan-out); `oldStatus=in_progress` → cancel `repair_in_progress_stuck` |
| `repair.transferred`           | **Cancel** existing `repair_assignment_pending` and **schedule** a fresh one for `newRepairerUserId`                  |
| `repair.completed`             | **Cancel** both `repair_assignment_pending` and `repair_in_progress_stuck`                                            |

### Schedule actor logic (simplified)

Schedule events have the richest branching because a single routing key can target either the repairer or the office staff depending on who acted.

```mermaid
flowchart TD
    Start(["schedule.* event"])
    Actor{actorId === userId ?}
    Type{scheduleType?}
    Extra{extra_day?}
    StaffNotif["Fan-out to<br/>ADMIN / MANAGER / SUPER_ADMIN<br/>via UserClientService"]
    UserNotif["Single notification<br/>to userId (repairer)"]

    Start --> Actor
    Actor -- yes (repairer acted) --> Type
    Actor -- no (staff acted) --> UserNotif

    Type --> Extra
    Extra -- yes --> StaffNotif
    Extra -- no --> UserNotif

    style StaffNotif fill:#e0f2fe,stroke:#0369a1
    style UserNotif fill:#fef3c7,stroke:#b45309
```

---

## 7. Notification Lifecycle

### Sequence — domain event → persisted & delivered notification

```mermaid
sequenceDiagram
    autonumber
    participant Prod as Producer<br/>(e.g. repair-service)
    participant RMQ as 🐇 RabbitMQ<br/>notification_queue
    participant Cons as RepairEventConsumer
    participant Svc as NotificationService
    participant DB as 🐘 Postgres
    participant Push as NotificationPushService
    participant Redis as 🟥 Redis<br/>notifications:push
    participant Pub as NotificationEventPublisher
    participant RG as 🛰 Realtime Gateway
    participant Web as 🌐 Web UI

    Prod->>RMQ: publish("repair.status_changed", payload)
    RMQ-->>Cons: deliver
    activate Cons
    Cons->>Svc: createNotification(userId, type, title, body, ...)
    activate Svc
    Svc->>DB: INSERT INTO notification
    DB-->>Svc: row
    Svc->>Push: pushToUser(userId, entity)
    Push->>Redis: PUBLISH notifications:push {userId, notification}
    Svc->>Pub: publishCreated(entity)
    Pub->>RMQ: emit notification.created → chat_queue
    Svc-->>Cons: void
    deactivate Svc
    Cons->>RMQ: channel.ack(msg)
    deactivate Cons

    Redis-->>RG: SUBSCRIBE payload
    RG-->>Web: WebSocket "notification" event
```

### Sequence — client marks as read

```mermaid
sequenceDiagram
    autonumber
    participant Web as 🌐 Web UI
    participant RG as 🛰 Realtime Gateway
    participant Ctl as NotificationGrpcController
    participant Svc as NotificationService
    participant DB as 🐘 Postgres

    Web->>RG: POST /notifications/:id/read
    RG->>Ctl: MarkAsRead { id, userId }
    Ctl->>Svc: markAsRead(id, userId)
    Svc->>DB: SELECT WHERE id=? AND userId=?
    alt not found
        DB-->>Svc: null
        Svc-->>Ctl: throw AppErrors.notificationNotFound()
        Ctl-->>RG: RpcException NOT_FOUND
        RG-->>Web: 404
    else found
        DB-->>Svc: entity
        Svc->>DB: UPDATE SET isRead=true, readAt=now
        DB-->>Svc: ok
        Svc-->>Ctl: void
        Ctl-->>RG: Empty
        RG-->>Web: 200
    end
```

---

## 8. Real-Time Push Pipeline

The service never talks to WebSocket clients directly. It drops a JSON payload on a Redis pub/sub channel and the realtime-gateway (which owns socket state) fans it out to the right sockets.

```mermaid
flowchart LR
    NSV["NotificationService"] --> Push["NotificationPushService"]
    Push -- "PUBLISH notifications:push" --> R[("🟥 Redis Pub/Sub")]
    R -- "SUBSCRIBE" --> RG["🛰 realtime-gateway"]
    RG -- "emit('notification', payload)" --> WS{{"🔌 WebSocket<br/>sticky per user"}}
    WS --> C1["Client A"]
    WS --> C2["Client B"]

    style R fill:#fecaca,stroke:#b91c1c,color:#7f1d1d
    style Push fill:#fde68a,stroke:#b45309
    style RG fill:#dbeafe,stroke:#1d4ed8
```

Payload shape:

```json
{
  "userId": "uuid",
  "notification": { "id": "...", "type": "...", "title": "...", "body": "...", "..." : "..." }
}
```

Errors are caught and logged — a Redis outage will not break notification creation.

---

## 9. Email Pipeline (BullMQ)

A dedicated RMQ → BullMQ bridge decouples the transactional email fan-in from the SMTP dispatch, giving us retries, priority, and backpressure.

### Activity flow

```mermaid
flowchart LR
    A[["Service emits<br/>email.send"]] --> B[("🐇 RabbitMQ")]
    B --> C["EmailEventConsumer"]
    C -->|add job 'send'| D[("🟥 Redis<br/>BullMQ 'email'")]
    D --> E["EmailProcessor<br/>@Processor('email')"]
    E --> F["EmailTransportService<br/>(nodemailer)"]
    F --> G["📮 SMTP server"]
    F -- "success" --> H[["✅ keep last 1000"]]
    F -- "failure" --> I{attempts<br/>&lt; 5 ?}
    I -- yes --> J["exponential backoff<br/>3s, 6s, 12s, ..."]
    J --> E
    I -- no --> K[["💀 keep last 5000<br/>(no DLQ)"]]

    style B fill:#fb923c,color:#fff,stroke:#9a3412
    style D fill:#fecaca,stroke:#b91c1c
    style G fill:#dcfce7,stroke:#15803d
```

### Job shape — `EmailJobData`

```ts
interface EmailJobData {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;        // pre-rendered — no server-side templating
  metadata?: {
    type?: string;     // e.g. "invoice", "reset_password"
    userId?: string;
    priority?: number; // BullMQ priority, default 5
  };
}
```

Queue options (set by `email-event.consumer.ts` when calling `queue.add('send', ...)`):

| Option                      | Value                   |
|----------------------------|-------------------------|
| `attempts`                  | `5`                     |
| `backoff`                   | `{ type: 'exponential', delay: 3000 }` |
| `removeOnComplete`          | `1000`                  |
| `removeOnFail`              | `5000`                  |
| `priority`                  | `data.metadata?.priority ?? 5` |

> HTML is expected to be pre-rendered upstream. `notification-service` is a transport, not a template engine.

---

## 10. Reminder Watchdog

A persistent, cron-swept scheduler that **re-fires a notification after a delay when the target action is still pending** — and stops as soon as the action transitions to a terminal state. Lives entirely inside `notification-service`; no new RPC surface, no callbacks from other services.

### Why it exists

| Case                            | What should happen                                                                                                    |
|---------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Invoice never paid              | Re-notify the customer every 30 min, up to 3 times, until `payment.paid/failed/refunded` arrives.                     |
| Repairer ignores an assignment  | Re-notify the repairer every 15 min, up to 3 times, until they leave `ASSIGNED`.                                      |
| Repair stuck in `IN_PROGRESS`   | 8 h after entering `IN_PROGRESS`, fire **once** to the repairer **and** all `ADMIN` / `MANAGER` / `SUPER_ADMIN` staff. |

**Hard rule:** before firing a scheduled reminder, skip this round for any recipient that already has an **unread** prior notification for the same `(userId, targetType, targetId)`. We only nag once the user has actually *seen* and ignored the previous reminder — no unread stacking.

### Component Model

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#ede9fe','primaryTextColor':'#3730a3','primaryBorderColor':'#6d28d9','lineColor':'#6d28d9'}}}%%
flowchart LR
    subgraph Producers["Consumers (§6)"]
        PC["PaymentEventConsumer"]
        RC["RepairEventConsumer"]
    end

    subgraph RSV["Reminder Subsystem"]
        direction TB
        RS["ReminderService<br/>schedule / cancel / fire"]
        SW["ReminderSweepService<br/>@Cron"]
    end

    subgraph Storage["Postgres"]
        RJ[("reminder_job")]
        NT[("notification")]
    end

    PC -- scheduleReminder / cancelReminder --> RS
    RC -- scheduleReminder / cancelReminder --> RS

    SW -- "@Cron tick" --> SW
    SW -- pg_try_advisory_lock(94117) --> PG[("🐘 PG advisory lock")]
    SW -- fireDueReminders() --> RS

    RS -- persist --> RJ
    RS -- hasUnreadForTarget() --> NT
    RS -- createNotification() --> NT

    classDef svc fill:#fef3c7,stroke:#b45309;
    classDef cons fill:#ede9fe,stroke:#6d28d9;
    classDef store fill:#dbeafe,stroke:#1d4ed8;
    class RS,SW svc;
    class PC,RC cons;
    class RJ,NT,PG store;
```

### ReminderJob state machine

```mermaid
stateDiagram-v2
    [*] --> active: scheduleReminder()<br/>dedupe on (kind, target, active)
    active --> active: sweep fires<br/>fireCount++<br/>nextFireAt += interval
    active --> active: sweep skipped<br/>(all recipients had unread prior)<br/>fireCount unchanged
    active --> exhausted: fireCount == maxFires
    active --> cancelled: cancelReminder()<br/>from consumer state transition
    exhausted --> [*]
    cancelled --> [*]

    note right of active
        nextFireAt always advances
        by intervalMs even on all-skip
        rounds to space out retries.
    end note

    note left of exhausted
        Terminal success — reminder
        has nagged maxFires times.
    end note
```

### Sweep algorithm

```mermaid
sequenceDiagram
    autonumber
    participant Cron as @Cron<br/>(every minute)
    participant Sweep as ReminderSweepService
    participant PG as 🐘 Postgres<br/>(advisory lock)
    participant RS as ReminderService
    participant RJ as reminder_job
    participant NT as notification
    participant Push as NotificationPushService

    Cron->>Sweep: sweep()
    Sweep->>PG: SELECT pg_try_advisory_lock(94117)
    alt lock not acquired (other replica holds it)
        PG-->>Sweep: false
        Sweep-->>Cron: return (silent skip)
    else lock acquired
        PG-->>Sweep: true
        Sweep->>RS: fireDueReminders()
        RS->>RJ: SELECT WHERE status='active' AND next_fire_at <= now()<br/>ORDER BY next_fire_at ASC LIMIT batchSize
        RJ-->>RS: [jobs]
        loop for each job
            Note over RS: anyFired = false
            loop for each recipient
                RS->>NT: hasUnreadForTarget(userId, targetType, targetId)
                NT-->>RS: true | false
                alt unread prior exists
                    Note over RS: skip recipient this round
                else no prior unread
                    RS->>NT: INSERT notification
                    NT->>Push: pushToUser()
                    Note over RS: anyFired = true
                end
            end
            alt anyFired
                Note over RS: job.fireCount += 1
            end
            Note over RS: job.nextFireAt = now() + intervalMs
            alt fireCount >= maxFires
                Note over RS: job.status = 'exhausted'
            end
        end
        RS->>RJ: em.flush() (batch update)
        Sweep->>PG: SELECT pg_advisory_unlock(94117)
    end
```

### Skip-if-unread decision

```mermaid
flowchart TD
    Start(["fire job for recipient"])
    Check{Unread prior<br/>for (userId,<br/>targetType,<br/>targetId) ?}
    Skip["Skip this recipient<br/>(log: unread prior exists)"]
    Fire["createNotification()<br/>metadata.reminderAttempt = fireCount + 1"]
    Mark{"anyFired<br/>across recipients ?"}
    Bump["fireCount += 1"]
    Keep["fireCount unchanged"]
    Advance["nextFireAt = now() + intervalMs"]
    Exhaust{"fireCount &gt;= maxFires ?"}
    Done["status = exhausted"]
    Loop["status stays active"]

    Start --> Check
    Check -- yes --> Skip --> Mark
    Check -- no --> Fire --> Mark
    Mark -- yes --> Bump --> Advance
    Mark -- no --> Keep --> Advance
    Advance --> Exhaust
    Exhaust -- yes --> Done
    Exhaust -- no --> Loop

    style Skip fill:#fef3c7,stroke:#b45309
    style Fire fill:#dcfce7,stroke:#15803d
    style Done fill:#fecaca,stroke:#b91c1c
```

**Consequence:** a reminder that keeps getting skipped because the user never reads it will *not* run out of fires — it re-tries indefinitely until the user either reads and ignores the previous copy (triggering a real fire) or a terminal event arrives. That matches the intent: we only nag once the user has seen and dismissed the last notification.

### Reminder kinds

| Kind                           | Target            | Default interval | Max fires | Recipients                                                  | Cancelled by                                                                 |
|--------------------------------|-------------------|------------------|-----------|-------------------------------------------------------------|------------------------------------------------------------------------------|
| `payment_unpaid`               | `payment`         | 30 min           | 3         | Payer                                                       | `payment.paid`, `payment.failed`, `payment.refunded`                          |
| `repair_assignment_pending`    | `repairRequest`   | 15 min           | 3         | Assigned repairer (by `repairerUserId`)                     | Any `repair.status_changed` leaving `assigned`, `repair.transferred`, `repair.completed` |
| `repair_in_progress_stuck`     | `repairRequest`   | 8 h              | **1**     | Repairer + all `ADMIN` / `MANAGER` / `SUPER_ADMIN` (deduped)| Any `repair.status_changed` leaving `in_progress`, `repair.completed`         |

Defaults come from `AppConfig.reminders.*` and are fully env-overridable — see §12.

### Multi-replica safety

Two or more `notification-service` replicas running on the same database would fire every due reminder multiple times if not coordinated. The sweep wraps each tick in a **Postgres session-level advisory lock**:

```sql
SELECT pg_try_advisory_lock(94117);   -- non-blocking; returns false if held
-- ... fireDueReminders() ...
SELECT pg_advisory_unlock(94117);
```

- The lock key (`94117`, default) is configurable via `REMINDER_ADVISORY_LOCK_KEY`.
- `pg_try_advisory_lock` is non-blocking — the second replica silently logs a debug line and exits.
- Session-level (not xact-level) so the lock survives across multiple statements inside the tick.
- A crash releases the lock automatically on connection drop, so a dead replica cannot deadlock the sweep.

```mermaid
sequenceDiagram
    autonumber
    participant R1 as Replica A
    participant R2 as Replica B
    participant PG as 🐘 Postgres

    par Cron tick @ :00
        R1->>PG: pg_try_advisory_lock(94117)
        PG-->>R1: true
    and
        R2->>PG: pg_try_advisory_lock(94117)
        PG-->>R2: false (silent skip)
    end

    R1->>PG: fireDueReminders() → notifications created
    R1->>PG: pg_advisory_unlock(94117)

    Note over R1,R2: Next tick, replicas may swap roles —<br/>whoever wins the race this minute runs the sweep.
```

### Public surface of `ReminderService`

```ts
interface ReminderService {
  scheduleReminder(params: {
    kind: 'payment_unpaid' | 'repair_assignment_pending' | 'repair_in_progress_stuck';
    targetType: string;
    targetId: string;
    recipientUserIds: string[];      // deduped, falsy stripped
    notificationType: string;
    title: string;
    body: string;
    metadata?: Record<string, any>;
    intervalMs: number;
    maxFires: number;
    firstFireAt?: Date;               // default now + intervalMs
  }): Promise<ReminderJobEntity>;    // dedupes on (kind, targetType, targetId, status='active')

  cancelReminder(
    targetType: string,
    targetId: string,
    reason: string,
    kinds?: ReminderKind[],           // optional filter
  ): Promise<number>;                 // count of jobs flipped to 'cancelled'

  fireDueReminders(): Promise<void>;  // called by ReminderSweepService only
}
```

---

## 11. Deployment Topology

```mermaid
flowchart TB
    subgraph Host["VPS host — asko-rws@193.42.127.113"]
        NG["nginx (host)<br/>SSL + path routing"]
        subgraph Docker["Docker (network_mode: host)"]
            direction TB
            RG["realtime-gateway :4004"]
            NS["🛎 notification-service<br/>gRPC :5004 / metrics :9104"]
            US["user-service :5000"]
            CS["chat-service :5005"]
            subgraph Data["Stateful infra"]
                PG[("PostgreSQL")]
                RD[("Redis")]
                MQ[("RabbitMQ")]
            end
        end
    end

    Prom["🔥 Prometheus"]:::mon --> NS
    Graf["📊 Grafana"]:::mon --> Prom

    NG --> RG
    RG <-- gRPC --> NS
    NS <--> PG
    NS <--> RD
    NS <--> MQ
    NS -- gRPC --> US
    NS -- notification.created --> MQ
    MQ --> CS

    classDef mon fill:#fef9c3,stroke:#ca8a04;
```

**Dockerfile notes:** one Dockerfile per app, minimal builds via `turbo prune @asko/notification-service --docker`. The service runs as a long-lived NestJS microservice (no HTTP listener beyond the metrics server) with both gRPC and RMQ transports attached via `app.connectMicroservice()`.

---

## 12. Configuration

All env vars are loaded through `@asko/shared`'s `getEnvFilePath()` helper (resolves `.env.prod` / `.env.dev` or falls back to `process.env`).

### Core

| Variable              | Default                  | Description                                   |
|-----------------------|--------------------------|-----------------------------------------------|
| `PORT`                | `4100`                   | Unused (kept for parity)                      |
| `GRPC_PORT`           | `5004`                   | gRPC microservice port                        |
| `METRICS_PORT`        | `9104`                   | Prometheus HTTP metrics port                  |
| `DATABASE_HOST`       | *required*               | Postgres host                                 |
| `DATABASE_PORT`       | *required*               | Postgres port                                 |
| `DATABASE_DB_NAME`    | `asko_rws_notify_db`     | Database name                                 |
| `DATABASE_USER`       | *required*               | DB user                                       |
| `DATABASE_PASS`       | *required*               | DB password                                   |
| `RABBITMQ_URL`        | `amqp://localhost:5672`  | RMQ connection string                         |
| `REDIS_URL`           | `redis://localhost:6379` | Redis for pub/sub + BullMQ                    |
| `USER_SERVICE_ADDR`   | `localhost:5000`         | gRPC target for `UserClientService`           |
| `EMAIL_HOST`          | `smtp.gmail.com`         | SMTP host                                     |
| `EMAIL_SMTP_PORT`     | `587`                    | SMTP port (secure mode if `465`)              |
| `EMAIL_AUTH_USER`     | *required*               | SMTP user                                     |
| `EMAIL_AUTH_PASS`     | *required*               | SMTP password                                 |
| `EMAIL_FROM`          | *required*               | Default `from` address for outbound mail      |

### Reminder watchdog (§10)

| Variable                                | Default      | Description                                                              |
|-----------------------------------------|--------------|--------------------------------------------------------------------------|
| `REMINDER_PAYMENT_INTERVAL_MS`          | `1800000`    | Payment-unpaid reminder interval (30 min)                                |
| `REMINDER_PAYMENT_MAX_FIRES`            | `3`          | Max times a payment-unpaid reminder nags                                 |
| `REMINDER_REPAIR_ASSIGNMENT_INTERVAL_MS`| `900000`     | Repair-assignment reminder interval (15 min)                             |
| `REMINDER_REPAIR_ASSIGNMENT_MAX_FIRES`  | `3`          | Max times an assignment reminder nags                                    |
| `REMINDER_REPAIR_STUCK_AFTER_MS`        | `28800000`   | `IN_PROGRESS` stuck threshold (8 h, fires once)                          |
| `REMINDER_SWEEP_CRON`                   | `* * * * *`  | Cron for `ReminderSweepService.sweep()` — read at class-decoration time  |
| `REMINDER_SWEEP_BATCH_SIZE`             | `100`        | Max due jobs per sweep tick                                              |
| `REMINDER_ADVISORY_LOCK_KEY`            | `94117`      | `pg_try_advisory_lock` key used to serialize sweeps across replicas      |

> `REMINDER_SWEEP_CRON` must be set **before** the NestJS module graph is constructed — it's baked into the `@Cron()` decorator. Restart the service after changing it.

---

## 13. Error Model

Domain errors live in `src/common/error/` and extend `@asko/shared`'s `AppError` registry. Codes start at **1100** to avoid collisions with other services.

```mermaid
classDiagram
    direction LR
    class AppError {
        +code: number
        +httpStatus: number
        +message: string
        +registerDefinitions(defs)
    }
    class NotificationErrorTypeEnum {
        <<enum>>
        NOTIFICATION_NOT_FOUND = 1100
    }
    class AppErrors {
        <<helpers>>
        +notificationNotFound(msg?)
    }
    AppError <|.. AppErrors
    AppErrors ..> NotificationErrorTypeEnum : uses
```

| Code | HTTP | Message                | Thrown from                                         |
|------|------|------------------------|-----------------------------------------------------|
| 1100 | 404  | `Notification not found` | `markAsRead()`, `deleteNotification()`            |

The gRPC controller converts any thrown `AppError` into an `RpcException` with the correct gRPC status (see §5).

---

## 14. Observability

- **Logging:** `@asko/observability`'s `PinoLogger` is wired in `main.ts` with service name `notification-service`.
- **Metrics:** A standalone HTTP server is started on `METRICS_PORT` via `createMetricsServer()` from `@asko/observability`. Default Node/Prometheus metrics are collected in the constructor (`collectDefaultMetrics()`).
- **Health:** There is no dedicated HTTP health endpoint — liveness is observed through RMQ consumer lag and metrics scraping.
- **Reminder sweep logs:** `ReminderService` logs `Sweep: N due reminder(s)` per non-empty tick, plus `Scheduled reminder <id>`, `Cancelled N reminder(s)`, `Reminder <id> exhausted`, and (debug) `Skipped user=<u> job=<id>: unread prior exists`. `ReminderSweepService` logs a warning when a sweep holds the advisory lock longer than **5000 ms**, which is the signal to investigate DB pressure or runaway batch sizes.

---

## 15. Notification & Target Type Catalog

All enums live in `@asko/shared` so every producer and consumer uses the same string literals.

### `NotificationType`

| Group      | Values                                                                                                                 |
|------------|------------------------------------------------------------------------------------------------------------------------|
| Repair     | `REPAIR_STATUS_CHANGED`, `REPAIR_ASSIGNED`, `REPAIR_COMPLETED`, `REPAIR_TRANSFERRED_TO_REPAIRER`, `REPAIR_TRANSFERRED_FROM_REPAIRER`, `REPAIR_TRANSFERRED_CLIENT`, `REPAIR_DIAGNOSTICS_DECLINED` |
| Payment    | `INVOICE_CREATED`, `PAYMENT_PAID`, `PAYMENT_FAILED`, `PAYMENT_REFUNDED`                                                 |
| Certificate| `CERTIFICATE_ISSUED`, `CERTIFICATE_EXPIRING_SOON`, `CERTIFICATE_EXPIRED`                                                |
| Chat       | `CHAT_MESSAGE`, `CHAT_CONVERSATION_CREATED`, `CHAT_PARTICIPANT_ADDED`, `CHAT_PARTICIPANT_REMOVED`                       |
| Schedule   | `SCHEDULE_CREATED`, `SCHEDULE_APPROVED`, `SCHEDULE_REJECTED`, `SCHEDULE_UPDATED`, `SCHEDULE_DELETED`, `SCHEDULE_EXTRA_DAY_REQUESTED`, `SCHEDULE_EXTRA_DAY_ACCEPTED`, `SCHEDULE_EXTRA_DAY_REJECTED`, `SCHEDULE_PATTERN_CREATED`, `SCHEDULE_PATTERN_UPDATED`, `SCHEDULE_PATTERN_DELETED`, `SCHEDULE_PATTERN_APPROVED`, `SCHEDULE_PATTERN_REJECTED` |
| Reminder   | `INVOICE_UNPAID_REMINDER`, `REPAIR_ASSIGNMENT_REMINDER`, `REPAIR_IN_PROGRESS_STUCK`                                    |
| Generic    | `MESSAGE`, `SYSTEM`                                                                                                    |

### `NotificationTargetType`

| Value            | Example target entity            |
|------------------|----------------------------------|
| `repairRequest`  | `RepairRequestEntity.id`         |
| `payment`        | `PaymentEntity.id`               |
| `certificate`    | `CertificateEntity.id`           |
| `conversation`   | `ConversationEntity.id`          |
| `schedule`       | `ScheduleEntity.id` / patternId  |
| `system`         | —                                |

---

## 16. Releases

A chronological log of user-visible changes. Entries are grouped by semantic version; each line links the change to a concrete file path so a reader can jump straight to the code.

```mermaid
timeline
    title notification-service release timeline
    section v1.1.0 — Reminder watchdog
        2026-04-12 : Persistent reminder_job table
                   : @Cron sweep with Postgres advisory lock
                   : Skip-if-unread rule
                   : Payment / repair assignment / repair stuck kinds
    section v1.0.0 — Initial release
        2026-03-24 : gRPC RPC surface (6 methods)
                   : RMQ consumers for repair / payment / chat / schedule / email
                   : BullMQ email pipeline
                   : Redis pub/sub real-time push
```

### v1.1.0 — Reminder Watchdog _(2026-04-12)_

Introduces a persistent, cron-swept reminder subsystem that re-fires notifications for actions the user hasn't completed, and stops automatically on terminal state transitions. See §10 for the full model.

**Added**
- Entity `ReminderJobEntity` with composite indexes for sweep, target lookup, and kind-scoped dedupe — `src/entities/reminder-job.entity.ts`.
- Migration `Migration20260412120000` creating `reminder_job` and the composite index `idx_notification_target_unread` on `notification` — `migrations/Migration20260412120000.ts`.
- `ReminderService.scheduleReminder / cancelReminder / fireDueReminders` with application-level dedupe and the skip-if-unread rule — `src/services/reminder.service.ts`.
- `ReminderSweepService` — `@Cron`-decorated sweep wrapped in `pg_try_advisory_lock(94117)` for multi-replica safety — `src/services/reminder-sweep.service.ts`.
- `NotificationService.hasUnreadForTarget(userId, targetType, targetId)` — backing query for the skip-if-unread rule, indexed by `idx_notification_target_unread` — `src/services/notification.service.ts`.
- Three new `NotificationType` enum values in `@asko/shared`: `INVOICE_UNPAID_REMINDER`, `REPAIR_ASSIGNMENT_REMINDER`, `REPAIR_IN_PROGRESS_STUCK`.
- Eight new env vars under `AppConfig.reminders.*` — see §12.
- Unit tests: `reminder.service.spec.ts` (14 specs) + `hasUnreadForTarget` cases in `notification.service.spec.ts`.

**Changed**
- `PaymentEventConsumer` now **schedules** a `payment_unpaid` reminder on `payment.created` and **cancels** it on `payment.paid` / `.failed` / `.refunded` — `src/consumers/payment-event.consumer.ts`.
- `RepairEventConsumer` now:
  - Schedules `repair_assignment_pending` on `repair.assigned`.
  - Schedules `repair_in_progress_stuck` (repairer + all ADMIN/MANAGER/SUPER_ADMIN staff) when `status_changed → in_progress`.
  - Cancels `repair_assignment_pending` when leaving `assigned` and `repair_in_progress_stuck` when leaving `in_progress`.
  - Cancels both kinds on `repair.completed`.
  - Reschedules `repair_assignment_pending` for the new repairer on `repair.transferred`.
  - `src/consumers/repair-event.consumer.ts`
- `RepairEvent` (in `apps/repair-service/src/modules/repair-event.service.ts`) gained `repairerUserId?: string` and `managerId?: string`; populated by `assignRepairer()` and `startWork()` in `apps/repair-service/src/services/repair-request.service.ts` so the notification-service can resolve reminder recipients without a new gRPC hop.
- `AppModule` now imports `ScheduleModule.forRoot()` and registers `ReminderJobEntity` with `MikroOrmModule.forFeature([...])`; `ReminderService` and `ReminderSweepService` join the providers list — `src/app.module.ts`.
- `NotificationEntity` gained the composite index `idx_notification_target_unread` on `(target_type, target_id, is_read)` — `src/entities/notification.entity.ts`.

**Dependencies**
- `@nestjs/schedule ^5.0.1` — matches the version used by `payment-service` and `user-service`.

**Operational notes**
- Manual step before deploy: `pnpm --filter @asko/shared run build` (Turbo dev filter excludes `@asko/shared` from watch).
- Run `./scripts/migrate-dev.sh notification-service` to apply `Migration20260412120000`.
- Default sweep cron is `* * * * *` (every minute). For faster local iteration, override via `REMINDER_SWEEP_CRON=*/10 * * * * *` in `.env.dev`.
- Multi-replica rollouts are safe as long as all replicas point at the same database (the advisory lock serializes sweeps).

### v1.0.0 — Initial release _(2026-03-24)_

First production cut of the service.

**Added**
- gRPC RPC surface: `CreateNotification`, `ListUserNotifications`, `MarkAsRead`, `MarkAllAsRead`, `GetUnreadCount`, `DeleteNotification` — `src/controllers/notification.grpc.controller.ts`.
- MikroORM entity `NotificationEntity` with migration `Migration20260324123852` — `src/entities/notification.entity.ts`, `migrations/Migration20260324123852.ts`.
- RMQ consumers for `repair.*`, `certificate.*`, `payment.*`, `chat.*`, `schedule.*`, `email.send` — `src/consumers/`.
- Real-time push via Redis pub/sub on the `notifications:push` channel — `src/services/notification-push.service.ts`.
- `NotificationEventPublisher` emits `notification.created` back to `chat_queue` so chat-service can sync message read state — `src/services/notification-event.publisher.ts`.
- BullMQ-backed email pipeline (`email` queue): `EmailEventConsumer` → `EmailProcessor` → `EmailTransportService` (nodemailer) — `src/consumers/email-event.consumer.ts`, `src/services/email.processor.ts`, `src/services/email-transport.service.ts`.
- Prometheus metrics endpoint via `@asko/observability` — default `METRICS_PORT=9104`.
- Domain error registry starting at code `1100` (`NOTIFICATION_NOT_FOUND`) — `src/common/error/`.

---

## Source Map

| Responsibility        | File                                                             |
|-----------------------|------------------------------------------------------------------|
| Bootstrap             | `src/main.ts`                                                    |
| Root module wiring    | `src/app.module.ts`                                              |
| Config                | `src/app.config.ts`                                              |
| Notification entity   | `src/entities/notification.entity.ts`                            |
| Reminder entity       | `src/entities/reminder-job.entity.ts`                            |
| Migration (v1.0.0)    | `migrations/Migration20260324123852.ts`                          |
| Migration (v1.1.0)    | `migrations/Migration20260412120000.ts`                          |
| gRPC controller       | `src/controllers/notification.grpc.controller.ts`                |
| Core service          | `src/services/notification.service.ts`                           |
| Reminder service      | `src/services/reminder.service.ts`                               |
| Reminder sweep        | `src/services/reminder-sweep.service.ts`                         |
| Push (Redis)          | `src/services/notification-push.service.ts`                      |
| RMQ publisher         | `src/services/notification-event.publisher.ts`                   |
| SMTP transport        | `src/services/email-transport.service.ts`                        |
| BullMQ worker         | `src/services/email.processor.ts`                                |
| Repair consumer       | `src/consumers/repair-event.consumer.ts`                         |
| Payment consumer      | `src/consumers/payment-event.consumer.ts`                        |
| Chat consumer         | `src/consumers/chat-event.consumer.ts`                           |
| Schedule consumer     | `src/consumers/schedule-event.consumer.ts`                       |
| Email consumer        | `src/consumers/email-event.consumer.ts`                          |
| Database module       | `src/modules/database.module.ts`                                 |
| Email queue module    | `src/modules/email-queue.module.ts`                              |
| User gRPC client      | `src/modules/user-client/user-client.{module,service}.ts`        |
| Errors                | `src/common/error/{definition,error-type.enum,eval,index}.ts`    |
| Email job interface   | `src/common/email-job.interface.ts`                              |
| Notification spec     | `src/services/notification.service.spec.ts`                      |
| Reminder spec         | `src/services/reminder.service.spec.ts`                          |
