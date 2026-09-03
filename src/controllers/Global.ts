import MongoDB from "../services/MongoDB.ts";
import Users from "../services/Users.ts";
import type { User } from "../services/Users.ts";
import Scores from "../services/Scores.ts";
import EVENTS from "../constants/events.ts";
import type { Db, ObjectId } from "mongodb";

// Results using literal event types
type AddUserResult =
  | { message: typeof EVENTS.USER_ALREADY_EXIST }
  | { message: typeof EVENTS.USER_CREATED; list: User[] }
  | { message: typeof EVENTS.USER_RECOGNIZED; user: User };

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
      console.log("Global Controller - initDB initialisation successful");
      this.db = db;
      this.users.init(db);
      console.log("Global Controller - initDB users initialised");
      this.scores.init(db);
      console.log("Global Controller - initDB scores initialised");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Global Controller - initDB initialisation failed !!!");
      throw e;
    }
  }

  /**
   * Create a user aligned with the mobile schema: { userName }.
   * No real authentication — identity is device-local, like an arcade
   * high-score entry. `password` is accepted for backward compatibility
   * but is otherwise unused. `email` is an optional recognition/recovery
   * key: if it already belongs to an existing user, that user is
   * recognized instead of creating a duplicate.
   * Optionally seed an initial score in the scores collection.
   */
  async addUser(payload: {
    userName: string;
    password?: string;
    email?: string;
    score?: number;
  }): Promise<AddUserResult> {
    const { userName, password, email, score } = payload;

    if (!userName) {
      throw new Error("Invalid payload: userName is required");
    }

    if (email) {
      const recognized = await this.users.findByEmail(email);
      if (recognized) {
        if (typeof score === "number" && !Number.isNaN(score)) {
          await this.scores.addScore(recognized._id as ObjectId, score);
        }
        return { message: EVENTS.USER_RECOGNIZED, user: recognized };
      }
    }

    const exists = await this.users.findByUserName(userName);
    if (exists) {
      return { message: EVENTS.USER_ALREADY_EXIST };
    }

    try {
      const created = await this.users.addUser({ userName, password, email });

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
   * Look up an existing user by their recovery email, for the "recover my
   * player on a new device" flow. Returns the public shape (no password).
   */
  async findUserByEmail(
    email: string
  ): Promise<Pick<User, "_id" | "userName" | "createdAt" | "updatedAt"> | null> {
    const user = await this.users.findByEmail(email);
    if (!user) return null;
    const { _id, userName, createdAt, updatedAt } = user;
    return { _id, userName, createdAt, updatedAt };
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

  /**
   * Public list of users without sensitive fields (no password)
   */
  async listUsersPublic(): Promise<
    Array<Pick<User, "_id" | "userName" | "createdAt" | "updatedAt">>
  > {
    const list = await this.users.list();
    return list.map(({ _id, userName, createdAt, updatedAt }) => ({
      _id,
      userName,
      createdAt,
      updatedAt,
    }));
  }

  /**
   * Top N scores with their associated user
   */
  async getTopScores(limit = 10): Promise<
    Array<{
      score: number;
      user: {
        _id: any;
        userName: string;
        createdAt?: number;
        updatedAt?: number;
      };
    }>
  > {
    const rows = await this.scores.topWithUsers(limit);
    return rows.map((r) => ({ score: r.value, user: r.user }));
  }

  /* Compare a raw score against the current Top 10 threshold.
   * Returns whether it would be in the Top 10, the threshold score (10th best),
   * and how many scores currently exist in the Top 10 (could be < 10 on a fresh DB).
   */
  async compareScoreToTop10(value: number): Promise<{
    isTop10: boolean;
    threshold: number | null;
    top10Count: number;
  }> {
    const top = await this.getTopScores(10);
    const top10Count = top.length;
    const threshold =
      top10Count > 0 ? top[Math.min(top10Count, 10) - 1].score : null;

    // If there are fewer than 10 scores in DB, any score qualifies as Top 10 by definition.
    const isTop10 = top10Count < 10 ? true : value >= (threshold as number);

    return { isTop10, threshold, top10Count };
  }

  /**
   * Bottom N (smallest) scores with their associated user
   */
  async getBottomScores(limit = 10): Promise<
    Array<{
      score: number;
      user: {
        _id: any;
        userName: string;
        createdAt?: number;
        updatedAt?: number;
      };
    }>
  > {
    const rows = await this.scores.bottomWithUsers(limit);
    return rows.map((r) => ({ score: r.value, user: r.user }));
  }

  /**
   * Compare a raw score against the 10 smallest scores in the DB.
   * Returns whether it would be among the 10 lowest, the highest value among the bottom 10 (i.e., the *threshold*),
   * and how many scores are in that bottom list (can be <10 on a fresh DB).
   */
  async compareScoreToBottom10(value: number): Promise<{
    isBottom10: boolean;
    threshold: number | null;
    bottom10Count: number;
  }> {
    const bottom = await this.getBottomScores(10);
    console.log("Bottom 10 scores:", bottom);
    const bottom10Count = bottom.length;
    const threshold =
      bottom10Count > 0 ? bottom[Math.min(bottom10Count, 10) - 1].score : null;

    // If fewer than 10 scores exist, any score is considered among the 10 lowest
    const isBottom10 =
      bottom10Count < 10 ? true : value <= (threshold as number);

    return { isBottom10, threshold, bottom10Count };
  }
}
