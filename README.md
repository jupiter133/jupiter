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
| 0 | Parent hook — "Where should {child} begin?" | Parent | `src/screens/StartScreen.tsx` |
| 0b | Deferred — where "Maybe later" lands | Parent | `src/screens/DeferredScreen.tsx` |
| 1 | Grown-up setup — confirm age/grade, optional note | Parent | `src/screens/ParentContextScreen.tsx` |
| 2 | Meet Ms Hannah — the track's seven subject tiles, time and coins | Child | `src/screens/HandoffScreen.tsx` |
| 2b | Subject intro — one per subject, with its rule cards | Child | `src/screens/SectionIntroScreen.tsx` |
| 3 | Question (reusable, looped; passage + question layout) | Child | `src/screens/QuestionScreen.tsx` |
| 3b | Section complete — popup: keep going, or hand back | Child | `src/components/SectionCompleteDialog.tsx` |
| 4 | Placement results — one program, seven subject rows | Parent | `src/screens/ParentResultsScreen.tsx` |

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

`scratchpad/audit5.mjs` walks the whole flow (all five sittings, several
age/grade pairings) at 1024x768, 768x1024 and 390x844
and reports horizontal scroll, side gutters, a stage that isn't exactly the
viewport, vertical overflow (allowed on phones for parent pages), dead space
under the answer grid, auto-read firing unasked, or an answer speaker that
chooses the answer.

### The account seam

Name, age and grade all come from the **signed-in family's account**, captured
at sign-up. `src/profile.ts` is the seam where the host injects that record; the
demo build seeds a placeholder and accepts `?name=`, `?age=` and `?grade=` for
trying values.

```ts
interface ChildProfile {
  name: string;
  age: number | null;   // null = sign-up never captured it
  grade: Grade | null;  // null = sign-up never captured it
}
```

`?grade=` takes the code (`EL`, `JK`, `SK`, `1`–`6`) or the short label the
chips show (`Early`), case-insensitively. An out-of-range age or an unrecognised
grade comes back **null rather than a guess** — a grade quietly accepted wrong
produces a placement measured against nothing, and nobody downstream can see it
happened.

Age and grade are nullable on purpose: an older account, a migrated one, or a
second child added in a hurry may be missing either.

The grown-up setup screen is two numbered cards and nothing else, built to the
design bundle. It never re-asks for the name:

- **Card 1 — "Is this {child}? · from your account"**: age and grade on one
  line with a **Change** button. Change opens two selects; when sign-up never
  captured one, they are open from the start and the line reads "Not set yet".
- **Card 2 — "Anything we should know?"**: the optional note.

### Global chrome

`src/components/FlowChrome.tsx` draws the nine progress pills top-right and the
back link at the foot. The nine are the design's steps: hook, grown-up setup,
meet Ms Hannah, the seven subjects, results.

Back is offered on the grown-up setup, the handoff and a subject intro. It is
**withheld mid-question and after a sitting finishes**: rewinding would throw
away answers the child has already given, which is worse than no back button.

The values are shown rather than silently used because **a grade goes stale
every September**, and grade is what the whole placement is measured against.
The parent is the only one in the loop who knows the child repeated a year or
started late.

`src/assessment/childName.ts` still owns the empty-name fallbacks, because a
profile name can be blank, and the split matters:

- **Parent-facing** copy falls back to "your child" / "your child's", which reads
  fine in a sentence (`displayName`, `possessiveName`).
- **Child-facing** copy uses `firstName`, which returns `null` when blank, and
  drops the name entirely. Ms Hannah greeting "Hi your child!" is worse than no
  greeting at all.

The name threads through the start screen, the intake copy, the handoff
greeting and the parent results.

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

- **Auto-read is off for every band until the user turns it on**
  (`audioDefaultFor()` in `src/audio/speechScript.ts`). The "Read to me"
  control and a speaker on every answer are always one tap away, so a child
  who cannot read the screen is never stuck; what is avoided is unasked
  narration in a shared room.
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
- **Guide** — Ms Hannah stands still. Her introduction (the handoff screen)
  shows once, before the first sitting; later sittings go straight to the
  section intro.
- **Card transitions** — the question body slides out left and the next slides
  in from the right, keyed by question id, instead of a hard cut.

