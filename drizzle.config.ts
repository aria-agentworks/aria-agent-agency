import { defineConfig } from "drizzle-kit";

const dbPath = process.env.SQLITE_DB_PATH ?? "data/aria.sqlite3";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
