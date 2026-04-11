# JobPilot

A full-stack AI-powered job search co-pilot with a drag-and-drop Kanban board.

**Stack:** React + Vite + TypeScript + Tailwind (client) · Node.js + Express + TypeScript + MongoDB (server) · Groq `llama-3.3-70b-versatile` via OpenAI-compatible API (AI)

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string (or local MongoDB)
- A [Groq API key](https://console.groq.com) (free tier available — used for AI job description parsing)

---

### 1. Clone & Install

```bash
# From the repo root — install all dependencies
cd server && npm install && cd ../client && npm install && cd ..
```

### 2. Configure Environment Variables

#### Server — `server/.env`

```bash
cp server/.env.example server/.env
# Then fill in your values
```

| Variable | Description |
|---|---|
| `MONGO_URI` | Full MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/job-tracker`) |
| `JWT_SECRET` | A long, random secret string for signing JWTs — generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `OPENAI_API_KEY` | Your **Groq** API key from [console.groq.com](https://console.groq.com) — the server uses Groq's OpenAI-compatible endpoint |
| `PORT` | Port the Express server listens on (default: `5000`) |

#### Client — `client/.env`

```bash
cp client/.env.example client/.env
# Defaults to http://localhost:5000 — change only if your server runs on a different port
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the running Express server (default: `http://localhost:5000`) |

---

### 3. Run Development Servers

Open two terminals:

```bash
# Terminal 1 — API server (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — React client (http://localhost:5173)
cd client
npm run dev
```

Health check: `http://localhost:5000/api/health`

---

## API Reference

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ✗ | Create account, returns JWT |
| `POST` | `/api/auth/login` | ✗ | Login, returns JWT |
| `GET` | `/api/applications` | ✅ | Get all applications for logged-in user |
| `POST` | `/api/applications` | ✅ | Create a new application |
| `PUT` | `/api/applications/:id` | ✅ | Update an application |
| `DELETE` | `/api/applications/:id` | ✅ | Delete an application |
| `POST` | `/api/ai/parse` | ✅ | Parse a job description + generate resume suggestions |

---

## Architecture Decisions

### Why is AI logic in a service layer (`aiService.ts`) and not in the controller?

Controllers should only handle HTTP concerns — parsing request bodies, calling business logic, and writing responses. The AI API calls involve prompt engineering, JSON parsing, defensive validation, and error handling that have nothing to do with HTTP. By isolating them in `aiService.ts`, the logic is:

- **Testable in isolation** — you can unit-test `parseJobDescription()` without spinning up Express
- **Reusable** — both `parsedJob` and `resumeSuggestions` are generated in a single controller call, but the service functions can be composed independently
- **Replaceable** — switching from Groq to any other OpenAI-compatible provider only requires editing the service, not the routes or controllers

### Why Groq + Llama 3.3 instead of OpenAI directly?

Groq exposes an OpenAI-compatible REST API, so the `openai` npm package works with zero code changes — only `baseURL` and the model name differ. Llama 3.3 70B on Groq offers:
- **Free tier** with generous rate limits — no credit card required for evaluation
- **Faster inference** than hosted OpenAI for similarly-sized prompts
- **JSON mode** (`response_format: { type: 'json_object' }`) is fully supported

The entire AI integration would work equally well against `gpt-4o-mini` by changing two strings in `aiService.ts`.

### Why React Query for server state?

React Query handles the full lifecycle of server data — fetching, caching, background revalidation, and mutation side effects. Specifically in this app:

- **Drag-and-drop optimistic updates**: when a card is dragged to a new column, the cache is updated instantly (`onMutate`) and rolled back automatically if the server returns an error (`onError`) — without any manual loading state management
- **Cache invalidation**: after any mutation (create, update, delete), `queryClient.invalidateQueries('applications')` triggers a background refetch so all components stay in sync
- **Zero boilerplate**: no Redux slices, no `useEffect` fetch loops, no manual loading/error booleans for server data

### How JWT authentication works

1. On login/register, the server signs a JWT containing `{ userId }` with `JWT_SECRET` (expires in 7 days) and returns it
2. The client stores the token in `localStorage` and attaches it as `Authorization: Bearer <token>` on every request via an Axios request interceptor
3. Protected server routes run the `protect` middleware, which verifies the token using `jsonwebtoken.verify()` and attaches `req.userId` to the request object
4. All database queries in protected controllers filter by `userId` — a user can never read or modify another user's data even with a valid token
5. If a token is missing, expired, or tampered with, the server returns `401`. The client's Axios response interceptor catches `401` responses, clears localStorage, and redirects to `/login`
