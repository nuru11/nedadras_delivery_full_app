# cPanel Deployment Guide

## Differences from the working "hosted" app

| Aspect | Hosted (working) | Delivery Backend |
|--------|------------------|------------------|
| **Socket auth** | None – anyone connects, then joins with userId | **JWT required** – must send valid token in handshake |
| **.htaccess** | Has Passenger config | Added – **update paths** for your server |
| **Transports** | Default (polling first) | Explicit `['polling', 'websocket']` for cPanel |

## Required steps for cPanel

### 1. Update `.htaccess` paths

Edit `.htaccess` and replace:

- `YOUR_CPANEL_USER` → your cPanel username
- `deliveryappapi.negadrasexpress.net` → your domain if different
- Ensure `PassengerAppRoot` points to the folder containing `package.json` and `src/app.js`
- Ensure `PassengerNodejs` points to your Node.js binary (from cPanel Node.js selector)

### 2. Set environment variables in cPanel

**Important:** Use `JWT_SECRET` (uppercase) — the backend reads `process.env.JWT_SECRET`. Do not use `jwtSecret`.

If using .htaccess SetEnv (Litespeed), use:
```apache
SetEnv JWT_SECRET your_secret_value
```
Remove any `jwtSecret` — it is not used.


In cPanel → **Setup Node.js App** → **Environment variables**:

- `JWT_SECRET` – must match what you use for API auth
- `REDIS_URL` – Redis connection (e.g. `redis://localhost:6379` or your Redis host)
- `AFROMESSAGE_FROM` – Afromessage sender ID for OTP SMS (leave empty for static OTP 2222)
- `AFROMESSAGE_SENDER` – Sender name (e.g. `Negadras`)
- `NODE_ENV=production`
- Database vars if not in `.env`

**Important:** If `JWT_SECRET` is missing, Socket connections are rejected with "JWT secret not configured".

### 3. Deployment layout

Deploy so the structure matches:

```
your-app-root/
├── .htaccess
├── package.json
├── src/
│   └── app.js
├── .env (optional; prefer cPanel env vars)
└── ...
```

### 4. Check server logs on connection errors

If the driver still sees "Connecting...":

1. In cPanel, open **Metrics** → **Errors** or your app logs.
2. Look for lines like:
   - `[Socket] Rejected: Missing auth token` → token not sent from app
   - `[Socket] Rejected: JWT secret not configured` → set `JWT_SECRET` in env
   - `[Socket] Rejected: Invalid or expired token` → token expired or wrong secret

### 5. Mobile app configuration

- Socket URL must match the API domain: `http://deliveryappapi.negadrasexpress.net` (or `https://` if using SSL).
- The app sends the JWT via `setAuth({ token })` – ensure the user is logged in and the token is valid.
- Transports are set to `['polling', 'websocket']` so it works when WebSocket is blocked.
