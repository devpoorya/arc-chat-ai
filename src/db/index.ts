import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/env";
import schema from "./schema/index.sql";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { threads, messages } from "./schema/content.sql";
import { asc } from "drizzle-orm";

export const db = drizzle(env.DATABASE_URL, { schema }) as NodePgDatabase<typeof schema>;

// Query builder setup
export const queryBuilder = {
  threads: {
    findFirst: async (where: any) => {
      return db.select().from(threads).where(where).limit(1).then(rows => rows[0]);
    },
    findMany: async (where: any) => {
      return db.select().from(threads).where(where);
    }
  },
  messages: {
    findMany: async (where: any) => {
      return db.select().from(messages).where(where).orderBy(asc(messages.createdAt));
    }
  }
};
