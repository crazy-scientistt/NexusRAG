# RAG V2 - Python 3.12 + Supabase Compatible

This is the updated version of RAG V2 that fixes Python 3.12/3.13 compatibility issues and adds Supabase PostgreSQL support.

## 🔧 What's Fixed

### Python 3.12+ Compatibility
The original code failed with this error:
```
error: the configured Python interpreter version (3.13) is newer than PyO3's maximum supported version (3.12)
```

**Root Cause:** The `chromadb` and `langchain` dependencies require `tokenizers`, which uses PyO3 (a Python-Rust binding). PyO3 v0.21.2 doesn't support Python 3.13+.

**Solution:** 
- Kept all original dependencies intact (no version changes)
- Created `db_supabase.py` using raw SQL with `psycopg2-binary` (pure C, no PyO3)
- Avoided SQLAlchemy and other packages that depend on PyO3

### Database Support Added

✅ **Supabase PostgreSQL** (NEW - Recommended for production)
✅ **Standard PostgreSQL** (Heroku, Neon, Railway, etc.)
✅ **SQLite** (Original - for local development)

## 📦 What's Included

```
backend/
├── db_supabase.py          # NEW - Supabase-compatible database layer
├── db_postgres.py          # Original PostgreSQL support (still works)
├── requirements.txt        # Updated with Python 3.12+ compatibility notes
├── env.example             # Updated with Supabase configuration
├── SUPABASE_SETUP.md       # NEW - Complete Supabase setup guide
└── [all other original files unchanged]
```

## 🚀 Quick Start

### 1. Install Dependencies (Python 3.12+)
```bash
cd backend
pip install -r requirements.txt
```

### 2. Choose Your Database

