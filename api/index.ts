// api/index.ts
import express from "express";
import "dotenv/config";
import Global from "../src/controllers/Global.ts";
import EVENTS from "../src/constants/events.ts";

const app = express();
app.use(express.json());

// --- Initialize DB on cold start and await before handling requests ---
const globalController = new Global();
const ready = (async () => {
  try {
    await globalController.initDB();
    console.log("SERVER - initDB - DONE");
  } catch (e) {
    console.error("SERVER - initDB - ERROR", e);
    throw e;
  }
})();

app.use(async (_req, _res, next) => {
  try {
    await ready; // wait for cold-start DB init once
    next();
  } catch (e) {
    next(e);
  }
});

// --- Debug route (remove once stable) ---
app.get("/__debug", async (_req, res) => {
  res.json({
    hasMongoURI: Boolean(process.env.MONGODB_URI),
    vercelEnv: process.env.VERCEL_ENV || null,
    nodeVersion: process.version,
  });
});

// --- Health/base route ---
app.get("/", async (_req, res) => {
  console.log("GET /");
  res.send("<h1>Hello world</h1>");
});

// --- Routes ---
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
      console.error("POST /score error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

app.post(
  "/adduser",
  async (
    req: express.Request<{}, {}, { userName: string; score?: number }>,
    res: express.Response
  ) => {
    try {
      const { userName, score } = req.body;
      const result = await globalController.addUser({ userName, score });
      if (result.message === EVENTS.USER_ALREADY_EXIST)
        return res.status(409).send("User Already Exist.");
      if (result.message === EVENTS.USER_CREATED)
        return res.status(200).json({ user: result.user, key: result.key });
      return res.send();
    } catch (e) {
      console.error("POST /adduser error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

app.post(
  "/login",
  async (
    req: express.Request<{}, {}, { userName: string; key: string }>,
    res: express.Response
  ) => {
    try {
      const { userName, key } = req.body;
      if (!userName || !key) {
        return res.status(400).json({ error: "userName and key are required" });
      }
      const result = await globalController.login(userName, key);
      if (result.message === EVENTS.LOGIN_FAILED) {
        return res.status(401).json({ error: "Invalid username or key" });
      }
      return res.status(200).json({ user: result.user });
    } catch (e) {
      console.error("POST /login error:", e);
      return res.status(500).json({ error: "Internal error" });
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
      console.error("POST /users/:userName/scores error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

app.get("/users", async (_req, res) => {
  try {
    const list = await globalController.listUsersPublic();
    return res.status(200).json(list);
  } catch (e) {
    console.error("GET /users error:", e);
    return res.status(500).json({ error: "Internal error" });
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
      const parsed = raw ? parseInt(String(raw), 10) : 10;
      const limit = Number.isFinite(parsed)
        ? Math.min(Math.max(parsed, 1), 50)
        : 10;
      const rows = await globalController.getTopScores(limit);
      return res.status(200).json(rows);
    } catch (e) {
      console.error("GET /scores/top error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

app.get("/scores/bottom", async (req, res) => {
  try {
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam
      ? Math.max(1, Math.min(50, parseInt(limitParam, 10)))
      : 10;
    const data = await globalController.getBottomScores(limit);
    return res.status(200).json({ limit, scores: data });
  } catch (e) {
    console.error("GET /scores/bottom error:", e);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.post(
  "/scores/compare",
  async (
    req: express.Request<{}, {}, { value: number }>,
    res: express.Response
  ) => {
    try {
      const { value } = req.body;
      if (typeof value !== "number") {
        return res.status(400).send("value must be a number");
      }
      const result = await globalController.compareScoreToTop10(value);
      return res.status(200).json(result);
    } catch (e) {
      console.error("POST /scores/compare error:", e);
      return res.status(500).json({ error: "Internal error" });
    }
  }
);

export default app;
