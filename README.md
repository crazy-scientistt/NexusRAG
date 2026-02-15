# Cloud RAG System - v2.0 (Fixed)

A production-ready Retrieval-Augmented Generation (RAG) system with improved LLM responses, structured outputs, and clean architecture.

## 🎯 What's Fixed in v2.0

This version includes major improvements to fix poor LLM response quality:

- ✅ **Upgraded Model**: Qwen 2.5-72B (was 4B) for coherent, structured responses
- ✅ **4x More Tokens**: 2048 tokens (was 512) for complete, detailed answers  
- ✅ **System Prompts**: Better instruction following and formatting control
- ✅ **Optimized Prompts**: Simplified, clearer prompts for better results
- ✅ **Clean Codebase**: Removed unnecessary files and credentials

**See `FIXES_APPLIED.md` for detailed explanation of all changes.**

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- pnpm
- HuggingFace account with Inference API access

### 1. Clone and Setup

```bash
git clone <your-repo>
cd RAG_V2-main-fixed

# Backend setup
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your HF_TOKEN

# Frontend setup
cd ../frontend
pnpm install
cp .env.example .env
# Edit .env and add your Firebase config
```

### 2. Get Required API Keys

**HuggingFace Token** (Required):
1. Go to https://huggingface.co/settings/tokens
2. Create a new token with "Inference API" permission
3. Add to `backend/.env`: `HF_TOKEN=hf_your_token_here`

**Firebase** (Optional, for auth):
1. Create project at https://console.firebase.google.com
2. Get config from Project Settings → Web App
3. Add to `frontend/.env`

### 3. Run

```bash
# Terminal 1 - Backend (port 8000)
cd backend
python app.py

# Terminal 2 - Frontend (port 5173)
cd frontend  
pnpm dev
```

Visit http://localhost:5173

---

## 📁 Project Structure

```
RAG_V2-main-fixed/
├── backend/
│   ├── app.py              # FastAPI main application
│   ├── rag_system.py       # Core RAG logic (IMPROVED)
│   ├── llm_provider.py     # HuggingFace LLM integration (IMPROVED)
│   ├── config.py           # Configuration (IMPROVED)
│   ├── vector_store.py     # Chroma vector database
│   ├── document_loader.py  # Document processing
│   ├── embeddings_provider.py
│   ├── db.py               # SQLite for metadata
│   ├── auth.py             # Firebase authentication
│   └── requirements.txt
│
├── frontend/
│   ├── client/
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── Home.tsx        # Main chat interface
│   │       │   └── LandingPage.tsx
│   │       ├── components/
│   │       │   ├── ChatArea.tsx
│   │       │   ├── Message.tsx     # Markdown rendering
│   │       │   ├── InputArea.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   └── DocumentPanel.tsx
│   │       ├── hooks/
│   │       ├── services/
│   │       └── types/
│   ├── package.json
│   └── vite.config.ts
│
├── FIXES_APPLIED.md        # Detailed fix documentation (NEW)
├── TROUBLESHOOTING.md      # Common issues and solutions
└── README.md               # This file
```

---

## 🎨 Features

### Core RAG Capabilities
- 📄 **Multi-format Documents**: PDF, DOCX, TXT, HTML, images (OCR)
- 🧠 **Smart Chunking**: Context-aware document splitting
- 🔍 **Vector Search**: Fast semantic retrieval with Chroma
- 💬 **Structured Responses**: Clean markdown formatting
- 📊 **Confidence Scoring**: Know when answers are well-supported

### User Features
- 👤 **Firebase Auth**: Secure user sessions
- 💾 **Session Management**: Organize conversations
- 📌 **Pin Messages**: Save important responses
- 🔄 **Session Cloning**: Duplicate and modify conversations
- 📥 **Export Chat**: Download as markdown
- ⏱️ **Temporary Docs**: Auto-cleanup of test documents

### Developer Features  
- 🚀 **FastAPI Backend**: Fast, async Python API
- ⚛️ **React Frontend**: Modern, responsive UI
- 🎯 **TypeScript**: Type-safe development
- 🔌 **RESTful API**: Easy integration
- 📦 **Docker Ready**: Containerization support

---

## ⚙️ Configuration

### Backend (`backend/config.py`)

```python
# Model Selection
LLM_MODEL = "Qwen/Qwen2.5-72B-Instruct"  # Can change to faster models
EMBEDDING_MODEL = "BAAI/bge-large-en-v1.5"

# Generation Parameters
MAX_TOKENS = 2048      # Response length
TEMPERATURE = 0.3      # Lower = more consistent, Higher = more creative

# RAG Behavior
TOP_K_RESULTS = 4      # Number of chunks to retrieve
CHUNK_SIZE = 1000      # Document chunk size
CHUNK_OVERLAP = 200    # Overlap between chunks

# Storage
VECTOR_DB_DIR = "./data/chroma"
DB_PATH = "./data/rag.db"
```

### Recommended Models

**For Quality** (slower, better responses):
- `Qwen/Qwen2.5-72B-Instruct` ⭐⭐⭐⭐⭐ (current)
- `meta-llama/Llama-3.3-70B-Instruct` ⭐⭐⭐⭐⭐

**For Speed** (faster, good quality):  
- `mistralai/Mixtral-8x7B-Instruct-v0.1` ⭐⭐⭐⭐
- `Qwen/Qwen2.5-32B-Instruct` ⭐⭐⭐

**For Development** (fastest, testing):
- `Qwen/Qwen2.5-7B-Instruct` ⭐⭐⭐

Change in `backend/config.py`:
```python
LLM_MODEL: str = "mistralai/Mixtral-8x7B-Instruct-v0.1"  # Example
```

---

## 🔧 API Endpoints

