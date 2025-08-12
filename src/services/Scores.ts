import { Collection, Db } from "mongodb";
import { getCollectionPropertyValue } from "../utils/array";
import type { User } from "./Users";

export default class Scores {
  private collection!: Collection<User>;

  constructor() {
    // eslint-disable-next-line no-console
    console.log("Scores Class Constructor");
  }

  init(db: Db): void {
    // eslint-disable-next-line no-console
    console.log("Scores Class - init");
    this.collection = db.collection<User>("users");
  }

  async getSmallerScores(): Promise<number> {
    const collection = await this.collection.find().toArray();
    const scores = getCollectionPropertyValue(collection, "score") as number[];
    return Math.min(...scores);
  }

  async getHigherScores(): Promise<number> {
    const collection = await this.collection.find().toArray();
    const scores = getCollectionPropertyValue(collection, "score") as number[];
    return Math.max(...scores);
  }

  async checkScores(score: number): Promise<boolean> {
    try {
      const collection = await this.collection.find().toArray();
      const scores = getCollectionPropertyValue(
        collection,
        "score"
      ) as number[];

      // eslint-disable-next-line no-console
      console.log("User score --> ", score);
      // eslint-disable-next-line no-console
      console.log("-- checkScores - collection User --------------");
      // eslint-disable-next-line no-console
      console.log("length", collection.length);
      // eslint-disable-next-line no-console
      console.log("min", Math.min(...scores));
      // eslint-disable-next-line no-console
      console.log("max", Math.max(...scores));
      // eslint-disable-next-line no-console
      console.log("---------------------------");

      return score > Math.min(...scores);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("checkScores - ERROR", error);
      throw error;
    }
  }
}
