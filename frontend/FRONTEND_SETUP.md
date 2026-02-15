# Cloud RAG Frontend - Setup & Configuration

## Overview
A modern, ChatGPT-inspired conversational interface for the Cloud RAG system. Built with React 19, TypeScript, Tailwind CSS, and shadcn/ui components.

## Architecture

### Component Structure
```
App (Root)
├── AuthGate (Firebase login/signup)
├── Sidebar (Navigation, session list, user menu)
└── ChatArea (Main conversation interface)
    ├── Message (Individual message display)
    ├── InputArea (Message input with mode controls)
    └── DocumentPanel (File upload and document list)
```

### State Management
- **useAuth**: Firebase authentication state
- **useSession**: Session CRUD operations
- **useMessages**: Message history and sending
- **useDocuments**: Document upload and management

### API Integration
All backend communication goes through `apiClient` service:
- Automatic token injection from Firebase
- Error handling and retry logic
- Type-safe request/response models

## Environment Setup

### Firebase Configuration
You need to set up Firebase environment variables. Create a `.env.local` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:8000
```

### Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Go to Project Settings → Your apps
4. Copy the config values to `.env.local`

### Enable Firebase Authentication
1. In Firebase Console, go to Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Enable "Google" provider (optional)

## Development

### Start Dev Server
```bash
pnpm dev
```

### Build for Production
```bash
pnpm build
```

### Type Check
```bash
pnpm check
```

## Key Features

### 1. Authentication
- Firebase Email/Password authentication
- Password reset functionality
- Persistent login state
- Automatic token refresh

### 2. Session Management
- Create new conversations
- Switch between sessions
- Rename sessions
- Clone sessions (copy with history)
- Delete sessions
- Auto-save session list

### 3. Document Management
- Drag-drop file upload
- Multiple file formats (PDF, TXT, DOCX, HTML, Images)
- Temporary documents with auto-expiry
- Document preview
- Document deletion
- Upload progress tracking

### 4. Chat Interface
- Real-time message streaming
- Source citations with preview
- Confidence scores
- Message pinning
- Export conversation as Markdown
- Clear conversation history

### 5. Query Modes
- **Strict Mode**: Only answer from uploaded documents
- **Hybrid Mode**: Use documents + general knowledge
- **Explain Simpler**: Simplify responses for better understanding

### 6. Theme Support
- Dark/Light theme toggle
- Persistent theme preference
- Smooth theme transitions

### 7. Responsive Design
- Mobile-first approach
- Collapsible sidebar on mobile
- Optimized layouts for all screen sizes
- Touch-friendly controls

## Component Documentation

### AuthGate
Handles user authentication with email/password and password reset.

**Props:**
- `onLogin`: (email, password) => Promise<void>
- `onSignup`: (email, password) => Promise<void>
- `onResetPassword`: (email) => Promise<void>
- `isLoading`: boolean
- `error`: string | null

### Sidebar
Navigation and session management.

**Props:**
- `sessions`: Session[]
- `activeSessionId`: string | null
- `onSelectSession`: (id) => void
- `onCreateSession`: () => void
- `onCloneSession`: (id) => void
- `onDeleteSession`: (id) => void
- `onRenameSession`: (id, name) => void
- `onLogout`: () => void
- `onThemeToggle`: () => void
- `theme`: 'light' | 'dark'
- `isOpen`: boolean
- `onToggle`: (open) => void
- `userEmail`: string | undefined

### ChatArea
Main conversation interface.

**Props:**
- `messages`: Message[]
- `documents`: Document[]
- `uploads`: Map<string, UploadProgress>
- `isLoading`: boolean
- `isSending`: boolean
- `mode`: 'strict' | 'hybrid'
- `explainSimpler`: boolean
- `inputValue`: string
- `onInputChange`: (value) => void
- `onSendMessage`: () => void
- `onModeChange`: (mode) => void
- `onExplainSimpler`: (enabled) => void
- `onUpload`: (file, isTemp) => Promise<void>
- `onDeleteDocument`: (id) => void
- `onPreviewDocument`: (id) => void
- `onPinMessage`: (id, pinned) => void
- `onExportSession`: () => void
- `onClearChat`: () => void
- `documentError`: string | null
- `messageError`: string | null

### Message
Individual message display with sources and actions.

**Props:**
- `message`: Message
- `onPin`: (id, pinned) => void
- `onPreviewSource`: (source) => void
- `isLoading`: boolean

### InputArea
Message input with mode controls.

**Props:**
- `value`: string
- `onChange`: (value) => void
- `onSend`: () => void
- `onModeChange`: (mode) => void
- `onExplainSimpler`: (enabled) => void
- `isLoading`: boolean
- `isSending`: boolean
- `mode`: 'strict' | 'hybrid'
- `explainSimpler`: boolean

### DocumentPanel
File upload and document list.

**Props:**
- `documents`: Document[]
- `uploads`: Map<string, UploadProgress>
- `onUpload`: (file, isTemp) => Promise<void>
- `onDelete`: (id) => void
- `onPreview`: (id) => void
- `isLoading`: boolean
- `error`: string | null

## Styling

### Design System
- **Colors**: Tailwind default palette with custom dark mode
- **Typography**: System fonts (Inter fallback)
- **Spacing**: 4px base unit (Tailwind default)
- **Shadows**: Subtle shadows for depth
- **Radius**: 8px default border radius

### Dark Mode
- Automatic dark mode detection
- Manual theme toggle
- Persistent preference in localStorage
- Smooth transitions between themes

## Performance Optimizations

1. **Code Splitting**: Dynamic imports for components
2. **Lazy Loading**: Documents and messages load on demand
3. **Memoization**: React.memo for expensive components
4. **Debouncing**: API calls debounced to prevent spam
5. **Virtual Scrolling**: Large message lists use virtualization
6. **Image Optimization**: Lazy load images, responsive sizes

## Error Handling

### Network Errors
- Automatic retry with exponential backoff
- User-friendly error messages
- Toast notifications for errors

### Auth Errors
- Redirect to login on 401
- Clear session on logout
- Handle token expiration

### File Upload Errors
- Validation before upload
- Progress tracking
- Graceful error recovery

## Testing

### Manual Testing Checklist
- [ ] Login/signup flow
- [ ] Create new session
- [ ] Upload documents
- [ ] Send messages
- [ ] Switch between sessions
- [ ] Delete documents
- [ ] Export conversation
- [ ] Theme toggle
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Error handling (network, auth, file)

## Troubleshooting

### Firebase Not Loading
- Check Firebase config in `.env.local`
- Verify Firebase project exists
- Check browser console for errors

### API Connection Errors
- Ensure backend is running on correct port
- Check `VITE_API_URL` in environment
- Verify CORS headers from backend

### Theme Not Persisting
- Check localStorage in browser DevTools
- Verify `switchable` prop in ThemeProvider

### Messages Not Sending
- Check network tab in DevTools
- Verify session ID is set
- Check backend logs for errors

## Future Enhancements

- [ ] Message editing/deletion
- [ ] Conversation search
- [ ] Advanced document analysis
- [ ] Streaming responses
- [ ] Voice input/output
- [ ] Collaborative sessions
- [ ] Analytics dashboard
- [ ] Custom system prompts
- [ ] Document chunking visualization
- [ ] Conversation templates

## Contributing

When adding new features:
1. Create components in `src/components/`
2. Add types in `src/types/`
3. Create hooks in `src/hooks/` for state
4. Add API methods in `src/services/api.ts`
5. Update tests
6. Document in this README

## License

MIT
