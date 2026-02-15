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
PostgreSQL/SQLite compatible database layer using raw SQL.
Works with Python 3.13+ by avoiding PyO3-dependent packages.

Supports both SQLite (local dev) and PostgreSQL (production).
"""
import json
import uuid
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from pathlib import Path


# ============================================================================
# Database Connection Factory
# ============================================================================

def _get_db_type_and_connection():
    """Determine database type and return appropriate connection."""
    db_url = os.getenv("DATABASE_URL")
    
    if db_url and not db_url.startswith("sqlite"):
        # PostgreSQL
        return "postgres", _get_postgres_connection(db_url)
    else:
        # SQLite (default)
        db_path = os.getenv("DB_PATH", "./data/rag.db")
        return "sqlite", _get_sqlite_connection(db_path)


def _get_postgres_connection(db_url: str):
    """Get PostgreSQL connection."""
    import psycopg2
    import psycopg2.extras
    
    # Handle Heroku-style postgres:// URLs
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    conn = psycopg2.connect(db_url)
    return conn


def _get_sqlite_connection(db_path: str):
    """Get SQLite connection."""
    import sqlite3
    
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


# ============================================================================
# Database Initialization
# ============================================================================

def init_db():
    """Initialize database tables."""
    db_type, conn = _get_db_type_and_connection()
    
    if db_type == "postgres":
        _init_postgres(conn)
    else:
        _init_sqlite(conn)
    
    conn.close()
    print(f"✅ Database initialized ({db_type})")


def _init_sqlite(conn):
    """Initialize SQLite database."""
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            email TEXT,
            created_at TEXT
        )
    """)
    
    cur.execute("""
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
    """)
    
    cur.execute("""
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
    """)
    
    cur.execute("""
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
    """)
    
    # Indexes
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_docs_user_session ON documents(user_id, session_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_docs_expiry ON documents(expires_at)")
    
    conn.commit()


def _init_postgres(conn):
    """Initialize PostgreSQL database."""
    cur = conn.cursor()
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            uid VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            name VARCHAR(500) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_message_at TIMESTAMP,
            cloned_from VARCHAR(36)
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(36) PRIMARY KEY,
            session_id VARCHAR(36) NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            role VARCHAR(50) NOT NULL,
            content TEXT NOT NULL,
            metadata TEXT,
            pinned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            parent_id VARCHAR(36)
        )
    """)
    
    cur.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
            session_id VARCHAR(36) REFERENCES sessions(id) ON DELETE SET NULL,
            filename VARCHAR(500),
            stored_path VARCHAR(1000),
            mime VARCHAR(100),
            size_bytes INTEGER,
            uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_temp BOOLEAN DEFAULT FALSE,
            expires_at TIMESTAMP
        )
    """)
    
    # Indexes
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user_updated ON sessions(user_id, updated_at DESC)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id, created_at)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_docs_user_session ON documents(user_id, session_id)")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_docs_expiry ON documents(expires_at)")
    
    conn.commit()


# ============================================================================
# User Functions
# ============================================================================

def upsert_user(uid: str, email: str):
    """Create or update user."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            INSERT INTO users(uid, email, created_at)
            VALUES (%s, %s, %s)
            ON CONFLICT(uid) DO UPDATE SET email=EXCLUDED.email
        """, (uid, email, datetime.utcnow()))
    else:
        cur.execute("""
            INSERT INTO users(uid, email, created_at)
            VALUES (?, ?, ?)
            ON CONFLICT(uid) DO UPDATE SET email=excluded.email
        """, (uid, email, datetime.utcnow().isoformat()))
    
    conn.commit()
    conn.close()


# ============================================================================
# Session Functions
# ============================================================================

