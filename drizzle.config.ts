import type { Config } from "drizzle-kit";
export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations/",
  dialect: "sqlite",
  dbCredentials: {
    url: "./drizzle/db.sqlite",
  },
} satisfies Config;
