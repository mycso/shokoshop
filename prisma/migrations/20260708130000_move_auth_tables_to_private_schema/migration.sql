-- Move the remaining auth tables out of the public (Data API-exposed) schema.
-- This app has no @supabase/supabase-js usage anywhere: User, BackupCode, and
-- PasswordResetToken are only ever read/written by server-side Prisma routes,
-- so none of them need to be reachable via PostgREST.
CREATE SCHEMA IF NOT EXISTS "private";

ALTER TABLE "public"."User" SET SCHEMA "private";
ALTER TABLE "public"."BackupCode" SET SCHEMA "private";
ALTER TABLE "public"."PasswordResetToken" SET SCHEMA "private";
