from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, KeepTogether)

INK   = colors.HexColor('#141B22')
BODY  = colors.HexColor('#475569')
GREEN = colors.HexColor('#1E9E3C')
CYAN  = colors.HexColor('#1E97C9')
LINE  = colors.HexColor('#E6EAEF')
SOFT  = colors.HexColor('#F7F9FB')
WARN  = colors.HexColor('#FCE7EA')
GOLD  = colors.HexColor('#F5C130')

ss = getSampleStyleSheet()
def st(name, **kw):
    base = dict(fontName='Helvetica', fontSize=9.5, leading=14, textColor=BODY,
                alignment=TA_LEFT, spaceAfter=6)
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
 'title':  st('title', fontName='Helvetica-Bold', fontSize=26, leading=30, textColor=INK, spaceAfter=4),
 'sub':    st('sub', fontSize=11.5, leading=16, spaceAfter=18),
 'h1':     st('h1', fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=INK, spaceBefore=16, spaceAfter=8),
 'h2':     st('h2', fontName='Helvetica-Bold', fontSize=11.5, leading=15, textColor=GREEN, spaceBefore=12, spaceAfter=5),
 'h3':     st('h3', fontName='Helvetica-Bold', fontSize=9.8, leading=13, textColor=INK, spaceBefore=8, spaceAfter=3),
 'p':      st('p'),
 'li':     st('li', leftIndent=11, bulletIndent=2, spaceAfter=3),
 'code':   st('code', fontName='Courier', fontSize=8.2, leading=11.5, textColor=INK,
              backColor=SOFT, borderPadding=6, spaceBefore=4, spaceAfter=8),
 'note':   st('note', fontSize=9.5, leading=14, backColor=WARN, borderPadding=8,
              spaceBefore=6, spaceAfter=10, textColor=INK),
 'kicker': st('kicker', fontName='Helvetica-Bold', fontSize=7.6, leading=10, textColor=CYAN, spaceAfter=3),
 'cell':   st('cell', fontSize=8.4, leading=11.5, spaceAfter=0),
 'cellb':  st('cellb', fontName='Helvetica-Bold', fontSize=8.4, leading=11.5, textColor=INK, spaceAfter=0),
 'foot':   st('foot', fontSize=8, leading=11, textColor=colors.HexColor('#94A3B8')),
}

def P(t, s='p'): return Paragraph(t, S[s])
def BULLETS(items, s='li'):
    return [Paragraph(t, S[s], bulletText='•') for t in items]

def TBL(rows, widths, head=True):
    data = [[Paragraph(c, S['cellb' if (head and i == 0) else 'cell']) for c in row]
            for i, row in enumerate(rows)]
    t = Table(data, colWidths=widths, hAlign='LEFT')
    style = [('VALIGN', (0,0), (-1,-1), 'TOP'),
             ('LINEBELOW', (0,0), (-1,-2), 0.5, LINE),
             ('TOPPADDING', (0,0), (-1,-1), 5),
             ('BOTTOMPADDING', (0,0), (-1,-1), 5),
             ('LEFTPADDING', (0,0), (-1,-1), 6),
             ('RIGHTPADDING', (0,0), (-1,-1), 6)]
    if head:
        style += [('BACKGROUND', (0,0), (-1,0), SOFT),
                  ('LINEBELOW', (0,0), (-1,0), 0.9, colors.HexColor('#CBD5E1'))]
    t.setStyle(TableStyle(style))
    return t

W = A4[0] - 36*mm
story = []
def A(x):
    story.extend(x) if isinstance(x, list) else story.append(x)

# ---------------------------------------------------------------- cover
A(P('OLC', 'kicker'))
A(P('Placement Assessment', 'title'))
A(P('How it was built, and how the whole thing works. A handover document for '
    'the engineer picking this up.', 'sub'))

A(TBL([
  ['', ''],
  ['Repository', 'jupiter133/jupiter'],
  ['Branch', 'claude/olc-placement-assessment-y4lrpw'],
  ['Stack', 'React 18 + TypeScript + Vite. Plain CSS, no UI framework. Vitest.'],
  ['Bank', '741 items across 14 subjects, one JSON file'],
  ['Tests', '157, all passing'],
  ['State', 'No placeholder content remains. One thing is unbuilt — see §10.'],
], [34*mm, W-34*mm], head=False))

