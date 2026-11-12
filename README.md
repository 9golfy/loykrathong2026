# TH Seasons — Loy Krathong Online

Starter project for a Thai Loy Krathong online experience. Includes a responsive landing page, krathong design picker, wish submission flow, public wishes section, Next.js API route, Prisma data model, PostgreSQL migration, seed data, and Docker Compose setup.

## Stack

- Next.js App Router + TypeScript
- Prisma ORM 7 + PostgreSQL driver adapter
- PostgreSQL 17
- Docker Compose
- Responsive CSS with reduced-motion support

## Run with Docker

1. Copy `.env.example` to `.env` and replace `POSTGRES_PASSWORD` with a private password.
2. Start the services:

   ```bash
   docker compose up --build
   ```

3. Open `http://localhost:3000`.

The app container runs the database migration and seeds the campaign plus four krathong styles before starting Next.js:

```bash
docker compose logs -f app
```

## Run Next.js outside Docker

Start PostgreSQL with Docker Compose, then set `DATABASE_URL` in `.env` to point to `localhost:5432`.

```bash
npm install
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

## Important behavior in this starter

- New submissions are saved as `PENDING`. Sign in at `/admin/login`, then approve or hide them at `/admin`. Approved public wishes can be read and shared; approving a private wish never makes it public.
- The homepage river, public wishes and public counter include only approved public submissions. Newly submitted wishes wait for moderation, including in the submitter's own browser. The page checks for approvals every 15 seconds.
- A simple single-administrator dashboard is available for local testing. Configure `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (`salt:hash`, using scrypt with a 16-byte hex salt and a 64-byte derived key), and `ADMIN_SESSION_SECRET` (at least 32 characters). Local test credentials are saved in the ignored `ADMIN-TEST-LOGIN.local.txt` file. Never publish that file.
- Admin sessions expire after eight hours and use signed HttpOnly, SameSite cookies. Set `ADMIN_COOKIE_SECURE=false` only for local HTTP testing; use `true` with HTTPS. Login throttling is in memory for this single-container test setup.
- Submission rate limiting, image uploads, and a privacy-policy page are not implemented yet.
- Do not expose PostgreSQL port `5432` publicly in production. Use a private network and managed secrets.

## Folder map

```text
app/                 Next.js routes, API, global styles
components/          Loy Krathong interactive experience
lib/                 Prisma singleton
prisma/               Schema, initial migration, seed
Dockerfile            Multi-stage production image
docker-compose.yml    App and PostgreSQL services
```
