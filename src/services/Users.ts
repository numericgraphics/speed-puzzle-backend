import bcrypt from "bcryptjs";
import { Collection, Db, ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  userName: string; // align with mobile schema
  password?: string; // hashed, optional: the game uses device-local identity, not real auth
  email?: string; // optional recognition/recovery key, not used for login
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
    // Sparse (most users have no email) and non-unique by design — email is
    // a secondary lookup key layered on top of the real identity (_id /
    // userName), not a hard constraint. Idempotent, safe on every cold start.
    this.collection
      .createIndex({ email: 1 }, { sparse: true, name: "users_email_lookup" })
      .catch((e) => console.error("Users Class - email index failed", e));
  }

  async findByUserName(userName: string): Promise<User | null> {
    return this.collection.findOne({ userName });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.collection.findOne({ email });
  }

  async addUser(user: Omit<User, "_id">): Promise<User> {
    const now = Date.now();
    const doc: Omit<User, "_id"> = {
      ...user,
      createdAt: now,
      updatedAt: now,
    };
    if (user.password) {
      doc.password = await bcrypt.hash(user.password, 10);
    } else {
      delete doc.password;
    }

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
