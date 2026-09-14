import { pgTable, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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
