import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import { generateRecoveryKey } from "../services/Users.ts";

// Seed settings
const DB_NAME = "speed-puzzle-db"; // same as backend
const URI = process.env.MONGODB_URI ?? "";
const NUM_USERS = 10;
const BCRYPT_ROUNDS = 10;

if (!URI) {
  throw new Error("Missing MONGODB_URI in environment");
}

// Types aligned with backend services
interface SeedUser {
  _id?: ObjectId;
  userName: string;
  keyHash: string;
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
  return faker.string.alphanumeric({ length: len }).toLowerCase();
}

// Easy to beat: low scores so a first-time player's real game score
// (typically several hundred+) lands in the top 10 without trying hard.
function randScore(): number {
  return faker.number.int({ min: 10, max: 80 });
}

async function ensureIndexes(client: MongoClient) {
  const db = client.db(DB_NAME);
  const users = db.collection<SeedUser>("users");
  const scores = db.collection<SeedScore>("scores");

  await users.createIndex(
    { userName: 1 },
    { unique: true, name: "users_userName_unique" }
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

  // Cleanup: always start from an empty slate — this seeder is meant to
  // fully replace whatever demo/stale data (old email/password schema
  // included) is sitting in the DB, not layer on top of it.
  console.log("Cleaning up existing users and scores...");
  const delScores = await scoresCol.deleteMany({});
  const delUsers = await usersCol.deleteMany({});
  console.log(
    `Removed ${delUsers.deletedCount} users and ${delScores.deletedCount} scores`
  );

  // Drop legacy indexes from the old schema (email lookup, non-unique
  // userName) if present, then recreate the current ones.
  await usersCol.dropIndex("users_email_lookup").catch(() => {});
  await ensureIndexes(client);

  // Build unique, rule-compliant usernames, each with its own generated key.
  const usedNames = new Set<string>();
  const userDocs: Omit<SeedUser, "_id">[] = [];
  const printableKeys: { userName: string; key: string }[] = [];

  while (userDocs.length < NUM_USERS) {
    const uname = generateUsername();
    if (usedNames.has(uname)) continue;
    usedNames.add(uname);

    const key = generateRecoveryKey();
    const keyHash = await bcrypt.hash(key, BCRYPT_ROUNDS);
    printableKeys.push({ userName: uname, key });

    const now = Date.now();
    userDocs.push({
      userName: uname,
      keyHash,
      createdAt: now,
      updatedAt: now,
    });
  }

  const userInsert = await usersCol.insertMany(userDocs, { ordered: true });
  const insertedIds = Object.values(userInsert.insertedIds);

  // One easy-to-beat score per user.
  const scoreDocs: Omit<SeedScore, "_id">[] = insertedIds.map((userId) => ({
    userId,
    value: randScore(),
    createdAt: Date.now(),
  }));

  if (scoreDocs.length) {
    await scoresCol.insertMany(scoreDocs, { ordered: false });
  }

  console.log(
    `Seed complete: inserted ${insertedIds.length} users and ${scoreDocs.length} scores.`
  );
  console.log("Seeded recovery keys (dev/testing only):");
  printableKeys.forEach(({ userName, key }) =>
    console.log(`  ${userName} -> ${key}`)
  );

  await client.close();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
