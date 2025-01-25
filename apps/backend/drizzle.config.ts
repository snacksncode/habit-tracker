import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  driver: "durable-sqlite",
  dialect: "sqlite",
} satisfies Config;
