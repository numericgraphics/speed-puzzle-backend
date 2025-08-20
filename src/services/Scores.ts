import { Collection, Db, ObjectId } from "mongodb";

export interface Score {
  _id?: ObjectId;
  userId: ObjectId;
  value: number;
  createdAt?: number;
}

export interface TopScoreWithUser {
  value: number;
  user: {
    _id: ObjectId;
    userName: string;
    createdAt?: number;
    updatedAt?: number;
  };
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

  async topWithUsers(limit = 10): Promise<TopScoreWithUser[]> {
    const pipeline = [
      { $sort: { value: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          value: 1,
          user: {
            _id: "$user._id",
            userName: "$user.userName",
            createdAt: "$user.createdAt",
            updatedAt: "$user.updatedAt",
          },
        },
      },
    ];

    const docs = await this.collection
      .aggregate<TopScoreWithUser>(pipeline)
      .toArray();
    return docs;
  }

  async bottomWithUsers(limit = 10): Promise<TopScoreWithUser[]> {
    const pipeline = [
      { $sort: { value: 1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          value: 1,
          user: {
            _id: "$user._id",
            userName: "$user.userName",
            createdAt: "$user.createdAt",
            updatedAt: "$user.updatedAt",
          },
        },
      },
    ];

    const docs = await this.collection
      .aggregate<TopScoreWithUser>(pipeline)
      .toArray();
    return docs;
  }

  async checkScores(score: number): Promise<boolean> {
    const min = await this.getMinScore();
    if (min === null) return true; // no scores yet -> accept
    return score > min;
  }
}
