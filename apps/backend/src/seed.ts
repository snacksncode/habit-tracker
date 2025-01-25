import * as schema from "./db/schema";
import { db } from "./db";
import { seed } from "drizzle-seed";

async function main() {
  await seed(db, schema, { count: 10 });
}

if (Bun.main) main();
