import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.text(`Hello Hono! ${Bun.env.TEST}`);
});

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

export default app;
