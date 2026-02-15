# Copyright 2026 Abdulrehman Qureshi
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
FastAPI backend for the RAG system with Firebase auth, sessions, and document management.
"""
import os
import shutil
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends,
    BackgroundTasks,
    Form,
    Query,
    Response,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth import get_current_user
from config import get_config
from db_supabase import (
    add_message,
    cleanup_expired_documents,
    cleanup_old_sessions,
    create_session,
    delete_document,
    delete_session,
    get_document,
    init_db,
    list_documents,
    list_messages,
    list_sessions,
    register_document,
    rename_session,
    set_pinned,
    upsert_user,
    clone_session,
)
from rag_system import CloudRAG


config = get_config()

app = FastAPI(title="Cloud RAG API")

# Build CORS origins list defensively. Railway sometimes injects an empty env var,
# which previously produced an empty list and no CORS headers.
origins_raw = config.ALLOWED_ORIGINS or "*"
allowed_origins = [o.strip() for o in origins_raw.split(",") if o.strip()] or ["*"]
allow_creds = False if allowed_origins == ["*"] else True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_creds,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Single RAG instance to maintain state
rag_instance: Optional[CloudRAG] = None

BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


class SessionCreateRequest(BaseModel):
    name: Optional[str] = None
    clone_from: Optional[str] = None


class MessageRequest(BaseModel):
    question: str
    mode: str = "hybrid"  # strict | hybrid
    explain_simpler: bool = False
    replace_message_id: Optional[str] = None


class QueryResponse(BaseModel):
    question: str
    response: str
    sources: list
    num_sources: int
    supported_by_documents: bool
    confidence: dict
    mode: str
    retrieval_ms: int
    generation_ms: int


def _safe_filename(filename: str) -> str:
    keep = [c if c.isalnum() or c in (".", "-", "_") else "_" for c in filename]
    cleaned = "".join(keep)
    return cleaned or "upload"


def _ensure_user(user):
    if not user or not user.get("uid"):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


def _ensure_session(session_id: str, user_id: str):
    sessions = list_sessions(user_id)
    if not any(s["id"] == session_id for s in sessions):
        raise HTTPException(status_code=404, detail="Session not found")
    return True


def _enforce_size_limit(file: UploadFile):
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    max_bytes = config.MAX_FILE_MB * 1024 * 1024
    if size > max_bytes:
        raise HTTPException(
            status_code=400, detail=f"File too large. Max {config.MAX_FILE_MB} MB"
        )
    return size


def _delete_file(path: Path):
    try:
        if path.exists():
            path.unlink()
    except Exception as exc:  # pylint: disable=broad-except
        print(f"⚠️ Failed to delete file {path}: {exc}")


def _get_rag() -> CloudRAG:
    if not rag_instance:
        raise HTTPException(status_code=503, detail="RAG system not initialized")
    return rag_instance


@app.on_event("startup")
async def startup_event():
    """Initialize RAG system and database on startup."""
    global rag_instance  # pylint: disable=global-statement
    rag_instance = CloudRAG()
    init_db()
    print("✅ Database ready")

    # Clean expired temp docs and stale sessions
    expired = cleanup_expired_documents()
    for row in expired:
        try:
            rag_instance.vector_store.delete_by_doc_id(row["id"])
        except Exception as exc:  # pylint: disable=broad-except
            print(f"Failed to delete vectors for {row['id']}: {exc}")
        _delete_file(Path(row["stored_path"]))

    old = cleanup_old_sessions(days=30)
    for sess in old.get("sessions", []):
        try:
            rag_instance.clear_session_data(sess["user_id"], sess["id"])
        except Exception as exc:  # pylint: disable=broad-except
            print(f"Failed to clear vectors for stale session {sess['id']}: {exc}")
    for doc in old.get("documents", []):
        _delete_file(Path(doc["stored_path"]))


@app.get("/")
async def root():
    return {"status": "online", "message": "Cloud RAG API"}


@app.get("/me")
async def me(user=Depends(get_current_user)):
    _ensure_user(user)
    return user


@app.get("/stats")
async def get_stats(user=Depends(get_current_user)):
    _ensure_user(user)
    rag = _get_rag()
    return rag.get_stats()


@app.post("/sessions")
async def create_user_session(payload: SessionCreateRequest, user=Depends(get_current_user)):
    _ensure_user(user)
    upsert_user(user["uid"], user.get("email", ""))
    name = payload.name or "Untitled Session"
    
    if payload.clone_from:
        session_id = clone_session(payload.clone_from, user["uid"])
        if session_id:
            rename_session(session_id, name, user["uid"])
            return {"id": session_id, "name": name}
        raise HTTPException(status_code=404, detail="Source session not found")
    
    session_id = create_session(user["uid"], name)
    return {"id": session_id, "name": name}


@app.get("/sessions")
async def list_user_sessions(user=Depends(get_current_user)):
    _ensure_user(user)
    return list_sessions(user["uid"])


@app.patch("/sessions/{session_id}")
async def rename_user_session(session_id: str, payload: SessionCreateRequest, user=Depends(get_current_user)):
    _ensure_user(user)
    if not payload.name:
        raise HTTPException(status_code=400, detail="Name is required")
    rename_session(session_id, payload.name, user["uid"])
    return {"status": "ok"}


@app.post("/sessions/{session_id}/clone")
async def clone_user_session(session_id: str, user=Depends(get_current_user)):
    _ensure_user(user)
    new_id = clone_session(session_id, user["uid"])
    if not new_id:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"id": new_id}


@app.delete("/sessions/{session_id}")
async def delete_user_session(session_id: str, user=Depends(get_current_user)):
    _ensure_user(user)
    _ensure_session(session_id, user["uid"])
    delete_session(session_id, user["uid"])
    rag = _get_rag()
    rag.clear_session_data(user["uid"], session_id)
    session_dir = UPLOAD_DIR / user["uid"] / session_id
    shutil.rmtree(session_dir, ignore_errors=True)
    return {"status": "deleted"}


@app.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str, user=Depends(get_current_user)):
    _ensure_user(user)
    _ensure_session(session_id, user["uid"])
    return list_messages(session_id)


@app.post("/sessions/{session_id}/messages", response_model=QueryResponse)
async def create_message(
    session_id: str,
    payload: MessageRequest,
    user=Depends(get_current_user),
):
    _ensure_user(user)
    _ensure_session(session_id, user["uid"])
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    upsert_user(user["uid"], user.get("email", ""))

    if payload.replace_message_id:
        # mark as edited by linking parent id
        add_message(
            session_id,
            role="user-edit",
            content=f"Edited message {payload.replace_message_id}",
            metadata={"target": payload.replace_message_id},
        )

    user_msg_id = add_message(
        session_id,
        role="user",
        content=payload.question,
    )

    rag = _get_rag()
    result = rag.query(
        question=payload.question,
        user_id=user["uid"],
        session_id=session_id,
        mode=payload.mode,
        explain_simpler=payload.explain_simpler,
    )

    assistant_metadata = {
        "supported_by_documents": result["supported_by_documents"],
        "mode": payload.mode,
    }

    add_message(
        session_id,
        role="assistant",
        content=result["response"],
        metadata=assistant_metadata,
        parent_id=user_msg_id,
    )

    return result


@app.patch("/sessions/{session_id}/messages/{message_id}/pin")
async def pin_message(session_id: str, message_id: str, pinned: bool = Query(True), user=Depends(get_current_user)):
    _ensure_user(user)
    _ensure_session(session_id, user["uid"])
    set_pinned(message_id, pinned, user["uid"])
    return {"status": "ok", "pinned": pinned}


@app.get("/sessions/{session_id}/export")
async def export_session(session_id: str, user=Depends(get_current_user)):
    _ensure_user(user)
    _ensure_session(session_id, user["uid"])
    messages = list_messages(session_id, limit=500)
    lines: List[str] = [f"# Session {session_id}", ""]
    for msg in messages:
        role = "User" if msg["role"].startswith("user") else "Assistant"
        lines.append(f"## {role} ({msg['created_at']})")
        lines.append(msg["content"])
        meta = msg.get("metadata", {})
        if meta and isinstance(meta, dict) and meta.get("supported_by_documents"):
            lines.append("\nNote: Answer references your uploaded documents.")
        lines.append("")
    return Response("\n".join(lines), media_type="text/markdown")


@app.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    session_id: str = Form(...),
    is_temp: bool = Form(False),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    """Upload and process a document."""
    _ensure_user(user)
    _ensure_session(session_id, user["uid"])
    rag = _get_rag()

    allowed_extensions = {
        ".pdf",
        ".txt",
        ".docx",
        ".html",
        ".htm",
        ".png",
        ".jpg",
        ".jpeg",
        ".heic",
        ".webp",
        ".bmp",
        ".tiff",
        ".tif",
    }
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(allowed_extensions))}",
        )

    size = _enforce_size_limit(file)

    try:
        safe_name = _safe_filename(file.filename)
        doc_id = str(uuid.uuid4())
        session_dir = UPLOAD_DIR / user["uid"] / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        file_path = session_dir / f"{doc_id}_{safe_name}"

        # Persist upload
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        expires_at = (
            datetime.utcnow() + timedelta(minutes=config.TEMP_DOC_TTL_MIN)
            if is_temp
            else None
        )

        register_document(
            doc_id=doc_id,
            user_id=user["uid"],
            session_id=session_id,
            filename=file.filename,
            stored_path=str(file_path),
            mime=file.content_type,
            size_bytes=size,
            is_temp=is_temp,
            expires_at=expires_at,
        )

        # Vectorize in background to keep response fast
        background_tasks.add_task(
            rag.add_document,
            file_path=str(file_path),
            doc_id=doc_id,
            user_id=user["uid"],
            session_id=session_id,
        )

        return {
            "status": "success",
            "message": f"Document '{file.filename}' queued for processing",
            "filename": file.filename,
            "doc_id": doc_id,
            "expires_at": expires_at.isoformat() if expires_at else None,
        }

    except HTTPException:
        raise
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=500, detail=f"Error processing document: {exc}") from exc
    finally:
        file.file.close()


@app.get("/documents")
async def get_documents(session_id: Optional[str] = None, user=Depends(get_current_user)):
    _ensure_user(user)
    docs = list_documents(user["uid"], session_id=session_id)
    return docs


@app.get("/documents/{doc_id}/preview")
async def preview_document(doc_id: str, user=Depends(get_current_user)):
    _ensure_user(user)
    doc = get_document(doc_id, user["uid"])
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    path = Path(doc["stored_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="File missing on disk")

    # Light preview: return first 3000 characters for text files
    if path.suffix.lower() in {".txt", ".md", ".html", ".htm"}:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read(3000)
        return {"text": content, "filename": doc["filename"], "mime": doc["mime"]}
    return {
        "message": "Preview not available for this file type. Please download.",
        "filename": doc["filename"],
    }


@app.delete("/documents/{doc_id}")
async def remove_document(doc_id: str, user=Depends(get_current_user)):
    _ensure_user(user)
    doc = get_document(doc_id, user["uid"])
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    delete_document(doc_id, user["uid"])
    try:
        rag = _get_rag()
        rag.vector_store.delete_by_doc_id(doc_id)
    except Exception as exc:  # pylint: disable=broad-except
        print(f"Failed to delete vectors for {doc_id}: {exc}")
    _delete_file(Path(doc["stored_path"]))
    return {"status": "deleted"}


@app.delete("/clear")
async def clear_user_data(user=Depends(get_current_user)):
    """Clear all documents, vectors, and sessions for the user."""
    _ensure_user(user)
    rag = _get_rag()
    rag.clear_user_data(user["uid"])
    # remove db rows
    sessions = list_sessions(user["uid"])
    for sess in sessions:
        delete_session(sess["id"], user["uid"])
    # remove files
    shutil.rmtree(UPLOAD_DIR / user["uid"], ignore_errors=True)
    return {"status": "success", "message": "User data cleared"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
