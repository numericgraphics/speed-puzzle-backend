import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

// Seed settings
const DB_NAME = "speed-puzzle-db"; // same as backend
const URI = process.env.MONGODB_URI ?? "";
const NUM_USERS = 15;
const BCRYPT_ROUNDS = 10;
const PASSWORD_PLAIN = "Seed2025"; // shared demo password (8 chars, no spaces)

if (!URI) {
  throw new Error("Missing MONGODB_URI in environment");
}

// Types aligned with backend services
interface SeedUser {
  _id?: ObjectId;
  userName: string;
  password: string; // hashed
  email?: string;
  createdAt: number;
  updatedAt: number;
}

interface SeedScore {
  _id?: ObjectId;
  userId: ObjectId;
  value: number;
  createdAt: number;
}

function generateUsername(): string {
  // produce 4-9 chars, no spaces, alphanumeric
  const len = faker.number.int({ min: 4, max: 9 });
  const raw = faker.string.alphanumeric({ length: len }).toLowerCase();
  return raw;
}

function randScore(): number {
  // inclusive 200..500
  return faker.number.int({ min: 200, max: 500 });
}

async function ensureIndexes(client: MongoClient) {
  const db = client.db(DB_NAME);
  const users = db.collection<SeedUser>("users");
  const scores = db.collection<SeedScore>("scores");

  await users.createIndex(
    { userName: 1 },
    { unique: true, name: "users_userName_unique" }
  );
  await users.createIndex(
    { email: 1 },
    { sparse: true, name: "users_email_lookup" }
  );
  await scores.createIndex({ userId: 1 }, { name: "scores_userId_idx" });
  await scores.createIndex({ value: -1 }, { name: "scores_value_desc" });
}

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const usersCol = db.collection<SeedUser>("users");
  const scoresCol = db.collection<SeedScore>("scores");

  // Optional reset (clear both collections)
  const reset = process.argv.includes("--reset");

  if (reset) {
    console.log("Resetting database...");
    const delScores = await scoresCol.deleteMany({});
    const delUsers = await usersCol.deleteMany({});
    console.log(
      `Reset mode: removed ${delUsers.deletedCount} users and ${delScores.deletedCount} scores`
    );
  }

  // Make sure indexes exist
  await ensureIndexes(client);

  // Pre-hash shared password
  const hashed = await bcrypt.hash(PASSWORD_PLAIN, BCRYPT_ROUNDS);

  // Build unique, rule-compliant usernames
  const usedNames = new Set<string>();
  const userDocs: Omit<SeedUser, "_id">[] = [];

  const NUM_WITH_EMAIL = 3; // a few seeded users get a recovery email, for local testing

  while (userDocs.length < NUM_USERS) {
    const uname = generateUsername();
    if (usedNames.has(uname)) continue;
    usedNames.add(uname);

    const now = Date.now();
    userDocs.push({
      userName: uname, // 4-9 chars, no spaces
      password: hashed,
      ...(userDocs.length < NUM_WITH_EMAIL
        ? { email: `${uname}@example.com` }
        : {}),
      createdAt: now,
      updatedAt: now,
    });
  }

  const userInsert = await usersCol.insertMany(userDocs, { ordered: true });
  const insertedIds = Object.values(userInsert.insertedIds);

  // For each user, create 1–3 score documents in the 200–500 range
  const scoreDocs: Omit<SeedScore, "_id">[] = [];
  insertedIds.forEach((userId) => {
    const count = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < count; i++) {
      scoreDocs.push({ userId, value: randScore(), createdAt: Date.now() });
    }
  });

  if (scoreDocs.length) {
    await scoresCol.insertMany(scoreDocs, { ordered: false });
  }

  console.log(
    `Seed complete: inserted ${insertedIds.length} users and ${scoreDocs.length} scores.`
  );
  console.log(`Default password for all users: ${PASSWORD_PLAIN}`);

  await client.close();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
