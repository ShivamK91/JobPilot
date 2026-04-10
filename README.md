# JobPilot

A full-stack AI-powered job search co-pilot with a drag-and-drop kanban board.

**Stack:** React + Vite + TypeScript + Tailwind (client) · Node.js + Express + TypeScript + MongoDB (server) · OpenAI GPT-4o-mini (AI)

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection string (or local MongoDB)
- An [OpenAI API key](https://platform.openai.com/api-keys)

---

### 1. Clone & Install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment Variables

#### Server — `server/.env`

```bash
cp server/.env.example server/.env
```

| Variable | Description |
|---|---|
| `MONGO_URI` | Full MongoDB connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/job-tracker`) |
| `JWT_SECRET` | A long, random secret string for signing JWTs (e.g. `openssl rand -hex 32`) |
| `OPENAI_API_KEY` | Your OpenAI API key — used for job description parsing and resume suggestions |
| `PORT` | Port the Express server listens on (default: `5000`) |

#### Client — `client/.env`

```bash
cp client/.env.example client/.env
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the running server (default: `http://localhost:5000`) |

---

### 3. Run Development Servers

Open two terminals:

```bash
# Terminal 1 — API server (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — React client (http://localhost:3000)
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

Controllers should only handle HTTP concerns — parsing request bodies, calling business logic, and writing responses. The OpenAI API calls involve prompt engineering, JSON parsing, and error handling that have nothing to do with HTTP. By isolating them in `aiService.ts`, the logic is:

- **Testable in isolation** — you can unit-test `parseJobDescription()` without spinning up Express
- **Reusable** — both `parsedJob` and `resumeSuggestions` are generated in a single controller call, but the service functions can be composed independently
- **Replaceable** — switching from OpenAI to another provider only requires editing the service, not the routes or controllers

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