A(Spacer(1, 10))
A(P('<b>Read §10 first if you read nothing else.</b> Nothing scores a spoken answer. '
    'Three subjects produce observations that move no placement, and two of them are '
    'load-bearing. That is the one open decision in this project.', 'note'))

A(P('Contents', 'h1'))
A(TBL([
  ['§', 'Section', '§', 'Section'],
  ['1', 'What this is', '6', 'The 14 subjects'],
  ['2', 'The flow, screen by screen', '7', 'Answer modes'],
  ['3', 'Two tracks, one product', '8', 'Layout rules that cost us'],
  ['4', 'The adaptive engine', '9', 'Testing and verification'],
  ['5', 'The priority gate', '10', 'What is NOT built'],
  ['', '', '11', 'Running it'],
], [8*mm, (W-16*mm)/2-8*mm, 8*mm, (W-16*mm)/2]))

A(PageBreak())

# ---------------------------------------------------------------- 1
A(P('1. What this is', 'h1'))
A(P('A placement assessment that a child sits once, on a tablet, to find the OLC program '
    'they belong in. A grown-up sets it up, hands the device over, and gets a result '
    'screen at the end. The child never sees a score.'))

A(P('Three principles that shaped every decision', 'h2'))
A(TBL([
  ['Principle', 'What it means in the code'],
  ['<b>Correctness-blindness</b>',
   'There is no red / error colour role in the design system at all. Nothing is ever '
   'marked wrong mid-flow, and the child is never shown a score. A chosen answer just '
   'looks chosen.'],
  ['<b>Grade places, age presents</b>',
   'Grade drives which tier a child starts at and what the result means. Age drives '
   'wording, art, read-aloud defaults and which track they sit. The two are never '
   'conflated.'],
  ['<b>Never guess a verdict</b>',
   'An answer nothing could judge is recorded as <font face="Courier">scored: false</font>. '
   'It moves no streak and no tier, and the parent is told it was not measured. A '
   'fabricated number would be worse than a gap.'],
], [34*mm, W-34*mm]))

A(P('Module map', 'h2'))
A(TBL([
  ['Path', 'Holds'],
  ['<font face="Courier">src/assessment/types.ts</font>',
   'Every shared type, plus the predicates the screens branch on '
   '(<font face="Courier">isListenQuestion</font>, <font face="Courier">isOddQuestion</font>, …). '
   'Screens ask a predicate, never a subject name.'],
  ['<font face="Courier">src/assessment/engine.ts</font>',
   'Question selection, branching, stop rule. Pure functions over a session state.'],
  ['<font face="Courier">src/assessment/gate.ts</font>',
   'The five ordered rules that turn subject results into a program.'],
  ['<font face="Courier">src/assessment/tiers.ts</font>',
   'Tier ↔ grade mapping, gap maths, the behind-threshold.'],
  ['<font face="Courier">src/assessment/usePlacementFlow.ts</font>',
   'The one hook that owns the whole flow: which screen, which sitting, what happens '
   'on skip.'],
  ['<font face="Courier">src/content/questionBank.json</font>',
   'All 741 items. Subject and tier live in the data, so replacing content needs no '
   'engine change.'],
  ['<font face="Courier">src/components/</font>',
   'One component per answer mode — drag, order, write, keypad, match, pair.'],
  ['<font face="Courier">src/screens/</font>',
   'One per stage of the flow. <font face="Courier">QuestionScreen.tsx</font> is the hub.'],
  ['<font face="Courier">src/components/glyphs.tsx</font>',
   '39 illustrations, each drawn in a 100×100 box using the locked colour roles.'],
], [52*mm, W-52*mm]))

A(PageBreak())

# ---------------------------------------------------------------- 2
A(P('2. The flow, screen by screen', 'h1'))
A(TBL([
  ['#', 'Screen', 'Who is holding the device'],
  ['1', 'Start', 'Grown-up. Name and age.'],
  ['2', 'Parent context', 'Grown-up. Grade, and a mismatch check against age.'],
  ['3', 'Handoff', 'Grown-up → child. Shows the seven sections and hands over.'],
  ['4', 'Section intro', 'Child. What this section is, in the track’s own words.'],
  ['5', 'Question', 'Child. The hub — renders every answer mode.'],
  ['6', 'Section complete', 'Child. No score, just progress.'],
  ['7', 'Kid complete', 'Child. Coins, then hand back.'],
  ['8', 'Parent results', 'Grown-up. Program, per-subject rows, what was not measured.'],
], [7*mm, 36*mm, W-43*mm]))

