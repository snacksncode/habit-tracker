import { Hono } from "hono";
import { db } from "./db";
import { usersTable, habitsTable, todosTable } from "./db/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

app.get("/", async (c) => {
  return c.json({ message: "Habit Tracker API!" });
});

app.get("/users", async (c) => {
  return c.json(
    await db
      .select({
        name: usersTable.id,
        email: usersTable.email,
        id: usersTable.id,
      })
      .from(usersTable)
  );
});

app.get("/users/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const user = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (user.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user[0]);
});

app.post("/users", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.name || !body.email) {
      return c.json({ error: "Name and email are required" }, 400);
    }

    const newUser = await db
      .insert(usersTable)
      .values({
        name: body.name,
        email: body.email,
        avatar_id: body.avatar_id || 1,
        health: body.health || 0,
        experience: body.experience || 0,
        level: body.level || 0,
      })
      .returning();

    return c.json(newUser[0], 201);
  } catch (error) {
    return c.json({ error: "Failed to create user" }, 500);
  }
});

app.put("/users/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (existingUser.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const updatedUser = await db
      .update(usersTable)
      .set({
        name: body.name !== undefined ? body.name : existingUser[0].name,
        email: body.email !== undefined ? body.email : existingUser[0].email,
        avatar_id:
          body.avatar_id !== undefined
            ? body.avatar_id
            : existingUser[0].avatar_id,
        health:
          body.health !== undefined ? body.health : existingUser[0].health,
        experience:
          body.experience !== undefined
            ? body.experience
            : existingUser[0].experience,
        level: body.level !== undefined ? body.level : existingUser[0].level,
      })
      .where(eq(usersTable.id, id))
      .returning();

    return c.json(updatedUser[0]);
  } catch (error) {
    return c.json({ error: "Failed to update user" }, 500);
  }
});

app.delete("/users/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));
    if (existingUser.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    await db.delete(usersTable).where(eq(usersTable.id, id));
    return c.json({ message: "User deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete user" }, 500);
  }
});

// HABITS endpoints
app.get("/habits/user/:user_id", async (c) => {
  const user_id = parseInt(c.req.param("user_id"));
  return c.json(
    await db.select().from(habitsTable).where(eq(habitsTable.user_id, user_id))
  );
});

app.get("/habits/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const habit = await db
    .select()
    .from(habitsTable)
    .where(eq(habitsTable.id, id));

  if (habit.length === 0) {
    return c.json({ error: "Habit not found" }, 404);
  }

  return c.json(habit[0]);
});

app.post("/habits", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.user_id || !body.name) {
      return c.json({ error: "User ID and name are required" }, 400);
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, body.user_id));
    if (user.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const newHabit = await db
      .insert(habitsTable)
      .values({
        user_id: body.user_id,
        name: body.name,
        completed: body.completed || 0,
        to_complete: body.to_complete || 1,
        status: body.status || 0,
        freq: body.freq || "DAILY",
      })
      .returning();

    return c.json(newHabit[0], 201);
  } catch (error) {
    return c.json({ error: "Failed to create habit" }, 500);
  }
});

app.put("/habits/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existingHabit = await db
      .select()
      .from(habitsTable)
      .where(eq(habitsTable.id, id));
    if (existingHabit.length === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }

    const updatedHabit = await db
      .update(habitsTable)
      .set({
        name: body.name !== undefined ? body.name : existingHabit[0].name,
        completed:
          body.completed !== undefined
            ? body.completed
            : existingHabit[0].completed,
        to_complete:
          body.to_complete !== undefined
            ? body.to_complete
            : existingHabit[0].to_complete,
        status:
          body.status !== undefined ? body.status : existingHabit[0].status,
        freq: body.freq !== undefined ? body.freq : existingHabit[0].freq,
      })
      .where(eq(habitsTable.id, id))
      .returning();

    return c.json(updatedHabit[0]);
  } catch (error) {
    return c.json({ error: "Failed to update habit" }, 500);
  }
});

app.delete("/habits/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existingHabit = await db
      .select()
      .from(habitsTable)
      .where(eq(habitsTable.id, id));
    if (existingHabit.length === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }

    await db.delete(habitsTable).where(eq(habitsTable.id, id));
    return c.json({ message: "Habit deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete habit" }, 500);
  }
});

app.get("/todos/user/:user_id", async (c) => {
  const user_id = parseInt(c.req.param("user_id"));
  return c.json(
    await db.select().from(todosTable).where(eq(todosTable.user_id, user_id))
  );
});

app.get("/todos/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const todo = await db.select().from(todosTable).where(eq(todosTable.id, id));

  if (todo.length === 0) {
    return c.json({ error: "Todo not found" }, 404);
  }

  return c.json(todo[0]);
});

app.post("/todos", async (c) => {
  try {
    const body = await c.req.json();
    if (!body.user_id || !body.name) {
      return c.json({ error: "User ID and name are required" }, 400);
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, body.user_id));
    if (user.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const newTodo = await db
      .insert(todosTable)
      .values({
        user_id: body.user_id,
        name: body.name,
        is_completed: body.is_completed || 0,
      })
      .returning();

    return c.json(newTodo[0], 201);
  } catch (error) {
    return c.json({ error: "Failed to create todo" }, 500);
  }
});

app.put("/todos/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    const existingTodo = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.id, id));
    if (existingTodo.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    const updatedTodo = await db
      .update(todosTable)
      .set({
        name: body.name !== undefined ? body.name : existingTodo[0].name,
        is_completed:
          body.is_completed !== undefined
            ? body.is_completed
            : existingTodo[0].is_completed,
      })
      .where(eq(todosTable.id, id))
      .returning();

    return c.json(updatedTodo[0]);
  } catch (error) {
    return c.json({ error: "Failed to update todo" }, 500);
  }
});

app.delete("/todos/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existingTodo = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.id, id));
    if (existingTodo.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    await db.delete(todosTable).where(eq(todosTable.id, id));
    return c.json({ message: "Todo deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete todo" }, 500);
  }
});

app.patch("/todos/:id/toggle", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const existingTodo = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.id, id));
    if (existingTodo.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    const newStatus = existingTodo[0].is_completed === 1 ? 0 : 1;

    const updatedTodo = await db
      .update(todosTable)
      .set({ is_completed: newStatus })
      .where(eq(todosTable.id, id))
      .returning();

    return c.json(updatedTodo[0]);
  } catch (error) {
    return c.json({ error: "Failed to changee todo status" }, 500);
  }
});

export default app;
