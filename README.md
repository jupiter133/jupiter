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

`scratchpad/audit5.mjs` walks the whole flow (all four sittings, several
age/grade pairings) at 1024x768, 768x1024 and 390x844
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
session by the **age** the parent entered on screen 1 — so an eleven-year-old
who drops to tier 1 still gets the senior presentation, rather than being handed
cartoon bunnies.

| Band | Age | Illustration | Wording | Answers |
|------|-----|-------------|---------|---------|
| `junior` | 8 and under | Leads the layout — full art panel, scene above each passage | `questionTextJunior` — short, plain, early-primary vocabulary | Picture answers where they help; larger tap targets |
| `senior` | 9 and up | Supports the text — smaller, quieter, no card of its own | `questionText` — fuller phrasing | Word answers only; picture answers suppressed |

`ageBandForAge()` in `src/assessment/intake.ts` owns the split.

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

- **Auto-read is on by default for the junior band** (age 8 and under) and off
  for senior (`audioDefaultFor()` in `src/audio/speechScript.ts`). Many younger
  children cannot read the question they are being asked; older ones can, and
  unasked narration is noise in a shared room. A floored sitting forces it on
  whatever the age.
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

## Intake: age and grade do different jobs

Screen 1 asks for **both**, and they are never used interchangeably
(`src/assessment/intake.ts`).

- **Grade drives placement.** Every "grades behind" figure is measured against
  it, and it picks the Core Skills band (1–3 vs 4–6). Nothing else.
- **Age drives presentation.** Read-aloud default, art-led vs text-led layout,
  tone, session length. It never touches the placement.

A nine-year-old in Grade 2 is measured against Grade 2 and shown the older
child's screen. Neither fact is allowed to contaminate the other.

When age and grade are **two or more years apart either way**, the result is
flagged for teacher review on the parent screen rather than quietly absorbed —
held back, started late, newly arrived, skipped ahead. The placement is only as
good as the grade it is measured against, so a human confirms the comparison.

### Grades before Grade 1

Intake offers **Early Learners** (before kindergarten), **Junior Kindergarten**
and **Senior Kindergarten** as well as Grades 1–6, and ages **2 to 12**. All
three pre-Grade-1 years start at tier 0, because the bank floors at
kindergarten content. Two consequences, both content decisions rather than code:

- A pre-Grade-1 child's gap can never go negative on this scale, so they are
  never "behind" — only reading below a Grade 3 level (which they will be)
  routes them, via step 1.
- Telling an Early Learner from an SK child needs items below tier 0, which do
  not exist yet.

## Subjects

**Every child sits all four subjects, in this order: reading, spelling,
writing, math.** Nobody is stopped early. A result we did not gather is a result
a teacher cannot look at.

Reading goes first because it is what the other three are built on. If reading
comes in below a Grade 3 level, the child is placed on the Reading track
whatever the later sittings say — those sittings still run, and their results
are recorded and flagged as **non-determining** (see below).

Spelling is assessed **separately from writing**, with its own tier-tagged bank,
and feeds the gate as an input rather than sitting on the results page as
decoration. The current spelling bank is a **stub** — 27 correct-spelling-choice
items across tiers 0–8 — pending real content.

Skills by band, per the content plan:

- **Early reading:** letter-sound recognition, phonemic awareness, sight words.
- **Middle reading:** decoding, fluency, literal comprehension.
- **Upper reading:** vocabulary in context, inference, main idea, sequencing —
  passage-based.
- **Math:** number sense and operations, fractions and decimals, measurement,
  word problems. Word problems stay light on purpose: a wordy math item doubles
  as a reading test.
- **Writing:** multiple choice on sub-skills only, no open response —
  punctuation and capitalization, complete sentence vs fragment, word choice,
  paragraph sequencing.
- **Spelling:** pick the correctly spelled word. Stub content.

## The priority gate

Placement is **one program**, chosen by an ordered gate — not an average of four
subject scores. Averaging a Grade 1 reading level with a Grade 5 math level
produces a Grade 3 child who does not exist.

The gate runs on **gap**, not on tier: `gap = assessed tier − grade tier`.
"More than one grade behind" means `gap ≤ −2`. See `src/assessment/gate.ts`.

Rules are evaluated in order and **the first match wins**:

