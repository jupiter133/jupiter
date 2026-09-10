# OLC — Placement Assessment ("Discovery Quest")

Tablet-first, landscape placement flow for OLC. A parent enters a little context,
hands the tablet to their child, the child works through an adaptive activity
covering **reading, math and writing**, and the parent gets a grade-equivalent
placement and a starting module for each strand.

Runs ~5 minutes: three strands x 7 questions = 21 items.

```bash
npm install
npm run dev     # local dev server
npm test        # engine unit tests
npm run build   # typecheck + production build
```

## Screens

| # | Screen | Audience | File |
|---|--------|----------|------|
| 0 | Start — personalised invitation | Parent | `src/screens/StartScreen.tsx` |
| 0b | Deferred — where "Maybe later" lands | Parent | `src/screens/DeferredScreen.tsx` |
| 1 | Parent context (grade + optional learning-challenges flag) | Parent | `src/screens/ParentContextScreen.tsx` |
| 2 | Handoff — Ms Hannah introduces the discovery quest | Child | `src/screens/HandoffScreen.tsx` |
| 2b | Section intro — Ms Hannah introduces each strand | Child | `src/screens/SectionIntroScreen.tsx` |
| 3 | Question (reusable, looped; passage + question layout) | Child | `src/screens/QuestionScreen.tsx` |
| 4 | Completion — badge, **no score** | Child | `src/screens/KidCompletionScreen.tsx` |
| 5 | Results — grade-equivalent placement per subject | Parent | `src/screens/ParentResultsScreen.tsx` |

`src/assessment/usePlacementFlow.ts` owns the step machine and session state; the
screens are presentational.

### Viewport

The app is the screen. There is no device frame, no centred card and no
max-width cap — the root fills the real viewport (`100dvh`), every screen fills
the root, and only real device chrome (browser / OS) frames the content.

Target sizes are iPad landscape (1024x768) and portrait (768x1024), and it is
usable on phones (390x844 portrait, 844x390 landscape). Layout is
flex/grid so content stretches edge-to-edge: the quest bar pins full-width at
the top, the question body claims the remaining height, and the answer grid
stretches its rows to fill it (`grid-auto-rows: minmax(min-content, 1fr)`, with
a 64px tap-target floor). Type scales with the viewport via `clamp()` in
`tokens.css`, so the same layout reads at both sizes.

Portrait stacks the passage above the question (passage capped at 34vh so the
answers stay on screen) and keeps answers two-up. Every screen fits both iPad
sizes without scrolling.

**The screen's height is definite, not a min-height.** Flex and grid children
only get definite sizes from a definite parent; with `min-height: 100%` the
passage panel could never shrink to its row, and sized the row to its own
content instead. `.stage` is exactly the viewport and `.card` is the scroll
container, so a passage scrolls inside its panel and a tall parent page
scrolls inside the screen.

Phones: text answers go one-up; sentence-length answers go one-up everywhere
(two-up wraps them into a tall mess); the main read-aloud control is icon-only.
Landscape phones have width and no height, so the art sits beside the question
instead of above it, answers pack rather than stretch, and the heading drops a
size. Only the parent intake form and results scroll there.

`scratchpad/audit4.mjs` walks both placement paths (a K child and a Grade 4–6
child across all three sittings) at 1024x768 and 390x844
and reports horizontal scroll, side gutters, a stage that isn't exactly the
viewport, vertical overflow (allowed on phones for parent pages), dead space
under the answer grid, auto-read firing unasked, or an answer speaker that
chooses the answer.

### Child name

The name comes from the **child's profile** — by the time a parent reaches this
flow the app already knows who is being placed, so the flow never asks.
`src/profile.ts` is the seam where the host injects it; the demo build seeds a
placeholder and accepts `?name=` for trying other values.

`src/assessment/childName.ts` still owns the empty-name fallbacks, because a
profile name can be blank, and the split matters:

- **Parent-facing** copy falls back to "your child" / "your child's", which reads
  fine in a sentence (`displayName`, `possessiveName`).
- **Child-facing** copy uses `firstName`, which returns `null` when blank, and
  drops the name entirely. Ms Hannah greeting "Hi your child!" is worse than no
  greeting at all.

The name threads through the start screen, the intake copy, the handoff
greeting, the completion screen and the parent results.

"Maybe later" lands on a deferred screen with two ways out: back into the
quest, or **Exit**. Exit goes through `src/host.ts`, the host app's navigation
seam — in the host it returns the parent to wherever they came from; the demo
falls back to the start screen.

## Age-scaled presentation

Presentation is a **separate axis from difficulty**. The tier decides *what* a
child is asked; the age band decides *how* it looks. The band is fixed for the
session by the grade the parent entered on screen 1 — so a Grade 5 child who
drops to tier 1 still gets the senior presentation, rather than being handed
cartoon bunnies.

