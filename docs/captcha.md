# Captcha (Cloudflare Turnstile)

Anonymous sign-ins are on, so anyone can create a Supabase user from `/post/quick` with no email. Supabase recommends captcha protection to stop bots from creating accounts in bulk. The site uses [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/): free, usually invisible to people, no cookies for tracking (so no consent needed).

## What the code does

Every Supabase Auth call that Supabase checks for a captcha sends `options.captchaToken`:

| Page | Call |
|---|---|
| `/login` | `signInWithPassword` |
| `/signup` | `signUp` |
| `/forgot-password` | `resetPasswordForEmail` |
| `/post/quick` | `signInAnonymously` (widget shown only when the visitor has no session yet) |

- The widget renders only when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set. Empty = no widget, no token, auth works as before. This is what keeps local dev and previews working **while captcha is off in Supabase**.
- Tokens are single-use and expire after 5 minutes. After any failed auth call the widget resets and gets a new one; expired tokens refresh on their own.
- The widget uses the page locale (`fr`, `ar`, `en`) and the full width of the form, so it lines up in RTL too. The messages around it are in `messages/*.json` under `captcha`.
- Code: `src/lib/captcha.ts` (helpers, tested in `captcha.test.ts`), `src/components/Captcha.tsx` (widget + `useCaptcha` hook).

Adding a new auth call (OTP, magic link, phone…)? Give it the widget and `...captcha.options` too, or it will fail once captcha is on.

## Turning it on — in this order

**Turning captcha on in Supabase before the site sends tokens breaks every sign-in, sign-up, password reset and quick post.** Production, previews and local dev all use the same Supabase project, so all three must send tokens first.

1. **Create the widget.** Cloudflare dashboard → Turnstile → *Add widget*.
   - Name: `Maroclist`
   - Hostnames: `maroclist.com` (covers `www.`), `localhost` for local dev, and the branch alias of each preview branch you test on, e.g. `maroclist-p5rq-git-seller-growth-<team>.vercel.app`. Use the branch alias, not the per-deploy URL: the alias stays the same across pushes, while each deploy gets a new URL that would eat into the limit. No wildcards; 10 hostnames max on the free plan.
   - Widget mode: *Managed*.
   - Copy the **site key** and the **secret key**.
2. **Add the site key to Vercel** for Production *and* Preview:
   ```bash
   npx vercel@latest env add NEXT_PUBLIC_TURNSTILE_SITE_KEY production,preview --value <site-key> --force
   ```
   And to `.env.local` for local dev.
3. **Redeploy** production and the previews you use (`NEXT_PUBLIC_*` is baked in at build time).
4. **Check the widget shows** on `/fr/login`, `/ar/signup`, `/en/forgot-password` and, in a private window (no session), `/fr/post/quick`. Sign in once: it must still work, captcha being off in Supabase ignores the token.
5. **Turn it on in Supabase.** Dashboard → Authentication → *Attack Protection* (older dashboards: Project Settings → Authentication → *Bot and Abuse Protection*) → **Enable Captcha protection** → provider **Turnstile** → paste the **secret key** → Save.
6. **Test straight away**, in a private window: sign up, log in, request a password reset, and post a listing from `/fr/post/quick` without an account. If anything fails, switch captcha off again in Supabase (step 5) — that restores sign-ins instantly — then investigate.

To turn it off later: switch it off in Supabase **first**, then remove the variable if you want.

## Troubleshooting

- **"The security check didn't load"** — an ad blocker or network blocks `challenges.cloudflare.com`, or the hostname isn't in the widget's list (Cloudflare shows error 110200).
- **"The security check failed or expired"** — Supabase rejected the token (`captcha_failed`): wrong secret key in Supabase, or the site key and secret are from different widgets.
- A preview whose hostname isn't in the widget's list can't sign anyone in once captcha is on. Add the hostname, or test on production.
