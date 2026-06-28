#!/usr/bin/env python3
"""Genera Business Plan HTML con estilo NaoLab (tema web)."""
from __future__ import annotations

import html
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MD_PATH = ROOT / "docs" / "NaoLab_BusinessPlan_v1.1_Completo.md"
OUT_HTML = ROOT / "docs" / "NaoLab_BusinessPlan_v1.1_Completo.html"
OUT_DOWNLOADS = Path.home() / "Downloads" / "NaoLab_BusinessPlan_v1.1_Completo.html"

BRAND_SVG = """<svg class="bp-logo" width="40" height="40" viewBox="0 0 48 48" aria-hidden="true">
  <defs>
    <linearGradient id="nl-grad" x1="8" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7a7268" stop-opacity="0.45"/>
      <stop offset="0.4" stop-color="#7a7268"/>
      <stop offset="1" stop-color="#5c564e"/>
    </linearGradient>
    <linearGradient id="nl-route" x1="13" y1="14" x2="35" y2="34" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7a7268" stop-opacity="0.15"/>
      <stop offset="1" stop-color="#5c564e" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <circle cx="13.5" cy="14.5" r="2.1" fill="url(#nl-grad)" opacity="0.85"/>
  <circle cx="34.5" cy="33.5" r="2.1" fill="url(#nl-grad)" opacity="0.85"/>
  <path d="M 24 22 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0" fill="none" stroke="url(#nl-grad)" stroke-width="1.15" stroke-opacity="0.28"/>
  <g stroke="url(#nl-grad)" stroke-width="1.1" stroke-linecap="round" stroke-opacity="0.38">
    <path d="M 24 6.5 V 9.5"/><path d="M 24 34.5 V 37.5"/><path d="M 7.5 22 H 10.5"/><path d="M 37.5 22 H 40.5"/>
  </g>
  <path d="M 13.5 14.5 Q 24 27 34.5 33.5" fill="none" stroke="url(#nl-route)" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M 15 34 V 14 L 33 34 V 14" fill="none" stroke="url(#nl-grad)" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 6 40.5 Q 14 37.5 24 39.5 T 42 40.5" fill="none" stroke="url(#nl-grad)" stroke-width="1.65" stroke-linecap="round" stroke-opacity="0.55"/>
</svg>"""


def inline_md(text: str) -> str:
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)
    text = re.sub(r"`(.+?)`", r"<code>\1</code>", text)
    return text


