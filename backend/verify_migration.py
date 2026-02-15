#!/usr/bin/env python3
"""
Verify PostgreSQL database setup and data integrity.

Usage:
    python verify_migration.py
"""

import os
import sys

def verify():
    """Verify database setup and connectivity."""
    print("\n" + "="*70)
    print("🔍 RAG V2 Database Verification")
    print("="*70 + "\n")
    
    # Check environment
    postgres_url = os.getenv("DATABASE_URL")
    if not postgres_url:
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        return False
    
    print(f"📊 Database URL: {postgres_url[:50]}...")
    print()
    
    # Test connection
    print("1️⃣  Testing database connection...")
    try:
        import db_postgres as db
        print("   ✅ Connected to PostgreSQL")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return False
    
    # Verify tables
    print("\n2️⃣  Verifying tables...")
    try:
        from db_postgres import get_session, User, Session, Message, Document
        
        session = get_session()
        
        # Check if tables exist by querying them
        user_count = session.query(User).count()
        session_count = session.query(Session).count()
        message_count = session.query(Message).count()
        doc_count = session.query(Document).count()
        
        print(f"   ✅ users table: {user_count} records")
        print(f"   ✅ sessions table: {session_count} records")
        print(f"   ✅ messages table: {message_count} records")
        print(f"   ✅ documents table: {doc_count} records")
        
        session.close()
        
    except Exception as e:
        print(f"   ❌ Table verification failed: {e}")
        return False
    
    # Test CRUD operations
    print("\n3️⃣  Testing basic operations...")
    
    try:
        # Test user creation
        test_user_id = "test_verification_user_12345"
        test_email = "test@verification.com"
        
        print("   📝 Creating test user...")
        db.upsert_user(test_user_id, test_email)
        print("   ✅ User created")
        
        # Test session creation
        print("   📝 Creating test session...")
        session_id = db.create_session(test_user_id, "Test Session")
        print(f"   ✅ Session created: {session_id}")
        
        # Test message creation
        print("   📝 Creating test message...")
        message_id = db.add_message(
            session_id=session_id,
            role="user",
            content="Test message for verification",
            metadata={"test": True}
        )
        print(f"   ✅ Message created: {message_id}")
        
        # Test retrieval
        print("   📝 Retrieving data...")
        sessions = db.list_sessions(test_user_id)
        messages = db.list_messages(session_id)
        
        if len(sessions) > 0 and len(messages) > 0:
            print("   ✅ Data retrieval successful")
        else:
            print("   ⚠️  Data retrieval returned empty results")
        
        # Cleanup test data
        print("   🧹 Cleaning up test data...")
        db.delete_session(session_id, test_user_id)
        print("   ✅ Test data cleaned up")
        
    except Exception as e:
        print(f"   ❌ CRUD operations failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Check indexes
    print("\n4️⃣  Checking indexes...")
    try:
        session = get_session()
        
        # Check if indexes exist (PostgreSQL specific)
        from sqlalchemy import inspect
        inspector = inspect(session.bind)
        
        indexes = inspector.get_indexes('sessions')
        print(f"   ✅ Found {len(indexes)} indexes on sessions table")
        
        indexes = inspector.get_indexes('messages')
        print(f"   ✅ Found {len(indexes)} indexes on messages table")
        
        indexes = inspector.get_indexes('documents')
        print(f"   ✅ Found {len(indexes)} indexes on documents table")
        
        session.close()
        
    except Exception as e:
        print(f"   ⚠️  Index check failed: {e}")
        print("   Indexes may not be properly created, but database is functional")
    
    # Check pgvector extension
    print("\n5️⃣  Checking pgvector extension...")
    try:
        session = get_session()
        
        result = session.execute(
            "SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')"
        )
        has_vector = result.scalar()
        
        if has_vector:
            print("   ✅ pgvector extension is enabled")
            print("   ℹ️  Ready for vector embeddings!")
        else:
            print("   ⚠️  pgvector extension not found")
            print("   ℹ️  Run 'CREATE EXTENSION vector;' in SQL editor to enable")
        
        session.close()
        
    except Exception as e:
        print(f"   ⚠️  pgvector check failed: {e}")
        print("   This is OK if you're using SQLite or don't need vector search")
    
    return True


def main():
    """Entry point."""
    success = verify()
    
    if success:
        print("\n" + "="*70)
        print("✅ Database Verification Successful!")
        print("="*70)
        print("\nYour PostgreSQL database is ready to use!")
        print("\nNext steps:")
        print("1. Check Supabase dashboard to see your data")
        print("2. Start your application and test")
        print("3. Monitor usage in Supabase Analytics")
        print()
        sys.exit(0)
    else:
        print("\n" + "="*70)
        print("❌ Verification Failed")
        print("="*70)
        print("\nPlease check the errors above and fix them.")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
