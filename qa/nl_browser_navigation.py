"""Load large HTML via file navigation rather than a DevTools markup message.
Keep the exact test fixture (including injected storage shims) and retain the
temporary document until process exit so reload and save tests keep working.
"""
from pathlib import Path
import atexit
import tempfile

ROOT = Path(__file__).resolve().parents[1]
def navigate_markup(page, markup, *, wait_until="domcontentloaded", timeout=None):
    # Same directory as the actual game: preserve relative asset resolution.
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".html",
                                     prefix=".nl-browser-qa-", dir=ROOT,
                                     delete=False) as stream:
        stream.write(markup)
        path = Path(stream.name)
    atexit.register(path.unlink, missing_ok=True)
    return page.goto(path.as_uri(), wait_until=wait_until,
                     timeout=max(180000, timeout or 0))
