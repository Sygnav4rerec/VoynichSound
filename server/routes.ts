import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { imageProcessor } from "./services/image-processor";
import { patternAnalyzer } from "./services/pattern-analyzer";
import {
  insertAnalysisSessionSchema,
  insertGlyphPresetSchema,
  type WaveformType,
  type MappingAlgorithm,
  waveformTypes,
  mappingAlgorithms,
} from "@shared/schema";
import multer from "multer";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ── Analysis Sessions ──────────────────────────────────────────────────────

  app.get("/api/sessions", async (req, res) => {
    try {
      const userId = "demo-user";
      const sessions = await storage.getAnalysisSessionsByUser(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.put("/api/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertAnalysisSessionSchema.partial().parse(req.body);
      const session = await storage.updateAnalysisSession(id, updates);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid session data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update session" });
      }
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAnalysisSession(id);
      if (!deleted) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // ── Presets ────────────────────────────────────────────────────────────────

  app.get("/api/presets", async (req, res) => {
    try {
      const userId = "demo-user";
      const presets = await storage.getGlyphPresets(userId);
      res.json(presets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch presets" });
    }
  });

  app.post("/api/presets", async (req, res) => {
    try {
      const validatedData = insertGlyphPresetSchema.parse(req.body);
      const userId = "demo-user";
      const preset = await storage.createGlyphPreset({ ...validatedData, userId });
      res.json(preset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid preset data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create preset" });
      }
    }
  });

  app.delete("/api/presets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteGlyphPreset(id);
      if (!deleted) {
        return res.status(404).json({ error: "Preset not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete preset" });
    }
  });

  // ── Manuscript Image Upload & Analysis ────────────────────────────────────

  app.post("/api/manuscript/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const optionsSchema = z.object({
        autoDetectGlyphs: z.boolean().default(true),
        patternRecognition: z.boolean().default(true),
        frequencyMapping: z.boolean().default(true),
      });

      const options = optionsSchema.parse(req.body);
      const analysis = await imageProcessor.processManuscriptImage(req.file.buffer, options);

      const userId = "demo-user";
      const manuscriptImage = await storage.createManuscriptImage({
        filename: `manuscript_${Date.now()}.png`,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        detectedGlyphs: analysis.glyphs,
        patterns: analysis.patterns,
        analysisData: analysis,
        userId,
      });

      res.json({
        imageId: manuscriptImage.id,
        analysis: analysis.patterns,
        glyphs: analysis.glyphs,
        processingComplete: true,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid options", details: error.errors });
      } else {
        res.status(500).json({
          error: "Failed to process manuscript image",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  app.get("/api/manuscript/images", async (req, res) => {
    try {
      const userId = "demo-user";
      const images = await storage.getManuscriptImages(userId);
      res.json(images);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch manuscript images" });
    }
  });

  // ── Export ─────────────────────────────────────────────────────────────────

  app.post("/api/export/audio", async (req, res) => {
    try {
      const schema = z.object({
        glyphSequence: z.string().min(1),
        baseFrequency: z.number().min(20).max(2000).default(440),
        waveformType: z.enum(waveformTypes).default("sine"),
        mappingAlgorithm: z.enum(mappingAlgorithms).default("unicode"),
        duration: z.number().min(0.1).max(30).default(5),
        sampleRate: z.number().default(44100),
      });

      const config = schema.parse(req.body);
      const analysis = patternAnalyzer.analyzeGlyphSequence(
        config.glyphSequence,
        config.baseFrequency,
        config.mappingAlgorithm
      );

      res.json({
        config,
        analysis,
        message: "Audio configuration ready for client-side generation",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid export configuration", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to prepare audio export" });
      }
    }
  });

  app.post("/api/export/data", async (req, res) => {
    try {
      const schema = z.object({
        sessionId: z.string().optional(),
        format: z.enum(["json", "csv"]).default("json"),
      });

      const { sessionId, format } = schema.parse(req.body);

      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required for data export" });
      }

      const session = await storage.getAnalysisSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="analysis_${sessionId}.csv"`);
        res.send(convertToCSV(session));
      } else {
        res.setHeader("Content-Type", "application/json");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="analysis_${sessionId}.json"`
        );
        res.json(session);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid export parameters", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to export data" });
      }
    }
  });

  // ── Server ─────────────────────────────────────────────────────────────────

  const httpServer = createServer(app);
  return httpServer;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function convertToCSV(session: any): string {
  const headers = ["Glyph", "Frequency", "Pattern", "Count"];
  const rows = [headers.join(",")];

  if (session.analysisResults?.frequencyMappings) {
    for (const mapping of session.analysisResults.frequencyMappings) {
      rows.push([mapping.glyph, mapping.frequency.toString(), "", ""].join(","));
    }
  }

  if (session.analysisResults?.patterns) {
    for (const pattern of session.analysisResults.patterns) {
      rows.push(
        [
          "",
          pattern.mappedFrequency?.toString() ?? "",
          pattern.sequence,
          pattern.frequency.toString(),
        ].join(",")
      );
    }
  }

  return rows.join("\n");
}
