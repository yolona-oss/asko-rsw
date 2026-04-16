# @asko/repair-service

gRPC + RabbitMQ microservice owning the repair domain: repair requests, devices, user-devices, device categories, certificates, repairers, reviews, points, schedules, AVR (work completion act).

- **Port**: 5003 (gRPC)
- **Transport**: gRPC, RabbitMQ
- **Database**: PostgreSQL (repair DB)
- **Talks to**: user-service (gRPC), payment-service (RabbitMQ), file-service (RabbitMQ), notification-service (RabbitMQ)

## Docs

| Doc | Topic |
|---|---|
| [Repair Request Architecture](./docs/repair-request.md) | Request lifecycle, state machine, schedule guards, overtime tracking, timezone, completion metrics |
| [Schedule System](./docs/schedule.md) | Work patterns, entries (vacation/sick/overtime/extra_day), validation rules, API |

See also: [top-level docs index](../../docs/README.md) · [project CLAUDE.md](../../CLAUDE.md)

## Key Entities

- `RepairRequest` — central lifecycle entity ([docs](./docs/repair-request.md))
- `WSchedulePattern` — repeating work/rest cycle per repairer ([docs](./docs/schedule.md))
- `WSchedule` — one-time entries: vacation, sick leave, overtime, extra day ([docs](./docs/schedule.md))
- `Repairer` — repairer profile with `timezone` (IANA) field
- `Address` — customer/repairer addresses with `timezone` field
- `Certificate`, `UserDevice`, `Device`, `WorkStep`, `BrokenPart`

## Commands

```bash
pnpm dev       # start with hot reload
pnpm build     # compile to dist/
pnpm test      # run jest tests
pnpm mikro-orm migration:up    # apply migrations
```
