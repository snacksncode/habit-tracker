import { db } from "./db";
import { reset } from "drizzle-seed";
import * as schema from "./db/schema";

async function main() {
  await reset(db, schema);
}

if (Bun.main) main();
