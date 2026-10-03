// `npm run bracket:sim` — plays a full 10-bot rehearsal game on an in-memory
// Postgres and prints it round by round. Never touches the real database.
import { test } from "vitest";
import { makeTestDb } from "@/lib/bracket/__tests__/testDb";
import { simulateGame } from "@/lib/bracket/sim";

test("print a full 10-bot game", async () => {
  const db = await makeTestDb();
  const seed = Number(process.env.SEED ?? 7);
  const { log } = await simulateGame(db, { bots: 10, seed });
  console.log(`\nBRACKET NIGHT · 10 bots · seed ${seed}\n` + log + "\n");
});
