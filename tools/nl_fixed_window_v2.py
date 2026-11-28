#!/usr/bin/env python3
"""Embed the production fixed-window UI in the canonical offline game HTML."""
from __future__ import annotations

import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
CSS = HERE / "nl_fixed_window_v2.css"
JS = HERE / "nl_fixed_window_v2.js"
STYLE_ID = "nl-fixed-window-v2-style"
SCRIPT_ID = "nl-fixed-window-v2-script"


def apply_fixed_window(html: str) -> str:
    """Return canonical HTML with exactly one deterministic UI V2 bundle."""
    if html.count("</head>") != 1 or html.count("</body>") != 1:
        raise ValueError("Expected one canonical HTML head and body")
    if not all(anchor in html for anchor in ('id="app"', 'id="view"')):
        raise ValueError("Canonical game is missing app/view anchors")
    if "NL-WINDOW-UI-20261121:" in html:
        raise ValueError("Obsolete UI V1 overlay detected; rebuild canonical HTML first")
    if "nl-review-art-d-style" in html or "nl-review-art-d-script" in html:
        raise ValueError("Review-only art was found in the canonical build input")

    css = CSS.read_text(encoding="utf-8")
    js = JS.read_text(encoding="utf-8")
    if "NL FIXED WINDOW V2" not in css or "NL-WINDOW-UI-V2" not in js:
        raise ValueError("Fixed-window UI source marker missing")
    if "</style" in css.lower() or "</script" in js.lower():
        raise ValueError("Unsafe fixed-window inline source")

    style_tag = f'<style id="{STYLE_ID}">'
    script_tag = f'<script id="{SCRIPT_ID}">'
    if html.count(style_tag) > 1 or html.count(script_tag) > 1:
        raise ValueError("Duplicate fixed-window UI bundle in canonical input")
    html = re.sub(rf'<style id="{STYLE_ID}">.*?</style>\s*', "", html, flags=re.S)
    html = re.sub(rf'<script id="{SCRIPT_ID}">.*?</script>\s*', "", html, flags=re.S)
    html = html.replace("</head>", f"{style_tag}\n{css}</style>\n</head>", 1)
    html = html.replace("</body>", f"{script_tag}\n{js}</script>\n</body>", 1)
    if html.count(style_tag) != 1 or html.count(script_tag) != 1:
        raise AssertionError("Failed to embed exactly one fixed-window UI bundle")
    return html
