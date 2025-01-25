import { Hono } from "hono";
import { db } from "./db";
import { usersTable } from "./db/schema";

const app = new Hono();

app.get("/", async (c) => {
  return c.json({ hello: "world" });
});

app.get("/users", async (c) => {
  return c.json(
    await db
      .select({ name: usersTable.id, email: usersTable.email })
      .from(usersTable)
  );
});
