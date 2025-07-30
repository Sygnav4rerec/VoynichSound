import { 
  type User, 
  type InsertUser, 
  type AnalysisSession,
  type InsertAnalysisSession,
  type GlyphPreset,
  type InsertGlyphPreset,
  type ManuscriptImage,
  type InsertManuscriptImage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis Sessions
  getAnalysisSession(id: string): Promise<AnalysisSession | undefined>;
  getAnalysisSessionsByUser(userId: string): Promise<AnalysisSession[]>;
  createAnalysisSession(session: InsertAnalysisSession & { userId: string }): Promise<AnalysisSession>;
  updateAnalysisSession(id: string, updates: Partial<InsertAnalysisSession>): Promise<AnalysisSession | undefined>;
  deleteAnalysisSession(id: string): Promise<boolean>;
  
  // Glyph Presets
  getGlyphPresets(userId: string): Promise<GlyphPreset[]>;
  createGlyphPreset(preset: InsertGlyphPreset & { userId: string }): Promise<GlyphPreset>;
  deleteGlyphPreset(id: string): Promise<boolean>;
  
  // Manuscript Images
  getManuscriptImages(userId: string): Promise<ManuscriptImage[]>;
  createManuscriptImage(image: InsertManuscriptImage & { userId: string }): Promise<ManuscriptImage>;
  updateManuscriptImage(id: string, updates: Partial<InsertManuscriptImage>): Promise<ManuscriptImage | undefined>;
  deleteManuscriptImage(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, AnalysisSession>;
  private presets: Map<string, GlyphPreset>;
  private images: Map<string, ManuscriptImage>;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.presets = new Map();
    this.images = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAnalysisSession(id: string): Promise<AnalysisSession | undefined> {
    return this.sessions.get(id);
  }

  async getAnalysisSessionsByUser(userId: string): Promise<AnalysisSession[]> {
    return Array.from(this.sessions.values()).filter(
      session => session.userId === userId
    );
  }

  async createAnalysisSession(sessionData: InsertAnalysisSession & { userId: string }): Promise<AnalysisSession> {
    const id = randomUUID();
    const now = new Date();
    const session: AnalysisSession = {
      ...sessionData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateAnalysisSession(id: string, updates: Partial<InsertAnalysisSession>): Promise<AnalysisSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updated = { ...session, ...updates, updatedAt: new Date() };
    this.sessions.set(id, updated);
    return updated;
  }

  async deleteAnalysisSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async getGlyphPresets(userId: string): Promise<GlyphPreset[]> {
    return Array.from(this.presets.values()).filter(
      preset => preset.userId === userId
    );
  }

  async createGlyphPreset(presetData: InsertGlyphPreset & { userId: string }): Promise<GlyphPreset> {
    const id = randomUUID();
    const preset: GlyphPreset = {
      ...presetData,
      id,
      createdAt: new Date(),
    };
    this.presets.set(id, preset);
    return preset;
  }

  async deleteGlyphPreset(id: string): Promise<boolean> {
    return this.presets.delete(id);
  }

  async getManuscriptImages(userId: string): Promise<ManuscriptImage[]> {
    return Array.from(this.images.values()).filter(
      image => image.userId === userId
    );
  }

  async createManuscriptImage(imageData: InsertManuscriptImage & { userId: string }): Promise<ManuscriptImage> {
    const id = randomUUID();
    const image: ManuscriptImage = {
      ...imageData,
      id,
      createdAt: new Date(),
    };
    this.images.set(id, image);
    return image;
  }

  async updateManuscriptImage(id: string, updates: Partial<InsertManuscriptImage>): Promise<ManuscriptImage | undefined> {
    const image = this.images.get(id);
    if (!image) return undefined;
    
    const updated = { ...image, ...updates };
    this.images.set(id, updated);
    return updated;
  }

  async deleteManuscriptImage(id: string): Promise<boolean> {
    return this.images.delete(id);
  }
}

export const storage = new MemStorage();
