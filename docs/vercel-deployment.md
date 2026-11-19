# Deploy to Vercel

The application needs a cloud PostgreSQL database. The Docker database at
`localhost:5432` cannot be reached from Vercel.

## Project setup

1. Run `npx vercel login`, then `npx vercel link` from the project directory.
2. Create or connect PostgreSQL in the Vercel project's Storage section.
3. Configure these server-only environment variables in the Production environment:

   - `DATABASE_URL`: the cloud PostgreSQL connection string, with TLS as required by the provider.
   - `ADMIN_USERNAME`: administrator username.
   - `ADMIN_PASSWORD_HASH`: the existing scrypt `salt:hash` value or a separately configured production hash.
   - `ADMIN_SESSION_SECRET`: a private random secret of at least 32 characters.
   - `ADMIN_COOKIE_SECURE`: `true` for Vercel HTTPS.

Do not upload `.env`, the local administrator credential file, or test submission
ledgers. `.vercelignore` excludes them. Do not copy Docker's `POSTGRES_*` settings
to Vercel; they configure only the local database container.

## Initialize the cloud database

Use the cloud `DATABASE_URL` in the shell environment when running these commands.
Keep the local Docker `.env` unchanged.

```powershell
npm run db:generate
npm run db:deploy
```

The migration creates the schema. The idempotent seed creates the campaign and
15 krathong designs, and disables retired choices. It does not import local user posts.

## Publish and verify

```powershell
npx vercel --prod
```

Check the homepage, `/api/submissions`, `/admin/login`, music playback and the
mobile layout. The submissions endpoint must not return `databaseReady: false`.
Verify that an approved public wish can be opened through its share link.

The local administrator currently uses in-memory login throttling. For a public
launch, shared throttling is needed across Vercel function instances, together
with submission rate limiting.
