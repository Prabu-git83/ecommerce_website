import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../config/env";
import * as schema from "./schema/index";

export const queryClient = postgres(env.DATABASE_URL, {
  max: env.DATABASE_POOL_MAX,
  prepare: env.DATABASE_POOLED !== "true",
});
export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
