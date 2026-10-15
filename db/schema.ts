import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const responses = sqliteTable("responses", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  session: text("session").notNull(),
  medium: text("medium").notNull(),
  imageKey: text("image_key"),
  digest: text("digest"),
  status: text("status").notNull().default("queued"),
  draft: text("draft").notNull().default(""),
  text: text("text").notNull().default(""),
  warnings: text("warnings").notNull().default("[]"),
  verified: integer("verified").notNull().default(0),
  permission: integer("permission").notNull().default(0),
  approved: integer("approved").notNull().default(0),
  excerpt: text("excerpt").notNull().default(""),
  error: text("error").notNull().default(""),
  created: integer("created").notNull(),
  updated: integer("updated").notNull(),
  version: integer("version").notNull().default(1),
  lease: text("lease"),
}, table => [index("responses_owner_session").on(table.owner, table.session)]);

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  session: text("session").notNull(),
  groups: text("groups").notNull().default("[]"),
  version: integer("version").notNull().default(1),
  updated: integer("updated").notNull(),
});

export const snapshots = sqliteTable("snapshots", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  session: text("session").notNull(),
  payload: text("payload").notNull(),
  created: integer("created").notNull(),
});
