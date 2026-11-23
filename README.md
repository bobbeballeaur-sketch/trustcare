# TrustCare

Find the right **verified** doctor in Indore, in your language — and book an appointment that actually happens.
Web Development group project, IIM Indore. **All doctors, patients and reviews are fictional demo data.**

## Run it locally
1. Install Node.js 20+ and PostgreSQL.
2. Create a `.env` file:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/trustcare"
   DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@localhost:5432/trustcare"
   ```
3. `npm install`, then `npm run build` (creates the tables and loads demo data), then `npm start`.
4. Open http://localhost:3000 — demo logins use the password `Demo@1234` (see the login page).

## Deploy on Vercel
Import this repository, add a **Neon** Postgres database under Storage, and redeploy.
The build creates the tables and loads the demo data automatically.

## Tech
Next.js 16 (React, TypeScript), Tailwind CSS, PostgreSQL + Prisma, Zod validation (browser + server),
Cloudflare Turnstile CAPTCHA, Mapbox map, WebRTC video calls, GSAP + Lenis animations.
Hero video: Mixkit free stock footage (see `public/media/CREDITS.txt`).
