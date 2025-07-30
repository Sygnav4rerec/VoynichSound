import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const analysisSession = pgTable("analysis_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  glyphSequence: text("glyph_sequence").notNull(),
  baseFrequency: real("base_frequency").notNull().default(440),
  waveformType: text("waveform_type").notNull().default('sine'),
  mappingAlgorithm: text("mapping_algorithm").notNull().default('unicode'),
  analysisResults: json("analysis_results"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const glyphPresets = pgTable("glyph_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  glyphSequence: text("glyph_sequence").notNull(),
  baseFrequency: real("base_frequency").notNull(),
  waveformType: text("waveform_type").notNull(),
  mappingAlgorithm: text("mapping_algorithm").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const manuscriptImages = pgTable("manuscript_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  detectedGlyphs: json("detected_glyphs"),
  patterns: json("patterns"),
  analysisData: json("analysis_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAnalysisSessionSchema = createInsertSchema(analysisSession).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlyphPresetSchema = createInsertSchema(glyphPresets).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertManuscriptImageSchema = createInsertSchema(manuscriptImages).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AnalysisSession = typeof analysisSession.$inferSelect;
export type InsertAnalysisSession = z.infer<typeof insertAnalysisSessionSchema>;
export type GlyphPreset = typeof glyphPresets.$inferSelect;
export type InsertGlyphPreset = z.infer<typeof insertGlyphPresetSchema>;
export type ManuscriptImage = typeof manuscriptImages.$inferSelect;
export type InsertManuscriptImage = z.infer<typeof insertManuscriptImageSchema>;

export const waveformTypes = ['sine', 'sawtooth', 'square', 'triangle'] as const;
export const mappingAlgorithms = ['unicode', 'phonetic', 'geometric', 'psycholinguistic'] as const;

export type WaveformType = typeof waveformTypes[number];
export type MappingAlgorithm = typeof mappingAlgorithms[number];
