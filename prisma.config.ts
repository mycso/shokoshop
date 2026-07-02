import { defineConfig } from "@prisma/config";

// Plain process.env read (not @prisma/config's `env()` helper) — that helper throws
// immediately if the var is unset, which breaks `prisma generate` in `npm run build`
// even though generate itself never needs a live DB connection. Only `migrate`/`db push`
// and the app's own runtime queries (lib/db.ts) actually require DATABASE_URL to be set.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
