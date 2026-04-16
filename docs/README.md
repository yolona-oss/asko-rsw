# ASKO Documentation

Top-level index for the ASKO repair management platform.

## General

- [Architecture Overview](./architecture.md) — system topology, services, communication
- [Setup](./setup.md) — local development quickstart
- [Project CLAUDE.md](../CLAUDE.md) — canonical project rules, conventions, and structure

## Domain Documentation

Domain docs live next to their owning service or infrastructure.

### Backend services

| Service | Docs |
|---|---|
| [repair-service](../apps/repair-service/README.md) | [Repair Request Architecture](../apps/repair-service/docs/repair-request.md) · [Schedule System](../apps/repair-service/docs/schedule.md) |
| [notification-service](../apps/notification-service/README.md) | — |
| auth-gateway, repair-gateway, media-gateway, realtime-gateway, content-gateway | — |
| user-service, payment-service, file-service, chat-service, content-service | — |

### Frontend

| App | Docs |
|---|---|
| [web](../apps/web) | — (component library: `packages/ui`) |

### Infrastructure

| Topic | Docs |
|---|---|
| Docker Compose & profiles | [deploy/docker/README.md](../deploy/docker/README.md) |
| Nginx routing | `deploy/nginx/nginx.app.conf` |
| Monitoring (Prometheus + Grafana) | `monitoring/` |

## Key Conventions

- **Russian UI strings** in user-facing code
- **Theme tokens only** on the frontend (no hard-coded colors) — see CLAUDE.md
- **Sharp corners** — no `rounded-*` except `rounded-full` for avatars/badges
- **Lucide icons** — never inline SVG
- **Each microservice owns its DB** — cross-service access only via gRPC or RabbitMQ
