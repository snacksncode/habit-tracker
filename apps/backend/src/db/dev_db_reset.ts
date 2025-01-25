import * as schema from "./schema";
import { db } from "./";
import { reset, seed } from "drizzle-seed";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await reset(db, schema);
  await seed(db, schema, { count: 10 });
}

if (Bun.main) main();
