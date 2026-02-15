#!/usr/bin/env python3
"""
Migration script to transfer data from SQLite to PostgreSQL.
Uses raw SQL (no SQLAlchemy) for Python 3.13 compatibility.

Usage:
    python migrate_to_postgres_simple.py

Environment variables needed:
    DATABASE_URL - PostgreSQL connection string
"""

import os
import sys
import sqlite3

def migrate():
    """Main migration function."""
    print("\n" + "="*70)
    print("🚀 RAG V2 Database Migration: SQLite → PostgreSQL")
    print("="*70 + "\n")
    
    # Check environment
    postgres_url = os.getenv("DATABASE_URL")
    if not postgres_url:
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("\nPlease set your Supabase PostgreSQL connection string:")
        print("export DATABASE_URL='postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres'")
        return False
    
    sqlite_path = os.getenv("DB_PATH", "./data/rag.db")
    
    print(f"📊 Source (SQLite): {sqlite_path}")
    print(f"📊 Target (PostgreSQL): {postgres_url[:50]}...")
    print()
    
    # Load SQLite data
    print("1️⃣  Loading SQLite data...")
    try:
        if not os.path.exists(sqlite_path):
            print(f"   ⚠️  SQLite database not found at {sqlite_path}")
            print("   Starting with fresh PostgreSQL database...")
            user_count = session_count = message_count = doc_count = 0
        else:
            conn = sqlite3.connect(sqlite_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM sessions")
            session_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM messages")
            message_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM documents")
            doc_count = cursor.fetchone()[0]
            
            print(f"   ✅ Found {user_count} users")
            print(f"   ✅ Found {session_count} sessions")
            print(f"   ✅ Found {message_count} messages")
            print(f"   ✅ Found {doc_count} documents")
        
    except Exception as e:
        print(f"   ❌ Error reading SQLite: {e}")
        return False
    
    # Setup PostgreSQL
    print("\n2️⃣  Setting up PostgreSQL...")
    
    try:
        import psycopg2
        
        # Handle Heroku-style URLs
        if postgres_url.startswith("postgres://"):
            postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)
        
        pg_conn = psycopg2.connect(postgres_url)
        pg_cur = pg_conn.cursor()
        
        print("   ✅ PostgreSQL connection established")
        
        # Initialize tables (using db_postgres_raw)
        os.environ["DATABASE_URL"] = postgres_url
        import db_postgres_raw
        
        print("   ✅ Tables created/verified")
        
    except Exception as e:
        print(f"   ❌ Error connecting to PostgreSQL: {e}")
        return False
    
    # If no data to migrate, we're done
    if user_count == 0:
        pg_conn.close()
        print("\n✅ PostgreSQL database ready (no data to migrate)")
        return True
    
    # Migrate data
    print("\n3️⃣  Migrating data...")
    
    try:
        # Migrate users
        print(f"   📤 Migrating {user_count} users...")
        cursor.execute("SELECT uid, email, created_at FROM users")
        users = cursor.fetchall()
        
        for user in users:
            try:
                pg_cur.execute("""
                    INSERT INTO users(uid, email, created_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT(uid) DO UPDATE SET email=EXCLUDED.email
                """, (user['uid'], user['email'], user['created_at']))
            except Exception as e:
                print(f"      ⚠️  Error migrating user {user['uid']}: {e}")
        
        pg_conn.commit()
        print(f"   ✅ Migrated {len(users)} users")
        
        # Migrate sessions
        print(f"   📤 Migrating {session_count} sessions...")
        cursor.execute("""
            SELECT id, user_id, name, created_at, updated_at, last_message_at, cloned_from 
            FROM sessions
        """)
        sessions = cursor.fetchall()
        
        for sess in sessions:
            try:
                pg_cur.execute("""
                    INSERT INTO sessions(id, user_id, name, created_at, updated_at, last_message_at, cloned_from)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT(id) DO NOTHING
                """, (
                    sess['id'], sess['user_id'], sess['name'],
                    sess['created_at'], sess['updated_at'],
                    sess['last_message_at'], sess['cloned_from']
                ))
            except Exception as e:
                print(f"      ⚠️  Error migrating session {sess['id']}: {e}")
        
        pg_conn.commit()
        print(f"   ✅ Migrated {len(sessions)} sessions")
        
        # Migrate messages
        print(f"   📤 Migrating {message_count} messages...")
        cursor.execute("""
            SELECT id, session_id, role, content, metadata, pinned, created_at, parent_id
            FROM messages
        """)
        messages = cursor.fetchall()
        
        for msg in messages:
            try:
                pg_cur.execute("""
                    INSERT INTO messages(id, session_id, role, content, metadata, pinned, created_at, parent_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT(id) DO NOTHING
                """, (
                    msg['id'], msg['session_id'], msg['role'], msg['content'],
                    msg['metadata'], bool(msg['pinned']), msg['created_at'], msg['parent_id']
                ))
            except Exception as e:
                print(f"      ⚠️  Error migrating message {msg['id']}: {e}")
        
        pg_conn.commit()
        print(f"   ✅ Migrated {len(messages)} messages")
        
        # Migrate documents
        print(f"   📤 Migrating {doc_count} documents...")
        cursor.execute("""
            SELECT id, user_id, session_id, filename, stored_path, mime, size_bytes,
                   uploaded_at, is_temp, expires_at
            FROM documents
        """)
        documents = cursor.fetchall()
        
        for doc in documents:
            try:
                pg_cur.execute("""
                    INSERT INTO documents(id, user_id, session_id, filename, stored_path, mime, size_bytes, uploaded_at, is_temp, expires_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT(id) DO NOTHING
                """, (
                    doc['id'], doc['user_id'], doc['session_id'], doc['filename'],
                    doc['stored_path'], doc['mime'], doc['size_bytes'],
                    doc['uploaded_at'], bool(doc['is_temp']), doc['expires_at']
                ))
            except Exception as e:
                print(f"      ⚠️  Error migrating document {doc['id']}: {e}")
        
        pg_conn.commit()
        print(f"   ✅ Migrated {len(documents)} documents")
        
        conn.close()
        
    except Exception as e:
        print(f"\n❌ Migration error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Verify migration
    print("\n4️⃣  Verifying migration...")
    
    try:
        pg_cur.execute("SELECT COUNT(*) FROM users")
        new_user_count = pg_cur.fetchone()[0]
        
        pg_cur.execute("SELECT COUNT(*) FROM sessions")
        new_session_count = pg_cur.fetchone()[0]
        
        pg_cur.execute("SELECT COUNT(*) FROM messages")
        new_message_count = pg_cur.fetchone()[0]
        
        pg_cur.execute("SELECT COUNT(*) FROM documents")
        new_doc_count = pg_cur.fetchone()[0]
        
        print(f"   ✅ PostgreSQL has {new_user_count} users")
        print(f"   ✅ PostgreSQL has {new_session_count} sessions")
        print(f"   ✅ PostgreSQL has {new_message_count} messages")
        print(f"   ✅ PostgreSQL has {new_doc_count} documents")
        
        pg_conn.close()
        
        # Check if counts match
        if (new_user_count == user_count and 
            new_session_count == session_count and
            new_message_count == message_count and
            new_doc_count == doc_count):
            print("\n✅ Migration successful! All data transferred correctly.")
        else:
            print("\n⚠️  Migration complete, but counts don't match exactly.")
            print("   This might be due to duplicate IDs or constraints.")
            print("   Please verify your data in Supabase dashboard.")
        
        return True
        
    except Exception as e:
        print(f"\n⚠️  Verification error: {e}")
        print("   Migration may have completed, but verification failed.")
        return False


def main():
    """Entry point."""
    success = migrate()
    
    if success:
        print("\n" + "="*70)
        print("🎉 Migration Complete!")
        print("="*70)
        print("\nNext steps:")
        print("1. Update your .env file to use DATABASE_URL")
        print("2. Replace db.py with db_postgres_raw.py in your backend/")
        print("3. Test your application")
        print("4. Check Supabase dashboard to verify data")
        print()
        sys.exit(0)
    else:
        print("\n" + "="*70)
        print("❌ Migration Failed")
        print("="*70)
        print("\nPlease check the errors above and try again.")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()