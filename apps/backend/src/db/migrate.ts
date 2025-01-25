import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./";

async function main() {
  await migrate(db, { migrationsFolder: "./drizzle" });
}

if (Bun.main) main();