### Sessions
- `POST /sessions` - Create new chat session
- `GET /sessions` - List user sessions  
- `PATCH /sessions/{id}` - Rename session
- `DELETE /sessions/{id}` - Delete session
- `POST /sessions/{id}/clone` - Clone session

### Messages
- `GET /sessions/{id}/messages` - Get chat history
- `POST /sessions/{id}/messages` - Send question, get RAG response
- `PATCH /sessions/{id}/messages/{msg_id}/pin` - Pin/unpin message
- `GET /sessions/{id}/export` - Export as markdown

### Documents
- `POST /upload` - Upload document (PDF, DOCX, etc.)
- `GET /documents` - List uploaded documents
- `GET /documents/{id}/preview` - Preview document
- `DELETE /documents/{id}` - Delete document

### System
- `GET /stats` - System statistics
- `GET /me` - Current user info
- `DELETE /clear` - Clear all user data

---

## 📊 Query Response Format

```json
{
  "question": "What are the HR policies?",
  "response": "# Human Resources Policies\n\nThe company provides...",
  "sources": [
    {"source": "hr_manual.pdf", "chunk": 0, "id": "doc_123"}
  ],
  "num_sources": 1,
  "supported_by_documents": true,
  "confidence": {
    "score": 0.89,
    "label": "high"
  },
  "mode": "hybrid",
  "retrieval_ms": 45,
  "generation_ms": 3200
}
```

**Response Modes**:
- `hybrid` (default): Uses documents if available, falls back to general knowledge
- `strict`: Only answers from uploaded documents, returns error if not found

**Confidence Levels**:
- `high` (>0.75): Strong document support
- `medium` (0.45-0.75): Moderate support  
- `low` (<0.45): Weak or no document support

---

## 🚢 Deployment

### Docker (Recommended)

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["python", "app.py"]
```

```dockerfile
# Frontend Dockerfile  
FROM node:18-alpine
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml .
RUN npm install -g pnpm && pnpm install
COPY frontend/ .
RUN pnpm build
CMD ["pnpm", "preview"]
```

### Railway

1. Push to GitHub
2. Connect to Railway
3. Add environment variables (HF_TOKEN, etc.)
4. Deploy automatically

### Render/Heroku

See `TROUBLESHOOTING.md` for platform-specific guides.

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` templates
2. **Rotate API keys** regularly
3. **Use Firebase Authentication** for production
4. **Set appropriate CORS origins** in backend/.env
5. **Enable HTTPS** in production
6. **Implement rate limiting** for API endpoints
7. **Sanitize file uploads** - validate file types and sizes
8. **Use environment variables** for all secrets

---

## 🐛 Troubleshooting

### "Authentication Error: Invalid HuggingFace token"
- Get new token from https://huggingface.co/settings/tokens
- Ensure it has "Inference API" permission
- Add to `backend/.env`: `HF_TOKEN=hf_...`

### "Model not found" or "Model is loading"
- Check model name spelling in `config.py`
- Wait 20 seconds for model to warm up
- Try alternative model from recommendations

### Slow responses
- Switch to faster model (Mixtral-8x7B)
- Reduce MAX_TOKENS to 1024
- Upgrade HuggingFace plan for faster inference

### Poor response quality
- Ensure using 7B+ parameter model
- Verify MAX_TOKENS is at least 1024
- Lower TEMPERATURE to 0.1 for consistency
- Check system prompt is being sent (logs)

### Rate limiting
- Upgrade to HuggingFace Pro ($9/month)
- Implement request caching
- Use smaller/faster model

**See `TROUBLESHOOTING.md` for more solutions.**

---

## 📈 Performance Tips

### Optimize Response Speed
1. **Use faster model**: Mixtral-8x7B vs Qwen-72B
2. **Reduce token limit**: 1024 vs 2048
3. **Cache responses**: Store common queries
4. **Use streaming**: Better UX for long responses
5. **Upgrade HF plan**: Faster inference queues

### Optimize Response Quality  
1. **Use larger model**: 70B+ parameters
2. **Increase token limit**: 2048+ tokens
3. **Lower temperature**: 0.1-0.3 for consistency
4. **Better chunking**: Adjust CHUNK_SIZE for your docs
5. **More context**: Increase TOP_K_RESULTS

### Optimize Costs
1. **Smaller model**: 7B-32B range
2. **Lower tokens**: 512-1024
3. **Cache aggressively**: Reduce API calls
4. **Batch queries**: Process multiple at once
5. **Use free tier**: For development/testing

---

## 📝 Example Queries

Try these to test the improvements:

```
1. "List all the IT security requirements"
   → Should get: Structured list with clear sections

2. "Explain the company's leave policy"
   → Should get: Well-formatted explanation with details

3. "What are the working hours?"
   → Should get: Clear, direct answer from documents

4. "Summarize the entire HR manual"
   → Should get: Organized summary with headings

5. "What happens if I'm late to work?"
   → Should get: Specific policy from documents
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Open Pull Request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- HuggingFace for Inference API
- Anthropic Claude for assistance in optimization
- LangChain community for RAG patterns
- Chroma for vector database
- FastAPI team for excellent framework

---

## 📞 Support

- 📖 Documentation: See `FIXES_APPLIED.md` and `TROUBLESHOOTING.md`
- 🐛 Issues: Open an issue on GitHub
- 💬 Discussions: Use GitHub Discussions
- 📧 Email: [your-email@example.com]

---

## 🗺️ Roadmap

- [ ] Add response streaming
- [ ] Implement caching layer
- [ ] Support more LLM providers (OpenAI, Anthropic)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Webhook integrations
- [ ] Mobile app

---

**Version**: 2.0  
**Last Updated**: February 2026  
**Status**: ✅ Production Ready
