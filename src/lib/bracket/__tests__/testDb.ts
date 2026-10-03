import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { createRequire } from "node:module";
import * as schema from "@/db/schema";
import type { Db } from "../store";

const require = createRequire(import.meta.url);

/** Fresh in-memory Postgres with the app's real schema (guests + bracket tables). */
export async function makeTestDb(): Promise<Db> {
  const { generateDrizzleJson, generateMigration } = require("drizzle-kit/api");
  const client = new PGlite();
  const db = drizzle(client, { schema });
  const empty = generateDrizzleJson({});
  const cur = generateDrizzleJson(schema);
  const statements: string[] = await generateMigration(empty, cur);
  for (const s of statements) await client.exec(s);
  return db as unknown as Db;
}
