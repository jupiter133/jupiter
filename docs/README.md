# docs/

## `OLC-placement-assessment.html`

The whole assessment as **one self-contained file**. No server, no build step, no
network: open it in a browser and it runs. JS and CSS are inlined from a
production `npm run build`.

Use it to hand the thing to somebody — a teacher, a parent, an investor — without
asking them to install anything. Drop it on any static host and it works as-is.

Enter the flow directly with query parameters:

```
OLC-placement-assessment.html?name=Ada&age=5&grade=1     # Little Readers
OLC-placement-assessment.html?name=Maya&age=10&grade=5   # Grade Level
```

Session state lives in `localStorage`; clear it to start over.

**Regenerate it** after any change — it is a build artefact and goes stale:

```bash
npm run build
python3 docs/build-handover-pdf.py   # the PDF
python3 docs/build-single-file-html.py   # the HTML
```

## `OLC-placement-assessment-handover.pdf`

Engineering handover, 13 pages: the flow, the adaptive engine, the priority
gate, all 14 subjects, the layout rules that cost us, how it is verified, and
what is still unbuilt.

Read §10 first. It is the one open decision in the project.

Built by `build-handover-pdf.py` (reportlab). Edit that, re-run it, and commit
both — the PDF is generated, not hand-edited.

The longer narrative, including what was tried and abandoned, stays in the root
`README.md`.
