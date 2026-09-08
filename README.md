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
| 1 | Parent context (grade + optional learning-challenges flag) | Parent | `src/screens/ParentContextScreen.tsx` |
| 2 | Mascot handoff — Nanuk introduces the discovery quest | Child | `src/screens/HandoffScreen.tsx` |
| 2b | Section intro — Nanuk introduces each strand | Child | `src/screens/SectionIntroScreen.tsx` |
| 3 | Question (reusable, looped; passage + question layout) | Child | `src/screens/QuestionScreen.tsx` |
| 4 | Completion — badge + coins, **no score** | Child | `src/screens/KidCompletionScreen.tsx` |
| 5 | Results — grade-equivalent placement + starting module | Parent | `src/screens/ParentResultsScreen.tsx` |

`src/assessment/usePlacementFlow.ts` owns the step machine and session state; the
screens are presentational.

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

## Tone rules baked into the code

- No right/wrong feedback during the activity. Selecting an option gives a neutral
  highlight, then the screen fades to the next question. `QuestionScreen` never
  receives correctness — it only reports the choice upward.
- The child never sees a score, an accuracy figure, a tier, or a grade level. The
  completion screen's only number is coins, awarded per question answered.
- There is deliberately **no error/red color role** in the token set, so a red X
  cannot be added to the child flow without a design-system change.
- The word "test" appears nowhere in child-facing copy.

## Branching logic

Static rules, no ML or adaptive model. See `src/assessment/engine.ts`.

- Three difficulty tiers. Every strand starts at the tier matching the grade the
  parent stated (`K–1 → 1`, `2–4 → 2`, `5–6 → 3`).
- **Each subject carries its own tier and its own streaks.** A child can place at
  a junior level in reading and an early-primary level in math; the strands never
  affect each other.
- **2 correct in a row → up one tier.** **2 incorrect in a row → down one tier.**
  Either move resets both streaks, so a fresh pair is needed at the new tier.
- Tiers clamp at 1 and 3.
- Strands are asked in blocks — never interleaved — in the order
  reading → math → writing, `QUESTIONS_PER_SUBJECT` (7) items each.
- Session length is **fixed**, not cut short on a stable tier. A predictable
  five-minute sitting is worth more here than shaving off a question or two.
  Change `QUESTIONS_PER_SUBJECT` in `engine.ts` to retune the duration.

Tracked per session: final tier per strand, full answer history (question id,
subject, tier, choice, correctness, per-item elapsed time), and session duration.

The parent results screen shows placement per strand and calls out the strongest
and weakest when they differ, rather than flattening everything into one label.

## Content

`src/content/questionBank.json` — placeholder bank: 45 items, **5 per tier per
subject** across reading (vocabulary + comprehension), math (number sense,
operations, word problems, measurement) and writing (conventions, grammar,
sentence structure, word choice, organization). Subject and tier data live in the
JSON, so dropping in the real bank needs no engine change.

Writing items are multiple choice — editing and grammar judgements rather than
free-form composition — so the strand stays auto-scorable in this pass.

37 of the 45 items carry an illustration, and every tier 1–2 item (what a K–3
child mostly sees) has art or picture answers to lean on. A test enforces that
coverage, and another keeps junior wording inside an early-primary vocabulary.

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

`src/styles/tokens.css` holds the locked color role system — light theme: warm
paper white surfaces, deep forest green text, lantern amber and moss accents,
Nunito type. Components reference role variables only, never raw hex. Add a role
to that file before using it anywhere.

## Out of scope for this pass

- Admin/CMS tooling for managing questions
- Free-form written composition (writing items are multiple choice)
- Persistence — session state is in-memory only
