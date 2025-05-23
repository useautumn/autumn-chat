import { pgTable, text, bigint, jsonb, boolean } from "drizzle-orm/pg-core";

export const chatResults = pgTable("chat_results", {
  id: text("id").primaryKey(),
  created_at: bigint("created_at", { mode: "number" }),
  data: jsonb("data").notNull(),
});

export type ChatResult = typeof chatResults.$inferSelect;
