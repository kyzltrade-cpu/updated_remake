# ReMake — Product Requirements Document

**Version:** 1.0  
**Last updated:** 2026-05-29  
**Repo:** `github.com/kyzltrade-cpu/updated_remake` (branch: `api-start`)  
**Working directory:** `/Users/kylecheung/updated_remake`

---

## 1. Product Overview

### What is ReMake?
ReMake is an AI-powered makeup self-analysis iOS app. Users photograph their face and receive a scored breakdown of their makeup application plus AI coaching. A separate "Beauty DNA" flow analyses facial features to produce a personalised makeup archetype, colour season, and curated product recommendations.

### Tagline
*"Your makeup, analysed. Daily."*

### Target User
Women aged 18–35 who wear makeup regularly, range from casual to enthusiast, and want personalised feedback without booking a makeup artist. They scroll beauty content, shop on Sephora, and are comfortable with AI tools.

### Core Value Props
1. **Instant makeup scoring** — camera → score in seconds, no human review
2. **Personalised coaching** — specific, actionable tips per category, not generic advice
3. **Beauty DNA reveal** — a Spotify Wrapped-style animated reveal of face shape, colour season, and archetype
4. **Curated product edit** — 6 categories × 3 products matched to your DNA archetype, each tappable to Sephora

### Business Model
Freemium. One free scan on signup, then subscription required.

| Plan | Price |
|------|-------|
| Weekly | $2.99/week |
| Monthly | $5.99/month |
| Annual | $49.99/year (save 68%) |

Pro unlocks: detailed coaching + watch tutorial button on face scan, full DNA reveal slides, curated product picks, unlimited scans.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo 54 / React Native 0.81.5 (New Architecture) |
| Routing | expo-router 6 (file-based) |
| Language | TypeScript (strict) |
| Auth + DB | Supabase (PostgreSQL + RLS + Realtime) |
| AI — face scan | Gemini Vision (`lib/api/diagnosis.ts`) |
| AI — DNA analysis | Gemini Vision (`lib/api/dna.ts`) |
| AI — product scan | Gemini Vision (`lib/api/product-scan.ts`) |
| AI — coaching | GPT-4o mini (`lib/api/coaching.ts`) |
| Animation | react-native-reanimated 4 + react-native-worklets |
| Camera | expo-camera |
| Image picker | expo-image-picker |
| Secure storage | expo-secure-store |
| Haptics | expo-haptics |
| Fonts | Inter + Playfair Display (`@expo-google-fonts`) |
| Audio | expo-av (DNA reveal music) |
| Share | expo-sharing + react-native-view-shot |
| Deep links | expo-linking |

**Supabase project ID:** `iednrmfazgqrnqwebppn`

---

## 3. Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_GEMINI_API_KEY        # Face scan, DNA, product scan
EXPO_PUBLIC_OPENAI_API_KEY        # Coaching suggestions (optional, mock if absent)
EXPO_PUBLIC_DEV_BYPASS=true       # Dev only — bypasses auth, skips to onboarding
EXPO_PUBLIC_DEV_EMAIL
EXPO_PUBLIC_DEV_PASSWORD
```

> **Note:** With `DEV_BYPASS=true`, the app always removes the onboarding key on launch and redirects to `/(onboarding)`. Disable in production.

---

## 4. Design System

### Colors (`components/theme.ts`)

| Token | Hex | Usage |
|-------|-----|-------|
| `text` | `#3D3532` | Body text, headings |
| `white` | `#FFF9F7` | Card backgrounds |
| `cream` | `#FDF0EC` | Screen backgrounds |
| `beige` | `#FBE8E3` | Secondary backgrounds |
| `pinkDeep` | `#E8399A` | Primary CTA, active states |
| `pinkRich` | `#C2187A` | Deep accent |
| `accent` | `#D63384` | Bold magenta — CTAs |
| `gold` | `#D4AF37` | DNA reveal accent, rewards |
| `border` | `#FAD0E8` | Card borders, dividers |
| `gray` | `#9A8E8A` | Secondary text |

