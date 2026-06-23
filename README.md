# Help Desk Hero API

The backend REST API for the Help Desk Hero IT ticketing system. Rebuilt from Express/Mongoose to
**NestJS + PostgreSQL (Drizzle ORM)** with **AWS Cognito** authentication.

## Architecture

Strict layering — `controller → service → repository → database`. Only repositories touch Drizzle/SQL.

```
src/
  db/            Drizzle schema, DB provider (DI token), migration runner
  auth/          Cognito token verification (+ local dev seam), guards, decorators
  users/         users controller / service / repository
  tickets/       tickets controller / service / repository
  common/        response interceptor + global exception filter
  health/        public health check
```

## Auth

The API is a **resource server**: it does not issue tokens. Sign-up / sign-in happen in **AWS Cognito**;
the API verifies the Cognito **ID token** (`Authorization: Bearer <id_token>`) and just-in-time provisions
a local user profile keyed by the Cognito `sub`. Roles come from Cognito groups (`admin`, `agent`).

For local development without AWS, set `AUTH_MODE=dev`; the API then accepts locally-signed HS256 tokens:

```bash
npm run db:migrate
npm run dev
# In another shell, mint a dev token and call the API:
TOKEN=$(npx tsx src/dev/mint-token.ts alice@example.com "Alice Admin" admin)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/v1/tickets
```

## Endpoints (prefix `/api/v1`)

- `GET  /health` — public health check
- `GET/POST /tickets`, `GET/PATCH/DELETE /tickets/:id`, `POST /tickets/:id/comments`
- `GET /users`, `GET/PATCH /users/me`, `GET /users/:id`, `DELETE /users/:id` (admin)
- Swagger UI at `/api/docs`

## Getting started

```bash
cp .env.example .env      # set DATABASE_URL; AUTH_MODE=dev for local
npm install
npm run db:generate       # generate SQL migrations from the schema (first time / on schema change)
npm run db:migrate        # apply migrations
npm run dev               # http://localhost:3001/api/v1
```

## Tech

NestJS 10 · PostgreSQL · Drizzle ORM · AWS Cognito (`aws-jwt-verify`) · class-validator · Helmet ·
@nestjs/throttler (rate limiting) · pino structured logging (Datadog-ready).