A(P('Deferring a section', 'h2'))
A(P('Any section can be skipped with “Do this one later”. This was the source of the '
    'worst bug in the project: skipping cleared the session but built no sitting for the '
    'next subject, so pressing Start rendered a question screen with no question — a '
    'blank white page, in a product for four-year-olds. '
    '<font face="Courier">doThisLater</font> now builds the next sitting, '
    '<font face="Courier">startSection</font> is defensive, and a sweep '
    '(<font face="Courier">noblank.mjs</font>) walks every skip combination on both tracks '
    'asserting the stage is never empty.'))

A(P('Read-aloud', 'h2'))
A(BULLETS([
  'Defaults ON for the whole Little Readers track and for the junior band. The default '
  'cannot be silence for a child who cannot read.',
  'A wordless option is never narrated. It used to read “A. B. C.” over picture '
  'cards, burying the one line that said what to do. A test holds this.',
  'Listen items (Spelling, the heard third of Letter Sounds) get a replay counter, '
  'currently 3.',
]))

A(PageBreak())

# ---------------------------------------------------------------- 3
A(P('3. Two tracks, one product', 'h1'))
A(P('A five-year-old and a ten-year-old are not doing the same thing, so they do not sit '
    'the same activities. Age chooses.'))
A(P('<font face="Courier">trackFor(age, grade)</font> — age ≤ 6 sits '
    '<b>Little Readers</b>, age ≥ 7 sits <b>Grade Level</b>. Grade is the fallback only '
    'when an account never captured an age. The boundary is one constant, '
    '<font face="Courier">LITTLE_READER_MAX_AGE</font>, because it is a judgement about '
    'children rather than a fact about code. <b>Pending teacher sign-off.</b>', 'p'))

A(TBL([
  ['', 'Little Readers', 'Grade Level'],
  ['Age', '≤ 6', '≥ 7'],
  ['Sections', 'Find the Same, Match Making, Spot the Difference, Shapes &amp; Colors, '
                'Number Fun, Letter Sounds, Word Practice',
              'Words Speaking, Oral Reading, Vocabulary, Reading Comprehension, '
              'Spelling, Sentence Writing, Math'],
  ['Tone', 'A park. Sections are “rides”.',
           'Plain language. Sections are “sections”. The tower cosplay was removed — '
           'a ten-year-old told they are ascending a tower of wisdom knows they are being '
           'managed.'],
  ['Places on', '<b>Letter Sounds</b> and <b>Word Practice</b> only. The other five are '
                'readiness observations.',
                '<b>Oral Reading</b> and <b>Reading Comprehension</b>.'],
], [20*mm, (W-20*mm)/2, (W-20*mm)/2]))

A(P('The rest of each track is recorded but does not decide the placement. '
    '<font face="Courier">readingSubjectsFor(track)</font> is the single source of that, '
    'and a test asserts every track only rests on subjects it actually sits.'))

A(PageBreak())

# ---------------------------------------------------------------- 4
A(P('4. The adaptive engine', 'h1'))
A(P('Tiers', 'h2'))
A(P('Tier 0 = Kindergarten … tier 8 = Grade 8. A child starts at the tier matching their '
    'grade. The tier a sitting <i>ends</i> on is the placement for that subject; the gap '
    'between that and their grade tier is what the gate reads.'))

A(P('Branching', 'h2'))
A(P('<font face="Courier">STREAK_TO_MOVE = 2</font>. Two correct in a row moves up a tier, '
    'two wrong moves down. Either move resets <i>both</i> streaks, so a fresh pair is '
    'needed at the new level before moving again.'))

A(P('Stopping', 'h2'))
A(P('<font face="Courier">STABILITY_WINDOW = 4</font>. When the tier has not changed across '
    'the trailing four answers, the sitting ends — usually after five or six questions. '
    '<b>This is the single most important fact about the content</b>, and it caught us out '
    'three times: a child who guesses never leaves the tier they start on, so anything you '
    'put two tiers up is content most children will never see. The window is suspended for '
    'a sitting where every answer is unscored, so a spoken section cannot end early on no '
    'evidence.'))

