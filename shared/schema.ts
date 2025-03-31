import { pgTable, text, serial, integer, boolean, varchar, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: varchar("email").notNull(),
  maincro: varchar("maincro").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  maincro: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Matching the original tables from the database
export const subcro = pgTable("subcro", {
  id: integer("id").primaryKey(),
  maincro: varchar("maincro").notNull(),
  subcro: varchar("subcro").notNull(),
  label: varchar("label"),
  flagcro: integer("flagcro"),
  webcallback: integer("webcallback"),
});

export const subcroRelations = relations(subcro, ({ many }) => ({
  hotels: many(hotel),
}));

export const insertSubcroSchema = createInsertSchema(subcro).omit({ id: true });
export type InsertSubcro = z.infer<typeof insertSubcroSchema>;
export type Subcro = typeof subcro.$inferSelect;

export const hotel = pgTable("hotel", {
  codeHotel: varchar("codeHotel").notNull().primaryKey(),
  subcroId: integer("subcroId").notNull().references(() => subcro.id),
});

export const hotelRelations = relations(hotel, ({ one }) => ({
  subcro: one(subcro, {
    fields: [hotel.subcroId],
    references: [subcro.id],
  }),
}));

export const insertHotelSchema = createInsertSchema(hotel);
export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotel.$inferSelect;

// Define schemas for views in the database
export type HotelMaincroSubcroView = {
  codeHotel: string;
  subcroId: number;
  subcro: string;
  maincro: string;
};

export type UserMaincroSubcroView = {
  id: number;
  email: string;
  maincro: string;
  subcro: string;
};

// Define schema for SQL query results
export type SqlQueryResult = {
  columns: string[];
  rows: Record<string, any>[];
  message: string;
  executionTime: number;
};
