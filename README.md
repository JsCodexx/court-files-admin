# Court Files Superadmin

Standalone React dashboard for superadmins. It calls the same **court-files-server** API as the main Court Files app (`court_files`).

## Setup

1. Apply migration `0013_superadmin_settings` on your database (`npm run db:migrate` in `court_files_server`).
2. Promote a user to superadmin (SQL), e.g.:

   ```sql
   UPDATE users SET is_superadmin = 'true' WHERE email = 'you@example.com';
   ```

3. In `court_files_server`, add the dashboard origin to CORS:

   ```env
   CORS_ORIGIN=http://localhost:4400,http://localhost:5173
   ```

4. Copy `.env.example` to `.env` and set `VITE_API_URL` (default `http://localhost:5500`).

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with the superadmin account (not the regular app login).

## Admin API (server)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/auth/login` | Superadmin login (JWT with `role: superadmin`) |
| GET | `/api/admin/users` | All users + subscription cache |
| PATCH | `/api/admin/users/:userId/active` | `{ "isActive": true/false }` |
| GET | `/api/admin/payments` | Recent payments |
| GET | `/api/admin/subscriptions` | Subscription profiles |
| GET/PUT | `/api/admin/plans/prices` | Monthly/yearly PKR amounts |
| GET | `/api/admin/revenue?months=12` | Paid revenue by month |
