# speed-puzzle-backend

Backend API for the **Speed Puzzle** app.

- **Language**: TypeScript
- **Framework**: Express (Node.js)
- **Runtime**: Vercel Functions (Node.js)
- **Database**: MongoDB Atlas

---

## What changed (serverless-ready)

This repo is now configured to run as **Vercel Serverless Functions**:

- The Express app lives in **`/api/index.ts`** and **exports the app** (`export default app`), no `app.listen()`.
- On cold start, we **await DB initialization** before serving requests.
- API routes return **500** on internal errors (instead of 406) and log a helpful message.
- A diagnostic route `GET /__debug` is available during testing.

---

## Project structure

```text
api/
  index.ts          # Express app exported for Vercel Functions
src/
  constants/events.ts
  controllers/Global.ts
  services/
    MongoDB.ts      # MongoDB client (Node driver)
    Users.ts
    Scores.ts
  scripts/
    seed.ts
```

---

## Environment variables

Create these for **local dev** in a `.env` file at the project root and set the same keys in **Vercel → Project → Settings → Environment Variables** (Production scope):

```bash
MONGODB_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority&appName=<YourApp>"
API_PORT=3000 # used only for local non-serverless runs
```

> For Vercel → Atlas connectivity, Atlas recommends allowing **`0.0.0.0/0`** (all IPs) because Vercel uses **dynamic egress IPs**. Tighten later with Secure Compute / private networking if required. citeturn0search2turn0search7

---

## Local development

```bash
npm install
npm run dev # uses `vercel dev` to emulate the platform
```

**Seed demo data**

```bash
npm run seed         # inserts users + scores
npm run seed -- --reset  # wipe & reseed
```

> The app runs as a Vercel Function locally; you don’t need `npm start` for serverless.

---

## Deployment (Vercel)

**One-time**:

```bash
npm i -g vercel
vercel login
```

**Deploy**:

```bash
vercel           # Preview deployment
vercel --prod    # Production deployment
```

**Vercel project settings** (for an API-only app):

- **Framework Preset**: **Other**
- **Build Command**: _empty_
- **Output Directory**: _empty_

This avoids the “Missing public directory” error that applies to static sites. If you previously set an Output Directory (e.g., `public/`), clear it. citeturn0search1

---

## REST API

**Base URL (prod):** `https://<your-deployment>.vercel.app`

### GET `/`

Health check.

```
200 OK → "<h1>Hello world</h1>"
```

```bash
curl -X GET https://<your-deployment>.vercel.app/ | jq
```

### GET `/__debug` (temporary)

Returns a few runtime facts to confirm env setup.

```json
{ "hasMongoURI": true, "vercelEnv": "production", "nodeVersion": "v20.x" }
```

```bash
curl -X GET https://<your-deployment>.vercel.app/__debug | jq
```

### POST `/adduser`

Create a user aligned with the mobile schema (optionally with an initial score).

**Body**

```json
{ "userName": "Ada Lovelace", "password": "SeedUser#2025", "score": 420 }
```

**Responses**

- `200 OK` → array of users (public fields only)
- `409 Conflict` → "User Already Exist."

```bash
curl -X POST https://<your-deployment>.vercel.app/adduser \
  -H "Content-Type: application/json" \
  -d '{"userName": "Ada Lovelace", "password": "SeedUser#2025", "score": 420}' | jq
```

### POST `/users/:userName/scores`

Add a score for an existing user.

**Body**

```json
{ "value": 451 }
```

**Responses**

- `201 Created` → `{ "userId": "<ObjectId>", "value": 451 }`
- `400 Bad Request` if `value` is not a number
- `409 Conflict` if rejected by the acceptance rule

```bash
curl -X POST https://<your-deployment>.vercel.app/users/AdaLovelace/scores \
  -H "Content-Type: application/json" \
  -d '{"value": 451}' | jq
```

### POST `/score`

Check a raw score against the global minimum across all scores. **Does not persist**.

**Body**