| # | Condition | Outcome |
|---|-----------|---------|
| 1 | Reading below a **Grade 3 level** (absolute, not gap) | Reading track |
| 2 | Reading more than one grade behind | Core Skills Reading |
| 3 | Reading within one grade **and** writing or spelling more than one behind | Core Skills Writing |
| 4 | Reading, writing and spelling all within one grade **and** math more than one behind | Core Skills Math |
| 5 | All four within one grade | Core Skills Enriched |

Two **hard blocks** fall out of that order, and are asserted by an exhaustive
test sweeping every gap combination from −3 to +1 across all four subjects and
all seven grades:

- Never Writing when reading is more than one grade behind.
- Never Math unless reading, writing **and** spelling are all within one grade.

Steps 3 and 4 restate their predecessors' conditions rather than relying on
falling through, so each rule is true on its own terms and the blocks hold even
if the order is ever edited.

**Math content level is set by grade, never by assessed math tier**
(`mathContentLevel` on the result). The assessed math tier only feeds gate
step 4.

### A consequence worth knowing

Step 1 reads an **absolute** level. A child before Grade 3 who is reading
*at* grade level is by definition reading below a Grade 3 level, so they route
to the Reading track. Gate steps 2–5 are only reachable by a Grade 3+ child, or
by a younger child reading ahead. That is what the specified rules say; it is
flagged here because the parent-facing copy has to make sense for a Grade 1
family who did nothing wrong.

### Program names

All names live in `src/assessment/programs.ts` as config tables, not as strings
scattered through the code. **They are placeholders pending a naming decision.**

| Band | Gate outcome | Program |
|------|--------------|---------|
| Reading track | step 1 | Core Reading 1–6 |
| Grades 1–3 | reading *or* writing | Core Skills Reading and Writing 1-3 |
| Grades 1–3 | math | Core Skills Math 1-3 |
| Grades 1–3 | enriched | Core Skills Enriched 1-3 |
| Grades 4–6 | reading | Core Skills Reading 4-6 |
| Grades 4–6 | writing | Core Skills Writing 4-6 |
| Grades 4–6 | math | Core Skills Math 4-6 |
| Grades 4–6 | enriched | Core Skills Enriched 4-6 |

The 1–3 band has **no separate reading and writing planners** — gate steps 2 and
3 both resolve to the one combined planner. Early Learners, JK and SK fold into the 1–3
band. Both are **flagged for teacher sign-off**.

Which of the six **Core Reading** levels a gated child lands on is
`CORE_READING_LEVEL_BY_TIER` — also a placeholder, also **flagged for teacher
sign-off**. Only tiers 0, 1 and 2 can reach the Reading track, so three tiers
have to address six levels; separating all six needs a finer measure than the
tier alone, which is a content decision, not a code one.

## Floored sittings

When reading gates, the spelling, writing and math sittings still run, but:

- they **start at the lowest tier** rather than the grade tier,
- adaptive branching still moves **upward**, so a child who can spell climbs
  out,
- there is no downward move — the floor is already the bottom,
- **read-aloud is forced on**, whatever the age band.

A Grade 5 spelling question put to a child reading at a Grade 1 level measures
the reading, not the spelling, and hands them eight straight failures on the way
down.

A floored result is never fed to the gate, and never rendered as a level.

## Non-determining results

Every subject result carries a `nonDetermining` flag. It is set when the sitting
was floored, or when the gate stopped before reading that subject. Downstream
views **must not** present a non-determining result as a measured level — the
parent screen shows those rows as observations, with copy explaining that
reading is the foundation.

## Sessions

**One subject per session**, four sessions, in order: reading, spelling,
writing, math. They are not run in one block — that is 32 questions for a child
who was promised five minutes.

Progress is stored between sessions, so returning picks up at the next subject
without re-asking the intake questions; the start screen reads "Continue
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
- The sitting starts at the child's grade tier (`EL / JK / SK → 0`,
  `Grade n → n`) —
  except a floored sitting, which starts at tier 0.
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

`src/content/questionBank.json` — placeholder bank: 115 items tagged by subject
and tier, covering **every tier 0–8 in all four subjects** (at least 3 per
cell). Spelling is a stub. Subject and tier data live in the JSON, so dropping in the real bank
needs no engine change.

Production content should carry **6+ items per subject/tier cell**. A sitting
can draw 5 questions from one tier before the stop rule fires, and when a tier
runs dry the selector walks outward to the nearest tier that still has items —
correct behaviour, but it serves an item one tier off the session's tier.

Writing items are multiple choice — editing and grammar judgements rather than
free-form composition — so the strand stays auto-scorable in this pass.

Tier 0–3 items lean on art and picture answers; tier 4+
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
