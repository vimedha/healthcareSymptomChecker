## Arogya AI - Healthcare Symptom Checker

Educational app to input symptoms and receive probable conditions and recommended next steps. This project includes a backend API that queries OpenAI models (text: gpt-4o-mini, image: gpt-4o-mini, speech-to-text: whisper-1), optional image/audio inputs, and an authenticated history stored in Firebase. All outputs include safety disclaimers and are for educational purposes only.

> **🌐 Live Demo:** [https://arogya-ai-health-checker.vercel.app/](https://arogya-ai-health-checker.vercel.app/)  
> **📁 Source Code:** [https://github.com/vimedha/healthcareSymptomChecker](https://github.com/vimedha/healthcareSymptomChecker)

> Important: This app does not provide medical advice, diagnosis or treatment. Always consult a qualified healthcare professional.

### Objectives
- Accept user symptom input (text; optional image/audio)
- Generate probable conditions and next steps via LLM
- Include explicit safety/educational disclaimers
- Optionally store user query history

## Tech Stack
- **Next.js 15.5.5** with App Router (TypeScript, React 19.1.0)
- **OpenAI API** for reasoning (text: gpt-4o-mini, image: gpt-4o-mini, speech-to-text: whisper-1)
- **Clerk 6.33.3** for authentication
- **Firebase 12.4.0** Admin + Firestore for server-side persistence; Firebase Web SDK for client
- **Tailwind CSS 4.1.14** + **Shadcn UI** (components in `components/ui`)
- **Framer Motion 12.23.24** for animations
- **React Markdown 10.1.0** for formatted responses
- **RecordRTC 5.6.2** for audio recording

## Project Structure
```
app/
├── (auth)/                    # Authentication pages
│   ├── layout.tsx
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
├── (dashboard)/               # Dashboard layout
│   └── layout.tsx
├── api/                       # API routes
│   ├── check-text/route.ts    # Analyze symptom text with LLM; saves per-user results
│   ├── check-image/route.ts   # Vision analysis for uploaded image; saves per-user result
│   └── stream-audio/route.ts  # Transcribe audio via Whisper then forwards to text analysis
├── dashboard/                 # Main dashboard
│   ├── layout.tsx
│   └── page.tsx
├── globals.css               # Global styles
├── layout.tsx                # Root layout with ClerkProvider
└── page.tsx                  # Landing page

components/
├── chat-interface.tsx        # Main chat UI component
├── chat-messages.tsx         # Message display component
├── chat-sidebar.tsx          # Chat history sidebar
├── header.tsx                # App header
├── sidebar.tsx               # Main sidebar
└── ui/                       # Shadcn UI components
    ├── avatar.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── input.tsx
    ├── scroll-area.tsx
    ├── separator.tsx
    ├── sonner.tsx
    └── textarea.tsx

lib/
├── firebase.ts               # Firebase configuration
└── utils.ts                  # Utility functions
```

## Environment Variables
Create a `.env.local` at the repo root:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Clerk (example names; match your Clerk dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Firebase Admin (server)
FIREBASE_DB_URL=https://<your-project>.firebaseio.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}

# Firebase Web (client)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**Important:** The `FIREBASE_SERVICE_ACCOUNT` should contain the entire service account JSON as a string. Do not create a separate JSON file.

## Requirements
- **Node.js 18+** (recommended: 20+)
- An **OpenAI API key** with access to `gpt-4.1-mini` and `whisper-1`
- A **Firebase project** (Firestore enabled) and a service account JSON
- A **Clerk application** configured for your local and deployed URLs
- Modern browser with microphone access for audio recording

## Installation & Run
```bash
npm install
npm run dev
# app runs at http://localhost:3000
```

## API

All endpoints are server-side and require `OPENAI_API_KEY`. Some routes require authentication via Clerk; ensure you are signed in through the app UI before calling.

### POST /api/check-text
Analyze free-form symptom text.

Request:
```bash
curl -X POST http://localhost:3000/api/check-text \
  -H "Content-Type: application/json" \
  --cookie "<your_cookies_if_auth_required>" \
  -d '{"symptoms":"Fever, sore throat for 2 days, mild cough"}'
```

Response:
```json
{
  "diagnosis": "...model response with conditions, next steps, and disclaimer...",
  "debug": {
    "userId": "...",
    "savedTo": "users/<id>/diagnosis"
  }
}
```

Storage:
- Saves a document under `users/{clerkUserId}/diagnosis` with `symptoms`, `answer`, `type: "text"`, and timestamp.

Auth:
- Requires a valid Clerk session (`currentUser`).

### POST /api/check-image
Analyze an uploaded image (e.g., skin rash) using vision capabilities.

Request (multipart/form-data):
```bash
curl -X POST http://localhost:3000/api/check-image \
  -H "Cookie: <your_cookies_if_auth_required>" \
  -F image=@"/path/to/photo.jpg"
```

Response:
```json
{
  "diagnosis": "...vision analysis with next steps and disclaimer...",
  "imageData": "data:<mime>;base64,..."
}
```

Storage:
- Saves a document under `users/{clerkUserId}/diagnosis` with `imageName`, `imageData` (data URI), `answer`, `type: "image"`.

Auth:
- Requires a valid Clerk session (`currentUser`).

### GET /api/check-image
Retrieve a previously uploaded image by name.

Request:
```bash
curl "http://localhost:3000/api/check-image?imageName=photo.jpg" \
  -H "Cookie: <your_cookies_if_auth_required>"
```

Response:
```json
{
  "success": true,
  "imageData": "data:<mime>;base64,...",
  "diagnosis": "...",
  "imageName": "photo.jpg",
  "createdAt": "...",
  "messageId": "..."
}
```

### POST /api/stream-audio
Transcribe audio (patient narrative) with Whisper and forward to `/api/check-text` for analysis.

Request (multipart/form-data):
```bash
curl -X POST http://localhost:3000/api/stream-audio \
  -F audio=@"/path/to/audio.wav"
```

Response:
```json
{
  "transcription": "...",
  "diagnosis": "..."
}
```

Storage:
- Adds a document in `queries` with `audioTranscription`, `answer`, and `createdAt`.

Auth:
- Does not itself check `currentUser`. The forwarded call to `/api/check-text` will include cookies if present; otherwise, `diagnosis` may be `null` and only the transcription is returned.

## Prompting & Safety
The text analysis uses a structured prompt to ensure:
- Summarized symptoms and critical red flags
- Probable conditions with appropriate Reasoning
- Concrete next steps (home care, tests, when to seek urgent care)
- Risk context (age, comorbidities, duration, severity)
- Mandatory educational disclaimer

Example user prompt:
> "I have been suffering from headaches and fever since the last 4 days, I am 23 , Male."

Safety policy:
- Outputs are informational/educational only; not a diagnosis
- Encourage consulting healthcare professionals
- Highlight urgent-care triggers for severe/worsening symptoms

Data handling:
- Image uploads are converted to data URIs and (in this demo) saved in Firestore; avoid storing sensitive PHI in production and prefer secure storage.
- Do not commit `firebase-service-account.json` or any secrets to source control.

## Frontend
This repo includes a modern chat-style interface with multiple input methods and a sidebar for chat history.

### Features:
- **Text Input**: Multi-line textarea with auto-resize for symptom descriptions
- **Voice Recording**: Real-time audio recording with visual indicators
- **Image Upload**: Support for image-based symptom analysis
- **Chat History**: Persistent sidebar showing previous conversations
- **Responsive Design**: Modern dark theme with smooth animations
- **Real-time Feedback**: Loading states and error handling

### UI Components:
- `ChatInterface`: Main chat component with input controls
- `ChatMessages`: Message display with markdown rendering
- `ChatSidebar`: Chat history and user management
- `Header`: Application header with navigation

### Quick UI Flow:
1. Sign in via routes under `app/(auth)`
2. Access dashboard at `/dashboard`
3. Use text, voice, or image inputs to describe symptoms
4. View AI responses with safety disclaimers
5. Access chat history via hamburger menu

## Development Notes
- **Authentication**: All API routes except `stream-audio` require a valid Clerk session (`currentUser`). Ensure the app sign-in flow is configured via files in `app/(auth)`.
- **Service Account**: The server uses Firebase Admin SDK via the `FIREBASE_SERVICE_ACCOUNT` environment variable containing the JSON as a string.
- **Data Model**: 
  - Per-user history at `users/{userId}/diagnosis` for text/image queries
  - General `queries` collection for audio transcription forwarding
  - All documents include timestamps and content metadata
- **Audio Recording**: Uses browser MediaRecorder API; requires HTTPS or localhost for microphone access
- **Image Storage**: Images are converted to base64 data URIs and stored in Firestore (consider cloud storage for production)

## Scripts
```bash
npm run dev      # start dev server
npm run build    # build (eslint ignored in build script as configured)
npm run start    # start production server
npm run lint     # run eslint
```


## Evaluation Mapping
- Correctness: Deterministic prompt structure, guarded inputs, typed routes
- LLM reasoning quality: Stepwise prompt, concise outputs, temperature tuned
- Safety disclaimers: Mandatory disclaimer in every answer
- Code design: Clear separation of API routes, auth, and persistence; typed TS; minimal coupling


## License
For educational use. Review third-party API terms (OpenAI, Clerk, Firebase) before production use.

