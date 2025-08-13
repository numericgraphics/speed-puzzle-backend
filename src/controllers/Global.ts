import MongoDB from "../services/MongoDB";
import Users, { User } from "../services/Users";
import Scores from "../services/Scores";
import EVENTS from "../constants/events";
import type { Db, ObjectId } from "mongodb";

// Results using literal event types
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

  /**
   * Create a user aligned with the mobile schema: { userName, password }
   * Optionally seed an initial score in the scores collection.
   */
  async addUser(payload: {
    userName: string;
    password: string;
    score?: number;
  }): Promise<AddUserResult> {
    const { userName, password, score } = payload;

    if (!userName || !password) {
      throw new Error("Invalid payload: userName and password are required");
    }

    const exists = await this.users.findByUserName(userName);
    if (exists) {
      return { message: EVENTS.USER_ALREADY_EXIST };
    }

    try {
      const created = await this.users.addUser({ userName, password });

      // create an initial score if provided
      if (typeof score === "number" && !Number.isNaN(score)) {
        await this.scores.addScore(created._id as ObjectId, score);
      }

      const list = await this.users.list();
      return { message: EVENTS.USER_CREATED, list };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Global Controller - addUser failed !!!");
      throw new Error("Add user failed");
    }
  }

  /**
   * Check a raw score against the global minimum across the scores collection.
   * Does not store the score.
   */
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

  /**
   * Add a score to a given user by userName.
   */
  async addScoreForUser(
    userName: string,
    value: number
  ): Promise<{ userId?: ObjectId; created?: boolean } & CheckScoreResult> {
    const user = await this.users.findByUserName(userName);
    if (!user || !user._id) {
      return { message: EVENTS.SCORE_REJECTED };
    }

    // optional: enforce same acceptance rule as checkScore
    const acceptable = await this.scores.checkScores(value);
    if (!acceptable) {
      return {
        userId: user._id,
        created: false,
        message: EVENTS.SCORE_REJECTED,
      };
    }

    await this.scores.addScore(user._id, value);
    return { userId: user._id, created: true, message: EVENTS.SCORED };
  }
}