A(P('Choosing the next question', 'h2'))
A(P('Among items equally close to the current tier, the selector prefers variety, at two '
    'levels that are not interchangeable:'))
A(TBL([
  ['Level', 'Why it comes first'],
  ['1. Unused <b>answer mode</b>',
   'A maths sitting that never serves the typed-number or ordering items lets a child work '
   'every answer backwards from the options. This is the level that protects validity.'],
  ['2. Unused <b>skill</b>',
   'Two items can share a mode and still be different questions — naming a shape, naming '
   'a colour and painting a shape are all tapped. Keying on mode alone served whichever '
   'came first in the bank, so a child met shapes and nothing else in the ride named for both.'],
], [38*mm, W-38*mm]))
A(P('Variety never costs a child a question at the wrong level: the selector only reaches '
    'past the nearest tier when the fresher item is exactly as close.'))

A(P('Unscored answers', 'h2'))
A(P('<font face="Courier">submitAnswer(state, id, { scored: false })</font> records the '
    'answer and does nothing else — no streak, no tier move. '
    '<font face="Courier">SubjectResult.unscored</font> carries it to the results screen, '
    'where it renders as <i>“Recorded — for review”</i> rather than a level.'))

A(PageBreak())

# ---------------------------------------------------------------- 5
A(P('5. The priority gate', 'h1'))
A(P('Five rules, evaluated in order, first match wins. <b>The order is the policy.</b> A '
    'child who cannot read is placed on reading no matter what the later subjects say, '
    'because those results measure reading as much as they measure their own subject — '
    'a maths word problem is a reading test wearing a hat.'))
A(TBL([
  ['#', 'Condition', 'Outcome'],
  ['1', 'Reading below a Grade 3 level (absolute, not a gap)', 'Reading track'],
  ['2', 'Reading more than one grade behind', 'Core Skills Reading'],
  ['3', 'Reading within one grade, writing or spelling behind', 'Core Skills Writing'],
  ['4', 'Literacy all within one grade, math behind', 'Core Skills Math'],
  ['5', 'All four within one grade', 'Enriched'],
], [7*mm, (W-7*mm)*0.6, (W-7*mm)*0.4]))
A(P('Rules 3 and 4 restate their predecessors’ conditions so each is true on its own '
    'terms. That is what makes the hard blocks hold even if someone reorders the list later. '
    'An exhaustive sweep asserts them.'))
A(P('<font face="Courier">evaluateGate</font> returns <font face="Courier">null</font> when a '
    'rule needs evidence that has not been gathered — the flow then asks for it rather '
    'than guessing. <font face="Courier">determinedBy</font> names the subjects the decision '
    'actually rested on; everything else is flagged non-determining on the results screen, so '
    'a parent is never shown a number that did not matter.'))

A(PageBreak())

# ---------------------------------------------------------------- 6
A(P('6. The 14 subjects', 'h1'))
A(P('Every subject was built the same way: decide what it actually measures, write a '
    'difficulty ladder, generate the items with a script that asserts its own rules, then '
    'add tests that hold the content honest, then look at it in a real browser at four '
    'viewports.'))

A(P('Little Readers — 741 items total, 399 here', 'h2'))
A(TBL([
  ['Section', 'n', 'What the child does', 'The ladder'],
  ['<b>Find the Same</b>', '54',
   'Tap the two pictures that match. Keyed by the <i>pair</i> of ids.',
   'More cards (3→6), then closer pairs — at the top, two counts of the same object '
   'differing by one.'],
  ['<b>Match Making</b>', '54',
   'Move each picture onto its twin. Drag or tap; tap is always an equal path.',
   'More pairs, then near-identical pieces.'],
  ['<b>Spot the Difference</b>', '54',
   'Tap the card that does not belong. Shares a component with Find the Same via a '
   '<font face="Courier">pick</font> prop — same act, different count.',
   'Different object → different count → count off by one.'],
  ['<b>Shapes &amp; Colors</b>', '75',
   'Name a shape, name a colour, or paint an outlined shape from a palette. '
   '<b>No labels on the cards</b> — a card reading “Diamond” makes it a reading test.',
   'Both shapes and colours at every tier; only the top rung asks for both at once.'],
  ['<b>Number Fun</b>', '54',
   'Find a written number, find a group to count, or count a group and tap the number. '
   'The third is the bridge and the one that matters.',
   'The size of the numbers — to 3, to 5, to 10 — then reasoning at 6–8.'],
  ['<b>Letter Sounds</b>', '54',
   'Hear a sound and find the picture, see a letter and find the picture, see a picture '
   'and find the letter. <b>The sound is played, never printed.</b>',
   'Which sounds: <font face="Courier">m s b t f p</font>, then the rest, vowels last.'],
  ['<b>Word Practice</b>', '54',
   'Read a word and find the picture, see a picture and find the word, read a word aloud.',
   'Word length. Three letters, then four, then <i>apple</i>, then <i>snowflake</i>.'],
], [30*mm, 10*mm, (W-40*mm)*0.5, (W-40*mm)*0.5]))

