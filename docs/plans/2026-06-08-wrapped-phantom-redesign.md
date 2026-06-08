# ReMake Beauty DNA "Phantom & Spotify" Redesign Plan

**Goal:** Redesign the in-app Beauty DNA Wrapped slideshow to feature high-fidelity, Phantom-wallet style fluid micro-interactions, responsive SVG face/eye shape holographic vector tracing, tactile haptics, and a luxury cyber-house soundtrack, including a brand-new **Eye Shape & Celebrity Look-Alike** slide.

**Architecture:** 
- Keep all existing slides but replace standard static transitions with Snappy Spring UI cards.
- Layer a CSS/SVG-blurred multi-orb background animation that morphs continuously.
- Update `lib/api/dna.ts` and `dna-reveal.tsx` to handle the new `eyeShape` properties.
- Implement synchronized haptic clicks matching the tracing animation speeds.

**Tech Stack:** React Native, Expo, `@expo/vector-icons`, `react-native-reanimated` (v4), `react-native-svg`, `expo-blur`, `expo-av`, `expo-haptics`.

---

## Part 1: The Eye Shape Data Model & Mapping

To support the new **Eye Shape** slide, we will enrich the `DnaResult` interface in `lib/api/dna.ts` with:
* `eyeShape`: 'Siren Eye' | 'Doe Eye' | 'Almond Eye' | 'Hooded Eye' | 'Monolid Eye' | 'Dove Eye'
* `eyeMakeup`: Description of best eyeliner style, eyeshadow placement, and mascara technique.
* `celebrityLookalike`: Name of a popular celebrity sharing this eye shape.

### Pre-defined Mapping Matrix (for real AI output & mock fallbacks):
| Eye Shape | Celebrity Look-Alike | Best Eye Makeup Recommendation |
| :--- | :--- | :--- |
| **Siren Eye** | Bella Hadid | Long, outer-corner winged eyeliner, smoked-out shadow on the outer V, tight-lined waterline. |
| **Doe Eye** | Sydney Sweeney | Rounded puppy-eyeliner, bright champagne shimmer in the center of the lid, outer lash focus. |
| **Almond Eye** | Kendall Jenner | Classic cat-eye wing, halo eyeshadow blending, balanced upper and lower lash mascara. |
| **Hooded Eye** | Jennifer Lawrence | Floating liner visible when open, matte gradients blending upward past the fold, inner-corner highlighting. |
| **Monolid Eye** | Yeji (ITZY) | Smudged horizontal gradient shadow, extended thin wing, defined upper-lash volume. |
| **Dove Eye** | Lily-Rose Depp | Soft, downward-angled lash smudge, bright nude eyeliner in the waterline, feathered lashes. |

---

## Part 2: Step-by-Step Task List

### Task 1: Enrich `DnaResult` Types & AI Prompts (`lib/api/dna.ts`)
* Add the new properties to `DnaResult` interface.
* Update `DNA_PROMPT` to instruct the Nvidia NIM model to return `eyeShape` from the permitted list.
* Update the `mockDna()` generator to dynamically choose a random eye shape and select its celebrity look-alike and makeup recommendations.

### Task 2: Build the Liquid Backdrop Shader (`components/liquid-backdrop.tsx`)
* Create a dedicated absolute-filled floating background layer.
* Use overlapping animated SVG blur filters driven by looping cosine and sine waves via `withRepeat` to create the dynamic, high-end "skincare lava lamp" effect.

### Task 3: Build the SVG Holographic Vector Tracer (`components/holographic-tracer.tsx`)
* Create a component that receives a `shape` (FaceShape or EyeShape) and traces its outlines on a dark frosted card using SVG paths.
* Trace path progress using `strokeDashoffset` driven by high-stiffness spring curves (`stiffness: 300`, `damping: 28`).
* **Tactile Haptics:** Trigger rapid `Haptics.impactAsync(Light)` ticks synced on the JS-thread with the animation frame progress, culminating in a heavy `Haptics.notificationAsync(Success)` snap when the outline seals.

### Task 4: Design the Eye Shape Slide Layout (`app/(main)/dna-reveal.tsx`)
* Create `SlideEyeShape`: Displays a sleek golden SVG trace of their eye shape, their celebrity match, and interactive beauty cards containing their makeup blueprint (eyeliner style, shadows, and lashes).
* Shift downstream slide indices (moving slides 7-17 to 8-18). Total slide count increases from 18 to 19.

### Task 5: Redesign existing slides for the Hype Vibe
* Replace standard containers with frosted-glass containers (`expo-blur`) boasting micro-scale animations (`scale: 0.98` on touch).
* Integrate the vector tracer into the **Face Shape**, **Brows**, and **Lashes** slides with liquid-gold contours.
* Add the Cyber-Luxury House track (`t5.mp3` or a new royalty-free track) that auto-preloads and transitions dynamically during the reveal sequence.
