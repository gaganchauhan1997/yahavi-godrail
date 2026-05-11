import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { workspacesTable } from "./workspaces";

export const labelsTable = pgTable("labels", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").references(() => workspacesTable.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLabelSchema = createInsertSchema(labelsTable).omit({ id: true, createdAt: true });
export type InsertLabel = z.infer<typeof insertLabelSchema>;
export type Label = typeof labelsTable.$inferSelect;