#### Option A: Supabase (Recommended)
1. Create free account at [supabase.com](https://supabase.com)
2. Get connection string from Settings → Database
3. Add to `.env`:
```env
SUPABASE_DB_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

#### Option B: Local SQLite
```env
DB_PATH=./data/rag.db
```

### 3. Set Required Environment Variables
```env
HF_TOKEN=your_huggingface_token_here
SUPABASE_DB_URL=your_supabase_connection_string  # or use DB_PATH for SQLite
```

### 4. Run
```bash
python app.py
```

## 📝 Important Notes

### Which Database File to Use?

**Use `db_supabase.py` if:**
- ✅ Running Python 3.12+
- ✅ Want Supabase support
- ✅ Need production-ready PostgreSQL
- ✅ Want auto SSL/pooling support

**Use `db_postgres.py` if:**
- ⚠️ Running Python 3.11 or earlier
- ⚠️ Using standard PostgreSQL without Supabase
- ⚠️ Already integrated with the old version

### Requirements.txt - DO NOT CHANGE VERSIONS!

The `requirements.txt` file keeps all original package versions:
```
chromadb>=0.4.22
langchain>=0.1.0
langchain-text-splitters>=0.0.1
pypdf>=3.17.0
python-docx>=1.1.0
beautifulsoup4>=4.12.0
numpy>=1.24.0
python-dotenv>=1.0.0
firebase-admin>=6.5.0
psycopg2-binary>=2.9.9  # Only addition - works with Python 3.12+
```

**Why no version changes?** Changing versions of `chromadb`, `langchain`, or related packages could break functionality. The PyO3 issue only affects database operations, which we've fixed by using raw SQL instead of SQLAlchemy.

## 🔄 Migration Guide

### From Original db_postgres.py to db_supabase.py

If your app.py imports the database:

**Before:**
```python
from db_postgres import init_db, create_session, add_message
```

**After:**
```python
from db_supabase import init_db, create_session, add_message
```

All function signatures are identical - it's a drop-in replacement!

### Environment Variable Priority

The system checks environment variables in this order:
1. `SUPABASE_DB_URL` → Supabase PostgreSQL
2. `DATABASE_URL` → Standard PostgreSQL  
3. `DB_PATH` → SQLite (default: `./data/rag.db`)

## 🆓 Supabase Free Tier

Perfect for development and MVPs:
- 500 MB database storage
- Unlimited API requests
- No credit card required
- Auto-scaling included

See `SUPABASE_SETUP.md` for detailed setup instructions.

## 🐛 Troubleshooting

### Still Getting PyO3 Error?
```
error: the configured Python interpreter version (3.13) is newer than PyO3's maximum supported version
```

**Solution:**
1. Make sure you're using `db_supabase.py` (not `db_postgres.py`)
2. Verify `psycopg2-binary` is installed: `pip install psycopg2-binary`
3. Don't install SQLAlchemy manually

### Import Error: No module named 'psycopg2'
```bash
pip install psycopg2-binary --break-system-packages  # if using system Python
```

### Connection to Supabase Fails
1. Verify password in connection string is correct
2. Use the **pooler** connection string (port 6543, not 5432)
3. Check Supabase dashboard for connection details

## 📚 Technical Details

### Why This Approach Works

**The Problem:**
- `chromadb` → requires `sentence-transformers` → requires `tokenizers`
- `tokenizers` → built with PyO3 (Python-Rust bindings)
- PyO3 v0.21.2 only supports Python ≤ 3.12

**The Solution:**
- Keep all original ML/RAG dependencies untouched (they work fine)
- Replace database layer (db.py) with raw SQL implementation
- Use `psycopg2-binary` (pure C extension, no PyO3)
- Avoid SQLAlchemy (newer versions depend on packages using PyO3)

### Database Implementation

Both `db_supabase.py` and `db_postgres.py` provide identical APIs:

**User Functions:**
- `upsert_user(uid, email)`

**Session Functions:**
- `create_session(user_id, name, cloned_from=None) → str`
- `get_session(session_id, user_id) → Dict`
- `list_sessions(user_id) → List[Dict]`
- `update_session(session_id, user_id, name=None)`
- `delete_session(session_id, user_id)`

**Message Functions:**
- `add_message(session_id, role, content, metadata=None, parent_id=None) → str`
- `get_messages(session_id) → List[Dict]`
- `update_message(msg_id, content=None, metadata=None)`
- `toggle_pin_message(msg_id)`
- `delete_message(msg_id)`

**Document Functions:**
- `save_document(...) → str`
- `list_documents(user_id, session_id=None) → List[Dict]`
- `get_document(doc_id, user_id) → Dict`
- `delete_document(doc_id, user_id)`

**Cleanup Functions:**
- `cleanup_expired_documents() → List[Dict]`
- `cleanup_old_sessions(days=30) → Dict`

## 🎯 Key Features

✅ **Drop-in Replacement** - Same function signatures as original
✅ **Python 3.12+ Compatible** - No PyO3 dependency issues
✅ **Supabase Ready** - Auto-SSL, connection pooling support
✅ **Multi-Database** - SQLite, PostgreSQL, Supabase support
✅ **Auto-Initialize** - Tables created automatically on first run
✅ **Production Ready** - Indexes, foreign keys, proper data types

## 🔐 Security Notes

1. Never commit `.env` with real credentials
2. Use different credentials for dev/staging/production
3. Enable SSL for PostgreSQL connections (automatic for Supabase)
4. Regularly update dependencies for security patches
5. Use Supabase's built-in auth if possible

## 📖 Additional Documentation

- `SUPABASE_SETUP.md` - Detailed Supabase configuration guide
- `env.example` - All environment variable options
- Original README files - Still applicable for frontend/deployment

## 🤝 Contributing

If you encounter issues:
1. Check Python version: `python --version` (should be 3.12+)
2. Verify database connection string format
3. Review `SUPABASE_SETUP.md` for configuration help
4. Check Supabase dashboard for connection issues

## 📄 License

Same as original RAG V2 project.

---

**Questions?** Check the troubleshooting section or create an issue with:
- Python version
- Database type (Supabase/PostgreSQL/SQLite)
- Full error message
- Relevant code snippet