### Fonts
- **Inter** — all UI text, labels, body
- **Playfair Display** — display headings, italic reveal text, brand wordmark

### Brand Voice
Warm, confident, encouraging. Expert but never condescending. Luxe-girly aesthetic: soft pinks, warm ivories, gold accents, serif typography.

---

## 5. Database Schema (Supabase)

All tables use Row Level Security scoped to `auth.uid()`.

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK, FK → auth.users) | |
| `name` | text | |
| `email` | text | |
| `avatar_url` | text | |
| `skin_type` | text | From onboarding |
| `created_at` | timestamptz | |

### `scans`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `image_uri` | text | `file://` path |
| `overall_score` | numeric | 0–100 |
| `verdict` | text | `GO` or `FIX` |
| `categories` | jsonb | Array of CategoryAnalysis |
| `coaching_compliment` | text | |
| `coaching_tips` | jsonb | |
| `created_at` | timestamptz | |

### `streaks`
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid PK FK | |
| `current_streak` | int | Days in a row |
| `longest_streak` | int | |
| `last_scan_date` | date | |
| `freeze_count` | int | Streak freezes available |

### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid PK FK | |
| `plan` | text | `free`, `pro` |
| `expires_at` | timestamptz | |

---

## 6. Navigation Architecture

```
app/
├── index.tsx                   Entry — checks onboarding flag → (onboarding) or (main)/home
│
├── (onboarding)/               Pre-auth flow (16 screens)
│   ├── index.tsx               Splash — "REMAKE" wordmark, 2s delay → value
│   ├── value.tsx               Hook screen — "Your private beauty mirror"
│   ├── pain-point.tsx          "You never know if your makeup actually looks good"
│   ├── features.tsx            3 feature highlights
│   ├── social-proof.tsx        Testimonials / trust signals
│   ├── name.tsx                "What should we call you?"
│   ├── skin-type.tsx           Skin type selection (dry/oily/combo/normal/sensitive)
│   ├── skin-goals.tsx          Multi-select goals (coverage, longevity, glow, etc.)
│   ├── allergies.tsx           20 real cosmetic allergen toggles + custom add
│   ├── ethics.tsx              Cruelty-free / vegan / eco preferences
│   ├── foundation-pain.tsx     "What's your biggest foundation struggle?"
│   ├── frequency.tsx           How often they do their makeup
│   ├── skill.tsx               Skill level (beginner / intermediate / advanced)
│   ├── style-archetype.tsx     Visual style preference selection
│   ├── tone-guess.tsx          Skin tone guess (warm / cool / neutral)
│   ├── lighting.tsx            Lighting tips before first scan
│   ├── first-scan.tsx          Camera capture for DNA analysis
│   ├── dna-loading.tsx         Runs analyzeDna → stores result → navigates to dna-reveal
│   ├── email-capture.tsx       Email input before account creation
│   ├── camera-permission.tsx   Camera permission request screen
│   └── create-account.tsx      Password creation → Supabase signUp → (main)/home
│
└── (main)/                     Authenticated screens
    ├── home.tsx                Immediately redirects to scan
    ├── scan/
    │   ├── index.tsx           Camera — face mode / product mode toggle, UV popup, gallery, flash
    │   ├── preview.tsx         Photo confirm / retake / mirror toggle
    │   ├── loading.tsx         Runs analyzeImage + analyzeDna + getCoaching → scan/results
    │   └── results.tsx         Score ring + GO/FIX verdict + category breakdown + coaching
    ├── dna-reveal.tsx          16-slide Spotify Wrapped-style DNA reveal (see §8)
    ├── wrapped.tsx             "Beauty Wrapped" stats screen (scan history stats)
    ├── product-scan/
    │   ├── results.tsx         Product analysis (shade match, SPF, ingredients, ethics)
    │   └── compare.tsx         Side-by-side product duel with winner verdict
    ├── paywall.tsx             Subscription plans + RevenueCat TODO
    ├── profile.tsx             Scan history, streak, stats → links to dna-reveal
    └── settings.tsx            Profile photo, preferences, sign-out
```

