# HealthFirstPriority Authentication Architecture

This document explains the detailed flow and architecture of the newly implemented authentication system, including Login, Signup, and Forgot Password features. It covers both the frontend React/Next.js implementation and the Go backend (`orchestrator.go`), along with the necessary environment configurations.

## Overview

The authentication system uses **JWT (JSON Web Tokens)** for stateless session management. 
- **Frontend**: Next.js (React) using Tailwind CSS for a responsive, theme-aware (Light/Dark mode) UI. State is managed locally.
- **Backend**: A custom Go server (`orchestrator.go`) that handles database operations (SQLite/PostgreSQL), password hashing (bcrypt), JWT generation, and SMTP email dispatch for password resets.

---

## 1. Signup Flow

### Frontend (`/signup` & `AuthModal`)
1. The user provides their `Full Name`, `Email Address`, `Password`, and `Confirm Password`.
2. The frontend validates that the passwords match and meet the minimum length (6 characters).
3. A `POST` request is sent to the frontend's same-origin route `/api/auth/signup`, and Next.js proxies that request to the upstream auth service.

### Backend (`orchestrator.go: handleSignup`)
1. **Validation**: Ensures all fields are present and the email is valid/sanitized.
2. **Uniqueness Check**: Queries the `users` table to ensure the email doesn't already exist. Returns `409 Conflict` if it does.
3. **Security**: Hashes the plain-text password using the robust `bcrypt` algorithm.
4. **Storage**: Generates a unique 16-byte hex `id` and inserts the new user record (`id`, `name`, `email`, `password_hash`) into the database.
5. **Session Creation**: Generates a signed JWT containing the `user_id` and `email`, valid for 7 days.
6. **Response**: Returns the user data and the JWT token to the frontend, which logs the user in immediately.

---

## 2. Login Flow

### Frontend (`/login` & `AuthModal`)
1. The user provides their `Email Address` and `Password`.
2. A `POST` request is sent to the frontend's same-origin route `/api/auth/login`, which Next.js proxies to the upstream auth service.

### Backend (`orchestrator.go: handleLogin`)
1. **Lookup**: Queries the `users` table for a record matching the provided email.
2. **Verification**: Uses `bcrypt.CompareHashAndPassword` to securely verify the provided plain-text password against the stored `password_hash`. Returns `401 Unauthorized` if they don't match.
3. **Session Creation**: Generates a fresh JWT valid for 7 days.
4. **Response**: Returns the user object and the JWT token back to the frontend.

---

## 3. Forgot Password / Reset Flow

### Frontend Request (`AuthModal` Forgot Password View)
1. The user enters their email address and clicks "Send Reset Link".
2. A `POST` request is sent to `/api/auth/forgot-password` and proxied by Next.js to the upstream auth service.

### Backend Processing (`orchestrator.go: handleForgotPassword`)
1. **Lookup & Security**: Checks if the email exists. **Crucially**, it always returns a success message to the frontend regardless of whether the email exists or not. This prevents "email enumeration" attacks (where malicious actors guess emails to see who is registered).
2. **Token Generation**: Generates a secure, cryptographically random 32-byte hex token.
3. **Storage**: Updates the user's database record, storing the `reset_token` and a `reset_expiry` timestamp (1 hour from generation).
4. **Email Dispatch**: Constructs a reset link using the `FRONTEND_URL` environment variable (e.g., `https://domain.com/reset-password?token=abc...`).
5. **SMTP**: Connects to the configured SMTP server and dispatches the email. If no SMTP server is configured in dev, it gracefully falls back to printing the reset link in the server console/logs for local testing.

### Password Reset Execution
1. The user clicks the link (`/reset-password?token=...`) in their email.
2. The frontend presents a form to enter a new password.
3. A `POST` request is sent to `handleResetPassword` with the `token` and new `password`.
4. The Go backend looks up the user by the `reset_token`, verifies the token hasn't expired, hashes the *new* password, updates the DB, and nullifies the reset token to prevent reuse.

---

## Environment Configuration

To make this architecture securely connect the Next.js frontend to the Go orchestrator in different environments (Local vs. Production), the following environment variables are required.

### 1. Frontend / Next.js Configuration (`.env`)
The frontend now talks to same-origin `/api/auth/*` routes, and the Next.js route handler decides where to forward those requests.

- **Local Development**:
  ```env
  NEXT_PUBLIC_API_URL="http://localhost:8095/api/auth"
  ```
- **Production** (preferred when auth is hosted separately from the frontend):
  ```env
  AUTH_API_BASE_URL="https://dev-ai.nomineelife.com/api/auth"
  ```

`AUTH_API_BASE_URL` may be either the host root (for example `https://dev-ai.nomineelife.com`) or the full auth path (`https://dev-ai.nomineelife.com/api/auth`). If it is not set, the route handler falls back to `NEXT_PUBLIC_API_URL`, then `HFP_API_BASE_URL`, then `http://localhost:8095`.

### 2. Backend Configuration (`orchestrator.go` Environment Variables)
The Go backend requires these variables to be set in its running environment (e.g., via a `.env` file, system variables, or a Docker/Systemd configuration).

| Variable | Description | Local Example | Production Example |
| :--- | :--- | :--- | :--- |
| `NET_ADDR` | The port or unix socket the Go server binds to. | `:8095` | `unix:/tmp/orchestrator.sock` |
| `JWT_SECRET` | Cryptographic secret used to sign sessions. **Must be highly secure in production.** | `hfp-dev-secret-change-me` | `xyz-very-long-random-string-1234` |
| `DB_DRIVER` | Database engine to use (`sqlite3` or `postgres`). | `sqlite3` | `postgres` |
| `FRONTEND_URL` | Used to generate the clickable link in password reset emails. | `http://localhost:3000` | `https://your-production-domain.com` |

#### SMTP Configuration (Optional but required for real emails)
If these are left blank locally, the password reset links will just be printed in the Go terminal. For production, you need a transactional email provider (SendGrid, AWS SES, Postmark, etc.).
- `SMTP_HOST` (e.g., `smtp.sendgrid.net`)
- `SMTP_PORT` (e.g., `587`)
- `SMTP_USER` (e.g., `apikey`)
- `SMTP_PASS` (e.g., `SG.xyz...`)
- `SMTP_FROM` (e.g., `noreply@healthfirstpriority.com`)

### 3. Caddy Reverse Proxy (Production Routing)
If you are deploying on a server using Caddy, your `Caddyfile` needs to properly route the `/api/auth/*` requests to the Go orchestrator instance.

> **⚠️ Important:** Use `handle`, **not** `handle_path`. The `handle_path` directive strips the matched prefix before forwarding, so Go would receive `/login` instead of `/api/auth/login` and no route would match.

```caddyfile
dev-ai.nomineelife.com {
    # 1. Route API Auth requests to the Go Orchestrator backend
    #    Use `handle` (NOT `handle_path`) to preserve the /api/auth prefix
    handle /api/auth/* {
        reverse_proxy localhost:8095
    }

    # 2. Route everything else to the Next.js Frontend
    handle {
        reverse_proxy localhost:3000
    }
}
```