| Band | Grades | Illustration | Wording | Answers |
|------|--------|-------------|---------|---------|
| `junior` | K–3 | Leads the layout — full art panel, scene above each passage | `questionTextJunior` — short, plain, early-primary vocabulary | Picture answers where they help; larger tap targets |
| `senior` | 4–6 | Supports the text — smaller, quieter, no card of its own | `questionText` — fuller phrasing | Word answers only; picture answers suppressed |

`ageBandForGrade()` in `src/assessment/types.ts` owns the split.

Illustrations are inline SVG, drawn from a shared glyph set in
`src/components/glyphs.tsx` and composed by `src/components/Illustration.tsx`.
Art is declared in the content JSON as a small spec — `count`, `countPlus`,
`countTakeAway`, `shape`, `fraction`, `areaGrid`, `pair`, `glyph`, `scene` — so
content stays in JSON and drawing stays in code. Scenes are compositions of
existing glyphs laid out on a shared baseline, not bespoke art, which keeps the
set consistent and cheap to extend.

Subtraction art fades the taken-away items rather than crossing them out — the
no-X rule applies inside illustrations too.

## Read-aloud

Every question screen carries a **Read to me** button, tappable as often as the
child likes — each press restarts the narration rather than queueing behind the
last one. A second control toggles auto-read, which fires the narration on every
new question.

- **Auto-read is on by default for K–3** and off for Grade 4–6
  (`audioDefaultFor()` in `src/audio/speechScript.ts`). Many K–3 children cannot
  read the question they are being asked; by Grade 4 they can, and unasked
  narration is noise in a shared room.
- **Every answer has its own speaker.** Tapping it reads that option without
  choosing it — the answer and its speaker are sibling buttons, not nested,
  so the speaker can fire independently and the markup stays valid.
- Junior narration includes the **answer options**. A child who can't read the
  question can't read the options either, so stopping at the question would
  leave them exactly as stuck. Senior narration is passage + question only.
- Junior is read more slowly (rate 0.85 vs 0.95).
- Built on the Web Speech API with no network dependency. Where the browser has
  no synthesis support the controls are hidden rather than offered dead.

`speechScriptFor()` is a pure function, so what gets spoken is unit-tested —
including a test that re-points the answer key at a different option and asserts
the narration comes out byte-identical, so audio can never leak the answer.

## Motion and engagement

All decoration, no meaning — every animation plays identically for a right and a
wrong answer, and `QuestionScreen` is never told which it was.

- **Answer sparkles** — a small fixed-angle burst of gold dots and pink stars
  on the tapped option. Fires on every answer; nothing about it varies by
  correctness.
- **Guide reactions** — Ms Hannah floats gently and blinks on the handoff and
  section screens.
- **Card transitions** — the question body slides out left and the next slides
  in from the right, keyed by question id, instead of a hard cut.

Everything above collapses under `prefers-reduced-motion: reduce`: states change
instantly, sparkles are removed entirely, and nothing about the flow is lost.

## Tone rules baked into the code

- No right/wrong feedback during the activity. Selecting an option gives a neutral
  highlight, then the screen fades to the next question. `QuestionScreen` never
  receives correctness — it only reports the choice upward.
- The child never sees a score, an accuracy figure, a tier, or a grade level. The
  completion screen shows a badge for finishing and nothing numeric.
- There is deliberately **no error/red color role** in the token set, so a red X
  cannot be added to the child flow without a design-system change.
- The word "test" appears nowhere in child-facing copy.
- Celebration animations and narration are correctness-blind by construction —
  the question screen never receives whether the answer was right.

## Subjects by grade

Which subjects a child sits is decided by grade, in `subjectsForGrade()`.

| Grade | Subjects | Questions | Read-aloud | Presentation |
|-------|----------|-----------|-----------|--------------|
| K–1 | Reading only | 8 | **On** by default | Art-led, picture answers |
| 2–3 | Reading only | 8 | **On** by default | Art-supported |
| 4–6 | Reading, then math, then writing | 8 each | **Off** by default, toggle available | Text-led, art supports |

**Math and writing are never served below Grade 4.** A seven-year-old's writing
score would measure handwriting stamina and reading ability rather than writing,
and placing on that is worse than not placing.

Skills by band, per the content plan:

- **K–1 reading:** letter-sound recognition, phonemic awareness, sight words.
- **2–3 reading:** decoding, fluency, literal comprehension (what happened, who
  did what).
- **4–6 reading:** vocabulary in context, inferential comprehension, main idea,
  sequencing — passage-based.
- **4–6 math:** number sense and operations, fractions and decimals,
  measurement, word problems. Word problems stay light on purpose: a wordy math
  item doubles as a reading test.
- **4–6 writing:** multiple choice on sub-skills only, no open response —
  punctuation and capitalization, complete sentence vs fragment, word choice,
  paragraph sequencing.

## Sessions

- **K–3:** one session, reading, done.
- **Grade 4–6:** **one subject per session**, not all three in a sitting.
  Progress is stored between sessions, so returning picks up at the next subject
  without re-asking the intake questions — the start screen reads "Continue
  <name>'s placement" and names what is next.

