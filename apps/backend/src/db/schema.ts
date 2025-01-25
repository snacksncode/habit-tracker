import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
});

export const tasksTable = sqliteTable("tasks", {
  id: integer("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => usersTable.id, {
      onDelete: "cascade",
    }),
  text: text("text"),
  status: integer("status").default(0),
});

export const subtasksTable = sqliteTable("substasks", {
  id: integer("id").primaryKey(),
  task_id: integer("task_id")
    .notNull()
    .references(() => tasksTable.id, {
      onDelete: "cascade",
    }),
  text: text("text"),
  status: integer("status").default(0),
});

export const habitsTable = sqliteTable("habits", {
  id: integer("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => usersTable.id, {
      onDelete: "cascade",
    }),
  text: text("text"),
  status: integer("status").default(0),
});