def slugify(title: str) -> str:
    s = title.lower().strip()
    s = re.sub(r"^[\d.]+\s*", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "section"


def parse_md(content: str) -> tuple[str, list[dict]]:
    lines = content.splitlines()
    skip_until = 0
    for i, line in enumerate(lines):
        if line.startswith("## Table of contents") or line.startswith("## Índice"):
            skip_until = i
            break

    body_lines = lines[skip_until:]
    # drop cover block before index - handled in template
    sections: list[dict] = []
    current: dict | None = None
    buffer: list[str] = []
    table_buffer: list[str] = []
    in_code = False
    code_buffer: list[str] = []

    def flush_paragraphs():
        nonlocal buffer
        if not buffer or current is None:
            buffer = []
            return
        text = " ".join(x.strip() for x in buffer if x.strip())
        if text:
            current["blocks"].append({"type": "p", "html": inline_md(text)})
        buffer = []

    def flush_table():
        nonlocal table_buffer
        if not table_buffer or current is None:
            table_buffer = []
            return
        rows = []
        for row in table_buffer:
            if not row.strip().startswith("|"):
                continue
            cells = [c.strip() for c in row.strip().strip("|").split("|")]
            if all(set(c) <= set("-: ") for c in cells):
                continue
            rows.append(cells)
        if rows:
            current["blocks"].append({"type": "table", "rows": rows})
        table_buffer = []

    def flush_code():
        nonlocal code_buffer
        if code_buffer and current is not None:
            current["blocks"].append({"type": "pre", "text": "\n".join(code_buffer)})
        code_buffer = []

    for line in body_lines:
        if line.startswith("```"):
            flush_paragraphs()
            flush_table()
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_buffer.append(line)
            continue

        if line.strip().startswith("|"):
            flush_paragraphs()
            table_buffer.append(line)
            continue
        elif table_buffer:
            flush_table()

        if line.startswith("## "):
            flush_paragraphs()
            if current:
                sections.append(current)
            title = line[3:].strip()
            current = {"title": title, "id": slugify(title), "level": 2, "blocks": []}
            continue
        if line.startswith("### "):
            flush_paragraphs()
            if current:
                sections.append(current)
            title = line[4:].strip()
            current = {"title": title, "id": slugify(title), "level": 3, "blocks": []}
            continue

        if line.strip() == "---":
            flush_paragraphs()
            continue

        if line.startswith("- [ ] "):
            flush_paragraphs()
            if current:
                current["blocks"].append({"type": "check", "html": inline_md(line[6:])})
            continue
        if line.startswith("- "):
            flush_paragraphs()
            if current:
                current["blocks"].append({"type": "li", "html": inline_md(line[2:])})
            continue

        if line.strip().startswith(">"):
            flush_paragraphs()
            if current:
                current["blocks"].append({"type": "quote", "html": inline_md(line.strip()[1:].strip())})
            continue

        if line.strip().startswith("**") and line.strip().endswith("**") and line.count("**") == 2:
            flush_paragraphs()
            if current:
                current["blocks"].append({"type": "lead", "html": inline_md(line.strip()[2:-2])})
            continue

        if line.strip().startswith("*") and line.strip().endswith("*") and not line.strip().startswith("**"):
            flush_paragraphs()
            if current:
                current["blocks"].append({"type": "note", "html": inline_md(line.strip()[1:-1])})
            continue

        if line.strip().startswith("─"):
            continue

        if line.strip():
            buffer.append(line)
        else:
            flush_paragraphs()

    flush_paragraphs()
    flush_table()
    if in_code:
        flush_code()
    if current:
        sections.append(current)

    toc = []
    for sec in sections:
        if sec["level"] == 2 and re.match(r"^\d{2}\.", sec["title"]):
            toc.append(sec)
    return "", sections


def render_block(block: dict) -> str:
    t = block["type"]
    if t == "p":
        return f'<p class="bp-p">{block["html"]}</p>'
    if t == "lead":
        return f'<p class="bp-lead">{block["html"]}</p>'
    if t == "note":
        return f'<p class="bp-note">{block["html"]}</p>'
    if t == "quote":
        return f'<blockquote class="bp-quote">{block["html"]}</blockquote>'
    if t == "li":
        return f'<li>{block["html"]}</li>'
    if t == "check":
        return f'<li class="bp-check"><span class="bp-check-box" aria-hidden="true"></span>{block["html"]}</li>'
    if t == "pre":
        return f'<pre class="bp-code">{html.escape(block["text"])}</pre>'
    if t == "table":
        rows = block["rows"]
        head = rows[0]
        body = rows[1:]
        th = "".join(f"<th>{inline_md(c)}</th>" for c in head)
        trs = []
        for row in body:
            tds = "".join(f"<td>{inline_md(c)}</td>" for c in row)
            trs.append(f"<tr>{tds}</tr>")
        return f'<div class="bp-table-wrap"><table class="bp-table"><thead><tr>{th}</tr></thead><tbody>{"".join(trs)}</tbody></table></div>'
    return ""


def render_sections(sections: list[dict]) -> str:
    out = []
    list_open = False
    check_open = False

    def close_lists():
        nonlocal list_open, check_open
        if check_open:
            out.append("</ul>")
            check_open = False
        if list_open:
            out.append("</ul>")
            list_open = False

    for sec in sections:
        close_lists()
        lvl = sec["level"]
        tag = "h2" if lvl == 2 else "h3"
        cls = "bp-section-title" if lvl == 2 else "bp-subsection-title"
        num = ""
        m = re.match(r"^(\d{2})\.\s*(.+)", sec["title"])
        if m and lvl == 2:
            num = f'<span class="bp-section-num">{m.group(1)}</span>'
            title = m.group(2)
        else:
            title = sec["title"]
        out.append(f'<section class="bp-section" id="{sec["id"]}">')
        out.append(f'<{tag} class="{cls}">{num}{inline_md(title)}</{tag}>')
        out.append('<div class="bp-card">')

        for block in sec["blocks"]:
            if block["type"] == "li":
                if check_open:
                    out.append("</ul>")
                    check_open = False
                if not list_open:
                    out.append('<ul class="bp-list">')
                    list_open = True
                out.append(render_block(block))
            elif block["type"] == "check":
                if list_open:
                    out.append("</ul>")
                    list_open = False
                if not check_open:
                    out.append('<ul class="bp-checklist">')
                    check_open = True
                out.append(render_block(block))
            else:
                close_lists()
                out.append(render_block(block))

        close_lists()
        out.append("</div></section>")

    return "\n".join(out)


CSS = """
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500&display=swap");

:root {
  --bg: #f7f7f4;
  --bg-elevated: #fdfdfc;
  --text: #2c2a26;
  --muted: #5c5752;
  --accent: #7a7268;
  --accent-strong: #5c564e;
  --accent-dim: rgba(122, 114, 104, 0.1);
  --border: rgba(44, 42, 38, 0.08);
  --border-strong: rgba(216, 213, 207, 0.95);
  --radius: 12px;
  --radius-sm: 8px;
  --content-max: 920px;
  --font: "DM Sans", system-ui, sans-serif;
  --mono: "JetBrains Mono", ui-monospace, monospace;
  color-scheme: light;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font);
  font-size: 16px;
  line-height: 1.6;
  color: var(--text);
  background: var(--bg);
  -webkit-font-smoothing: antialiased;
}

.bp-shell { min-height: 100vh; }

.bp-hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--border-strong);
  background: linear-gradient(180deg, #fdfdfc 0%, #f7f7f4 100%);
}
.bp-hero__glow {
  position: absolute;
  inset: -40% -20% auto;
  height: 420px;
  background: radial-gradient(ellipse at 30% 40%, rgba(122, 132, 113, 0.14), transparent 62%);
  pointer-events: none;
}
.bp-hero__inner {
  position: relative;
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 3rem 1.5rem 2.5rem;
}
.bp-hero__brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.bp-hero__name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-transform: none;
}
.bp-hero__eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--muted);
}
.bp-hero__title {
  margin: 0 0 0.35rem;
  font-size: clamp(2rem, 5vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  background: linear-gradient(120deg, #2c2a26 0%, #6f6b63 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.bp-hero__subtitle {
  margin: 0 0 1.25rem;
  max-width: 42ch;
  color: var(--muted);
  font-size: 1.05rem;
}
.bp-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}
.bp-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid var(--border-strong);
  background: rgba(253, 253, 252, 0.94);
  color: var(--muted);
}
.bp-badge--accent {
  color: #fffdfb;
  border-color: rgba(44, 42, 38, 0.08);
  background: #2c2a26;
}
.bp-badge--live {
  color: var(--text);
  border-color: rgba(122, 132, 113, 0.32);
  background: rgba(232, 235, 227, 0.95);
}

.bp-layout {
  max-width: calc(var(--content-max) + 280px);
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 2.5rem;
  align-items: start;
}

.bp-toc {
  position: sticky;
  top: 1.5rem;
  padding: 1rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: rgba(253, 253, 252, 0.98);
}
.bp-toc__label {
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}
.bp-toc ol {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.bp-toc a {
  display: block;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-sm);
  color: var(--muted);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  transition: background 0.18s, color 0.18s;
}
.bp-toc a:hover {
  color: var(--text);
  background: rgba(238, 240, 234, 0.85);
}
.bp-toc a.is-active {
  color: var(--text);
  background: rgba(232, 235, 227, 0.95);
}

.bp-main { min-width: 0; }

.bp-section { margin-bottom: 2rem; scroll-margin-top: 1.5rem; }
.bp-section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.85rem;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.bp-section-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 0.82rem;
  font-weight: 800;
  color: #fffdfb;
  flex-shrink: 0;
  background: linear-gradient(145deg, #7a7268 0%, #5c564e 100%);
  box-shadow: 0 2px 8px rgba(122, 114, 104, 0.22);
}
.bp-subsection-title {
  margin: 0 0 0.65rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}
.bp-card {
  padding: 1.15rem 1.25rem;
  border-radius: var(--radius);
  border: 1px solid var(--border-strong);
  background: rgba(253, 253, 252, 0.98);
}
.bp-p { margin: 0 0 0.85rem; color: var(--text); max-width: 72ch; }
.bp-p:last-child { margin-bottom: 0; }
.bp-lead {
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--accent-strong);
}
.bp-note {
  margin: 0 0 0.85rem;
  font-size: 0.92rem;
  color: var(--muted);
  font-style: italic;
}
.bp-quote {
  margin: 0 0 0.85rem;
  padding: 0.85rem 1rem;
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  background: var(--accent-dim);
  color: var(--text);
  font-weight: 600;
}
.bp-list, .bp-checklist {
  margin: 0 0 0.85rem;
  padding-left: 1.2rem;
  color: var(--text);
}
.bp-checklist { list-style: none; padding-left: 0; }
.bp-check {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin-bottom: 0.45rem;
}
.bp-check-box {
  width: 1rem;
  height: 1rem;
  margin-top: 0.2rem;
  border-radius: 4px;
  border: 1px solid rgba(168, 163, 154, 0.38);
  background: rgba(247, 247, 244, 0.98);
  flex-shrink: 0;
}
.bp-table-wrap {
  overflow-x: auto;
  margin: 0 0 0.85rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}
.bp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.bp-table th,
.bp-table td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}
.bp-table th {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  background: rgba(238, 240, 234, 0.55);
}
.bp-table tr:last-child td { border-bottom: none; }
.bp-table td strong { color: var(--accent-strong); }
.bp-code {
  margin: 0 0 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: rgba(247, 247, 244, 0.98);
  font-family: var(--mono);
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--accent-strong);
  overflow-x: auto;
}
code {
  font-family: var(--mono);
  font-size: 0.88em;
  padding: 0.1em 0.35em;
  border-radius: 4px;
  background: rgba(232, 235, 227, 0.65);
  color: var(--accent-strong);
}

.bp-footer {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 1.5rem 3rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
  border-top: 1px solid var(--border);
  padding-top: 1.5rem;
}

@media (max-width: 900px) {
  .bp-layout { grid-template-columns: 1fr; }
  .bp-toc { position: static; }
}

@media print {
  body { background: #fff; color: #2c2a26; }
  .bp-hero { background: #f7f7f4; border-color: #e5e3de; }
  .bp-hero__title { color: #2c2a26; background: none; -webkit-text-fill-color: #2c2a26; }
  .bp-hero__glow { display: none; }
  .bp-card, .bp-toc { background: #fdfdfc; border-color: #e5e3de; }
  .bp-toc { display: none; }
  .bp-section { break-inside: avoid; }
}
"""


def build_html(sections: list[dict]) -> str:
    toc_items = [
        s for s in sections if s["level"] == 2 and re.match(r"^\d{2}\.", s["title"])
    ]
    toc_html = "\n".join(
        f'<li><a href="#{s["id"]}">{html.escape(re.sub(r"^\d{2}\.\s*", "", s["title"]))}</a></li>'
        for s in toc_items
    )
    body = render_sections(sections)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>NaoLab — Business Plan v1.1</title>
  <meta name="description" content="NaoLab Business Plan v1.1 — trade operations platform for forwarders."/>
  <style>{CSS}</style>
</head>
<body>
<div class="bp-shell">
  <header class="bp-hero">
    <div class="bp-hero__glow" aria-hidden="true"></div>
    <div class="bp-hero__inner">
      <div class="bp-hero__brand">
        {BRAND_SVG}
        <p class="bp-hero__name">NaoLab</p>
      </div>
      <p class="bp-hero__eyebrow">Business Plan · Internal use</p>
      <h1 class="bp-hero__title">Trade operations platform</h1>
      <p class="bp-hero__subtitle">Supply chain management for logistics SMBs — orders, bookings, and trade setup without enterprise ERP.</p>
      <div class="bp-hero__meta">
        <span class="bp-badge bp-badge--accent">v1.1 · June 2026</span>
        <span class="bp-badge bp-badge--live">March 2027 milestone</span>
        <span class="bp-badge">Pablo Benéitez · naolab.io</span>
      </div>
    </div>
  </header>

  <div class="bp-layout">
    <nav class="bp-toc" aria-label="Table of contents">
      <p class="bp-toc__label">Contents</p>
      <ol>{toc_html}</ol>
    </nav>
    <main class="bp-main">
      {body}
    </main>
  </div>

  <footer class="bp-footer">
    <p>Living document — NaoLab Business Plan v1.1 · Pablo Benéitez · naolab.io</p>
  </footer>
</div>
<script>
document.querySelectorAll('.bp-toc a').forEach(a => {{
  a.addEventListener('click', e => {{
    document.querySelectorAll('.bp-toc a').forEach(x => x.classList.remove('is-active'));
    a.classList.add('is-active');
  }});
}});
</script>
</body>
</html>"""


def main():
    content = MD_PATH.read_text(encoding="utf-8")
    _, sections = parse_md(content)
    html_doc = build_html(sections)
    OUT_HTML.write_text(html_doc, encoding="utf-8")
    shutil.copy2(OUT_HTML, OUT_DOWNLOADS)
    print(f"HTML: {OUT_HTML}")
    print(f"Copy: {OUT_DOWNLOADS}")


if __name__ == "__main__":
    main()