`src/assessment/placementStore.ts` is the seam. In the host app this is the
child's profile record on the server; the demo build keeps it in `localStorage`
per child and falls back to memory when storage is unavailable.

## Branching logic

Static rules, no ML or adaptive model. See `src/assessment/engine.ts`.

- **Tiers span Kindergarten (0) through Grade 8 (8).** The bank reaches two
  grades past Grade 6 so a strong Grade 6 child has somewhere to go — otherwise
  the ceiling, not the child, is what the result measures. Tier 0 gives a
  struggling Grade 4 room to fall.
- The sitting starts at the child's grade tier (`K → 0`, `Grade n → n`).
- **2 correct in a row → serve the next question one tier up.**
  **2 incorrect in a row → one tier down.** Either move resets both streaks, so
  a fresh pair is needed at the new tier before moving again.
- Tiers clamp at 0 and 8.
- **8 questions per subject**, ending early once the tier has not changed across
  the last 4 answers (`STABILITY_WINDOW`).
- **The tier the sitting ends on is the placement for that subject.**

The tier number is internal. `tierGradeLabel()` maps it to the parent-facing
string ("Kindergarten level", "Grade 4 level"), and a test asserts no
parent-facing label ever contains the word "tier".

## Content

`src/content/questionBank.json` — placeholder bank: 88 items tagged by subject
and tier, covering **every tier 0–8 in all three subjects** (at least 3 per
cell). Subject and tier data live in the JSON, so dropping in the real bank
needs no engine change.

Production content should carry **6+ items per subject/tier cell**. A sitting
can draw 5 questions from one tier before the stop rule fires, and when a tier
runs dry the selector walks outward to the nearest tier that still has items —
correct behaviour, but it serves an item one tier off the session's tier.

Writing items are multiple choice — editing and grammar judgements rather than
free-form composition — so the strand stays auto-scorable in this pass.

Tier 0–3 items (what a K–3 child sees) lean on art and picture answers; tier 4+
items are text-forward. A test keeps junior wording inside an early-primary
vocabulary.

Question shape:

```jsonc
{
  "id": "r-t2-04",
  "subject": "reading",
  "tier": 2,
  "skill": "comprehension",
  "passageTitle": "The Compass",   // optional
  "passage": "…",                  // optional — triggers the two-column layout
  "questionText": "…",
  "options": [{ "id": "a", "text": "…" }],
  "correctAnswerId": "b"
}
```

Item selection prefers the current tier and walks outward to the nearest tier with
unserved items, so a short bank can never dead-end the flow.

## Design system

The app uses the **OLC design system**. Its palette, radii, shadows, spacing
and type foundations are vendored verbatim into `src/styles/tokens.css`
(Section 1), and the DS source files it came from are kept for reference in
`design/olc/` — `olc-tokens.tokens.json` (Tokens Studio format), the
`colors.css` / `layout.css` / `typography.css` foundations, and the DS readme.

Section 2 of `tokens.css` maps the app's **semantic roles** onto those
foundations. Screens reference roles only, never raw hex; add a role there
before using it anywhere.

DS patterns in use:

- **Pressable buttons** — green on a hard darker bottom edge (`0 6px 0`);
  pressing collapses the edge. Secondary buttons are white with a cyan
  uppercase label and a hairline edge.
- **SelectTile answers** — white tiles with a hairline and a flat tile shadow;
  the chosen tile goes solid green on a green-dark edge. The DS also defines
  `correct` / `wrong` tile states. **This app never uses them** — selection is
  acknowledged, never judged.
- **Highlighter word-tags** (`src/components/Tag.tsx`) — the signature tilted
  colour block. The three strands take the three O·L·C tile hues in tile
  order: reading green, math cyan, writing pink. That mapping runs through the
  quest bar, the section intros and the results cards.
- **Progress** — green→cyan gradient on a hairline track, bouncy easing.
- **Cards** — white floating cards with the soft blur; lime colour cards with a
  lime-dark edge for the "start here" module.
- **Type** — Nunito throughout; Black (900) for display and titles, ExtraBold
  for headings, SemiBold for body. Sizes follow the DS scale, scaled with the
  viewport via `clamp()`.

Not adopted, on purpose: the DS's ruled-paper and confetti backgrounds (the
product is focus-first; nothing decorative sits behind a question), and Lucide
as a runtime dependency (the few icons needed are inline SVG drawn to the same
round-capped, chunky spec). `--olc-red` is vendored for the maple leaf but no
feedback colour reaches the child flow.

A caveat the DS readme itself carries: its hex values were eyeball-matched
from product screenshots rather than pulled from Figma. If a value is off, fix
it once in Section 1 of `tokens.css` and every screen follows.

## Out of scope for this pass

- Admin/CMS tooling for managing questions
- Free-form written composition (writing items are multiple choice)
- Persistence — session state is in-memory only
