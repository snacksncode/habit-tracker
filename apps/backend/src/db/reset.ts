import { db } from "./";
import { reset } from "drizzle-seed";
import * as schema from "./schema";

async function main() {
  await reset(db, schema);
}

if (Bun.main) main();