```json
{ "score": 300 }
```

**Responses**

- `200 OK` if accepted
- `409 Conflict` if rejected

```bash
curl -X POST https://<your-deployment>.vercel.app/score \
  -H "Content-Type: application/json" \
  -d '{"score": 300}' | jq
```

### GET `/users`

List all users (public fields only).

**Response (example)**

```json
[
  {
    "_id": "665e...",
    "userName": "Ava Johnson",
    "createdAt": 1720000000000,
    "updatedAt": 1720000000000
  }
]
```

```bash
curl -X GET https://<your-deployment>.vercel.app/users | jq
```

### GET `/scores/top?limit=10`

Top `limit` scores (default 10). Each item returns `{ score, user }`.

**Response (example)**

```json
[
  { "score": 497, "user": { "_id": "665e...", "userName": "Noah Smith", "createdAt": 172..., "updatedAt": 172... } }
]
```

```bash
curl -X GET https://<your-deployment>.vercel.app/scores/top?limit=10 | jq
```

### GET `/scores/bottom?limit=10`

Bottom `limit` scores (default 10). Each item returns `{ score, user }`.

**Response (example)**

```json
[
  { "score": 50, "user": { "_id": "665e...", "userName": "Jane Doe", "createdAt": 172..., "updatedAt": 172... } }
]
```

```bash
curl -X GET https://<your-deployment>.vercel.app/scores/bottom?limit=10 | jq
```

### POST `/scores/compare`

Compare a raw score against the top 10 scores. **Does not persist**.

**Body**

```json
{ "score": 300 }
```

**Responses**

- `200 OK` if accepted
- `409 Conflict` if rejected

```bash
curl -X POST https://<your-deployment>.vercel.app/scores/compare \
  -H "Content-Type: application/json" \
  -d '{"score": 300}' | jq
```

### POST `/scores/compare-bottom`

Compare a raw score against the bottom 10 scores. **Does not persist**.

**Body**

```json
{ "score": 300 }
```

**Responses**

- `200 OK` if accepted
- `409 Conflict` if rejected

```bash
curl -X POST https://<your-deployment>.vercel.app/scores/compare-bottom \
  -H "Content-Type: application/json" \
  -d '{"score": 300}' | jq
```

---

## Serverless notes (important)

- **Express on Vercel**: Files under `/api` become functions; export the Express app and let Vercel handle the server. Don’t call `app.listen()`. citeturn0search0turn0search3
- **Cold start readiness**: We use an async `ready` promise to **await `initDB()`** on first request.
- **MongoDB Node driver**: `serverSelectionTimeoutMS` defaults to **30000ms**; we set shorter timeouts to fail fast during testing. citeturn0search14turn0search4
- **Connection reuse**: Prefer a **singleton client** cached across invocations to avoid reconnect storms in serverless environments. (See `MongoDB.ts`.)

---

## Troubleshooting

### "Missing public directory" during deploy

Your project is configured like a static site. For an API-only app, clear **Build Command** and **Output Directory** (Project → Settings). citeturn0search1

### `MongoServerSelectionError` / `ReplicaSetNoPrimary` / timeouts

Usually network access to Atlas. Ensure Atlas Network Access allows your deployment to connect. For Vercel, allow **`0.0.0.0/0`** during testing (use strong creds), or adopt a fixed-egress solution for production. Also verify you use the **SRV** URI (`mongodb+srv://…`). citeturn0search2turn0search7

### Env variables not picked up

Set them in **Vercel → Project → Settings → Environment Variables** (correct environment), then redeploy.

### Seeing 406 on errors

We now return **500** for server errors. If you still see 406, ensure your routes aren’t catching and rethrowing as 406.

---

## Scripts

```json
{
  "dev": "vercel dev",
  "build": "echo \"No build step for Vercel Functions\"",
  "seed": "tsx src/scripts/seed.ts"
}
```

> Vercel builds TypeScript in `/api` automatically; a real `build` step isn’t required for this API-only project.

---

## License

MIT