_gl_rows = ([
  ['Section', 'n', 'What the child does', 'Notes'],
  ['<b>Words Speaking</b>', '54', 'Says a word into the microphone.',
   '<b>Unscored.</b> See §10.'],
  ['<b>Oral Reading</b>', '27', 'Reads a short passage aloud, with read-along bolding.',
   '<b>Unscored</b>, and it is half the reading gate.'],
  ['<b>Vocabulary</b>', '45', 'Studies a word, then recalls its meaning without it on screen.',
   'Study → confirm → recall.'],
  ['<b>Reading Comprehension</b>', '54',
   'Studies a passage, then answers with the passage gone.',
   '11 question types. No passage is shared with Oral Reading — tests enforce it, '
   'because reading the same text twice makes one a rehearsal and the other a memory check.'],
  ['<b>Spelling</b>', '63', 'Hears a word, never sees it, picks the spelling. One item is '
   'a whole spoken sentence with a drag-and-drop gap.',
   'A voiceless device makes these unscored rather than guessed.'],
  ['<b>Sentence Writing</b>', '45', 'Orders words into a sentence, builds one from a '
   'heard sentence, or types one.',
   '<font face="Courier">markSentence</font> checks four objective things: required words '
   'present, opening capital, terminal punctuation, longer than the words handed.'],
  ['<b>Math</b>', '54', 'Five shapes: tap, typed keypad, ordering, picture maths, '
   'missing number.',
   'Four tappable options can be worked backwards, so the typed and ordered shapes exist '
   'to stop that.'],
])
A(KeepTogether([P('Grade Level — 342 items', 'h2'),
                TBL(_gl_rows, [30*mm, 10*mm, (W-40*mm)*0.5, (W-40*mm)*0.5])]))

A(PageBreak())

A(P('Two content rules worth keeping', 'h2'))
A(P('Topic is not difficulty', 'h3'))
A(P('Shapes &amp; Colors first put colours two tiers above shapes. Because a sitting stops '
    'after five or six questions and a guessing child never climbs, the ride named for both '
    'showed nothing but shapes. Measured, three ways of playing:'))
A(P('                before          after<br/>'
    'all&nbsp;right     shape&nbsp;2 colour&nbsp;3   shape&nbsp;3 colour&nbsp;2<br/>'
    'all&nbsp;wrong     shape&nbsp;5 colour&nbsp;<b>0</b>   shape&nbsp;2 colour&nbsp;2<br/>'
    'random        shape&nbsp;5 colour&nbsp;<b>0</b>   shape&nbsp;3 colour&nbsp;2', 'code'))
A(P('A three-year-old knows “red” long before “rectangle”. Difficulty now grows '
    '<i>inside</i> each topic — more cards, harder shapes, bigger numbers — never by '
    'swapping the topic out. Adding within ten at the top of Number Fun is fine, because '
    'that genuinely is harder.'))

A(P('A picture is only usable if a child names it one way', 'h3'))
A(P('The sharpest risk in Letter Sounds, and no test of the mechanics would ever catch it. '
    'A picture is unusable when the <i>other</i> name a child would reach for starts with a '
    'different sound that is also in the answer set — the item then marks a child wrong '
    'for naming the picture sensibly. Twelve words were cut:'))
