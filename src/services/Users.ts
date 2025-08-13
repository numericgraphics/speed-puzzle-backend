import bcrypt from "bcryptjs";
import { Collection, Db, ObjectId } from "mongodb";
import { getCollectionPropertyValue } from "../utils/array";

export interface User {
  _id?: ObjectId;
  username: string;
  score: number;
  email: string;
  password: string; // hashed when stored
}

export default class Users {
  // will be set in init()
  private collection!: Collection<User>;

  constructor() {
    // eslint-disable-next-line no-console
    console.log("Users Class Constructor");
  }

  init(db: Db): void {
    // eslint-disable-next-line no-console
    console.log("Users Class - init");
    this.collection = db.collection<User>("users");
  }

  async isUserAlreadyExist(email: string): Promise<User | null> {
    return this.collection.findOne({ email });
  }

  async addUser(user: Omit<User, "_id">): Promise<User[]> {
    // limit the base at 10 items by removing the smaller score
    const collectionCount = await this.collection.countDocuments({});
    if (collectionCount >= 10) {
      // eslint-disable-next-line no-console
      console.log("User - addUser - delete user");
      const all = await this.collection.find().toArray();
      const scores = getCollectionPropertyValue(all, "score");
      const minScore = Math.min(...scores);
      await this.collection.deleteOne({ score: minScore });
    }

    // encrypt user password
    const hashed = await bcrypt.hash(user.password, 10);

    // insert the new user with encrypted password and send back final list
    await this.collection.insertOne({ ...user, password: hashed });
    return this.collection.find().toArray();
  }

  async getUser(query: Partial<User>): Promise<User | null> {
    try {
      const found = await this.collection.findOne(query);
      // eslint-disable-next-line no-console
      console.log("Users - getUser", found);
      return found;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Users - getUser failed !!!", e);
      throw e;
    }
  }

  async deleteUser(query: Partial<User> = { score: 123 }): Promise<void> {
    try {
      const result = await this.collection.deleteOne(query);
      // eslint-disable-next-line no-console
      console.log("Users - deleteUser done", result);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Users - deleteUser failed !!!", e);
      throw e;
    }
  }
}
