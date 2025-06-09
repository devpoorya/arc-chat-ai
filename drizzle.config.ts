import { type Config } from "drizzle-kit";
import { env } from "@/env";

export default {
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  migrations: {
    schema: "public",
    table: "database-migrations",
  },
} satisfies Config;