A(TBL([
  ['Picture', 'Also called', 'Which is', 'Picture', 'Also called', 'Which is'],
  ['moose', '“deer”', '/d/', 'bottle', '“tube”', '/t/'],
  ['mitten', '“glove”', '/g/', 'map', '“paper”', '/p/'],
  ['river', '“water”', '/w/', 'rope', '“knot”', '/n/'],
  ['gift', '“present”', '/p/', 'van', '“truck”', '/t/'],
  ['bowl', '“soup”', '/s/', 'compass', '“circle”', '/s/'],
  ['pinecone', '“acorn”', '/a/', 'berry', '“grapes”', '/g/'],
], [(W)/6.0]*6))
A(P('Cutting them cost <font face="Courier">/v/</font> its only word, so v is out of the '
    'sound set. <b>A smaller alphabet that measures something beats a full one that measures '
    'whether a child shares the author’s vocabulary.</b> A test bans all twelve, from the '
    'answer cards and from the panel.'))

A(PageBreak())

# ---------------------------------------------------------------- 7
A(P('7. Answer modes', 'h1'))
A(P('<font face="Courier">Question.answerMode</font> decides which component renders. '
    'Screens branch on predicates in <font face="Courier">types.ts</font>, never on a '
    'subject name, which is why a new subject needs no screen change.'))
A(TBL([
  ['Mode', 'Component', 'Notes'],
  ['<font face="Courier">tap</font>', 'inline in QuestionScreen',
   'The default. Picture-only options get their own wordless layout.'],
  ['<font face="Courier">drag</font>', 'DragAnswer', 'One tile into one gap.'],
  ['<font face="Courier">order</font> / <font face="Courier">order-drag</font>', 'OrderAnswer',
   'Every tile into a sequence. Tap always works as an equal path.'],
  ['<font face="Courier">write</font>', 'WriteAnswer', 'Free text, marked by rubric.'],
  ['<font face="Courier">number</font>', 'NumberAnswer', 'On-screen keypad.'],
  ['<font face="Courier">match</font> / <font face="Courier">odd</font>', 'MatchAnswer',
   'One component, a <font face="Courier">pick</font> prop of 2 or 1.'],
  ['<font face="Courier">pair</font>', 'PairAnswer', 'Each picture onto its twin.'],
], [30*mm, 30*mm, W-60*mm]))
A(P('<b>Dragging is pointer-events, not HTML5 drag-and-drop</b>, which does not fire on '
    'touch. Exactly one dragged item is served per sitting '
    '(<font face="Courier">DRAG_QUESTION_POSITION</font>), and every draggable answer also '
    'has a tap path — a child who cannot aim must never be blocked.'))

# ---------------------------------------------------------------- 8
A(P('8. Layout rules that cost us', 'h1'))
A(P('These are written down because each one shipped wrong at least once, and one of them '
    'three times.'))
A(P('Check what the child can see, not what the DOM says', 'h3'))
A(P('Three separate bugs hid behind a page that did not scroll: paint chips, counting cards '
    'and text answers each ran past the bottom of a short screen. The stage does not scroll, '
    'so the last answer was not “below the fold”, it was <b>unreachable</b> — and '
    'the viewport audit reported <font face="Courier">overflow 0px</font> every time. The '
    'browser scripts now measure the last answer’s bottom edge against the viewport, and '
    'for counting cards compare the number a card claims against the glyphs whose box '
    'actually sits inside it.'))
A(P('Size off the constrained dimension', 'h3'))
A(BULLETS([
  'A percentage width against an auto-width wrapper silently collapses to nothing.',
  '<font face="Courier">margin-inline: auto</font> <b>stops a flex item stretching</b>. A '
  'grid shrink-wrapped to 163px inside a 763px parent and the cards came out 76px square. '
  'Use <font face="Courier">width: 100%</font> plus <font face="Courier">align-self: center</font>.',
  '<font face="Courier">grid-auto-rows: minmax(min-content, 1fr)</font> and a square card '
  'are circular — the square’s min-content floor is its own width, so the grid grows '
  'past its box. Use <font face="Courier">1fr</font> with '
  '<font face="Courier">min-height: 0</font>.',
  'An <font face="Courier">&lt;svg&gt;</font> with inline width/height attributes ignores '
  '<font face="Courier">aspect-ratio</font>. Picture cards use a container query: '
  '<font face="Courier">width: min(76cqw, 76cqh)</font>.',
  'The card fills its cell; the <b>picture</b> is the square. Chasing a square card means '
  'fighting the grid, and one of the two always wins by clipping.',
]))
A(P('Then measure it in a browser, at every viewport, rather than trusting it.'))

A(PageBreak())

