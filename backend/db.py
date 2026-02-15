"""
Lightweight SQLite helpers for sessions, messages, and documents.
"""
import json
import sqlite3
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional


def _connect(db_path: str):
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str):
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = _connect(db_path)
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            email TEXT,
            created_at TEXT
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_message_at TEXT,
            cloned_from TEXT,
            FOREIGN KEY(user_id) REFERENCES users(uid)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT,
            pinned INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            parent_id TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(id)
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            session_id TEXT,
            filename TEXT,
            stored_path TEXT,
            mime TEXT,
            size_bytes INTEGER,
            uploaded_at TEXT NOT NULL,
            is_temp INTEGER DEFAULT 0,
            expires_at TEXT
        )
        """
    )

    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_docs_user_session ON documents(user_id, session_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_docs_expiry ON documents(expires_at)")

    conn.commit()
    conn.close()


def upsert_user(db_path: str, uid: str, email: str):
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO users(uid, email, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT(uid) DO UPDATE SET email=excluded.email
        """,
        (uid, email, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()


def create_session(db_path: str, user_id: str, name: str, cloned_from: str = None) -> str:
    session_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO sessions(id, user_id, name, created_at, updated_at, cloned_from)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (session_id, user_id, name, now, now, cloned_from),
    )
    conn.commit()
    conn.close()
    return session_id


def list_sessions(db_path: str, user_id: str) -> List[Dict]:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, name, created_at, updated_at, last_message_at, cloned_from
        FROM sessions
        WHERE user_id=?
        ORDER BY COALESCE(last_message_at, updated_at) DESC
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def rename_session(db_path: str, session_id: str, name: str, user_id: str):
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "UPDATE sessions SET name=?, updated_at=? WHERE id=? AND user_id=?",
        (name, datetime.utcnow().isoformat(), session_id, user_id),
    )
    conn.commit()
    conn.close()


def clone_session(db_path: str, session_id: str, user_id: str) -> Optional[str]:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT name FROM sessions WHERE id=? AND user_id=?",
        (session_id, user_id),
    )
    row = cur.fetchone()
    if not row:
        conn.close()
        return None
    new_id = create_session(db_path, user_id, f"{row['name']} (copy)", cloned_from=session_id)

    cur.execute(
        "SELECT role, content, metadata, pinned, created_at, parent_id FROM messages WHERE session_id=?",
        (session_id,),
    )
    msgs = cur.fetchall()
    now = datetime.utcnow().isoformat()
    for m in msgs:
        cur.execute(
            """
            INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                str(uuid.uuid4()),
                new_id,
                m["role"],
                m["content"],
                m["metadata"],
                m["pinned"],
                now,
                m["parent_id"],
            ),
        )
    conn.commit()
    conn.close()
    return new_id


def delete_session(db_path: str, session_id: str, user_id: str):
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute("DELETE FROM messages WHERE session_id=?", (session_id,))
    cur.execute("DELETE FROM documents WHERE session_id=?", (session_id,))
    cur.execute("DELETE FROM sessions WHERE id=? AND user_id=?", (session_id, user_id))
    conn.commit()
    conn.close()


def add_message(
    db_path: str,
    session_id: str,
    role: str,
    content: str,
    metadata: Optional[Dict] = None,
    pinned: bool = False,
    parent_id: str = None,
) -> str:
    message_id = str(uuid.uuid4())
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            message_id,
            session_id,
            role,
            content,
            json.dumps(metadata or {}),
            1 if pinned else 0,
            datetime.utcnow().isoformat(),
            parent_id,
        ),
    )
    cur.execute(
        "UPDATE sessions SET last_message_at=?, updated_at=? WHERE id=?",
        (datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), session_id),
    )
    conn.commit()
    conn.close()
    return message_id


def list_messages(db_path: str, session_id: str, limit: int = 200) -> List[Dict]:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, role, content, metadata, pinned, created_at, parent_id
        FROM messages
        WHERE session_id=?
        ORDER BY created_at ASC
        LIMIT ?
        """,
        (session_id, limit),
    )
    rows = cur.fetchall()
    conn.close()

    result = []
    for r in rows:
        metadata = {}
        try:
            metadata = json.loads(r["metadata"] or "{}")
        except json.JSONDecodeError:
            metadata = {}
        result.append(
            {
                "id": r["id"],
                "role": r["role"],
                "content": r["content"],
                "metadata": metadata,
                "pinned": bool(r["pinned"]),
                "created_at": r["created_at"],
                "parent_id": r["parent_id"],
            }
        )
    return result


