# Login & Signup Implementation Guide

This folder contains the server-side code that powers the JWT authentication system for HealthFirstPriority.

## Folder Structure

```
backendLogicForLogin/
└── server_files/
    ├── Caddyfile          # Caddy reverse proxy configuration
    └── orchestrator.go    # Go auth/proxy backend ("Go Brain")
```

---

## Architecture Overview

```
Browser → Next.js (/api/auth/*) → Caddy (dev-ai.nomineelife.com) → Go Brain (:8095)
```

1. **Frontend** calls same-origin `/api/auth/*` routes (login, signup, forgot-password, reset-password, history).
2. **Next.js** route handler (`src/app/api/auth/[...path]/route.ts`) proxies these to the upstream `AUTH_API_BASE_URL`.
3. **Caddy** receives the request on `dev-ai.nomineelife.com` and routes `/api/auth/*` to `127.0.0.1:8095`.
4. **Go orchestrator** handles auth logic, JWT generation, bcrypt password hashing, and database operations.

---

## 1. Go Orchestrator (`orchestrator.go`)

A single Go binary that serves as both the auth backend and an AI proxy.

### Auth Endpoints

| Method | Path | Handler | Description |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/signup` | `handleSignup` | Register a new user |
| POST | `/api/auth/login` | `handleLogin` | Authenticate and return JWT |
| POST | `/api/auth/forgot-password` | `handleForgotPassword` | Send password reset email |
| POST | `/api/auth/reset-password` | `handleResetPassword` | Reset password with token |
| GET | `/api/auth/history` | `handleHistory` | Fetch user's chat history |

### Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NET_TYPE` | Network type (`tcp` or `unix`) | `tcp` |
| `NET_ADDR` | Listen address | `:8095` |
| `DB_DRIVER` | Database driver (`sqlite3` or `postgres`) | `sqlite3` |
| `JWT_SECRET` | JWT signing secret (**change in production!**) | `hfp-dev-secret-change-me-in-production` |
| `FRONTEND_URL` | Used in password reset email links | `https://dev-ai.nomineelife.com` |
| `SMTP_HOST` | SMTP server for sending emails | *(empty = logs links to console)* |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | *(empty)* |
| `SMTP_PASS` | SMTP password | *(empty)* |
| `SMTP_FROM` | From address for emails | `noreply@healthfirstpriority.com` |

### Database Schema

The orchestrator auto-creates two tables on startup:

- **`users`**: `id`, `name`, `email`, `password_hash`, `reset_token`, `reset_expiry`, `created_at`
- **`chat_history`**: `id`, `user_id`, `session_id`, `role`, `content`, `created_at`

---

## 2. Caddyfile (Reverse Proxy)

Caddy handles TLS termination, routing, and load balancing.

### Key Routing Rules

```caddyfile
dev-ai.nomineelife.com {
    # Auth → Go Brain (preserves /api/auth prefix)
    handle /api/auth/* {
        reverse_proxy 127.0.0.1:8095
    }

    # AI proxy → Go Brain
    handle /v1/* {
        reverse_proxy 127.0.0.1:8095
    }

    # Everything else → Next.js frontend
    handle {
        reverse_proxy 127.0.0.1:3000
    }
}
```

> **⚠️ Critical:** The auth route uses `handle`, **not** `handle_path`. The `handle_path` directive strips the path prefix before forwarding, which would break Go's route matching (Go expects `/api/auth/login`, not `/login`).

---

## 3. Frontend Configuration

In your Next.js `.env`:

```env
# Production: points to the server where Go Brain runs
AUTH_API_BASE_URL=https://dev-ai.nomineelife.com/api/auth

# Local dev: use when running Go Brain locally
NEXT_PUBLIC_API_URL=http://localhost:8095/api/auth
```

The auth proxy (`src/app/api/auth/[...path]/route.ts`) checks variables in priority order:
`AUTH_API_BASE_URL` → `NEXT_PUBLIC_API_URL` → `HFP_API_BASE_URL` → `http://localhost:8095`

---

## Deployment Steps

1. **Build the Go binary** on the server: `go build -o orchestrator orchestrator.go`
2. **Run it**: `./orchestrator` (or via systemd/PM2)
3. **Replace the Caddyfile** and reload: `caddy reload --config /etc/caddy/Caddyfile`
4. **Set environment variables** (especially `JWT_SECRET`, `DB_*`, and optionally `SMTP_*`)
