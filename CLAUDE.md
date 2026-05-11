# ReMake — Project Documentation

## What is ReMake?

**ReMake** is an AI-powered makeup self-analysis mobile app built with Expo/React Native. Users photograph their face with the device camera and receive:
- An overall makeup score (0–100)
- Category breakdowns: Complexion, Eyes, Lips, Sculpt & Glow
- AI-generated coaching suggestions for improvement
- Streak tracking for building habit

**Business model:** Freemium — one free scan, then $4.99/week or $39.99/year subscription.

**Tagline:** *"Your private beauty mirror that sees what you can't."*

Full product spec at `stage1-problem-users-value.md`.

---

## Quick Start

```bash
cd remake
npm install
npx expo start
```

**Environment variables** (copy from `.env.example` → `.env`):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_OPENAI_API_KEY` (for coaching — optional, mock data if absent)
- `EXPO_PUBLIC_YOUCAM_API_KEY` + `EXPO_PUBLIC_YOUCAM_API_ENDPOINT` (for diagnosis — optional, mock data if absent)
- `EXPO_PUBLIC_DEV_BYPASS=true` + `DEV_EMAIL`/`DEV_PASSWORD` (dev-only auth bypass, NEVER commit)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo 54 (React Native 0.81.5, New Architecture) |
| Routing | expo-router 6 (file-based) |
| Language | TypeScript |
| Auth + DB | Supabase (`@supabase/ssr`) |
| Fonts | Inter + Playfair Display via `@expo-google-fonts` |
| Animation | react-native-reanimated 4 + react-native-worklets |
| Camera | expo-camera |
| Image Picker | expo-image-picker |
| Secure Storage | expo-secure-store |
| Haptics | expo-haptics |

---

## Directory Structure

```
remake/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout: providers, fonts, routing
│   ├── index.tsx                 # Entry: redirects to /home or /onboarding
│   ├── (main)/                   # Authenticated screens (post-login)
│   │   ├── _layout.tsx
│   │   ├── home.tsx              # Redirects to /scan
│   │   ├── profile.tsx           # Stats + past analyses (mostly placeholder)
│   │   ├── settings.tsx          # Profile photo, preferences, subscription, sign-out
│   │   └── scan/
│   │       ├── index.tsx         # Camera with face-alignment guide
│   │       ├── preview.tsx       # Confirm photo before analysis
│   │       ├── loading.tsx       # Runs AI analysis, redirects to results
│   │       └── results.tsx       # Score ring, category breakdown, coaching
│   └── (onboarding)/             # Pre-auth screens
│       ├── _layout.tsx
│       ├── index.tsx             # Hook / value proposition
│       ├── features.tsx
│       ├── social-proof.tsx
│       ├── face-setup.tsx
│       ├── free-scan.tsx
│       ├── pricing.tsx
│       └── create-account.tsx
├── components/
│   ├── theme.ts                  # Design tokens (colors: warm pinks, gold, beige; fonts: Inter/Playfair)
│   ├── score-ring.tsx            # Animated circular score display
│   ├── category-item.tsx         # Score breakdown row
│   ├── suggestion-item.tsx       # Coaching suggestion with emphasis highlight
│   ├── face-corners.tsx          # Face-alignment guide overlay
│   ├── edge-flash.tsx            # Flash overlay for low-light capture
│   ├── glass-button.tsx          # Glassmorphism button
│   └── ui/                       # Icon components (gallery, flash)
├── contexts/
│   ├── AuthContext.tsx           # Supabase session + dev bypass
│   ├── user-context.tsx          # User profile + logout
│   ├── settings-context.tsx      # App settings + profile photo (secure storage)
│   └── subscription-context.tsx  # Subscription plan from DB
├── lib/
│   ├── supabase.ts               # Supabase browser client factory
│   ├── auth.ts                   # signUp, signIn, signInWithOtp, signOut, signInDev + validation
│   ├── secureStorage.ts          # XOR-obfuscated SecureStore wrapper for sensitive data
│   ├── validation.ts             # isValidEmail, isValidPassword, sanitizeString, isSafeImageUri
│   └── api/
│       ├── index.ts              # Re-exports analyzeImage + getCoaching
│       ├── types.ts              # DiagnosisResult, CoachingResult, request/response types
│       ├── diagnosis.ts          # YouCamDiagnosisProvider (PLACEHOLDER — returns mock data)
│       ├── coaching.ts           # GPT4oMiniCoachingProvider (PLACEHOLDER — returns mock data)
│       ├── secureClient.ts       # secureFetch with timeout + error sanitization
│       └── rateLimiter.ts        # Token-bucket rate limiter (30 req/min default)
├── hooks/
├── supabase/migrations/
│   └── 001_initial_schema.sql    # Full DB schema with RLS + triggers
├── stage1-problem-users-value.md # Full product specification
├── .env.example                  # Env var template + production checklist
└── package.json
```

---

## App Flow

### Scan Flow
1. `/scan` — Camera with face guide overlay, gallery picker, flash toggle
2. `/scan/preview` — Confirm or discard photo; mirror toggle
3. `/scan/loading` — Validates URI (SSRF protection: only `file://` or `content://`), calls AI, redirects
4. `/scan/results` — Animated score ring, 4 category scores, coaching suggestions

