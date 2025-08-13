# speed-puzzle-backend

Backend API for the **Speed Puzzle** app.

- **Language**: TypeScript
- **Framework**: Express (Node.js)
- **Database**: MongoDB
- **Data model**
  - `users`: `{ _id, userName, password(hashed), createdAt, updatedAt }`
  - `scores`: `{ _id, userId (ref users._id), value, createdAt }`

---

## Tech stack

- Express (REST API)
- MongoDB Node.js driver
- TypeScript + `tsx` (watch/dev runner)
- `dotenv` for env vars
- `bcryptjs` for password hashing
- `@faker-js/faker` for seed data

---

## Project structure

```text
src/
  constants/events.ts
  controllers/Global.ts
  services/
    MongoDB.ts
    Users.ts
    Scores.ts
  index.ts
  scripts/
    seed.ts
```

> Note: The seeder populates 15 users with 1–3 scores each (200–500).

---

## Setup

1. **Install**

```bash
npm install
```

2. **Environment** — create a `.env` at the project root:

```bash
MONGODB_URI="mongodb://localhost:27017"
API_PORT=3000
```

3. **Run**

```bash
# dev (watch)
npm run dev

# prod
npm run build
npm start
```

4. **Seed demo data**

```bash
# inserts 15 users with 1–3 scores each (values 200–500)
npm run seed

# wipe & reseed
npm run seed -- --reset
```

---

## REST API

**Base URL:** `http://localhost:3000`

### GET `/`

Health check.

```
200 OK → "<h1>Hello world</h1>"
```

---

### POST `/adduser`

Create a user aligned with the mobile schema (optionally with an initial score).

**Body**

```json
{
  "userName": "Ada Lovelace",
  "password": "SeedUser#2025",
  "score": 420
}
```

**Responses**

- `200 OK` → array of users (public fields only)
- `409 Conflict` → "User Already Exist."

**cURL**

```bash
curl -s -X POST http://localhost:3000/adduser \
  -H 'content-type: application/json' \
  -d '{"userName":"Ada Lovelace","password":"SeedUser#2025","score":420}' | jq .
```

---

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

**cURL**

```bash
curl -s -X POST 'http://localhost:3000/users/Ada%20Lovelace/scores' \
  -H 'content-type: application/json' \
  -d '{"value":451}' | jq .
```

---

### POST `/score`

Check a raw score against the global minimum across all scores. **Does not persist**.

**Body**

```json
{ "score": 300 }
```

**Responses**

- `200 OK` if accepted
- `409 Conflict` if rejected

**cURL**

```bash
curl -i -X POST http://localhost:3000/score \
  -H 'content-type: application/json' \
  -d '{"score":300}'
```

---

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

**cURL**

```bash
curl -s http://localhost:3000/users | jq .
```

---

### GET `/scores/top?limit=10`

Top `limit` scores (default 10). Each item returns `{ score, user }`.

**Response (example)**

```json
[
  {
    "score": 497,
    "user": { "_id": "665e...", "userName": "Noah Smith", "createdAt": 172..., "updatedAt": 172... }
  }
]
```

**cURL**

```bash
curl -s 'http://localhost:3000/scores/top?limit=5' | jq .
```

---

## Notes

- Passwords are hashed with `bcryptjs` (10 rounds).
- Seeding uses Faker’s `person.fullName()` to generate human names.
- `tsx` provides fast TypeScript execution with watch mode for development.

---

## License

MIT
