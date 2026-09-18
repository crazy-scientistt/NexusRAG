"""
Vercel serverless function entrypoint for the NexusRAG FastAPI backend.

Vercel imports this module once per cold start and serves the top-level `app`.
Anything that raises here takes the whole API down with an opaque platform 500,
so this module resolves paths defensively and, if the backend still fails to
import, serves a small ASGI app that reports the reason instead.
"""
import os
import sys
import traceback
from pathlib import Path

os.environ.setdefault("VERCEL", "1")


def _locate_backend() -> Path:
    """Return the directory holding the backend package, and put it on sys.path.

    The bundler does not promise to preserve the repository layout around this
    file, so find the directory that actually contains app.py by walking up from
    here rather than assuming it is always ../backend.
    """
    here = Path(__file__).resolve()
    for parent in (here.parent, *here.parents):
        for candidate in (parent / "backend", parent):
            if (candidate / "app.py").is_file():
                for entry in (str(candidate.parent), str(candidate)):
                    if entry not in sys.path:
                        sys.path.insert(0, entry)
                return candidate
    raise ModuleNotFoundError(
        "Could not find backend/app.py starting from %s. Searched: %s"
        % (here, [str(p) for p in (here.parent, *here.parents)])
    )


def _prefer_pysqlite3() -> None:
    """Use pysqlite3 when present; some runtimes ship an sqlite3 too old for chromadb."""
    try:
        __import__("pysqlite3")
        sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
    except ImportError:
        pass


class VercelPathRewriteMiddleware:
    """Strip the function's own file path when the platform routes it through.

    Depending on how a request is rewritten, the ASGI path can arrive as
    /api/index.py/<rest> instead of /<rest>. The parameter is named `app`
    because Starlette constructs middleware as cls(app, ...).
    """

    PREFIXES = ("/api/index.py", "/api/index")

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            path = scope.get("path", "")
            for prefix in self.PREFIXES:
                if path == prefix or path.startswith(prefix + "/"):
                    rest = path[len(prefix):]
                    scope = dict(scope)
                    scope["path"] = rest if rest.startswith("/") else "/" + rest
                    break
        await self.app(scope, receive, send)


def _boot_failure_app(detail: str):
    """Minimal ASGI app that reports why the backend could not be imported."""

    async def failed_app(scope, receive, send):
        if scope.get("type") == "lifespan":
            while True:
                message = await receive()
                if message["type"] == "lifespan.startup":
                    await send({"type": "lifespan.startup.complete"})
                elif message["type"] == "lifespan.shutdown":
                    await send({"type": "lifespan.shutdown.complete"})
                    return
        body = ("NexusRAG backend failed to start.\n\n" + detail).encode("utf-8")
        await send({
            "type": "http.response.start",
            "status": 500,
            "headers": [(b"content-type", b"text/plain; charset=utf-8"),
                        (b"cache-control", b"no-store")],
        })
        await send({"type": "http.response.body", "body": body})

    return failed_app


_prefer_pysqlite3()

try:
    _locate_backend()
    from app import app as fastapi_app

    fastapi_app.add_middleware(VercelPathRewriteMiddleware)
    app = fastapi_app
except Exception:
    # Print first so the traceback reaches the platform's runtime logs, then
    # serve it, because a cold-start failure is otherwise invisible from outside.
    _detail = traceback.format_exc()
    print("[FATAL] NexusRAG backend import failed:\n" + _detail, file=sys.stderr)
    app = _boot_failure_app(_detail)
