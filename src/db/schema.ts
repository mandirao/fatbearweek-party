import { pgTable, text, integer, timestamp, uniqueIndex, jsonb, boolean, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const guests = pgTable(
  "guests",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    status: text("status", { enum: ["yes", "no"] }),
    extraGuests: integer("extra_guests").notNull().default(0),
    bear: text("bear"),
    dishId: integer("dish_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("guests_dish_id_unique").on(table.dishId).where(sql`${table.dishId} is not null`),
  ],
);

export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;

// ── Bracket Night ──────────────────────────────────────────────────────────
// Reset wipes every bracket_* table and never touches `guests`.

export const bracketGame = pgTable("bracket_game", {
  id: integer("id").primaryKey(),
  version: integer("version").notNull().default(0),
  state: jsonb("state").notNull(),
  history: jsonb("history").notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bracketPlayers = pgTable("bracket_players", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  guestId: text("guest_id"),
  isPlusOne: boolean("is_plus_one").notNull().default(false),
  isBot: boolean("is_bot").notNull().default(false),
  deviceToken: text("device_token").notNull().unique(),
  prevDeviceToken: text("prev_device_token"),
  rejoinedAt: timestamp("rejoined_at", { withTimezone: true }),
  bonus: integer("bonus").notNull().default(0),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bracketVotes = pgTable(
  "bracket_votes",
  {
    playerId: text("player_id").notNull(),
    matchId: integer("match_id").notNull(),
    bearNum: integer("bear_num").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.matchId] })],
);

export const bracketTalk = pgTable(
  "bracket_talk",
  {
    playerId: text("player_id").notNull(),
    matchId: integer("match_id").notNull(),
    text: text("text").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull(),
    hidden: boolean("hidden").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.playerId, t.matchId] })],
);

export const bracketWagers = pgTable("bracket_wagers", {
  playerId: text("player_id").primaryKey(),
  amount: integer("amount").notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
});

export const bracketTbGuesses = pgTable("bracket_tb_guesses", {
  playerId: text("player_id").primaryKey(),
  value: integer("value").notNull(),
  lockedAt: timestamp("locked_at", { withTimezone: true }).notNull(),
});
