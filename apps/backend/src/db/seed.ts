import { db } from "./";
import { usersTable, habitsTable, todosTable } from "./schema";

async function main() {
  console.log("🌱 Seeding database...");

  const users = [
    {
      id: 1,
      avatar_id: 3,
      health: 75,
      experience: 1250,
      level: 5,
      name: "Test User 1",
      email: "tester1@example.com",
      password: "test1234",
    },
    {
      id: 2,
      avatar_id: 7,
      health: 90,
      experience: 3400,
      level: 12,
      name: "Test User 2",
      email: "tester2@example.com",
      password: "test1234",
    },
  ];

  const habitOptions = [
    { name: "Drink water", freq: "DAILY" },
    { name: "Exercise", freq: "WEEKLY" },
    { name: "Read a book", freq: "DAILY" },
    { name: "Meditate", freq: "DAILY" },
    { name: "Journal", freq: "DAILY" },
    { name: "Practice language", freq: "WEEKLY" },
    { name: "Take vitamins", freq: "DAILY" },
    { name: "Call family", freq: "WEEKLY" },
    { name: "Stretch", freq: "DAILY" },
    { name: "Walk 10k steps", freq: "DAILY" },
    { name: "Coding practice", freq: "WEEKLY" },
    { name: "No social media", freq: "DAILY" },
    { name: "Eat vegetables", freq: "DAILY" },
    { name: "Sleep 8 hours", freq: "DAILY" },
    { name: "Clean home", freq: "WEEKLY" },
  ];

  const todoOptions = [
    { name: "Buy groceries", date: "2025-02-25" },
    { name: "Finish project", date: "2025-03-05" },
    { name: "Call doctor", date: "2025-02-27" },
    { name: "Schedule meeting", date: "2025-03-01" },
    { name: "Pay bills", date: "2025-02-28" },
    { name: "Pick up package", date: "2025-02-26" },
    { name: "Fix bike", date: "2025-03-07" },
    { name: "Submit assignment", date: "2025-03-02" },
    { name: "Wash car", date: "2025-03-09" },
    { name: "Backup data", date: "2025-02-24" },
    { name: "Prepare presentation", date: "2025-03-04" },
    { name: "Order birthday gift", date: "2025-03-10" },
    { name: "Book flights", date: "2025-03-15" },
    { name: "Return library books", date: "2025-02-23" },
    { name: "Update resume", date: "2025-03-08" },
  ];

  const habits = [];
  for (let i = 0; i < 15; i++) {
    const habitOption = habitOptions[i % habitOptions.length];
    habits.push({
      id: i + 1,
      user_id: Math.random() < 0.5 ? 1 : 2, // Randomly assign to user 1 or 2
      name: habitOption.name,
      completed: Math.floor(Math.random() * 5),
      to_complete: Math.floor(Math.random() * 5) + 1,
      status: Math.floor(Math.random() * 3),
      freq: habitOption.freq as "DAILY" | "WEEKLY" | "MONTHLY",
    });
  }

  const todos = [];
  for (let i = 0; i < 15; i++) {
    const todoOption = todoOptions[i % todoOptions.length];
    todos.push({
      id: i + 1,
      user_id: Math.random() < 0.5 ? 1 : 2,
      name: todoOption.name,
      date: todoOption.date,
      is_completed: Math.random() < 0.3,
    });
  }

  try {
    console.log(`Inserting ${users.length} users...`);
    await db.insert(usersTable).values(users);

    console.log(`Inserting ${habits.length} habits...`);
    await db.insert(habitsTable).values(habits);

    console.log(`Inserting ${todos.length} todos...`);
    await db.insert(todosTable).values(todos);

    console.log("✅ Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

if (Bun.main) main();
