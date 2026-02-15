"""
Supabase-compatible PostgreSQL database layer using raw SQL.
Works with Python 3.12+ by avoiding PyO3-dependent packages.

Supports both SQLite (local dev) and Supabase PostgreSQL (production).
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
    # Check for Supabase URL first
    supabase_url = os.getenv("SUPABASE_DB_URL")
    db_url = os.getenv("DATABASE_URL")
    
    if supabase_url:
        # Supabase PostgreSQL
        return "postgres", _get_postgres_connection(supabase_url)
    elif db_url and not db_url.startswith("sqlite"):
        # Standard PostgreSQL
        return "postgres", _get_postgres_connection(db_url)
    else:
        # SQLite (default for local dev)
        db_path = os.getenv("DB_PATH", "./data/rag.db")
        return "sqlite", _get_sqlite_connection(db_path)


def _get_postgres_connection(db_url: str):
    """Get PostgreSQL/Supabase connection."""
    import psycopg2
    import psycopg2.extras
    
    # Substitute password from environment variable if using ${VAR} syntax
    if "${SUPABASE_PASSWORD}" in db_url:
        password = os.getenv("SUPABASE_PASSWORD", "")
        db_url = db_url.replace("${SUPABASE_PASSWORD}", password)
    elif "${DB_PASSWORD}" in db_url:
        password = os.getenv("DB_PASSWORD", "")
        db_url = db_url.replace("${DB_PASSWORD}", password)
    
    # Handle different URL formats
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    # For Supabase, ensure SSL is enabled
    if "supabase" in db_url.lower():
        conn = psycopg2.connect(db_url, sslmode='require')
    else:
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
    """Initialize PostgreSQL/Supabase database."""
    cur = conn.cursor()
    
    # Users table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            uid VARCHAR(255) PRIMARY KEY,
            email VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Sessions table
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
    
    # Messages table
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
    
    # Documents table
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
    
    # Indexes for performance
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
            VALUES (%s, %s, NOW())
            ON CONFLICT (uid) DO UPDATE SET email = EXCLUDED.email
        """, (uid, email))
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

def create_session(user_id: str, name: str) -> str:
    """Create a new session."""
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        cur.execute("""
            INSERT INTO sessions(id, user_id, name, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s)
        """, (session_id, user_id, name, now, now))
    else:
        cur.execute("""
            INSERT INTO sessions(id, user_id, name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (session_id, user_id, name, now.isoformat(), now.isoformat()))
    
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
    
    if db_type == "postgres":
        cur.execute("""
            UPDATE sessions SET name=%s, updated_at=%s WHERE id=%s AND user_id=%s
        """, (name, datetime.utcnow(), session_id, user_id))
    else:
        cur.execute("""
            UPDATE sessions SET name=?, updated_at=? WHERE id=? AND user_id=?
        """, (name, datetime.utcnow().isoformat(), session_id, user_id))
    
    conn.commit()
    conn.close()


def clone_session(session_id: str, user_id: str) -> Optional[str]:
    """Clone a session with all messages."""
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
    
    # Create new session
    new_session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    name = (row[0] if db_type == "postgres" else row['name']) + " (copy)"
    
    if db_type == "postgres":
        cur.execute("""
            INSERT INTO sessions(id, user_id, name, created_at, updated_at, cloned_from)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (new_session_id, user_id, name, now, now, session_id))
        
        # Copy messages
        cur.execute("""
            SELECT role, content, metadata, pinned, parent_id FROM messages WHERE session_id=%s
        """, (session_id,))
    else:
        cur.execute("""
            INSERT INTO sessions(id, user_id, name, created_at, updated_at, cloned_from)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (new_session_id, user_id, name, now.isoformat(), now.isoformat(), session_id))
        
        cur.execute("""
            SELECT role, content, metadata, pinned, parent_id FROM messages WHERE session_id=?
        """, (session_id,))
    
    messages = cur.fetchall()
    for msg in messages:
        msg_id = str(uuid.uuid4())
        if db_type == "postgres":
            cur.execute("""
                INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (msg_id, new_session_id, msg[0], msg[1], msg[2], msg[3], now, msg[4]))
        else:
            cur.execute("""
                INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (msg_id, new_session_id, msg['role'], msg['content'], msg['metadata'], msg['pinned'], now.isoformat(), msg['parent_id']))
    
    conn.commit()
    conn.close()
    return new_session_id


def delete_session(session_id: str, user_id: str):
    """Delete a session and all its messages."""
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    if db_type == "postgres":
        # PostgreSQL cascades automatically
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
    parent_id: Optional[str] = None
) -> str:
    """Add a message to a session."""
    msg_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    db_type, conn = _get_db_type_and_connection()
    cur = conn.cursor()
    
    metadata_str = json.dumps(metadata) if metadata else None
    
    if db_type == "postgres":
        cur.execute("""
            INSERT INTO messages(id, session_id, role, content, metadata, created_at, parent_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (msg_id, session_id, role, content, metadata_str, now, parent_id))
        
        # Update session's last_message_at
        cur.execute("""
            UPDATE sessions
            SET last_message_at=%s, updated_at=%s
            WHERE id=%s
        """, (now, now, session_id))
    else:
        cur.execute("""
            INSERT INTO messages(id, session_id, role, content, metadata, created_at, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (msg_id, session_id, role, content, metadata_str, now.isoformat(), parent_id))
        
        cur.execute("""
            UPDATE sessions
            SET last_message_at=?, updated_at=?
            WHERE id=?
        """, (now.isoformat(), now.isoformat(), session_id))
    
    conn.commit()
    conn.close()
    return msg_id


def list_messages(session_id: str, limit: int = 200) -> List[Dict]:
    """Get messages for a session with optional limit."""
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
            result.append({
                'id': r[0],
                'role': r[1],
                'content': r[2],
                'metadata': json.loads(r[3]) if r[3] else {},
                'pinned': r[4],
                'created_at': r[5].isoformat() if r[5] else None,
                'parent_id': r[6]
            })
        else:
            msg = dict(r)
            if msg.get('metadata'):
                try:
                    msg['metadata'] = json.loads(msg['metadata'])
                except:
                    msg['metadata'] = {}
            else:
                msg['metadata'] = {}
            result.append(msg)
    
    return result


def set_pinned(message_id: str, pinned: bool, user_id: str):
    """Set pinned status of a message."""
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
    """Register document metadata."""
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
