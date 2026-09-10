"""
STUB READING BANK GENERATOR.

Writes src/content/readingBank.stub.json: four reading sub-skill banks, six
items per sub-skill per tier, K (0) through Grade 8 (8). Every item is
template-generated from the word lists below. It exists so the engine and the
screens can be exercised end to end; it is NOT assessment content and must be
replaced by teacher-written banks before anything ships. See README.
"""
import json, random

random.seed(7)
letters = "abcd"

# Six target words per tier, roughly graded. Word recognition and decoding
# both draw from these.
WORDS = {
    0: ["cat", "dog", "sun", "hat", "big", "run", "map", "cup"],
    1: ["ship", "frog", "jump", "milk", "nest", "wish", "hand", "tree"],
    2: ["bridge", "candle", "spring", "pocket", "window", "rabbit", "little", "friend"],
    3: ["thunder", "journey", "stretch", "whisper", "morning", "captain", "surprise", "kitchen"],
    4: ["mountain", "distance", "creature", "shoulder", "language", "curious", "harvest", "balance"],
    5: ["ancient", "generous", "brilliant", "horizon", "invisible", "obstacle", "peculiar", "reluctant"],
    6: ["persistent", "abandoned", "temporary", "fortunate", "necessary", "landscape", "immediate", "spectacle"],
    7: ["deliberate", "inevitable", "phenomenon", "reservoir", "meticulous", "eloquent", "ambiguous", "tentative"],
    8: ["unprecedented", "conscientious", "juxtaposition", "indispensable", "ephemeral", "ubiquitous", "quintessential", "incongruous"],
}

# Synonym pairs per tier for reading vocabulary.
SYNONYMS = {
    0: [("big", "large"), ("little", "small"), ("fast", "quick"), ("happy", "glad"), ("shut", "close"), ("start", "begin")],
    1: [("tiny", "very small"), ("loud", "noisy"), ("shout", "yell"), ("chilly", "cold"), ("gift", "present"), ("look", "see")],
    2: [("brave", "not afraid"), ("silent", "quiet"), ("enormous", "huge"), ("rapid", "fast"), ("finish", "end"), ("gather", "collect")],
    3: [("muddy", "wet with dirt"), ("ancient", "very old"), ("fragile", "easily broken"), ("gloomy", "dark and sad"), ("vanish", "disappear"), ("weary", "tired")],
    4: [("reluctant", "unwilling"), ("cautious", "careful"), ("abundant", "plenty"), ("dense", "thick"), ("hesitate", "pause"), ("summit", "top of a mountain")],
    5: [("brilliant", "very bright"), ("peculiar", "strange"), ("generous", "giving"), ("obstacle", "something in the way"), ("persist", "keep going"), ("evident", "clear to see")],
    6: [("permanent", "lasting"), ("temporary", "for a short time"), ("fortunate", "lucky"), ("inevitable", "certain to happen"), ("scarce", "in short supply"), ("conceal", "hide")],
    7: [("meticulous", "very careful"), ("eloquent", "well spoken"), ("ambiguous", "unclear"), ("tentative", "unsure"), ("diminish", "shrink"), ("candid", "honest")],
    8: [("ephemeral", "short-lived"), ("ubiquitous", "found everywhere"), ("indispensable", "essential"), ("incongruous", "out of place"), ("mitigate", "lessen"), ("pragmatic", "practical")],
}

# Passage comprehension: one template per tier, six name/goal combos each.
NAMES = ["Aya", "Ben", "Nina", "Sam", "Leo", "Mira"]
COMP = {
    0: dict(p="{n} has a red ball. {n} rolls it to the dog.", q="What does {n} roll?", a="A ball", d=["A hat", "A cup", "A cat"]),
    1: dict(p="{n} lost a mitten in the snow. {n} looked under the tree and found it.", q="Where was the mitten?", a="Under the tree", d=["In the house", "In the car", "On the hill"]),
    2: dict(p="{n} wanted to see the ducks, so {n} walked to the pond after lunch. The ducks were sleeping in the reeds.", q="Why did {n} walk to the pond?", a="To see the ducks", d=["To eat lunch", "To swim", "To find a friend"]),
    3: dict(p="The tent kept falling down. {n} tied the rope to a rock, and this time it stayed up all night.", q="What made the tent stay up?", a="Tying the rope to a rock", d=["Moving the tent", "The wind stopping", "A second tent"]),
    4: dict(p="{n} had never paddled a canoe before. By the end of the week, {n} could steer it across the lake without help, though it still tipped whenever anyone laughed.", q="What can you tell about {n} by the end of the week?", a="{n} had learned to steer", d=["{n} gave up paddling", "{n} was afraid of the lake", "{n} had a new canoe"]),
    5: dict(p="The trail guide said the river crossing would be simple. {n} noticed the water was higher than the marker and suggested waiting until morning. Nobody argued.", q="Why did {n} suggest waiting?", a="The water was higher than usual", d=["The guide was tired", "It was already morning", "The trail was closed"]),
    6: dict(p="Most hikers rush the last climb. {n} slowed down instead, stopping to check the map at every fork. The group reached the summit later than planned, but nobody took a wrong turn.", q="What is the main idea?", a="Going carefully avoided mistakes", d=["The summit was very high", "The group got lost", "Maps are hard to read"]),
    7: dict(p="The old survey marked the creek well east of where {n} found it. Rather than assume the survey was wrong, {n} recorded both positions and noted the date. Creeks move; records should say when they were made.", q="Why did {n} record both positions?", a="Because the creek may have moved over time", d=["Because the survey was useless", "Because {n} was unsure how to read a map", "Because the group insisted"]),
    8: dict(p="The expedition's success was attributed to its leader, yet {n}'s journal tells a different story: supplies were rationed by a cook nobody remembers, and the route was corrected twice by a guide the reports never name.", q="What does the author suggest about the official account?", a="It leaves out people who mattered", d=["It exaggerates the danger", "It was written by {n}", "It is entirely accurate"]),
}

