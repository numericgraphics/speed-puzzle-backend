import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Collection, Db, ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId;
  userName: string; // align with mobile schema
  keyHash: string; // bcrypt hash of the generated recovery key — device-local identity, not real auth
  createdAt?: number;
  updatedAt?: number;
}

// Unambiguous alphabet: no 0/O/1/I/l, all uppercase for easy transcription.
const KEY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const KEY_LENGTH = 12;
const BCRYPT_ROUNDS = 10;

export function generateRecoveryKey(): string {
  const bytes = crypto.randomBytes(KEY_LENGTH);
  let key = "";
  for (let i = 0; i < KEY_LENGTH; i++) {
    key += KEY_ALPHABET[bytes[i] % KEY_ALPHABET.length];
  }
  return key;
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
    this.collection
      .createIndex(
        { userName: 1 },
        { unique: true, name: "users_userName_unique" }
      )
      .catch((e) => console.error("Users Class - userName index failed", e));
  }

  async findByUserName(userName: string): Promise<User | null> {
    return this.collection.findOne({ userName });
  }

  /**
   * Create a user with a freshly generated recovery key. The plaintext key
   * is returned once and never stored — only its bcrypt hash is persisted.
   */
  async addUser(
    userName: string
  ): Promise<{ user: User; key: string }> {
    const key = generateRecoveryKey();
    const keyHash = await bcrypt.hash(key, BCRYPT_ROUNDS);
    const now = Date.now();
    const doc: Omit<User, "_id"> = {
      userName,
      keyHash,
      createdAt: now,
      updatedAt: now,
    };

    const res = await this.collection.insertOne(doc);
    return { user: { ...doc, _id: res.insertedId }, key };
  }

  /**
   * Verify a username + recovery key pair. Returns the user on match, null
   * otherwise — deliberately the same result whether the username doesn't
   * exist or the key is wrong, to avoid leaking which usernames are taken.
   */
  async verifyKey(userName: string, key: string): Promise<User | null> {
    const user = await this.findByUserName(userName);
    if (!user) return null;
    const matches = await bcrypt.compare(key, user.keyHash);
    return matches ? user : null;
  }

  async list(): Promise<User[]> {
    return this.collection.find().toArray();
  }

  async deleteById(id: ObjectId): Promise<void> {
    await this.collection.deleteOne({ _id: id });
  }
}
