import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").unique(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const declarations = pgTable("declarations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  coupleName: text("couple_name").notNull().default(""),
  title: text("title").notNull().default(""),
  startDate: timestamp("start_date", { withTimezone: true }),
  soundtrackUrl: text("soundtrack_url").notNull().default(""),
  soundtrackType: text("soundtrack_type").notNull().default("url"),
  soundtrackName: text("soundtrack_name").notNull().default(""),
  revealEffect: text("reveal_effect").notNull().default("polaroid"),
  wallpaper: text("wallpaper").notNull().default("wood"),
  viewMode: text("view_mode").notNull().default("deck"),
  slideshowSeconds: integer("slideshow_seconds").notNull().default(5),
  passwordHash: text("password_hash"),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }),
  viewCount: integer("view_count").notNull().default(0),
});

export const photos = pgTable("photos", {
  id: text("id").primaryKey(),
  declarationId: text("declaration_id")
    .notNull()
    .references(() => declarations.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").notNull().default(""),
  filter: text("filter").notNull().default("natural"),
});

export const replies = pgTable("replies", {
  id: text("id").primaryKey(),
  declarationId: text("declaration_id")
    .notNull()
    .references(() => declarations.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  declarations: many(declarations),
}));

export const declarationsRelations = relations(declarations, ({ one, many }) => ({
  user: one(users, {
    fields: [declarations.userId],
    references: [users.id],
  }),
  photos: many(photos),
  replies: many(replies),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  declaration: one(declarations, {
    fields: [photos.declarationId],
    references: [declarations.id],
  }),
}));

export const repliesRelations = relations(replies, ({ one }) => ({
  declaration: one(declarations, {
    fields: [replies.declarationId],
    references: [declarations.id],
  }),
}));
