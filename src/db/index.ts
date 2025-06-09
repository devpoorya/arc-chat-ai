import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/env";
import schema from "./schema/index.sql";
export const db = drizzle(env.DATABASE_URL, { schema });
