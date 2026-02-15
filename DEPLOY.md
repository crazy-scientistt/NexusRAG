# Railway + Netlify Deployment Guide

## Backend (Railway)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "RAG system with image support"
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### 2. Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python app

### 3. Configure Environment Variables

In Railway dashboard, add these environment variables:
```
HF_TOKEN=your_huggingface_token_here
```

### 4. Add Build Command (if needed)

In Railway settings:
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && python app.py`

### 5. Install System Dependencies

In Railway settings, add this to your build:
```bash
apt-get update && apt-get install -y poppler-utils
```

Or use a `nixpacks.toml` file:
```toml
[phases.setup]
aptPkgs = ["poppler-utils"]
```

### 6. Get Your Railway URL

Railway will give you a URL like: `https://your-app.railway.app`

---

## Frontend (Netlify)

The new UI is a Vite + React app in `frontend/` (rooted at `frontend/client`). Configure Netlify like this:

1. **Environment variables (Netlify UI)**
   - `VITE_API_URL` = `https://your-app.railway.app`
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (copy from Firebase console).
2. **Build settings**
   - **Base directory**: `frontend`
   - **Build command**: `pnpm install && pnpm build` (or `npm install && npm run build` if pnpm is unavailable)
   - **Publish directory**: `frontend/dist/public`
   - **Node version**: 20+ recommended
3. **Local preview**
   ```bash
   cd frontend
   cp .env.example .env             # then fill values or use .env.production as reference
   pnpm install
   pnpm dev -- --host
   ```

---

## Testing

1. Visit your Netlify URL
2. Upload a PDF or image
3. Ask questions!

---

## File Structure

```
RAG-Railway-Netlify/
├── backend/              # Deploy to Railway
│   ├── app.py
│   ├── requirements.txt
│   ├── document_loader.py
│   └── ...
└── frontend/            # Deploy to Netlify
    ├── index.html
    ├── config.js
    └── js/
```

---

## Troubleshooting

**Railway "Application failed to respond"**
- Check logs: Make sure poppler-utils is installed
- Check environment: HF_TOKEN is set
- Check port: App uses PORT environment variable (auto-configured)

**Netlify CORS errors**
- Update `frontend/config.js` with correct Railway URL
- Make sure Railway app is running

**OCR not working**
- Railway logs will show if poppler-utils is missing
- Add apt package as shown above