---

## 7. Onboarding Data (`lib/glo-profile.ts`)

Data collected during onboarding is saved to AsyncStorage under `@glo_profile_draft` as a `GloProfileDraft` object:

```typescript
interface GloProfileDraft {
  skin_goals: string[];       // e.g. ['Full coverage', 'Long-wear']
  skin_type: string;          // 'Dry' | 'Oily' | 'Combination' | 'Normal' | 'Sensitive'
  allergies: string[];        // e.g. ['Fragrance / Parfum', 'Parabens']
  ethics: string[];           // e.g. ['Cruelty-free', 'Vegan']
  foundation_pain: string;    // e.g. 'Oxidises by midday'
  usual_brand: string;
  undertone_guess: string;    // 'Warm' | 'Cool' | 'Neutral'
  vibe_picks: string[];
  bare_photo_uri: string;     // file:// URI from first-scan
  // Gemini results from first-scan analysis:
  undertone: string;
  face_shape: string;
  skin_hex: string;
  colour_season: string;
  archetype: string;
}
```

---

## 8. DNA Reveal (`app/(main)/dna-reveal.tsx`)

The centrepiece feature. A 16-slide, Spotify Wrapped-style animated reveal with:
- Crossfading dark gradient backgrounds per slide
- Music system (7-track crossfade)
- Sparkle particle overlay
- Staggered text/element animations via `react-native-reanimated`
- Haptic feedback on finale

### Slide Order

| Index | Slide | Content |
|-------|-------|---------|
| 0 | Canvas | Archetype intro, skin tone swatch |
| 1 | Season | Colour season reveal with animated bar chart |
| 2 | Face Shape | Face shape with icon + analysis |
| 3 | Brows | Brow shape + symmetry % |
| 4 | Lashes | Lash profile with icon |
| 5 | Energy | Makeup energy type (Sharp/Soft/Balanced) |
| 6 | Archetype | Full archetype name reveal (THE reveal) |
| 7 | Lips | Lip profile swatch |
| 8 | Blush | Blush placement dots |
| 9 | Foundation | 3 foundation picks (shopping cards) |
| 10 | Blush picks | 3 blush picks |
| 11 | Mascara | 3 mascara picks |
| 12 | Eye | 3 liner/eye picks |
| 13 | Lip picks | 3 lip picks |
| 14 | Skincare | 3 toner/skincare picks |
| 15 | Summary | Final identity card + share |

### Product Recommendation Slides (9–14)

Each slide shows:
- Left-aligned header: `[Category italic]` + `[X/6 counter]` on one row
- Subtitle copy below
- 3 white shopping cards, each:
  - Brand (all-caps label) + Price pill (Budget/Mid-range/Premium) — top row
  - Product name (semi-bold)
  - "Why" copy (1 line, gray)
  - "🛍 Shop on Sephora →" row — taps to `sephora.com/search?keyword=Brand+Product`
  - Whole card is tappable

**Locked state** (free users): Cards render as frosted white placeholders (`rgba(255,255,255,0.10)`) matching the card shape, with shimmer bars. Persistent white "Unlock Everything" strip at screen bottom — no duplicate button on the final slide.

### DNA Result Model (`lib/api/dna.ts`)

