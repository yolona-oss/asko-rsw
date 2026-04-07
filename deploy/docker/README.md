# Docker Deployment

## Single Server (all services on one host)

```bash
cd deploy/docker
cp .env.example .env
# Edit .env if needed (defaults work for single server)
docker compose --profile all up -d
```

## Multi-Server

### Data node (PostgreSQL, Redis, RabbitMQ)
```bash
docker compose --profile data up -d
```

### Services node (microservices)
```bash
cp .env.example .env
# Set RABBITMQ_URL and DB connection strings to data node IP
docker compose --profile services up -d
```

### Gateway node (API gateways + nginx + frontend)
```bash
cp .env.example .env
# Set all *_SERVICE_URL vars to services node IP
# Set RABBITMQ_URL and REDIS_URL to data node IP
docker compose --profile gateways --profile frontend up -d
```

### Monitoring (any node)
```bash
docker compose --profile monitoring up -d
```

## Development

```bash
docker compose -f docker-compose.dev.yml up -d
# Then run services locally via: pnpm run start:dev in each app
```

## Profiles

| Profile | Services |
|---------|----------|
| `all` | Everything — single server deployment |
| `data` | RabbitMQ, Redis, redis-exporter |
| `services` | All 7 microservices |
| `gateways` | All 5 gateways + nginx |
| `frontend` | Next.js web app |
| `monitoring` | Prometheus, Grafana, redis-exporter |
