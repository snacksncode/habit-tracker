import * as schema from "./db/schema";
import { db } from "./db";
import { reset, seed } from "drizzle-seed";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await reset(db, schema);
  await seed(db, schema, { count: 10 });
}

if (Bun.main) main();
