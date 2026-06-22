# shokoshop

## TODOs

- [ ] **Fix "Failed to create checkout session" in production** — likely `NEXT_PUBLIC_BASE_URL` not set in Vercel env vars (Stripe rejects localhost URLs in live mode). Also confirm `STRIPE_SECRET_KEY` is a live key (`sk_live_...`) and `STRIPE_WEBHOOK_SECRET` is the live webhook secret. Check exact error in Vercel → Deployments → Functions → `/api/checkout/create-session` logs.