// src/index.ts
import express from "express";
import http from "http";
import "dotenv/config";
import Global from "./controllers/Global.ts";
import EVENTS from "./constants/events.ts";

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.API_PORT) || 3000;

const globalController = new Global();
globalController
  .initDB()
  .then(() => console.log("SERVER - initDB - DONE"))
  .catch((e) => console.log("SERVER - initDB - ERROR", e));

app.use(express.json());

app.get("/", (_req, res) => {
  console.log("GET /");
  res.send("<h1>Hello world</h1>");
});

app.post(
  "/score",
  async (
    req: express.Request<{}, {}, { score: number }>,
    res: express.Response
  ) => {
    try {
      const { score } = req.body;
      const result = await globalController.checkScore(score);
      return result.message === EVENTS.SCORED
        ? res.status(200).send()
        : res.status(409).send();
    } catch (e) {
      return res.status(406).send(e);
    }
  }
);

app.post(
  "/adduser",
  async (
    req: express.Request<
      {},
      {},
      { userName: string; password: string; score?: number }
    >,
    res: express.Response
  ) => {
    try {
      const { userName, password, score } = req.body;
      const result = await globalController.addUser({
        userName,
        password,
        score,
      });
      if (result.message === EVENTS.USER_ALREADY_EXIST)
        return res.status(409).send("User Already Exist.");
      if (result.message === EVENTS.USER_CREATED)
        return res.status(200).json(result.list);
      return res.send();
    } catch (e) {
      return res.status(406).send(e);
    }
  }
);

app.post(
  "/users/:userName/scores",
  async (
    req: express.Request<{ userName: string }, {}, { value: number }>,
    res: express.Response
  ) => {
    try {
      const { userName } = req.params;
      const { value } = req.body;
      if (typeof value !== "number")
        return res.status(400).send("value must be a number");
      const result = await globalController.addScoreForUser(userName, value);
      return result.message === EVENTS.SCORED && result.created
        ? res.status(201).json({ userId: result.userId, value })
        : res.status(409).send();
    } catch (e) {
      return res.status(406).send(e);
    }
  }
);

app.get("/users", async (_req, res) => {
  try {
    const list = await globalController.listUsersPublic();
    return res.status(200).json(list);
  } catch (e) {
    return res.status(406).send(e);
  }
});

app.get(
  "/scores/top",
  async (
    req: express.Request<{}, {}, {}, { limit?: string }>,
    res: express.Response
  ) => {
    try {
      const raw = req.query.limit;
      const parsed = raw ? parseInt(raw, 10) : 10;
      const limit = Number.isFinite(parsed)
        ? Math.min(Math.max(parsed, 1), 50)
        : 10;
      const rows = await globalController.getTopScores(limit);
      return res.status(200).json(rows);
    } catch (e) {
      return res.status(406).send(e);
    }
  }
);

// ❗ run the HTTP listener only when NOT on Vercel
// if (!process.env.VERCEL_ENV) {
//   console.log(`Listening on port ${PORT}`);
server.listen(PORT, () => console.log(`Listening on ${PORT}`));
// }

// ✅ expose the Express app for Vercel's /api entry
export default app;