def create_session(user_id: str, name: str, cloned_from: str = None) -> str:
    """Create a new chat session."""
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            INSERT INTO sessions(id, user_id, name, created_at, updated_at, cloned_from)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (session_id, user_id, name, now, now, cloned_from))
    else:
        cur.execute("""
            INSERT INTO sessions(id, user_id, name, created_at, updated_at, cloned_from)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, user_id, name, now.isoformat(), now.isoformat(), cloned_from))
    
    conn.commit()
    conn.close()
    return session_id


def list_sessions(user_id: str) -> List[Dict]:
    """List all sessions for a user."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            SELECT id, name, created_at, updated_at, last_message_at, cloned_from
            FROM sessions
            WHERE user_id=%s
            ORDER BY COALESCE(last_message_at, updated_at) DESC
        """, (user_id,))
    else:
        cur.execute("""
            SELECT id, name, created_at, updated_at, last_message_at, cloned_from
            FROM sessions
            WHERE user_id=?
            ORDER BY COALESCE(last_message_at, updated_at) DESC
        """, (user_id,))
    
    rows = cur.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        if db_type == "postgres":
            result.append({
                'id': r[0],
                'name': r[1],
                'created_at': r[2].isoformat() if r[2] else None,
                'updated_at': r[3].isoformat() if r[3] else None,
                'last_message_at': r[4].isoformat() if r[4] else None,
                'cloned_from': r[5]
            })
        else:
            result.append(dict(r))
    
    return result


def rename_session(session_id: str, name: str, user_id: str):
    """Rename a session."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    now = datetime.utcnow()
    
    if db_type == "postgres":
        cur.execute(
            "UPDATE sessions SET name=%s, updated_at=%s WHERE id=%s AND user_id=%s",
            (name, now, session_id, user_id)
        )
    else:
        cur.execute(
            "UPDATE sessions SET name=?, updated_at=? WHERE id=? AND user_id=?",
            (name, now.isoformat(), session_id, user_id)
        )
    
    conn.commit()
    conn.close()


def clone_session(session_id: str, user_id: str) -> Optional[str]:
    """Clone a session with all its messages."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    # Get original session
    if db_type == "postgres":
        cur.execute("SELECT name FROM sessions WHERE id=%s AND user_id=%s", (session_id, user_id))
    else:
        cur.execute("SELECT name FROM sessions WHERE id=? AND user_id=?", (session_id, user_id))
    
    row = cur.fetchone()
    if not row:
        conn.close()
        return None
    
    original_name = row[0] if db_type == "postgres" else row['name']
    
    # Create new session
    new_id = create_session(user_id, f"{original_name} (copy)", cloned_from=session_id)
    
    # Clone messages
    if db_type == "postgres":
        cur.execute(
            "SELECT role, content, metadata, pinned, created_at, parent_id FROM messages WHERE session_id=%s",
            (session_id,)
        )
    else:
        cur.execute(
            "SELECT role, content, metadata, pinned, created_at, parent_id FROM messages WHERE session_id=?",
            (session_id,)
        )
    
    msgs = cur.fetchall()
    now = datetime.utcnow()
    
    for m in msgs:
        if db_type == "postgres":
            role, content, metadata, pinned, created_at, parent_id = m
            cur.execute("""
                INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid.uuid4()), new_id, role, content, metadata, pinned, now, parent_id))
        else:
            cur.execute("""
                INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (str(uuid.uuid4()), new_id, m['role'], m['content'], m['metadata'], m['pinned'], now.isoformat(), m['parent_id']))
    
    conn.commit()
    conn.close()
    return new_id


def delete_session(session_id: str, user_id: str):
    """Delete a session and all associated data."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("DELETE FROM sessions WHERE id=%s AND user_id=%s", (session_id, user_id))
    else:
        cur.execute("DELETE FROM messages WHERE session_id=?", (session_id,))
        cur.execute("DELETE FROM documents WHERE session_id=?", (session_id,))
        cur.execute("DELETE FROM sessions WHERE id=? AND user_id=?", (session_id, user_id))
    
    conn.commit()
    conn.close()


# ============================================================================
# Message Functions
# ============================================================================

def add_message(
    session_id: str,
    role: str,
    content: str,
    metadata: Optional[Dict] = None,
    pinned: bool = False,
    parent_id: str = None
) -> str:
    """Add a message to a session."""
    message_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (message_id, session_id, role, content, json.dumps(metadata or {}), pinned, now, parent_id))
        
        cur.execute(
            "UPDATE sessions SET last_message_at=%s, updated_at=%s WHERE id=%s",
            (now, now, session_id)
        )
    else:
        cur.execute("""
            INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (message_id, session_id, role, content, json.dumps(metadata or {}), 1 if pinned else 0, now.isoformat(), parent_id))
        
        cur.execute(
            "UPDATE sessions SET last_message_at=?, updated_at=? WHERE id=?",
            (now.isoformat(), now.isoformat(), session_id)
        )
    
    conn.commit()
    conn.close()
    return message_id


def list_messages(session_id: str, limit: int = 200) -> List[Dict]:
    """List messages in a session."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            SELECT id, role, content, metadata, pinned, created_at, parent_id
            FROM messages
            WHERE session_id=%s
            ORDER BY created_at ASC
            LIMIT %s
        """, (session_id, limit))
    else:
        cur.execute("""
            SELECT id, role, content, metadata, pinned, created_at, parent_id
            FROM messages
            WHERE session_id=?
            ORDER BY created_at ASC
            LIMIT ?
        """, (session_id, limit))
    
    rows = cur.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        if db_type == "postgres":
            metadata = {}
            try:
                metadata = json.loads(r[3] or "{}")
            except json.JSONDecodeError:
                metadata = {}
            
            result.append({
                'id': r[0],
                'role': r[1],
                'content': r[2],
                'metadata': metadata,
                'pinned': r[4],
                'created_at': r[5].isoformat() if r[5] else None,
                'parent_id': r[6]
            })
        else:
            metadata = {}
            try:
                metadata = json.loads(r['metadata'] or "{}")
            except json.JSONDecodeError:
                metadata = {}
            
            result.append({
                'id': r['id'],
                'role': r['role'],
                'content': r['content'],
                'metadata': metadata,
                'pinned': bool(r['pinned']),
                'created_at': r['created_at'],
                'parent_id': r['parent_id']
            })
    
    return result


def set_pinned(message_id: str, pinned: bool, user_id: str):
    """Pin or unpin a message."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            UPDATE messages
            SET pinned=%s
            WHERE id=%s AND session_id IN (SELECT id FROM sessions WHERE user_id=%s)
        """, (pinned, message_id, user_id))
    else:
        cur.execute("""
            UPDATE messages
            SET pinned=?
            WHERE id=? AND session_id IN (SELECT id FROM sessions WHERE user_id=?)
        """, (1 if pinned else 0, message_id, user_id))
    
    conn.commit()
    conn.close()


# ============================================================================
# Document Functions
# ============================================================================

def register_document(
    doc_id: str,
    user_id: str,
    session_id: str,
    filename: str,
    stored_path: str,
    mime: str,
    size_bytes: int,
    is_temp: bool,
    expires_at: Optional[datetime]
):
    """Register a document."""
    now = datetime.utcnow()
    
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            INSERT INTO documents(id, user_id, session_id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (doc_id, user_id, session_id, filename, stored_path, mime, size_bytes, now, is_temp, expires_at))
    else:
        cur.execute("""
            INSERT INTO documents(id, user_id, session_id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (doc_id, user_id, session_id, filename, stored_path, mime, size_bytes, now.isoformat(), 1 if is_temp else 0, expires_at.isoformat() if expires_at else None))
    
    conn.commit()
    conn.close()


def list_documents(user_id: str, session_id: Optional[str] = None) -> List[Dict]:
    """List documents for a user or session."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        if session_id:
            cur.execute("""
                SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
                FROM documents
                WHERE user_id=%s AND session_id=%s
                ORDER BY uploaded_at DESC
            """, (user_id, session_id))
        else:
            cur.execute("""
                SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
                FROM documents
                WHERE user_id=%s
                ORDER BY uploaded_at DESC
            """, (user_id,))
    else:
        if session_id:
            cur.execute("""
                SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
                FROM documents
                WHERE user_id=? AND session_id=?
                ORDER BY uploaded_at DESC
            """, (user_id, session_id))
        else:
            cur.execute("""
                SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
                FROM documents
                WHERE user_id=?
                ORDER BY uploaded_at DESC
            """, (user_id,))
    
    rows = cur.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        if db_type == "postgres":
            result.append({
                'id': r[0],
                'filename': r[1],
                'stored_path': r[2],
                'mime': r[3],
                'size_bytes': r[4],
                'uploaded_at': r[5].isoformat() if r[5] else None,
                'is_temp': r[6],
                'expires_at': r[7].isoformat() if r[7] else None,
                'session_id': r[8]
            })
        else:
            result.append(dict(r))
    
    return result


def get_document(doc_id: str, user_id: str) -> Optional[Dict]:
    """Get a specific document."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
            FROM documents
            WHERE id=%s AND user_id=%s
        """, (doc_id, user_id))
    else:
        cur.execute("""
            SELECT id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at, session_id
            FROM documents
            WHERE id=? AND user_id=?
        """, (doc_id, user_id))
    
    row = cur.fetchone()
    conn.close()
    
    if not row:
        return None
    
    if db_type == "postgres":
        return {
            'id': row[0],
            'filename': row[1],
            'stored_path': row[2],
            'mime': row[3],
            'size_bytes': row[4],
            'uploaded_at': row[5].isoformat() if row[5] else None,
            'is_temp': row[6],
            'expires_at': row[7].isoformat() if row[7] else None,
            'session_id': row[8]
        }
    else:
        return dict(row)


def delete_document(doc_id: str, user_id: str):
    """Delete a document."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("DELETE FROM documents WHERE id=%s AND user_id=%s", (doc_id, user_id))
    else:
        cur.execute("DELETE FROM documents WHERE id=? AND user_id=?", (doc_id, user_id))
    
    conn.commit()
    conn.close()


# ============================================================================
# Cleanup Functions
# ============================================================================

def cleanup_expired_documents() -> List[Dict]:
    """Delete expired temporary documents."""
    now = datetime.utcnow()
    
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute(
            "SELECT id, stored_path, user_id, session_id FROM documents WHERE expires_at IS NOT NULL AND expires_at < %s",
            (now,)
        )
        rows = cur.fetchall()
        doc_ids = [r[0] for r in rows]
        
        if doc_ids:
            placeholders = ','.join(['%s'] * len(doc_ids))
            cur.execute(f"DELETE FROM documents WHERE id IN ({placeholders})", doc_ids)
        
        result = [{'id': r[0], 'stored_path': r[1], 'user_id': r[2], 'session_id': r[3]} for r in rows]
    else:
        cur.execute(
            "SELECT id, stored_path, user_id, session_id FROM documents WHERE expires_at IS NOT NULL AND expires_at < ?",
            (now.isoformat(),)
        )
        rows = cur.fetchall()
        doc_ids = [r['id'] for r in rows]
        
        if doc_ids:
            placeholders = ','.join(['?'] * len(doc_ids))
            cur.execute(f"DELETE FROM documents WHERE id IN ({placeholders})", doc_ids)
        
        result = [dict(r) for r in rows]
    
    conn.commit()
    conn.close()
    return result


def cleanup_old_sessions(days: int = 30) -> Dict[str, List[Dict]]:
    """Remove sessions older than N days."""
    threshold = datetime.utcnow() - timedelta(days=days)
    
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("SELECT id, user_id FROM sessions WHERE updated_at < %s", (threshold,))
        rows = cur.fetchall()
        session_ids = [r[0] for r in rows]
        session_data = [{'id': r[0], 'user_id': r[1]} for r in rows]
        
        docs = []
        if session_ids:
            placeholders = ','.join(['%s'] * len(session_ids))
            cur.execute(
                f"SELECT id, stored_path, user_id, session_id FROM documents WHERE session_id IN ({placeholders})",
                session_ids
            )
            doc_rows = cur.fetchall()
            docs = [{'id': r[0], 'stored_path': r[1], 'user_id': r[2], 'session_id': r[3]} for r in doc_rows]
            
            cur.execute(f"DELETE FROM sessions WHERE id IN ({placeholders})", session_ids)
    else:
        cur.execute("SELECT id, user_id FROM sessions WHERE updated_at < ?", (threshold.isoformat(),))
        rows = cur.fetchall()
        session_ids = [r['id'] for r in rows]
        session_data = [dict(r) for r in rows]
        
        docs = []
        if session_ids:
            placeholders = ','.join(['?'] * len(session_ids))
            cur.execute(
                f"SELECT id, stored_path, user_id, session_id FROM documents WHERE session_id IN ({placeholders})",
                session_ids
            )
            docs = [dict(r) for r in cur.fetchall()]
            
            cur.execute(f"DELETE FROM messages WHERE session_id IN ({placeholders})", session_ids)
            cur.execute(f"DELETE FROM documents WHERE session_id IN ({placeholders})", session_ids)
            cur.execute(f"DELETE FROM sessions WHERE id IN ({placeholders})", session_ids)
    
    conn.commit()
    conn.close()
    
    return {'sessions': session_data, 'documents': docs}


# ============================================================================
# Auto-initialize on import
# ============================================================================

try:
    init_db()
except Exception as e:
    print(f"⚠️  Database initialization warning: {e}")