# ---------------------------------------------------------------- 9
A(P('9. Testing and verification', 'h1'))
A(P('157 unit tests, and a set of Playwright scripts that drive the real build. The unit '
    'tests mostly guard <i>content</i>, not code — a bank is where an assessment goes '
    'wrong quietly.'))
A(P('What the content tests assert', 'h2'))
A(BULLETS([
  'Exactly one option can be right. Two pictures starting with the same sound, or two '
  'identical cards in an odd-one-out, make an item with two answers.',
  'The question never prints its own answer. The stub Number Fun bank read '
  '“How many stars are there? (1)” with “Count them: 1.” underneath.',
  'The answer is never parked in one position within a tier and a move. A child who '
  'notices the answer is always last stops reading the question.',
  'Distractors are plausible: counts within four of the answer, misreadings within two '
  'letters. “cat” against “elephant” is a length question.',
  'Red and green never decide an item — specifically, the <i>answer</i> is never '
  'opposite the other one. A colour-blind child is assessed on what they know.',
  'Every subject uses one format throughout. Old items survived a rewrite twice; this '
  'catches it.',
  'No passage appears in two subjects.',
  'The bank’s own note names exactly the subjects still carrying placeholder items. It '
  'went stale the moment a stub was replaced, which is the kind of claim nobody rechecks.',
]))
A(P('Browser scripts', 'h2'))
A(TBL([
  ['Script', 'What it proves'],
  ['<font face="Courier">noblank.mjs</font>',
   'Walks every skip combination on both tracks and asserts the stage is never empty. '
   'This is the one that would have caught the white screen.'],
  ['<font face="Courier">audit5.mjs</font>',
   'Six profiles × every screen: horizontal overflow, gutters, unexpected scrolling.'],
  ['<font face="Courier">nfcount.mjs</font>',
   'Every counting card shows its whole count — measured, not counted in the DOM.'],
  ['<font face="Courier">sc-grid.mjs</font>, <font face="Courier">paintfit.mjs</font>',
   'Card layout at every option count from 3 to 6, four viewports down to 360×640, '
   'last card visible.'],
], [42*mm, W-42*mm]))
A(P('Run order that has worked: <font face="Courier">npx vitest run</font>, then '
    '<font face="Courier">npm run build</font>, then '
    '<font face="Courier">npx vite preview --port 4173</font>, then the scripts against it. '
    'The sweeps take 10–15 minutes and are worth it before any content change ships.'))

# ---------------------------------------------------------------- 10
A(PageBreak())
A(P('10. What is NOT built', 'h1'))
A(P('<b>Nothing scores a spoken answer.</b> '
    '<font face="Courier">src/assessment/speechScoring.ts</font> exports '
    '<font face="Courier">STUB_SCORER</font>, which returns '
    '<font face="Courier">{ scored: false, reason: \'no-scorer\' }</font> for every take. A '
    'test asserts <font face="Courier">SPEECH_SCORING_IS_STUB</font> so this cannot be '
    'forgotten.', 'note'))
A(P('This is a seam, not a hole in the plumbing: the UI is finished, the microphone works, '
    'takes are timed, and the flow handles an unscored answer correctly all the way to the '
    'parent screen. What is missing is the thing that turns audio into a verdict.'))
A(P('What it costs, concretely', 'h2'))
A(TBL([
  ['Subject', 'Track', 'Cost'],
  ['Oral Reading', 'Grade Level',
   '<b>Half the reading gate.</b> Step 1 of the priority gate is the hardest block in the '
   'product and it runs on one measured subject instead of two.'],
  ['Words Speaking', 'Grade Level', 'Produces observations nobody can act on.'],
  ['Word Practice (1 move of 3)', 'Little Readers',
   '<b>One of only two subjects that place an under-7</b>, so a third of its evidence is '
   'unusable. This is why two of its three moves are tapped rather than spoken — the '
   'reference design was a microphone alone, which would have left an under-7 placed on '
   'Letter Sounds only.'],
], [34*mm, 24*mm, W-58*mm]))
A(P('The three options', 'h2'))
A(TBL([
  ['Option', 'Gets you', 'Costs'],
  ['<b>Browser speech recognition</b><br/>(Web Speech API)',
   'Ships today, free. The hooks already exist — '
   '<font face="Courier">useReadingTracker.ts</font> uses it for read-along.',
   'Mediocre with young voices and accents. Chrome-ish. Sends audio to a vendor.'],
  ['<b>Own Whisper endpoint</b>',
   'Accurate, private, works offline-ish, no vendor lock.',
   'Money and infrastructure. Somebody owns a GPU or an inference bill.'],
  ['<b>Record, a teacher scores it</b>',
   'The most accurate option, and the only one that tells you what “good” actually '
   'sounds like for this age group.',
   'Does not scale past the first cohort. Needs a queue and a teacher UI.'],
], [34*mm, (W-34*mm)*0.5, (W-34*mm)*0.5]))
A(P('<b>Recommendation for where this project is now</b> — pre-launch, five teachers, no '
    'users: do the third. It is the only one that produces labelled data on real children, '
    'and you need that data to tune or train either of the other two later. Move to Whisper '
    'once the queue hurts.'))

