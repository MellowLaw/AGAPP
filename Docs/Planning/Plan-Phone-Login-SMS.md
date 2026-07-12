# Future Plan — Phone-number login + SMS OTP (Philippines)

> **Status:** 🔵 Future / not started · idea captured 2026-07-06 · NOT scheduled.
> **Goal:** replace (or add alongside) email login with **phone-number + SMS OTP** login,
> using a cost-efficient, legitimate SMS provider for the Philippines.

## Why (and the honest trade-offs)

- **For:** most Filipino citizens have a mobile number but not necessarily an email they
  check; phone+OTP is lower-friction and matches how PH services (GCash, banks, gov apps)
  onboard. Good fit for the "rural municipality / low digital literacy" thesis framing.
- **Against / cost:** SMS costs real money per message (email is free), OTP delivery can
  be slow/unreliable on some networks, and phone numbers are PII under RA 10173 (needs a
  privacy-notice update + consent). Budget for delivery failures and a resend flow.
- **Recommendation:** keep email as a fallback/secondary rather than a hard replacement,
  at least through the capstone — so a demo never dies on an undelivered OTP.

## SMS provider recommendation (verify pricing at signup — rates change)

**Primary: Semaphore (semaphore.co)** — Manila-based SMS gateway, the de-facto default
for Philippine developers. Simple REST API, supports OTP, local/registered sender names,
pay-as-you-go with no monthly minimum. Pricing is roughly **₱0.50–0.80 per SMS** (regular
vs. priority) — markedly cheaper than global providers for PH destinations, and no
international A2P sender-ID registration hassle. This is the one I'd default to.

**Alternatives (if Semaphore doesn't fit):**
- **Movider** — SEA-focused SMS API, competitive PH rates, similar simple REST model.
- **Twilio** — global, rock-solid, great docs, but ~₱2.5+/SMS to PH and now requires
  A2P / sender-ID registration for reliable delivery. Overkill/pricey for a PH-only app,
  but it's the safest "it will just work" option and is a **built-in Supabase phone
  provider** (see below).
- **Vonage / MessageBird** — also built-in Supabase phone providers; global pricing,
  similar to Twilio.
- Avoid random resellers with no clear business entity — stick to the named ones above.

## Architecture (how it plugs into what we have)

Supabase Auth has **native phone/OTP login** (`signInWithOtp({ phone })` +
`verifyOtp`). The catch: its *built-in* SMS providers are **Twilio, MessageBird, Vonage,
Textlocal** — **Semaphore is not built in.** Two paths:

1. **Cheapest (Semaphore): use Supabase's "Send SMS" Auth Hook.** Supabase lets you
   override OTP delivery with a custom hook (an Edge Function / webhook) that receives the
   phone + OTP and sends it via *any* gateway — point it at Semaphore's API. You get
   Supabase's OTP generation/verification/session handling for free, but pay Semaphore's
   cheap PH rate. This is the recommended combo.
2. **Simplest (Twilio/Vonage): flip on a built-in provider** in Supabase Dashboard → Auth
   → Phone, paste the provider's API keys, done — no hook needed, but you pay the pricier
   global rate.

### Work involved (rough)
- **DB/auth:** enable phone auth; `users` gets a `phone` column (unique); decide
  email-optional vs required. Handle existing email accounts (link a phone, or migrate).
- **The signup trigger** (`handle_new_citizen_signup`) reads `email` — it would need to
  handle phone-only signups (email may be null).
- **Mobile:** new phone-entry + OTP-code screens (replace/augment `LoginScreen`), resend
  timer, error states (use the new toast). Country-code handling (+63).
- **Provider:** Semaphore account + API key (server-side only, like the other secrets),
  the Supabase Send-SMS hook (Edge Function) if going the Semaphore route.
- **Compliance:** privacy notice update (phone = PII), consent copy, rate-limit OTP sends
  (both Supabase's built-in auth rate limit and Semaphore cost caps).

## Open decisions (for when this is picked up)
- Replace email entirely, or phone-primary with email fallback? (Recommend: keep both.)
- Semaphore via hook (cheap, a bit more setup) vs. Twilio built-in (pricey, zero setup)?
- Is OTP login in scope for the capstone demo, or a documented "future work" item? (The
  manuscript could cite it as planned enhancement without building it.)
