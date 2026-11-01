"""Wrap each src/<page>.html body in the shared head and foot -> <page>.html.

The first line of each src file is: <!-- title | description -->
"""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
head = (root / "tools/head.html").read_text()
foot = (root / "tools/foot.html").read_text()
for src in sorted((root / "src").glob("*.html")):
    first, body = src.read_text().split("\n", 1)
    title, desc = (s.strip() for s in first.strip()[4:-3].split("|", 1))
    page = "home" if src.stem == "index" else src.stem
    html = head.replace("{{TITLE}}", title).replace("{{DESC}}", desc).replace("{{PAGE}}", page) + body + foot
    (root / f"{src.stem}.html").write_text(html)
    print("wrote", src.stem + ".html")
