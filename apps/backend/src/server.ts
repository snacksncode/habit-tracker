import { Hono } from "hono";
import { db } from "./db";
import { tasksTable, usersTable } from "./db/schema";
import { eq } from "drizzle-orm";

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

app.get("/users", async (c) => {
  return c.json(await db.select().from(usersTable));
});

app.get("/tasks/:user_id", async (c) => {
  const user_id = parseInt(c.req.param("user_id"));
  return c.json(
    await db.select().from(tasksTable).where(eq(tasksTable.user_id, user_id))
  );
});

export default app;