def set_pinned(db_path: str, message_id: str, pinned: bool, user_id: str):
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE messages
        SET pinned=?
        WHERE id=? AND session_id IN (SELECT id FROM sessions WHERE user_id=?)
        """,
        (1 if pinned else 0, message_id, user_id),
    )
    conn.commit()
    conn.close()


def register_document(
    db_path: str,
    doc_id: str,
    user_id: str,
    session_id: str,
    filename: str,
    stored_path: str,
    mime: str,
    size_bytes: int,
    is_temp: bool,
    expires_at: Optional[datetime],
):
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO documents(id, user_id, session_id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            doc_id,
            user_id,
            session_id,
            filename,
            stored_path,
            mime,
            size_bytes,
            datetime.utcnow().isoformat(),
            1 if is_temp else 0,
            expires_at.isoformat() if expires_at else None,
        ),
    )
    conn.commit()
    conn.close()


def list_documents(db_path: str, user_id: str, session_id: Optional[str] = None) -> List[Dict]:
    conn = _connect(db_path)
    cur = conn.cursor()
    if session_id:
        cur.execute(
            """
            SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
            FROM documents
            WHERE user_id=? AND session_id=?
            ORDER BY uploaded_at DESC
            """,
            (user_id, session_id),
        )
    else:
        cur.execute(
            """
            SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
            FROM documents
            WHERE user_id=?
            ORDER BY uploaded_at DESC
            """,
            (user_id,),
        )
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_document(db_path: str, doc_id: str, user_id: str) -> Optional[Dict]:
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
        FROM documents
        WHERE id=? AND user_id=?
        """,
        (doc_id, user_id),
    )
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_document(db_path: str, doc_id: str, user_id: str):
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM documents WHERE id=? AND user_id=?",
        (doc_id, user_id),
    )
    conn.commit()
    conn.close()


def cleanup_expired_documents(db_path: str) -> List[Dict]:
    """Delete expired temp documents; returns list of doc info removed."""
    now_iso = datetime.utcnow().isoformat()
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, stored_path, user_id, session_id FROM documents WHERE expires_at IS NOT NULL AND expires_at < ?",
        (now_iso,),
    )
    rows = cur.fetchall()
    doc_ids = [r["id"] for r in rows]
    if doc_ids:
        placeholders = ",".join(["?"] * len(doc_ids))
        cur.execute(f"DELETE FROM documents WHERE id IN ({placeholders})", doc_ids)
    conn.commit()
    conn.close()
    return [dict(r) for r in rows]


def cleanup_old_sessions(db_path: str, days: int = 30) -> Dict[str, List[Dict]]:
    """
    Remove sessions older than N days.
    Returns dict with removed sessions and documents for downstream cleanup.
    """
    threshold = datetime.utcnow() - timedelta(days=days)
    conn = _connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, user_id FROM sessions WHERE updated_at < ?", (threshold.isoformat(),)
    )
    rows = cur.fetchall()
    session_ids = [r["id"] for r in rows]

    docs = []
    if session_ids:
        placeholders = ",".join(["?"] * len(session_ids))
        cur.execute(
            f"SELECT id, stored_path, user_id, session_id FROM documents WHERE session_id IN ({placeholders})",
            session_ids,
        )
        docs = [dict(r) for r in cur.fetchall()]

        cur.execute(
            f"DELETE FROM messages WHERE session_id IN ({placeholders})",
            session_ids,
        )
        cur.execute(
            f"DELETE FROM documents WHERE session_id IN ({placeholders})",
            session_ids,
        )
        cur.execute(
            f"DELETE FROM sessions WHERE id IN ({placeholders})",
            session_ids,
        )
    conn.commit()
    conn.close()
    return {"sessions": [dict(r) for r in rows], "documents": docs}
