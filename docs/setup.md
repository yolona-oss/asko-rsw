# Local Development Setup

Quick-start guide for running the ASKO platform locally.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose
- PostgreSQL 16, RabbitMQ 3.12, Redis 7 (via Docker)

## Install & Build

```bash
pnpm install
turbo run build
# or, in dependency order:
./scripts/build.sh
```

## Database Setup

Create all service DBs and run migrations:

```bash
./scripts/setup-dev.sh
```

Each microservice owns its own DB. See [Architecture Overview](./architecture.md#service-ownership).

## Run Everything

```bash
./scripts/dev.sh    # Docker infra + all services (excl. web)
cd apps/web && pnpm dev   # Next.js frontend on :3000
```

## Common Commands

```bash
pnpm install                              # install deps
turbo run build                           # build everything
./scripts/build.sh                        # build in dependency order
./scripts/dev.sh                          # start all services
./scripts/openapi.sh                      # regenerate OpenAPI spec + frontend types
./scripts/setup-dev.sh                    # create DBs + run migrations
./scripts/env-push.sh [app...]            # push .env.prod to VPS
./scripts/nginx-push.sh                   # push nginx config to VPS
```

## Ports

| Component | Port |
|---|---|
| web (Next.js) | 3000 |
| auth-gateway | 4001 |
| repair-gateway | 4002 |
| media-gateway | 4003 |
| realtime-gateway | 4004 |
| content-gateway | 4005 |
| user-service | 5000 |
| payment-service | 5001 |
| file-service | 5002 |
| repair-service | 5003 |
| notification-service | 5004 |
| chat-service | 5005 |
| content-service | 5010 |

## Testing

```bash
# service-level tests
cd apps/repair-service && pnpm test

# workspace-wide
turbo run test
```

## Deployment

See [deploy/docker/README.md](../deploy/docker/README.md) for Docker Compose profiles and VPS deployment.

## Further Reading

- [Architecture Overview](./architecture.md)
- [Project CLAUDE.md](../CLAUDE.md) — canonical rules and conventions
- [Repair Request Architecture](../apps/repair-service/docs/repair-request.md)
- [Schedule System](../apps/repair-service/docs/schedule.md)
