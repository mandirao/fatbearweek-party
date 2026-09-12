import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const guests = pgTable("guests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status", { enum: ["yes", "no"] }),
  extraGuests: integer("extra_guests").notNull().default(0),
  bear: text("bear"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
