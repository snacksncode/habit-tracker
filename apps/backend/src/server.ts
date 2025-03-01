import { Hono } from "hono";
import { db } from "./db";
import { usersTable, habitsTable, todosTable } from "./db/schema";
import { cors } from "hono/cors";
import { eq, and } from "drizzle-orm";

interface User {
  id: number;
  name: string;
  email: string;
}

type CustomContext = {
  Variables: {
    user: User;
  };
};

const app = new Hono<CustomContext>();

app.use("*", cors());

const tokenStore = new Map<string, User>();

function generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

const authMiddleware = async (c: any, next: any) => {
  const token = c.req.header("TOKEN");

  if (!token || !tokenStore.has(token)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", tokenStore.get(token));

  await next();
};

app.get("/", async (c) => {
  return c.json({ message: "Habit Tracker API!" });
});

app.post("/register", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.name || !body.email || !body.password) {
      return c.json({ error: "Name, email, and password are required" }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    if (body.password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, body.email));

    if (existingUser.length > 0) {
      return c.json({ error: "Email already registered" }, 400);
    }

    const newUser = await db
      .insert(usersTable)
      .values({
        name: body.name,
        email: body.email,
        password: body.password,
        avatar_id: body.avatar_id || 1,
        health: body.health || 0,
        experience: body.experience || 0,
        level: body.level || 0,
      })
      .returning();

    return c.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser[0].id,
          name: newUser[0].name,
          email: newUser[0].email,
        },
      },
      201
    );
  } catch (error) {
    return c.json({ error: "Failed to register user" }, 500);
  }
});

app.post("/login", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.email || !body.password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, body.email))
      .limit(1);

    if (user.length === 0 || user[0].password !== body.password) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = generateToken();

    tokenStore.set(token, {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
    });

    return c.json({
      message: "Login successful",
      token,
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
      },
    });
  } catch (error) {
    return c.json({ error: "Failed to login" }, 500);
  }
});

app.post("/logout", authMiddleware, async (c) => {
  const token = c.req.header("TOKEN");
  if (token) {
    tokenStore.delete(token);
  }
  return c.json({ message: "Logged out successfully" });
});

app.get("/users", authMiddleware, async (c) => {
  return c.json(
    await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(usersTable)
  );
});

app.get("/users/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const currentUser = c.get("user");

  if (currentUser.id !== id) {
    return c.json({ error: "Access denied" }, 403);
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, id));

  if (user.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  const { password, ...userWithoutPassword } = user[0];
  return c.json(userWithoutPassword);
});

app.put("/users/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");

    if (currentUser.id !== id) {
      return c.json({ error: "Access denied" }, 403);
    }

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

    const { password, ...userWithoutPassword } = updatedUser[0];
    return c.json(userWithoutPassword);
  } catch (error) {
    return c.json({ error: "Failed to update user" }, 500);
  }
});

app.delete("/users/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");

    if (currentUser.id !== id) {
      return c.json({ error: "Access denied" }, 403);
    }

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

app.get("/habits", authMiddleware, async (c) => {
  const currentUser = c.get("user");

  return c.json(
    await db
      .select()
      .from(habitsTable)
      .where(eq(habitsTable.user_id, currentUser.id))
  );
});

app.get("/habits/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const currentUser = c.get("user");

  const habit = await db
    .select()
    .from(habitsTable)
    .where(
      and(eq(habitsTable.id, id), eq(habitsTable.user_id, currentUser.id))
    );

  if (habit.length === 0) {
    return c.json({ error: "Habit not found" }, 404);
  }

  return c.json(habit[0]);
});

