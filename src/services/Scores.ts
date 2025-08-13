import { Collection, Db, ObjectId } from "mongodb";

export interface Score {
  _id?: ObjectId;
  userId: ObjectId;
  value: number;
  createdAt?: number;
}

export default class Scores {
  private collection!: Collection<Score>;

  constructor() {
    // eslint-disable-next-line no-console
    console.log("Scores Class Constructor");
  }

  init(db: Db): void {
    // eslint-disable-next-line no-console
    console.log("Scores Class - init");
    this.collection = db.collection<Score>("scores");
  }

  async addScore(userId: ObjectId, value: number): Promise<Score> {
    const doc: Omit<Score, "_id"> = { userId, value, createdAt: Date.now() };
    const res = await this.collection.insertOne(doc);
    return { ...doc, _id: res.insertedId };
  }

  async getMinScore(): Promise<number | null> {
    const doc = await this.collection.find().sort({ value: 1 }).limit(1).next();
    return doc ? doc.value : null;
  }

  async getMaxScore(): Promise<number | null> {
    const doc = await this.collection
      .find()
      .sort({ value: -1 })
      .limit(1)
      .next();
    return doc ? doc.value : null;
  }

  async topScoreForUser(userId: ObjectId): Promise<number | null> {
    const doc = await this.collection
      .find({ userId })
      .sort({ value: -1 })
      .limit(1)
      .next();
    return doc ? doc.value : null;
  }

  async checkScores(score: number): Promise<boolean> {
    const min = await this.getMinScore();
    if (min === null) return true; // no scores yet -> accept
    return score > min;
  }
}
