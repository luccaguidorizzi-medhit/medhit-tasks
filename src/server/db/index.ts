import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Client singleton para PostgreSQL
const client = connectionString
  ? postgres(connectionString, { prepare: false })
  : (null as unknown as ReturnType<typeof postgres>);

export const db = client
  ? drizzle(client, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export * from "./schema";
