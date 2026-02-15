# Quick Start Guide - Secure Setup

This guide will get you up and running securely in 5 minutes.

## ✅ Prerequisites

- Python 3.12+ installed
- Supabase account (free) - [Sign up here](https://supabase.com)
- HuggingFace account (free) - [Sign up here](https://huggingface.co)

## 🚀 Setup Steps

### 1. Clone and Install (1 minute)

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt
```

### 2. Create Supabase Database (2 minutes)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for database to initialize (~2 minutes)
3. Go to **Settings** → **Database**
4. Under **Connection String**, click **Connection pooling** tab
5. Select **Transaction** mode
6. Copy the connection string

### 3. Get HuggingFace Token (1 minute)

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click **New token**
3. Select **Fine-grained** token
4. Enable **Inference Providers** permission
5. Click **Create token**
6. Copy the token

### 4. Configure Environment Variables (1 minute)

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your favorite editor
nano .env   # or vim, code, etc.
```

**Add your credentials:**

```env
# 1. Your HuggingFace token
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 2. Your Supabase connection string (replace [PROJECT] and [REGION])
SUPABASE_DB_URL=postgresql://postgres.[PROJECT]:${SUPABASE_PASSWORD}@aws-0-[REGION].pooler.supabase.com:6543/postgres

# 3. Your Supabase password (from Supabase dashboard)
SUPABASE_PASSWORD=your_password_here
```

**Example with real values:**
```env
HF_TOKEN=hf_abcdefGHIJKLMNOPqrstuvWXYZ1234567890
SUPABASE_DB_URL=postgresql://postgres.myproject:${SUPABASE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_PASSWORD=MySecureP@ssw0rd123
```

### 5. Run the Application

```bash
# Make sure you're in the backend directory
python app.py
```

You should see:
```
✅ Database initialized (postgres)
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 6. Test It!

Open another terminal and test:

```bash
curl http://localhost:8000/api/health
```

You should get:
```json
{"status":"healthy"}
```

## 🎉 You're Done!

Your RAG application is now running with:
- ✅ Secure database connection (Supabase PostgreSQL)
- ✅ Password stored safely in environment variable
- ✅ Ready for production deployment
- ✅ Python 3.12+ compatible

## 📱 Next Steps

### Frontend Setup
If you want to run the frontend:

```bash
cd ../frontend
npm install
npm run dev
```

### Update CORS (if using frontend)
In your `.env`, update:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 🔒 Security Reminder

Before pushing to GitHub:

```bash
# Verify .env is gitignored
git check-ignore .env
# Should return: .env

# Double check before committing
git status
# .env should NOT appear in the list
```

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'psycopg2'"
```bash
pip install psycopg2-binary
```

### "could not connect to server"
- Verify your Supabase password is correct
- Check you copied the full connection string
- Make sure you're using the **pooler** connection (port 6543)

### "PyO3 version error"
- Make sure you're using `db_supabase.py` (not `db_postgres.py`)
- Verify Python version: `python --version` (should be 3.12+)

### Connection string format issues
Make sure it looks like:
```
postgresql://postgres.PROJECT:${SUPABASE_PASSWORD}@aws-0-REGION.pooler.supabase.com:6543/postgres
```

Parts to replace:
- `PROJECT` - Your Supabase project name
- `REGION` - Your region (us-east-1, eu-west-1, etc.)
- Keep `${SUPABASE_PASSWORD}` as-is (it gets replaced automatically)

## 📚 Learn More

- **Detailed Setup:** See `backend/SUPABASE_SETUP.md`
- **Security Guide:** See `SECURITY.md`
- **Python 3.12 Fix:** See `backend/README_PYTHON312_FIX.md`

## 💡 Pro Tips

1. **Use different databases for dev/prod:**
   ```env
   # .env.development
   SUPABASE_DB_URL=postgresql://postgres.dev-project:${SUPABASE_PASSWORD}@...
   
   # .env.production
   SUPABASE_DB_URL=postgresql://postgres.prod-project:${SUPABASE_PASSWORD}@...
   ```

2. **Quick password rotation:**
   Just update `SUPABASE_PASSWORD` in `.env` and restart - no code changes!

3. **Team collaboration:**
   Share `.env.example`, not `.env`! Each person sets their own credentials.

---

**Need help?** Check the troubleshooting section or read the detailed guides!