Everything above collapses under `prefers-reduced-motion: reduce`: states change
instantly, sparkles are removed entirely, and nothing about the flow is lost.

## Tone rules baked into the code

- No right/wrong feedback during the activity. Selecting an option gives a neutral
  highlight, then the screen fades to the next question. `QuestionScreen` never
  receives correctness — it only reports the choice upward.
- The child never sees a score, an accuracy figure, a tier, or a grade level.
  A sitting ends on a popup over the quest that names the part just finished
  and how many of the five are done — progress, never performance. It offers
  two ways on: **keep going** into the next subject, or **hand the tablet
  back**. A child in flow should not need an adult to continue, and a tired one
  should not be pushed on. The last part offers only the hand-back. Escape
  takes the cautious exit.
- There is deliberately **no error/red color role** in the token set, so a red X
  cannot be added to the child flow without a design-system change.
- The word "test" **does** appear, in the subject intro headings ("The Oral
  Reading & Fluency test"). That comes from the design bundle and reverses the
  original no-"test" rule — noted here so nobody thinks it slipped through.
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

## The nine screens come from the design bundle

Screens 0, 1, 2, the subject intros and the results page are all built to
`design_handoff_olc_assessment_intro`, with its copy. The pieces that carry
numbers live in `src/assessment/sessionMeta.ts`:

- **Estimated time** for the whole placement, and per sitting.
- **Coins** — shown on the hook and on Ms Hannah's card as a CoinPill.
- **What's included** — the seven subject tiles, derived from the track's own subject list
  so the promise cannot drift from what a child is actually asked.

**The coins are only promised.** Nothing in this flow awards or banks them:
there is no wallet, and no screen shows a child a score. Wiring the
award to the child's account is the host app's job.

Two colour systems, both from the design: the **soft tile palette**
(`SUBJECT_TILE`) for the subject tiles and the results name chips, and the
**saturated highlighter** (`SUBJECT_COLOR`) for the subject-intro headings.

**Tags sit straight.** The design system's word-tag carries a -2° tilt, which
reads as hand-placed on a marketing headline and as a printing fault on a 13px
subject name above a question. `--tag-tilt` is 0.

**Cyan, gold and lime tags carry ink, not white.** They are light fills: white
on cyan is about 2.2:1, which fails at any size and badly at 13px.

## Two tracks

**Age chooses the assessment.** A five-year-old and a ten-year-old are not
doing the same thing, so they do not sit the same activities.

| | Little Readers | Grade Level |
|---|---|---|
| Who | age 6 and under | age 7 and up |
| Theme | the park | Scholar's Tower |
| Lead | "Step right up! Pick a ride and show off your reading superpowers!" | "Step into the tower — 7 chambers of wisdom await your mind!" |
| Call to action | Enter the Park! | Ascend the Tower! |
| Shape | 7 Activities · ~15 min · Fun & Easy | 7 Chambers · ~30 min · Adaptive |

The boundary is `LITTLE_READER_MAX_AGE` in `src/assessment/tracks.ts`, in one
place, **pending teacher sign-off** — it is a judgement about children, not a
fact about code. `trackFor(age, grade)` falls back to grade (Early Learners
through Grade 1) only for an account that never captured an age; guessing from
grade beats defaulting a five-year-old into the tower.

Everything downstream reads the track rather than hard-coding a subject list:
the hero screen's name, lead, tiles, stat chips and button, the section-intro
kicker ("Chamber 2 of 7" / "Activity 3 of 7") and noun (a *ride*, or a *test*),
the results rows, and which subjects a placement decision may rest on.

## Subjects

**Every child sits all seven subjects in their track, in this order**, named
exactly as the assessment intro design names them:

### Little Readers

| # | Activity | Colour | Sitting |
|---|---------|--------|---------|
| 1 | Find the Same | pink | 6 questions |
| 2 | Match Making | gold | 6 questions |
| 3 | Spot the Difference | green | 6 questions |
| 4 | Shapes & Colors | cyan | 6 questions |
| 5 | Number Fun | lime | 6 questions |
| 6 | Letter Sounds | pink | 8 questions |
| 7 | Word Practice | green | 8 questions |

### Grade Level

| # | Chamber | Colour | Sitting |
|---|---------|--------|---------|
| 1 | Words Speaking | cyan | 6 words, **spoken** |
| 2 | Oral Reading | pink | 5 passages, **read aloud** |
| 3 | Vocabulary | gold | 8 words, **study then recall** |
| 4 | Reading Comprehension | green | 8 passages, **study then recall** |
| 5 | Spelling | lime | 8 words, **heard not seen** |
| 6 | Sentence Writing | gold | 8 items, **built or written** |
| 7 | Math | cyan | 10 questions, **five shapes** |

Nobody is stopped early. A result we did not gather is a result a teacher
cannot look at. Each sitting is separate and resumable, and a child can tap
**"Do this one later"** on a subject intro to skip past it — the skip is
remembered for that run and the subject reads as "not yet assessed" until it
is actually sat.

**Words Speaking is never a gate input.** It is recorded as an observation in
every outcome and always reads as non-determining on the results page.

## Study, then recall

**Vocabulary and Reading Comprehension** are two beats, not one. The child
reads something on a card of its own; then the card is taken away and a
question about it takes its place. One format (`Question.format === 'study'`),
one screen, two shapes:

| Subject | Studies | Carries |
|---|---|---|
| Vocabulary | a word and what it means | `studyWord` + `studyMeaning` |
| Reading Comprehension | a short passage | `passage` + `passageTitle` |

```
"deteriorate"                    →   confirm   →   What is deteriorating?
To get steadily worse over time.                   ○ A bridge slowly rusting through
                                                   ○ A freshly painted fence
                                                   ○ A new pair of boots
```

The recall half is an ordinary tapped question with real options and a real
key, so both sittings are scored and branch like any other. `QuestionScreen`
runs the three phases — study, confirm, recall — off one item, which keeps the
answering path (sparkles, progress, read-aloud, correctness-blindness)
identical to every other tapped subject. In the recall beat the passage is
gone, so the layout does not reserve a column for it.

**Comprehension passages are deliberately short** — 9 to 37 words, well under
the Oral Reading ones. The passage is taken away before the question, so length
is working memory as much as comprehension, and a long passage would measure
the wrong thing. Questions ask what the passage meant, never a detail a child
would have had to memorise.

**No passage appears in two subjects.** A child sits Oral Reading and then
Reading Comprehension in the same assessment; reading the same text twice would
make the second sitting a memory check and the first a rehearsal. Two tests
enforce it — one on passage text, one on titles, because different words under
the same heading still read as the same piece. The first draft of the
comprehension bank failed both, and was rewritten rather than exempted.

**Why the confirmation exists.** The next tap takes the card away and a
child who tapped by accident cannot get it back. It is the only confirmation in
the flow. It is written as a question, not a warning — nothing has gone wrong,
and there is no error colour in this product to render one with. Escape goes
*back* to the word rather than past it: the safe way out of an accidental tap
is the one that keeps the meaning on screen.

**What the question may and may not do.** It may use the studied word —
"What is deteriorating?" is fair and unanswerable without the meaning. It must
not let a child match letters: a test asserts that the correct option is never
the only one echoed in the question text, which would let the answer be picked
without understanding anything.

Read-aloud follows the phase: in the study beat it reads the word and its
meaning, in the recall beat it reads the question and the choices. It never
reads the meaning back once the card is gone.

## Math: five shapes, because four answers can be worked backwards

Every maths tier carries all five, so a sitting is never ten of the same thing:

| Shape | `answerMode` | What it asks |
|---|---|---|
| tap | — | four answers, the classic |
| picture | — | four answers led by an illustration |
| **number** | `number` | type the answer on a keypad |
| **order** | `order` | put the values in order, smallest first |
| **gap** | `drag` | drag the missing number into an equation |

**The typed answer is the point of the exercise.** Four answers can be worked
backwards — try each, see which fits — so a bank of nothing but multiple choice
measures recognition rather than arithmetic. A typed number cannot be
back-solved. The keypad is on screen rather than borrowing the device keyboard:
on a tablet a text field summons a full alphabetic keyboard that covers half
the question, and a child hunting for the number row is not doing mathematics.

Two tests guard the content: a typed answer is never a number already printed
in its own question (checked as a whole token, so "7" inside "47" does not
count), and an answer needing a minus sign or a decimal point has the key to
type it.

### Variety has to survive the stop rule

A stable sitting ends after four or five questions. The selector used to serve
a tier in bank order, so whichever shapes were authored last were never
reached — a maths sitting ran tap, tap, tap and stopped, and the child never
met the two shapes that cannot be back-solved.

`selectNextQuestion` now prefers a shape the sitting has not used yet, **but
only among items equally close to the current tier**. Variety is a tie-break,
never a reason to ask a question at the wrong level, and a test asserts every
served item is as close to the session tier as the closest unserved one.

## Sentence Writing: built, then written

Every item shows a picture. What the child does with it depends on their
level, and the split is in the content rather than in a branch:

| Tiers | `answerMode` | The ask |
|---|---|---|
| 0–3 | `order` | the words are given, jumbled — put them in order |
| 4–8 | `write` | type the sentence yourself |

A sitting starts at the child's grade, so a Grade 2 builds and a Grade 6
writes; a Grade 6 who drops to tier 3 gets the ordering shape, which is the
right thing to happen.

### The second item is heard, and dragged

Question two of every Sentence Writing sitting plays a **whole sentence** and
asks the child to put the words back in the order they heard. The sentence is
spoken and written nowhere; the tiles are the only text on the screen. One per
tier, so a Grade 2 and a Grade 6 each meet it at their own level, and the same
`DRAG_QUESTION_POSITION` rule that places Spelling's dragged item places this
one.

It is dragged rather than tapped, but **tapping still does everything** — see
below. A word dropped outside the line goes home rather than being added.

**Ordering is otherwise tapped, not dragged.** Tapping a word adds it to the line,
tapping it in the line takes it back. Ordering six tiles by drag on a phone is
fiddly in a way that measures coordination rather than language — the one
other dragged item in the product is a single tile into a single gap, in
spelling. The words stay visible throughout, so the tiles themselves are never
the memory test — on the heard item the sentence is the thing being held, and
that is the point. The shuffle is seeded per item, so the
same child returning sees the same tiles, and a shuffle that happened to land
on the answer is nudged off it.

### What marks a written sentence, and what cannot

`src/assessment/sentenceScoring.ts` checks four objective things: the required
words are present (whole words, so "waterfall" is not "water"), it opens with a
capital, it closes with terminal punctuation, and it is longer than the words
it was handed. All four, and the answer is recorded correct.

**That is sentence mechanics, and it is all a rule can honestly claim.** It
does not know whether the sentence is good, apt or true. So every typed answer
is stored verbatim on the result as `AnsweredQuestion.writtenAnswer`, precisely
because the rubric cannot tell a teacher what they actually want to know.

An empty box is not a wrong answer — `hasAttempt` keeps "did not answer" and
"answered badly" apart, and the commit button stays disabled until something
is written.

### The 60-second limit is not built

The design this was drawn from puts a countdown on each sentence. It is not
here, and that is deliberate rather than an omission: every other screen in
this product says "no timer, take as long as you like", and a visible clock on
a writing task is the single change most likely to undo the focus this whole
assessment is for. Reinstating it is a product decision with a child on the
other end of it, so it needs a teacher's name against it rather than mine.

## Spelling: heard, never seen

The word plays by itself when the item appears, and is **never written
anywhere on the screen**. The options are spellings of it; picking one is an
ordinary tapped answer, so the sitting is scored and branches normally.

`Question.format === 'listen'` with a `listenWord` that the renderer reads and
never prints. Two tests hold the line: the word must not appear in the question
text, and exactly one option must spell it, which must be the key.

**Three replays, then no more.** A limit at all is a product decision rather
than a technical one: unlimited replays turn a spelling item into a listening
item, and a child can sit on one word forever. The first play is free — it is
the prompt, not a replay — and three more are offered after it. Running out is
not a failure state, so the button greys rather than warns and the counter
reads "your best guess is fine".

The generic "Read to me" control and the per-option speakers are **hidden on a
spelling item**: reading the choices aloud would say the answer.

### One item is a sentence, dragged

The **second** question of every spelling sitting plays a whole sentence rather
than a bare word, and the answer is dragged into a gap instead of tapped.
Hearing a word in context is a fairer ask than hearing it cold, and dragging is
slower and more deliberate than tapping — which makes it worth doing once and
tiring to do eight times. `DRAG_QUESTION_POSITION` in `engine.ts` is where that
choice lives; `selectNextQuestion` reaches for a drag item only at that
position, and falls back to a tapped one rather than ever leaving a sitting
short.

**Dragging is not the only way in.** Tapping a tile places it, tapping the
placed tile takes it back, and the tiles are real buttons so a keyboard reaches
them. HTML5 drag-and-drop does not fire on touch at all and this is a tablet
product, so the drag is built on pointer events — one code path for mouse, pen
and finger. A tile dropped anywhere but the gap goes home rather than being
lost or counted. The tile's place in the row is held while it sits in the gap,
so the row does not reshuffle under a child who is still deciding.

**Without speech synthesis the item cannot be administered.** Rather than
recording a guess as a spelling result, the panel says so plainly, shows the
word for a grown-up to read, and the answer is submitted **unscored** — the
same `scored: false` path an unjudged spoken take uses. It lands on the results
page as "Recorded — for review". Better a gap a teacher can see than a number
nobody measured.

## Spoken items

**Two of the seven Grade Level chambers are spoken**, and the rest are tapped.
A spoken item has `Question.format === 'speak'` and no options at all;
`SpeakingScreen` renders both shapes off the same mic mechanic — tap to
record, a waveform driven by the child's own microphone level, tap to stop,
next.

| Subject | Carries | Renders as |
|---|---|---|
| Words Speaking | `spokenWord` | one big word, 6 per sitting |
| Oral Reading | `spokenPassage` + `passageTitle` | a passage card, 5 per sitting |

**Oral Reading is never read to the child**, even with auto-read on. Modelling
the passage first would turn a reading measure into a repetition one. Single
words are fair to model, so Words Speaking keeps its "Hear it" button.

### Read-along highlighting

While a child reads a passage aloud, the words they have got through go bold
and full-ink; what is ahead stays lighter. It keeps their eyes on the line,
which is the focus-first idea the product is built on.

**It advances on speech, not on correctness, and that is the whole design.**
`src/audio/readingProgress.ts` counts the words in the transcript and moves the
marker along. It never compares a spoken word to the text. A highlight that
only advanced on a correctly recognised word would stall on exactly the word a
struggling reader is stuck on — telling them mid-sentence that they got it
wrong, at the worst possible moment, in a product that gives no right/wrong
feedback anywhere else. Sloppy recognition, which is what a seven-year-old
produces, costs a little accuracy in where the marker sits and costs the child
nothing. A test asserts that a correct reading and nonsense of the same length
advance the marker identically.

The marker never moves backwards (recognition revises interim results
downward, and un-reading words in front of a child is worse than a stale
marker) and never runs past the end.

**No layout shift.** Bold type is wider, so bolding a word in place would nudge
the rest of the line along and, at a line end, rewrap the paragraph under the
child's eye. Each word reserves the width of its own bold form: an invisible
bold "ghost" copy sizes the box and the visible copy changes weight inside a
box that never moves.

**Where the audio goes.** This is the browser's own `SpeechRecognition`. In
Chrome the audio is sent to Google to transcribe; Safari may handle it on
device. Nothing is stored, and nothing it returns reaches the placement — the
transcript is read for its word count and discarded. Set `TRACKING_ENABLED` to
`false` in `src/audio/useReadingTracker.ts` and passages render with no
highlight. A browser without speech recognition (Firefox) gets the plain
passage, and the sitting is unaffected either way.

**Nothing scores it yet, and the code says so rather than pretending.**
`src/assessment/speechScoring.ts` is the seam. The active scorer is a stub
that returns `{ scored: false }` for every attempt, and an unscored answer
**moves nothing**:

- no streak, so two takes never push a tier
- no tier move, so the sitting ends where it started
- `AnsweredQuestion.scored` is `false`, so a teacher can see what was measured
  and what was only captured
- `SubjectResult.unscored` is true when NOTHING in the sitting was scored, and
  that row reads **"Recorded — for review"** rather than a level
- the stability window is suspended for an unscored sitting: a tier that never
  moved is not a tier that settled, so it runs its full length instead of
  stopping after four

That is deliberate. Reading an unscored take as "wrong" would drop a child two
tiers on the strength of a guess, and the screen never says right or wrong
because nothing has established either.

### What an unscored Oral Reading costs the placement

Words Speaking never gated anything, so stubbing it is free. **Oral Reading is
one of the two subjects the reading level derives from**, so it is not.

Rather than withholding every Grade Level placement until a scorer exists,
`deriveReadingLevel` ignores unscored sittings and derives from what was
measured — today, Reading Comprehension alone. `PlacementResult.readingRestsOn`
reports which subjects that was, and the results page says so to the parent in
plain words instead of showing a level that quietly rests on half of what it
appears to. A level is withheld entirely only when nothing at all was measured.

When speech scoring lands, Oral Reading rejoins the derivation with no other
change.

Three ways to make it real, in `ACTIVE_SPEECH_SCORER`:

| Scorer | What it needs | Cost |
|---|---|---|
| Browser speech recognition | nothing — Web Speech API | free, but Chrome streams the child's voice to Google |
| Your own ASR (Whisper) | a backend endpoint and storage | per-minute, and you own the data |
| Record only | somewhere to put the clip; a teacher listens later | storage only, no judgement risk |

`SpeechScorer` takes the audio Blob and the target word and returns a verdict;
no screen or engine code changes for any of the three. `SPEECH_SCORING_IS_STUB`
is asserted by a test so a stub cannot ship as a scorer by accident.

**Microphone access is best-effort.** No mic, or permission refused, and the
child still speaks and still taps on — the take is marked as having no audio.
A placement is not the place to fight a browser permission prompt.

### Reading is two of the seven

The gate needs one reading level, and it comes from **both reading subjects**
(`src/assessment/readingLevel.ts`):

- `lowest` (default): the lower of oral reading and comprehension. A child is
  only as strong a reader as their weaker half, and a gap between decoding and
  comprehension is exactly what the reading gate exists to catch.
- `weighted`: a weighted mean, rounded down, using `READING_LEVEL_WEIGHTS`.

**Pending teacher sign-off.** Switching is a one-line config edit. The level is
withheld entirely until both reading sittings are done — half a reader is not a
reading level, and the gate waits rather than guessing.

### ⚠️ The intros promise input modes the engine does not have

The subject intro copy is verbatim from the design bundle
(`src/content/subjectIntros.ts`). Three of the five describe interactions that
**do not exist in this build**, where every item is multiple choice:

| Subject | The intro says | The engine does |
|---------|----------------|-----------------|
| Oral Reading & Fluency | speak each word aloud, 3s per word, the tablet listens | taps a written answer, no timer, no microphone |
| Vocabulary & Spelling | type the word on the keyboard | taps one of four spellings |
| Sentence Writing | write a few sentences about a picture | taps the best-written version |

Closing this needs speech capture and scoring, a typed-answer item type with
fuzzy matching, and a rubric (or a human) for free writing. Until then these
screens over-promise. **Decide before this goes near a child.**

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
| 3 | Reading within one grade **and** writing or vocabulary/spelling more than one behind | Core Skills Writing |
| 4 | Reading, writing and vocabulary/spelling all within one grade **and** math more than one behind | Core Skills Math |
| 5 | All five within one grade | Core Skills Enriched |

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
- there is no downward move — the floor is already the bottom.

Read-aloud is not forced on for a floored sitting; the per-answer speakers
and "Read to me" are there, and auto-read stays off until someone turns it on.

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

`src/content/questionBank.json` — placeholder bank, tagged by subject and
tier, covering **every tier 0–8 in all fourteen subjects** (at least 3 per
cell). Subject and tier data live in the JSON, so dropping in the real bank
needs no engine change.

**Two of the three banks are template-generated stubs, not assessment
content**, and both are flagged so nothing ships on them quietly:

| File | Covers | Flag |
|---|---|---|
| `trackBank.stub.json` | the seven Little Reader activities, Words Speaking, Spelling | `TRACK_BANK_IS_STUB` |

A test asserts both flags are still `true`. Flip the expectations when the
teacher-written banks land.

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