```typescript
interface DnaResult {
  skinToneHex: string;          // e.g. '#C9956A'
  colorSeason: ColorSeason;     // 'Warm Autumn' | 'Cool Summer' | ... (8 values)
  faceShape: FaceShape;         // 'Oval' | 'Round' | 'Heart' | 'Square' | 'Oblong'
  browShape: BrowShape;         // 'Soft Arch' | 'High Arch' | 'Flat' | 'S-Curve' | 'Tapered'
  browSymmetryPct: number;      // 70–100
  lashProfile: LashProfile;     // 'Long & Sparse' | 'Short & Full' | ...
  energy: EnergyType;           // 'Sharp' | 'Soft' | 'Balanced'
  archetype: string;            // One of 8 named archetypes (see §9)
  archetypeDescription: string;
  lipProfile?: string;
  blushProfile?: string;
  foundationShade?: string;
}
```

---

## 9. The 8 Archetypes

Each archetype maps to 6 category kits (Foundation, Blush, Mascara, Eye, Lip, Skincare) × 3 product picks in `lib/api/recommendations.ts`.

| Archetype | Character |
|-----------|-----------|
| The Glazed Canvas | Glass skin, dewy luminosity, minimal colour |
| The Soft Romantic | Peachy warmth, blurred edges, candlelit feel |
| The Editorial Eye | Graphic liner, bold structure, muted lip |
| The Power Contour | Sculpted, chiselled, full-coverage base |
| The Dark Feminine | Deep tones, smoky, moody and dramatic |
| The Radiant Minimalist | Clean, one-product, effortless flush |
| The Color Curator | Artistic colour theory, unexpected pairings |
| The Classic Glamour | Timeless, polished, red lip and defined brow |

---

## 10. Face Scan Flow

### Camera (`scan/index.tsx`)
- Two modes: **Face** (makeup analysis) and **Product** (product scan)
- Face mode: shows `FaceCorners` alignment guide overlay
- Product mode: shows barcode scanner + product camera
- UV popup showing current UV index and SPF recommendation (mock data currently)
- Gallery picker, flash toggle, compare mode (select two products)

### Analysis Pipeline (`scan/loading.tsx`)
Runs in parallel:
1. `analyzeImage()` → `DiagnosisResult` (makeup scores)
2. `analyzeDna()` → `DnaResult` (stores to AsyncStorage for DNA reveal)
3. `getCoaching({ diagnosis })` → `CoachingResult`

Navigates to `scan/results` with all three payloads as JSON params.

### Results (`scan/results.tsx`)
- Animated `ScoreRing` (0–100, gradient arc)
- `GO` (green) / `FIX` (amber) verdict badge + score delta vs last scan
- AI compliment in italic serif
- Category cards (Blending, Symmetry, Colour Harmony, Coverage, Cleanliness, Brow Framing):
  - Score bar (colour-coded red/amber/green)
  - Short tip (free) or full tip + YouTube tutorial link (pro)
- Done button → home

### Loading Screen
Light beige shimmer skeleton (circular placeholder + card shimmer bars). Uses `components/loading-screen.tsx`.

---

## 11. Product Scan Flow

### Trigger
From `scan/index.tsx` in product mode:
- Photo of product → `product-scan/results`
- Barcode scan → `product-scan/results`
- Gallery pick → `product-scan/results`
- Compare mode: selects two products → `product-scan/compare`

### Product Analysis (`lib/api/product-scan.ts`)
**Currently returns mock data for all calls** (`analyzeProductReal` exists but is not called).

Mock result always returns:
- Fenty Beauty Pro Filt'r, score 87, shade match 94%, with skin fit / SPF / ingredients / ethics data

### Results (`product-scan/results.tsx`)
Cards displayed:
1. **Score ring** + brand · product name + verdict sentence
2. **Shade & Tone** — skin swatch vs product swatch, ΔE, tone grid
3. **Coverage & Finish** — finish type, wear time, SPF
4. **SPF Reality Check** — SPF level badge, flashback warning
5. **Skin Compatibility** — 4 rows (dry/sensitive/oily/acne-safe) with Great/Caution badge
6. **Style Fit** — archetype pill + description + palette dots
7. **Safety Check** — allergy alert + ingredient list (safe/unsafe dots)
8. **Conscious Choice** — cruelty-free / vegan / eco badges
- Sticky "Save" button + PAO expiry reminder

