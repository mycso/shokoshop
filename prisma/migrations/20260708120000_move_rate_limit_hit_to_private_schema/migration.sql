-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "private";

-- Move RateLimitHit out of the public (Data API-exposed) schema so it is not
-- reachable via PostgREST, since it is only ever written by the app's
-- server-side Prisma connection.
ALTER TABLE "public"."RateLimitHit" SET SCHEMA "private";
