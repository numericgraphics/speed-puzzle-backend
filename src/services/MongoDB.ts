import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI ?? "";
if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable");
}

export default class MongoDB {
  private client: MongoClient;

  constructor() {
    // eslint-disable-next-line no-console
    console.log("MongoDB Class - Constructor");
    this.client = new MongoClient(uri);
  }

  async connect(): Promise<Db> {
    try {
      await this.client.connect();
      return this.client.db("speed-puzzle-db");
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("MongoDB Class - connect - ERROR", e);
      throw e;
    }
  }
}