### Compare (`product-scan/compare.tsx`)
- Side-by-side product duel card (Product A vs B)
- 5 metric rows: Shade Match, Skin Fit, Safety, SPF Protection, Ethics
- Winner highlighted with colour accent
- "The better pick for your skin" verdict card with rationale
- Done button

---

## 12. Paywall (`app/(main)/paywall.tsx`)

Three plan tiles (Weekly $2.99 / Monthly $5.99 / Annual $49.99).  
Value bullets: detailed coaching, tutorials, full DNA reveal, archetype card, unlimited scans.  
**RevenueCat purchase flow is TODO** — currently the subscribe button is wired but not connected.

After successful payment: create account → `dna-loading` (runs full DNA analysis) → `dna-reveal`.

---

## 13. AI APIs

### Current Status

| API | File | Status | Key |
|-----|------|--------|-----|
| Face analysis | `lib/api/diagnosis.ts` | **Live (Gemini)** | `EXPO_PUBLIC_GEMINI_API_KEY` |
| DNA analysis | `lib/api/dna.ts` | **Live (Gemini)** | `EXPO_PUBLIC_GEMINI_API_KEY` |
| Coaching | `lib/api/coaching.ts` | Mock | `EXPO_PUBLIC_OPENAI_API_KEY` |
| Product scan | `lib/api/product-scan.ts` | **Mock (hardcoded)** | — |

### Diagnosis Result Model (`lib/api/types.ts`)

```typescript
interface DiagnosisResult {
  overallScore: number;         // 0–100
  verdict: 'GO' | 'FIX';
  categories: CategoryAnalysis[];
}

interface CategoryAnalysis {
  name: SixCategory;            // 'Blending' | 'Symmetry' | 'Colour Harmony' | 'Coverage' | 'Cleanliness' | 'Brow Framing'
  score: number;                // 0–100
  weight: number;               // Percentage weight in overall score
  isPriority: boolean;
  tip: string;                  // Full tip (pro)
  tipShort: string;             // Short tip (free)
  tutorialQuery: string;        // YouTube search query
}
```

### Mock Fallback Pattern
All API functions check `hasGeminiKey()` / have a `mockResult()` function. If key is absent or Gemini fails, mock data is returned silently. Product scan currently returns mock unconditionally.

---

## 14. Allergen List (Onboarding)

20 real cosmetic allergens shown as toggles in `app/(onboarding)/allergies.tsx`:

Fragrance/Parfum, Parabens, Sulfates (SLS/SLES), Alcohol/Denatured Alcohol, Silicones (Dimethicone), Synthetic Dyes & Colorants, Propylene Glycol, Nickel, Lanolin, Oxybenzone (Chemical SPF), Retinol/Vitamin A, AHAs/Glycolic Acid, Salicylic Acid, Niacinamide, Lavender Oil, Tea Tree Oil, Coconut Oil/Derivatives, Nut Oils (Almond/Argan), Carmine (Red Dye), Gluten/Wheat Protein.

Users can also type and add custom allergens. Selected allergens are saved to `GloProfileDraft.allergies` and used to filter product recommendations.

---

## 15. Settings & Profile

### Settings (`app/(main)/settings.tsx`)
- Reference photo (used in product shade matching)
- Notifications toggle (wired but not implemented)
- Subscription management
- Sign out

### Profile (`app/(main)/profile.tsx`)
- Links to `dna-reveal` for full DNA breakdown
- Scan history list (date, score, delta, compliment)
- Stats: total scans, longest streak, best score

---

## 16. What Is Built vs TODO

