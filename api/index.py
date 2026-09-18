"""
Vercel Serverless Function Entrypoint for NexusRAG FastAPI Backend.
Seamlessly routes incoming Vercel requests to the FastAPI application.
"""
import os
import sys
from pathlib import Path

# Setup paths so backend modules are discoverable
current_dir = Path(__file__).resolve().parent
repo_root = current_dir.parent if current_dir.name == "api" else current_dir
backend_dir = repo_root / "backend"

for p in (str(repo_root), str(backend_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

os.environ.setdefault("VERCEL", "1")

# Apply pysqlite3 replacement if available
try:
    __import__("pysqlite3")
    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
except ImportError:
    pass

from app import app as fastapi_app


class VercelPathRewriteMiddleware:
    """Ensure paths prefixed with /api/index.py by Vercel runtime are rewritten."""

    def __init__(self, asgi_app):
        self.asgi_app = asgi_app

    async def __call__(self, scope, receive, send):
        if scope.get("type") == "http":
            path = scope.get("path", "")
            if path.startswith("/api/index.py"):
                remainder = path[len("/api/index.py"):]
                scope["path"] = remainder if remainder.startswith("/") else ("/" + remainder if remainder else "/")
        await self.asgi_app(scope, receive, send)


fastapi_app.add_middleware(VercelPathRewriteMiddleware)

app = fastapi_app
