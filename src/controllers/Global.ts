import MongoDB from "../services/MongoDB";
import Users, { User } from "../services/Users";
import Scores from "../services/Scores";
import EVENTS from "../constants/events";
import type { Db } from "mongodb";

// Narrow message types to exactly the events this method can return
type AddUserResult =
  | { message: typeof EVENTS.USER_ALREADY_EXIST }
  | { message: typeof EVENTS.USER_CREATED; list: User[] };

type CheckScoreResult =
  | { message: typeof EVENTS.SCORED }
  | { message: typeof EVENTS.SCORE_REJECTED };

export default class Global {
  private mongoDB = new MongoDB();
  private users = new Users();
  private scores = new Scores();
  private db: Db | null = null;

  constructor() {
    // eslint-disable-next-line no-console
    console.log("Global Class Constructor");
    this.initDB = this.initDB.bind(this);
  }

  async initDB(): Promise<void> {
    try {
      const db = await this.mongoDB.connect();
      this.db = db;
      this.users.init(db);
      this.scores.init(db);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Global Controller - initDB initialisation failed !!!");
      throw e;
    }
  }

  async addUser(user: Omit<User, "_id">): Promise<AddUserResult> {
    const { email, score } = user;

    if (typeof score !== "number") {
      throw new Error("Invalid score");
    }

    const oldUser = await this.users.isUserAlreadyExist(email);
    if (oldUser) {
      return { message: EVENTS.USER_ALREADY_EXIST };
    }

    try {
      const list = await this.users.addUser(user);
      return { message: EVENTS.USER_CREATED, list };
    } catch {
      // eslint-disable-next-line no-console
      console.log("Global Controller - addUser failed !!!");
      throw new Error("Add user failed");
    }
  }

  async checkScore(score: number): Promise<CheckScoreResult> {
    try {
      const ok = await this.scores.checkScores(score);
      return { message: ok ? EVENTS.SCORED : EVENTS.SCORE_REJECTED };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Global Controller - checkScore failed !!!");
      throw e;
    }
  }
}
