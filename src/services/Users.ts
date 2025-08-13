import bcrypt from "bcryptjs";
import { Collection, Db, ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  userName: string; // align with mobile schema
  password: string; // hashed
  createdAt?: number;
  updatedAt?: number;
}

export default class Users {
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

  async findByUserName(userName: string): Promise<User | null> {
    return this.collection.findOne({ userName });
  }

  async addUser(user: Omit<User, "_id">): Promise<User> {
    const now = Date.now();
    const hashed = await bcrypt.hash(user.password, 10);
    const doc: Omit<User, "_id"> = {
      ...user,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    };

    const res = await this.collection.insertOne(doc);
    return { ...doc, _id: res.insertedId };
  }

  async list(): Promise<User[]> {
    return this.collection.find().toArray();
  }

  async deleteById(id: ObjectId): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }
}
