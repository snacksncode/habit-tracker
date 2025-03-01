import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey(),
  avatar_id: integer("avatar_id").default(1),
  health: integer("health").notNull().default(0),
  experience: integer("experience").notNull().default(0),
  level: integer("level").notNull().default(0),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
});

export const habitsTable = sqliteTable("habits", {
  id: integer("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  name: text("name").notNull(),
  completed: integer("completed").notNull().default(0),
  to_complete: integer("to_complete").notNull().default(1),
  status: integer("status").notNull().default(0),
  freq: text("freq", { enum: ["DAILY", "WEEKLY", "MONTHLY"] })
    .notNull()
    .default("DAILY"),
});

export const todosTable = sqliteTable("todos", {
  id: integer("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  name: text("name").notNull(),
  date: text("date").notNull(),
  is_completed: integer("is_completed", { mode: "boolean" }).default(false),
});
