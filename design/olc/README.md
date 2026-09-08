# OLC — Online Learning Classroom · Design System

**OnlineLearningClassroom.com (OLC)** is a playful, Canadian, K–6-focused online
learning platform for kids (roughly ages 2–11). The product spans a **marketing
website** (parent/teacher/district facing) and a **learner app** (onboarding +
lessons, with coins, progress and animal mascots). The whole brand is designed
to "make learning feel like anything but school" — bright, friendly, rounded,
and unmistakably Canadian.

> **Sources:** built from 4 product screenshots supplied by the user
> (marketing homepage x2, app onboarding, feature cards). No codebase or Figma
> file was provided, so exact hex/spacing values are eyeball-matched from the
> screenshots — flag anything that looks off and I'll tune it.

---

## Content fundamentals

- **Voice:** warm, encouraging, kid-and-parent friendly. Second person ("your
  child", "you"). Short, confident sentences.
- **Tone examples (verbatim from screenshots):**
  - "Unlock Your Child's Potential with Online · Learning · Classroom"
  - "Canadian education that actually works"
  - "Learning shouldn't be one-size-fits-all."
  - "Fun and Joyful learning at home"
  - "K–6 is where our teachers built the deepest content."
- **Casing:** Title Case for hero headlines; sentence case for body and helper
  text. The three brand words **Online · Learning · Classroom** are always shown
  as highlighted tags separated by middots.
- **Canadian pride is a content pillar** — the maple leaf 🍁 and phrases like
  "Aligned to the Canadian Curriculum" / "Built by 4 Canadian teachers" recur.
- **Emoji / mascots:** the brand leans on 3D animal mascots (moose in a grad cap,
  polar bear, penguin) and a maple-leaf mark rather than flat emoji. Use the
  mascots as spot illustrations; don't substitute random emoji.

## Visual foundations

- **Color:** three tile hues drive everything — **green** (#2FBF4E, primary),
  **pink** (#F35EA6), **cyan** (#37BDF3) — plus a **lime highlighter** (#A4E552),
  **gold** (#F5C130) for coins/ratings, and a **maple red** (#E23B3B). Headings
  use a **deep forest green ink** (#0F3D22); body copy is **slate** (#475569).
  Backgrounds are white or a warm near-white "paper".
- **Type:** **Nunito** is the single brand typeface. **Black (900)** / ExtraBold
  (800) for display, headlines, the wordmark, numbers and tag words; Regular/
  SemiBold (400/600) for body.
- **The signature move — highlighter tags:** key words sit in solid color blocks
  (green / pink / cyan / lime) with black bold text, a slight **−2° tilt**, and a
  soft shadow — like a highlighter swipe over the word.
- **Buttons are pressable:** big rounded-pill CTAs sit on a **hard darker bottom
  edge** (`0 6px 0 darker`); press shrinks the offset. No gradients.
- **Cards:** two kinds — (1) solid-color fill blocks (lime/cyan/pink) with black
  text, an icon chip, and a flat offset shadow; (2) floating white cards with a
  soft blurred shadow. Radii are generous (16–28px).
- **Shadows are mostly FLAT offsets** (a second solid color underneath), not
  blurry — this is core to the toy-like feel. Reserve soft blur for white cards.
- **Backgrounds:** white; a faint **ruled-paper** texture (light-blue lines +
  red margin rule) on some marketing sections; scattered pastel confetti squares
  on the app canvas.
- **Motion:** bouncy and friendly (implied) — springy button press, progress bar
  fills. Keep easing playful, never linear/corporate.
- **Iconography:** OLC uses **Lucide** — chunky rounded line icons (round caps,
  ~2.25 stroke) that match the friendly brand. Icons inherit text color and
  often sit inside soft rounded color chips (green/pink/cyan/gold). Common set:
  arrows, chevrons, x, check, plus, star, heart, graduation-cap, coins,
  sparkles, book-open. The maple leaf and 3D animal mascots are the hero visual
  assets. Load Lucide's UMD script and use the `Icon` wrapper.
  *(Lucide is a substitution — no bespoke icon set was provided.)*

## Index / manifest

- `brand-guidelines.html` — **the full brand guidelines on one page** (logo,
  color, type, components, icons, voice). Start here for a visual overview.
- `styles.css` — entry point; `@import`s everything below.
- `tokens/` — `colors.css`, `typography.css`, `layout.css` (radii/shadow/space),
  `fonts.css` (Google Fonts: Nunito).
- `guidelines/` — foundation specimen cards (Design System tab).
- `components/core/` — Button, Tag, Card, SelectTile, Badge, ProgressBar,
  CoinPill, LogoLockup.
- `components/icons/` — `Icon` wrapper over Lucide + icon-grid card.
- `ui_kits/marketing/` — website hero recreation.
- `ui_kits/app/` — learner onboarding screen recreation.
- `templates/marketing-hero/`, `templates/app-onboarding/` — starting-point
  templates consuming projects can seed new designs from.
- `SKILL.md` — makes this usable as a downloadable Agent Skill.

## Figma handoff

- `assets/olc-logo-lockups.svg` — all eight lockups as one vector sheet. Drag the
  file into Figma; every tile, edge, and word becomes an editable layer. Install
  **Nunito** (free, Google Fonts) locally first or the text falls back.
- `assets/olc-tokens.tokens.json` — all 22 brand colors in Tokens Studio format.
  In Figma: Plugins → Tokens Studio → Import → paste this file → Create variables.
- For full screens, use the **html.to.design** plugin against a UI-kit `index.html`
  rather than re-drawing; it imports real layers with fills, radii, and shadows.

## Caveats / substitutions

- Nunito is loaded from Google Fonts. Provide brand binaries to self-host if needed.
- No real logo/mascot art was provided — the wordmark is rebuilt from type +
  color tiles; mascots are referenced as placeholders. Supply real assets to drop in.
- Hex + spacing values are matched by eye from screenshots.
- Two uploaded SVGs ("Untitled design (4)/(5).svg") are broken Canva exports —
  their embedded `<image>` tags carry no data, so they render blank and were
  not copied into assets. Re-export as PNG or a proper SVG.
