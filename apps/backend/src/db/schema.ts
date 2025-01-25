import { sql } from "drizzle-orm";
import { check, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    age: integer().notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
  },
  (table) => [
    {
      checkConstraint: check("age_check1", sql`${table.age} > 21`),
    },
  ]
);
