Step 1: Postgres database

Pick one:

Option A — Vercel Postgres (simplest if you already deploy on Vercel)
1. Go to your project on vercel.com → Storage tab → Create Database → Postgres.
2. Follow the prompts (pick a region close to your deployment).
3. Once created, Vercel shows a Quickstart/.env.local snippet with a DATABASE_URL (or POSTGRES_URL — if it's named differently, grab that value regardless of the variable name shown).
4. If your project is linked to Vercel, vercel env pull .env will pull it down automatically — otherwise just copy the connection string.

Option B — Neon (works the same if you're not on Vercel, or want a free tier outside it)
1. Go to neon.tech → sign up/log in → Create a project.
2. On the project dashboard, copy the connection string shown (starts with postgresql://...).

Either way, send me the connection string (or paste it directly into .env yourself as DATABASE_URL=... if you'd rather not share it in chat), and I'll run the migration for you:

npx prisma migrate dev --name init_auth

This creates the User, BackupCode, PasswordResetToken,

---
Step 2: Resend (email)

1. Go to resend.com → sign up.
2. Domains → Add Domain → enter the domain you want to ). Resend gives you a few DNS records (SPF/DKIM) to addat your domain registrar. Verification usually takes a few minutes once the DNS records are live — can take up to 24-48h for some
registrars.
  - No domain yet, or don't want to wait on DNS? Resend also gives you a shared onboarding@resend.dev sender that works immediately for
testing — fine to start with, just swap EMAIL_FROM late
3. API Keys → Create API Key → copy it (starts with re_...).
4. Decide your EMAIL_FROM address — must be something@yrding@resend.dev for the test option).

Send me the API key and the from-address (or add them t_KEY=... and EMAIL_FROM=...) and I'll wire it in —though there's nothing to "wire," the code already reads those two env vars directly, so once they're set it just works.

---
Once you've got the DATABASE_URL, let me know (paste itenv") and I'll run the migration.