app.post("/habits", authMiddleware, async (c) => {
  await new Promise((res) => setTimeout(res, 1000));

  try {
    const body = await c.req.json();
    const currentUser = c.get("user");

    if (!body.name || !body.freq) {
      return c.json({ error: "Name and freq required" }, 400);
    }

    const newHabit = await db
      .insert(habitsTable)
      .values({
        user_id: currentUser.id,
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

app.put("/habits/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");
    const body = await c.req.json();

    const existingHabit = await db
      .select()
      .from(habitsTable)
      .where(
        and(eq(habitsTable.id, id), eq(habitsTable.user_id, currentUser.id))
      );

    if (existingHabit.length === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }

    const new_completed = body.completed ?? existingHabit[0].completed;

    const updatedHabit = await db
      .update(habitsTable)
      .set({
        name: body.name !== undefined ? body.name : existingHabit[0].name,
        completed:
          new_completed > body.to_complete ? body.to_complete : new_completed,
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

app.delete("/habits/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");

    const existingHabit = await db
      .select()
      .from(habitsTable)
      .where(
        and(eq(habitsTable.id, id), eq(habitsTable.user_id, currentUser.id))
      );

    if (existingHabit.length === 0) {
      return c.json({ error: "Habit not found" }, 404);
    }

    await db.delete(habitsTable).where(eq(habitsTable.id, id));
    return c.json({ message: "Habit deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete habit" }, 500);
  }
});
app.get("/todos", authMiddleware, async (c) => {
  const currentUser = c.get("user");

  return c.json(
    await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.user_id, currentUser.id))
  );
});

app.get("/todos/:id", authMiddleware, async (c) => {
  const id = parseInt(c.req.param("id"));
  const currentUser = c.get("user");

  const todo = await db
    .select()
    .from(todosTable)
    .where(and(eq(todosTable.id, id), eq(todosTable.user_id, currentUser.id)));

  if (todo.length === 0) {
    return c.json({ error: "Todo not found" }, 404);
  }

  return c.json(todo[0]);
});

app.post("/todos", authMiddleware, async (c) => {
  await new Promise((res) => setTimeout(res, 1000));
  try {
    const body = await c.req.json();
    const currentUser = c.get("user");

    if (!body.name || !body.date) {
      return c.json({ error: "Name and date required" }, 400);
    }

    const newTodo = await db
      .insert(todosTable)
      .values({
        user_id: currentUser.id,
        date: body.date,
        name: body.name,
        is_completed: false,
      })
      .returning();

    return c.json(newTodo[0], 201);
  } catch (error) {
    return c.json({ error: "Failed to create todo" }, 500);
  }
});

app.put("/todos/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");
    const body = await c.req.json();

    const existingTodo = await db
      .select()
      .from(todosTable)
      .where(
        and(eq(todosTable.id, id), eq(todosTable.user_id, currentUser.id))
      );

    if (existingTodo.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    const updatedTodo = await db
      .update(todosTable)
      .set({
        name: body.name !== undefined ? body.name : existingTodo[0].name,
        date: body.date !== undefined ? body.date : existingTodo[0].date,
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

app.delete("/todos/:id", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");

    const existingTodo = await db
      .select()
      .from(todosTable)
      .where(
        and(eq(todosTable.id, id), eq(todosTable.user_id, currentUser.id))
      );

    if (existingTodo.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    await db.delete(todosTable).where(eq(todosTable.id, id));
    return c.json({ message: "Todo deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete todo" }, 500);
  }
});

app.patch("/todos/:id/toggle", authMiddleware, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const currentUser = c.get("user");

    const existingTodo = await db
      .select()
      .from(todosTable)
      .where(
        and(eq(todosTable.id, id), eq(todosTable.user_id, currentUser.id))
      );

    if (existingTodo.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    const newStatus = existingTodo[0].is_completed === true ? false : true;

    const updatedTodo = await db
      .update(todosTable)
      .set({ is_completed: newStatus })
      .where(eq(todosTable.id, id))
      .returning();

    return c.json(updatedTodo[0]);
  } catch (error) {
    return c.json({ error: "Failed to change todo status" }, 500);
  }
});

export default {
  port: 4000,
  fetch: app.fetch,
};
