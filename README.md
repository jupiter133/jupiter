# OLC — Placement Assessment ("Discovery Quest")

Tablet-first, landscape placement flow for OLC. A parent enters a little context,
hands the tablet to their child, the child works through a short adaptive reading
activity, and the parent gets a grade-equivalent placement and a starting module.

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
| 3 | Question (reusable, looped; passage + question layout) | Child | `src/screens/QuestionScreen.tsx` |
| 4 | Completion — badge + coins, **no score** | Child | `src/screens/KidCompletionScreen.tsx` |
| 5 | Results — grade-equivalent placement + starting module | Parent | `src/screens/ParentResultsScreen.tsx` |

`src/assessment/usePlacementFlow.ts` owns the step machine and session state; the
screens are presentational.

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

- Three difficulty tiers. The session starts at the tier matching the grade the
  parent stated (`K–1 → 1`, `2–4 → 2`, `5–6 → 3`).
- **2 correct in a row → up one tier.** **2 incorrect in a row → down one tier.**
  Either move resets both streaks, so a fresh pair is needed at the new tier.
- Tiers clamp at 1 and 3.
- The session ends when any of these hit:
  - 14 questions answered (`MAX_QUESTIONS`), or
  - at least 6 questions answered (`MIN_QUESTIONS`) and the last 4 have all sat at
    the same tier (`STABILITY_WINDOW`), or
  - the question bank runs out of unserved items.

Tracked per session: final tier, full answer history (question id, tier, choice,
correctness, per-item elapsed time), and total session duration.

## Content

`src/content/questionBank.json` — placeholder bank, 4 items per tier across
vocabulary and reading comprehension. Reading only; no math in v1. Tier data lives
in the JSON, so dropping in the real bank needs no engine change.

Question shape:

```jsonc
{
  "id": "t2-c-01",
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

`src/styles/tokens.css` holds the locked color role system — dark forest green
surfaces, lantern amber and moss accents, Nunito type. Components reference role
variables only, never raw hex. Add a role to that file before using it anywhere.

## Out of scope for this pass

- Admin/CMS tooling for managing questions
- Math items
- Persistence — session state is in-memory only
