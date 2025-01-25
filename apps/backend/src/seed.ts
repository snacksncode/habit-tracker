import { usersTable } from "./db/schema";
import { db } from "./db";
import { seed, reset } from "drizzle-seed";

async function main() {
  await reset(db, { usersTable });
  await seed(db, { usersTable }, { count: 10 });
}

if (Bun.main) {
  main();
}