def mutate(word):
    """A near-miss spelling: swap two letters, drop one, or double one."""
    w = list(word)
    kind = random.choice(["swap", "drop", "double", "sub"])
    if kind == "swap" and len(w) > 3:
        i = random.randrange(1, len(w) - 1); w[i], w[i + 1] = w[i + 1], w[i]
    elif kind == "drop" and len(w) > 3:
        del w[random.randrange(1, len(w) - 1)]
    elif kind == "double":
        i = random.randrange(1, len(w)); w.insert(i, w[i])
    else:
        # Substitute one letter: the only mutation that always yields something
        # new, so short words can never stall the generator.
        i = random.randrange(0, len(w)); w[i] = random.choice([c for c in "abdegmnoprstu" if c != w[i]])
    return "".join(w)

def near_misses(word, n=3):
    out = set()
    while len(out) < n:
        m = mutate(word)
        if m != word: out.add(m)
    return sorted(out)

def nonsense(word):
    """Change one vowel so it stops being a word (good enough for a stub)."""
    vowels = "aeiou"
    w = list(word)
    idx = [i for i, c in enumerate(w) if c in vowels]
    if not idx: return word + "ip"
    i = random.choice(idx)
    w[i] = random.choice([v for v in vowels if v != w[i]])
    return "".join(w)

def item(id, sub, tier, q, qj, correct, distractors, passage=None, title=None):
    opts = [correct] + list(distractors)
    random.shuffle(opts)
    out = {
        "id": id, "subject": "reading", "subSkill": sub, "tier": tier,
        "skill": f"stub-{sub}", "questionText": q, "questionTextJunior": qj,
        "options": [{"id": letters[i], "text": o} for i, o in enumerate(opts)],
        "correctAnswerId": letters[opts.index(correct)],
    }
    if passage: out["passage"] = passage; out["passageTitle"] = title
    return out

items = []
for tier in range(9):
    words = WORDS[tier][:6]
    for i, w in enumerate(words, 1):
        items.append(item(f"rs-wr-t{tier}-{i:02d}", "word-recognition", tier,
            f"Which word is “{w}”?", f"Find “{w}”.", w, near_misses(w)))
        pool = [x for x in WORDS[tier] if x != w]
        items.append(item(f"rs-or-t{tier}-{i:02d}", "oral-reading", tier,
            "Which one is a real word?", "Which one is a real word?", w,
            [nonsense(x) for x in random.sample(pool, 3)]))
    for i, (w, meaning) in enumerate(SYNONYMS[tier], 1):
        others = [m for (x, m) in SYNONYMS[tier] if x != w]
        items.append(item(f"rs-rv-t{tier}-{i:02d}", "reading-vocabulary", tier,
            f"“{w.capitalize()}” means:", f"What does “{w}” mean?", meaning, random.sample(others, 3)))
    t = COMP[tier]
    for i, n in enumerate(NAMES, 1):
        f = lambda s: s.replace("{n}", n)
        items.append(item(f"rs-pc-t{tier}-{i:02d}", "passage-comprehension", tier,
            f(t["q"]), f(t["q"]), f(t["a"]), [f(d) for d in t["d"]],
            passage=f(t["p"]), title="A short read"))

json.dump({"version": "STUB-reading-0.1", "stub": True,
           "note": "TEMPLATE-GENERATED STUB. Not assessment content. Replace before shipping.",
           "questions": items}, open("src/content/readingBank.stub.json", "w"), indent=2, ensure_ascii=False)
print(len(items))