### Onboarding
10+ screens: Hook → Value prop → Features → Social proof → Face setup → Free scan → Pricing → Create account

### Auth Flow
- Supabase email/password or OTP
- Dev bypass: `EXPO_PUBLIC_DEV_BYPASS=true` with `DEV_EMAIL` + `DEV_PASSWORD` env vars (dev only)
- Sign-out clears onboarding flag and redirects to `/onboarding`

---

## AI API Architecture

### `lib/api/diagnosis.ts` — Image Analysis (YouCam or any vision provider)
- Currently returns **mock data** (random scores + template suggestions)
- Wire up by setting `EXPO_PUBLIC_YOUCAM_API_KEY` + `EXPO_PUBLIC_YOUCAM_API_ENDPOINT`
- The `withNimRateLimit` wrapper handles rate limiting
- Supports: YouCam, OpenAI Vision, Google Cloud Vision, Azure, Replicate

### `lib/api/coaching.ts` — Coaching Suggestions (GPT-4o mini)
- Currently returns **mock data** (template-based suggestions)
- Wire up by setting `EXPO_PUBLIC_OPENAI_API_KEY`
- Falls back to placeholders if no API key

### `lib/api/rateLimiter.ts` — Token bucket rate limiter
- Default: 30 requests/minute
- `withNimRateLimit(fn)` wraps API calls with rate limiting + exponential backoff retry

---

## Database Schema (Supabase)

Tables: `profiles`, `scans`, `streaks`, `subscriptions` — all with Row Level Security policies scoped to `auth.uid()`. Triggers auto-create a profile + streak row on new user signup, and update streak on new scan.

---

## Security

- Image URIs validated: must be `file://` or `content://`, no path traversal (`..`, `%2e%2e`)
- Auth inputs: sanitized lowercase email, stripped names, validated passwords
- Error responses sanitized — no stack traces or internal paths leaked
- Dev bypass auth: only reads from env vars, never logs credentials
- Production checklist in `.env.example`: disable dev bypass, SSL pinning, secure-store, ProGuard

---

## What's Incomplete / TODO

### Critical (must fix before shipping)
1. **Wire up YouCam API** in `lib/api/diagnosis.ts` — get credentials from youcam.com/developers
2. **Wire up OpenAI API** in `lib/api/coaching.ts` — set `EXPO_PUBLIC_OPENAI_API_KEY`
3. **Set `EXPO_PUBLIC_DEV_BYPASS=false`** in production
4. **Persist scan results to Supabase** — currently `/scan/loading.tsx` doesn't write to the `scans` table
5. **Implement subscription/payment flow** — currently pricing page just navigates to create-account

### Missing Features
- Profile screen: stats (`--` placeholders) need to query the `scans` and `streaks` tables
- Streak mechanics from spec: freeze, milestone rewards (badges, coupons, Sephora gift cards)
- Push notifications (toggle exists but nothing fires)
- Replace XOR obfuscation with proper encryption for profile photos

---

## Design System

See `components/theme.ts` for tokens:

**Colors:** Warm pinks (`pinkDeep #E8A0AA`, `pinkRich #D98A96`), ivory/cream/beige neutrals, gold accents (`gold #D4AF37`)

**Fonts:** Inter (UI), Playfair Display (headings/display)

**Brand:** Luxe-girly — soft pinks, warm ivories, gold accents, serif typography. Tone: warm, confident, encouraging, expert but never condescending.

---

## Git

```
Branch: master
Remote: origin → https://github.com/kyzltrade-cpu/ReMake.git
Status: clean, up to date with origin/master
```

Other remotes: `origin-makespace`, `origin-remake`, `remake` (kyzl225), `upstream`

---

## How to Continue Building

1. **Fix TODOs above** — particularly wire up real AI APIs
2. **Build subscription flow** — integrate Stripe or another payment provider
3. **Build profile/stats** — query `scans` and `streaks` tables, show real data
4. **Build streak mechanics** — implement freeze, milestones, rewards per spec
5. **Build notification system** — expo-notifications for scan reminders
6. **Production hardening** — replace XOR obfuscation, add SSL pinning, ProGuard