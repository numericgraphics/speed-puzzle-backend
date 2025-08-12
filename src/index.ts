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

type ScoreRequestBody = { score: number };
app.post(
  "/score",
  async (req: Request<{}, {}, ScoreRequestBody>, res: Response) => {
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

type AddUserRequestBody = {
  username: string;
  score: number;
  email: string;
  password: string;
};
app.post(
  "/adduser",
  async (req: Request<{}, {}, AddUserRequestBody>, res: Response) => {
    try {
      const { username, score, email, password } = req.body;
      const result = await globalController.addUser({
        username,
        score,
        email,
        password,
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

server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
