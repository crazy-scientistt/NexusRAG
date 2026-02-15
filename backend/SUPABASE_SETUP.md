# Supabase Database Setup Guide

This project now supports Supabase PostgreSQL for production-grade database functionality with Python 3.12+.

## 🚀 Quick Setup

### 1. Create a Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Sign up for free (no credit card required)
3. Create a new project

### 2. Get Your Database Connection String
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to **Connection String** section
3. Select the **Connection pooling** tab
4. Choose **Transaction** mode
5. Copy the connection string (it looks like this):
   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```

### 3. Configure Your Environment

You have **two secure options** for storing your database password:

#### Option A: Separate Password Variable (Most Secure - Recommended)
Add to your `.env` file:
```env
# Connection string with password placeholder
SUPABASE_DB_URL=postgresql://postgres.[PROJECT]:${SUPABASE_PASSWORD}@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Actual password stored separately
SUPABASE_PASSWORD=your_actual_password_here
```

**Benefits:**
- ✅ Password separated from connection string
- ✅ Easier to rotate passwords
- ✅ Better for team environments
- ✅ Can use different password variables for different databases

#### Option B: Direct Connection String (Simple)
Add to your `.env` file:
```env
SUPABASE_DB_URL=postgresql://postgres.[PROJECT]:your_actual_password@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Important Security Notes:**
- Never commit `.env` to Git (add it to `.gitignore`)
- Use Option A for production deployments
- For GitHub Actions/CI, set `SUPABASE_PASSWORD` as a secret
- For Heroku/Railway, add `SUPABASE_PASSWORD` as config var

### 4. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 5. Run Your Application
```bash
python app.py
```

The database tables will be created automatically on first run!

## 📊 Database Features

The system automatically creates the following tables:
- **users** - User accounts and authentication
- **sessions** - Chat sessions with timestamps
- **messages** - Conversation history with metadata
- **documents** - Uploaded document tracking with expiration

All tables include appropriate indexes for optimal performance.

## 🔧 Python 3.12 Compatibility

This implementation uses `psycopg2-binary` directly, avoiding the PyO3-dependent packages (like SQLAlchemy with newer versions) that cause compatibility issues with Python 3.12+.

### Why This Works:
- ✅ Uses raw SQL with `psycopg2-binary` (pure C implementation)
- ✅ No SQLAlchemy dependency (which requires `tokenizers` → PyO3)
- ✅ Compatible with Python 3.12 and 3.13
- ✅ Works seamlessly with Supabase's PostgreSQL

## 🆓 Supabase Free Tier

Perfect for development and small projects:
- 500 MB database storage
- 1 GB file storage
- Unlimited API requests
- Up to 50,000 monthly active users
- 2 GB bandwidth
- No credit card required

## 🔄 Database Modes

The system supports three database modes:

### 1. Supabase (Production - Recommended)
```env
SUPABASE_DB_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### 2. Standard PostgreSQL (Heroku, Neon, Railway, etc.)
```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### 3. SQLite (Local Development Only)
```env
DB_PATH=./data/rag.db
```

The system automatically detects which mode to use based on environment variables.

## 🛠️ Connection Pooling

Supabase offers two connection modes:

### Transaction Mode (Recommended)
- Best for most applications
- Port: 6543
- Lower latency
- Better for serverless deployments

### Session Mode
- For long-running connections
- Port: 5432
- Full PostgreSQL compatibility
- Better for traditional server deployments

## 🔐 Security Best Practices

### 1. Never Commit Credentials to Git
```bash
# Make sure .env is in .gitignore
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
echo ".env.*" >> .gitignore
```

### 2. Use Environment Variables for Passwords

**Local Development (.env file):**
```env
SUPABASE_DB_URL=postgresql://postgres.myproject:${SUPABASE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_PASSWORD=my_secure_password_123
```

**Production Deployment:**

**GitHub Actions:**
```yaml
env:
  SUPABASE_DB_URL: postgresql://postgres.myproject:${SUPABASE_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  SUPABASE_PASSWORD: ${{ secrets.SUPABASE_PASSWORD }}
```

**Heroku/Railway:**
```bash
# Set config vars via CLI
heroku config:set SUPABASE_PASSWORD=your_password

# Or via dashboard: Settings → Config Vars
```

**Docker:**
```bash
docker run -e SUPABASE_PASSWORD=your_password your-image
```

### 3. Password Rotation
When rotating passwords:
1. Update password in Supabase dashboard
2. Update `SUPABASE_PASSWORD` environment variable
3. Restart your application
4. No code changes needed!

### 4. Multiple Environments
```env
# Development
SUPABASE_DB_URL=postgresql://postgres.dev-project:${SUPABASE_PASSWORD}@...
SUPABASE_PASSWORD=dev_password

# Production (separate .env.production)
SUPABASE_DB_URL=postgresql://postgres.prod-project:${SUPABASE_PASSWORD}@...
SUPABASE_PASSWORD=prod_password
```

### 5. Team Collaboration
- Share the connection string template (with `${SUPABASE_PASSWORD}`)
- Each team member sets their own `SUPABASE_PASSWORD` locally
- Never share actual passwords via chat/email
- Use a password manager for secure sharing if needed

## 🔐 Security Best Practices (Original)

1. **Never commit credentials**
   - Add `.env` to your `.gitignore`
   - Use different credentials for development/production

2. **Use environment variables**
   - Store `SUPABASE_DB_URL` securely
   - Use secrets management in production

3. **Enable SSL**
   - The implementation automatically enables SSL for Supabase connections
   - This is required for secure connections

## 📝 Migration from SQLite

If you're currently using SQLite and want to migrate to Supabase:

1. Export your SQLite data (if needed)
2. Update your `.env` with `SUPABASE_DB_URL`
3. Remove or comment out `DB_PATH`
4. Restart your application

The tables will be created automatically in Supabase!

## 🐛 Troubleshooting

### Connection Issues
```
Error: could not connect to server
```
**Solution:** 
- Verify your password is correct
- Check that you're using the pooler connection string
- Ensure your IP isn't blocked by Supabase firewall

### SSL Certificate Errors
```
Error: SSL SYSCALL error
```
**Solution:**
- The code automatically enables `sslmode=require` for Supabase
- Make sure your Python environment has updated SSL certificates

### Import Errors
```
ModuleNotFoundError: No module named 'psycopg2'
```
**Solution:**
```bash
pip install psycopg2-binary
```

## 🎯 Key Advantages

1. **Zero Configuration** - Just add the connection string
2. **Auto-scaling** - Supabase handles scaling automatically
3. **Real-time Ready** - Built-in support for real-time subscriptions
4. **Built-in Auth** - Can integrate with Supabase Auth if needed
5. **Free Tier** - Perfect for development and small projects
6. **Python 3.12+** - Fully compatible with latest Python versions

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)

## 💡 Tips

- Use transaction pooling (port 6543) for most applications
- Monitor your database usage in the Supabase dashboard
- Set up database backups for production use
- Consider upgrading to a paid tier for production workloads
- Use indexes wisely - they're already set up for common queries

---

**Need help?** Check the [Supabase Community](https://github.com/supabase/supabase/discussions) or [documentation](https://supabase.com/docs).
