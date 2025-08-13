import express, { Request, Response } from "express";
import http from "http";
import "dotenv/config";
import Global from "./controllers/Global";
import EVENTS from "./constants/events";

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
  res.send("<h1>Hello world</h1>");
});

// --- Score check endpoint (schema-agnostic): checks against global min, does not persist ---
app.post(
  "/score",
  async (req: Request<{}, {}, { score: number }>, res: Response) => {
    try {
      const { score } = req.body;
      const result = await globalController.checkScore(score);
      if (result.message === EVENTS.SCORED) {
        return res.status(200).send();
      }
      return res.status(409).send();
    } catch (e) {
      return res.status(406).send(e);
    }
  }
);

// --- Create user aligned with mobile schema: { userName, password, score? } ---
app.post(
  "/adduser",
  async (
    req: Request<
      {},
      {},
      { userName: string; password: string; score?: number }
    >,
    res: Response
  ) => {
    try {
      const { userName, password, score } = req.body;
      const result = await globalController.addUser({
        userName,
        password,
        score,
      });

      if (result.message === EVENTS.USER_ALREADY_EXIST) {
        return res.status(409).send("User Already Exist.");
      }
      if (result.message === EVENTS.USER_CREATED) {
        return res.status(200).json(result.list);
      }
      return res.send();
    } catch (e) {
      console.log("index - response 406");
      return res.status(406).send(e);
    }
  }
);

// --- Add a score for a specific user ---
app.post(
  "/users/:userName/scores",
  async (
    req: Request<{ userName: string }, {}, { value: number }>,
    res: Response
  ) => {
    try {
      const { userName } = req.params;
      const { value } = req.body;

      if (typeof value !== "number") {
        return res.status(400).send("value must be a number");
      }

      const result = await globalController.addScoreForUser(userName, value);
      if (result.message === EVENTS.SCORED && result.created) {
        return res.status(201).json({ userId: result.userId, value });
      }
      return res.status(409).send();
    } catch (e) {
      return res.status(406).send(e);
    }
  }
);

server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