A(P('Also pending, and smaller', 'h2'))
A(BULLETS([
  '<font face="Courier">LITTLE_READER_MAX_AGE = 6</font>, the reading-level rule and the '
  'program names are all config <b>pending teacher sign-off</b>. They are judgements about '
  'children, kept in one place each.',
  'The 60-second Sentence Writing timer is deliberately not built. It needs a teacher’s '
  'name against it before a clock goes near a child’s writing.',
  'Orange and purple are absent from the shape palette. Adding them means new brand hexes, '
  'which is a design-system decision.',
  'Sounds <font face="Courier">q x y z v</font> have no picture word.',
]))

# ---------------------------------------------------------------- 11
A(PageBreak())
A(P('11. Running it', 'h1'))
A(P('npm install<br/>'
    'npm run dev            # localhost:5173<br/>'
    'npx vitest run         # 157 tests<br/>'
    'npm run build          # -&gt; dist/<br/>'
    'npx vite preview --port 4173', 'code'))
A(P('Useful query parameters', 'h2'))
A(P('The flow can be entered directly, which is how every browser script drives it:'))
A(P('http://localhost:4173/?name=Ada&amp;age=5&amp;grade=1     # Little Readers<br/>'
    'http://localhost:4173/?name=Maya&amp;age=10&amp;grade=5   # Grade Level', 'code'))
A(P('Session state is in <font face="Courier">localStorage</font>; clear it to start over.'))

A(P('Adding or replacing content', 'h2'))
A(BULLETS([
  'Edit <font face="Courier">src/content/questionBank.json</font>. Subject and tier live in '
  'the data — no engine change is needed.',
  'Generate items with a script that asserts its own rules, and keep the script. Every '
  'subject in this build has one; they caught real bugs (three tier-0 items parking the '
  'answer in the same slot, a colour guard that re-rolled per element).',
  'Then add tests that hold the <i>content</i>, not the code. See §9.',
  'Then look at it in a browser at four viewports. Every layout bug in §8 was found by '
  'looking, not by a test.',
]))

A(P('The one thing to keep', 'h2'))
A(P('If you change nothing else, keep the rule that <b>an answer nothing could judge is '
    'recorded as unscored and told to the parent</b>. It is the difference between a '
    'placement you can defend and a number you made up.'))

A(Spacer(1, 14))
A(P('Generated from the repository at branch '
    '<font face="Courier">claude/olc-placement-assessment-y4lrpw</font>. '
    'The deeper narrative, including what was tried and abandoned, is in '
    '<font face="Courier">README.md</font>.', 'foot'))

def furniture(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE); canvas.setLineWidth(0.5)
    canvas.line(18*mm, A4[1]-14*mm, A4[0]-18*mm, A4[1]-14*mm)
    canvas.setFont('Helvetica', 7.5); canvas.setFillColor(colors.HexColor('#94A3B8'))
    canvas.drawString(18*mm, A4[1]-11.5*mm, 'OLC — Placement Assessment · engineering handover')
    canvas.drawRightString(A4[0]-18*mm, 12*mm, str(canvas.getPageNumber()))
    canvas.restoreState()

doc = SimpleDocTemplate('docs/OLC-placement-assessment-handover.pdf', pagesize=A4,
                        leftMargin=18*mm, rightMargin=18*mm,
                        topMargin=20*mm, bottomMargin=18*mm,
                        title='OLC Placement Assessment — engineering handover',
                        author='OLC')
doc.build(story, onFirstPage=furniture, onLaterPages=furniture)
print('built')
