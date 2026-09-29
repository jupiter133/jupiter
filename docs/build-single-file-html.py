"""Inline dist/ into one self-contained HTML file.

Run `npm run build` first. The output is a build artefact: regenerate it after
any change rather than editing it.
"""
import re
import pathlib

dist = pathlib.Path('dist')
html = (dist / 'index.html').read_text()
html = re.sub(
    r'<script type="module"[^>]*crossorigin src="([^"]+)"></script>',
    lambda m: '<script type="module">' + (dist / m.group(1).lstrip('/')).read_text() + '</script>',
    html,
)
html = re.sub(
    r'<link rel="stylesheet"[^>]*href="([^"]+)"\s*/?>',
    lambda m: '<style>' + (dist / m.group(1).lstrip('/')).read_text() + '</style>',
    html,
)
assert 'assets/' not in html, 'something did not inline'
out = pathlib.Path('docs/OLC-placement-assessment.html')
out.write_text(html)
print(f'{out} \u2014 {len(html):,} bytes')