### Built ✓
- Full 16-screen onboarding with data collection
- Camera scan with face alignment guide and UV popup
- Face scan analysis (Gemini) + results screen with coaching
- DNA reveal (16 animated slides) with music, sparkles, morphing backgrounds
- 8 archetypes × 6 categories × 3 product picks with Sephora deep links
- Product scan results (mock data)
- Product compare (mock data)
- Paywall UI with 3 plan tiers
- Supabase auth (email/password + dev bypass)
- Supabase schema (profiles, scans, streaks, subscriptions) with RLS
- Settings screen
- Profile screen with scan history

### TODO — Critical for Ship
| Item | File | Notes |
|------|------|-------|
| RevenueCat payment | `paywall.tsx` | `handleSubscribe` is a stub |
| Wire coaching API | `lib/api/coaching.ts` | Needs `EXPO_PUBLIC_OPENAI_API_KEY` |
| Wire product scan | `lib/api/product-scan.ts` | `analyzeProductReal` exists, not called |
| Save scans to DB | `scan/loading.tsx` | `saveScan` call is missing |
| Real subscription check | `subscription-context.tsx` | Currently hardcoded to `free` |
| Push notifications | `settings.tsx` | Toggle exists, nothing fires |

### TODO — Post-Launch
| Item | Notes |
|------|-------|
| Streak mechanics | Freeze, milestones, Sephora gift card rewards |
| Wrapped screen data | Real scan history stats (currently uses mock) |
| Profile stats | Wire to `scans` + `streaks` tables |
| SSL pinning | Production hardening |
| RevenueCat webhooks | Sync subscription state to Supabase |
| App Store submission | Icons, screenshots, review copy |

---

## 17. File Quick-Reference

```
lib/api/
  diagnosis.ts        Face scan — Gemini Vision → DiagnosisResult
  dna.ts              DNA analysis — Gemini Vision → DnaResult
  coaching.ts         Coaching tips — GPT-4o mini → CoachingResult
  product-scan.ts     Product analysis — mock (analyzeProductReal not wired)
  recommendations.ts  8 archetypes × 6 category kits × 3 picks each
  scan-storage.ts     saveScan / getLastScan / getScanHistory (Supabase)
  gemini.ts           geminiVision / geminiTextJson / uriToBase64 helpers
  shades.ts           findShades(hex) → Fenty + MAC shade name

components/
  theme.ts            Design tokens (colors, fonts)
  loading-screen.tsx  Shimmer skeleton for scan loading
  score-ring.tsx      Animated circular score display
  face-corners.tsx    Face alignment guide overlay
  onboarding-header.tsx  Step indicator + back button

contexts/
  AuthContext.tsx          Supabase session + dev bypass
  subscription-context.tsx Plan (free/pro) from DB
  settings-context.tsx     Reference photo + prefs (SecureStore)
```

---

## 18. Running the App

```bash
cd /Users/kylecheung/updated_remake
npx expo start          # Local network (same Wi-Fi) — scan QR in Expo Go
npx expo start --tunnel # Different network (requires @expo/ngrok — may be buggy)
```

**Expo Go on phone:** Scan QR code with the Expo Go app. The app is on branch `api-start`.

**Dev mode behaviour:** With `EXPO_PUBLIC_DEV_BYPASS=true`, every app launch clears the onboarding flag and starts at the splash screen. Users must go through onboarding on every cold start. This is intentional for dev — disable in production.

---

## 19. Known Issues (as of 2026-05-29)

1. `npx expo start --tunnel` fails even after `@expo/ngrok` install — use LAN mode instead
2. Product scan and compare always return mock data (Fenty Beauty Pro Filt'r) regardless of what is scanned
3. Streak stats on the Wrapped screen are derived from local scan history only (not persisted to Supabase)
4. Push notifications: toggle exists in Settings but nothing is wired
5. RevenueCat: `handleSubscribe` in `paywall.tsx` is a stub — no actual payment processed
6. `subscription-context.tsx` does not yet read from the `subscriptions` table accurately in all cases — pro features may not unlock after payment

---

*This PRD reflects the codebase as of the `api-start` branch. Always verify current state with `git log --oneline -10` before making assumptions.*
