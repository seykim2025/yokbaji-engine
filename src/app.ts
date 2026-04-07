import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createCharacter,
  getCharacter,
  listCharacters,
  deleteCharacter,
} from "./services/character.service";
import { generateReaction } from "./services/reaction.service";
import { loadBaseAssets } from "./lib/asset-selector";
import { isUsingBlobStorage } from "./lib/blob-storage";
import type { Personality, Gender } from "./types";
import { getStorageDir, getAssetsDir } from "./lib/paths";

const app = express();

// Rate limiting — per-character cooldown for reaction generation (Replicate calls are expensive)
const REACTION_COOLDOWN_MS = 30_000; // 30 seconds between reactions per character
const reactionLastCalled = new Map<string, number>();

function reactionRateLimiter(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const characterId = req.body?.character_id as string | undefined;
  if (!characterId) {
    next();
    return;
  }
  const now = Date.now();
  const last = reactionLastCalled.get(characterId) ?? 0;
  const elapsed = now - last;
  if (elapsed < REACTION_COOLDOWN_MS) {
    const retryAfter = Math.ceil((REACTION_COOLDOWN_MS - elapsed) / 1000);
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({
      error: `Too many requests. Please wait ${retryAfter}s before generating another reaction.`,
      retry_after_seconds: retryAfter,
    });
    return;
  }
  reactionLastCalled.set(characterId, now);
  next();
}

// CORS — allow cross-origin requests from the Toss frontend
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

// Static file serving for generated videos and storage (local dev only)
const storageDir = getStorageDir();
const assetsDir = getAssetsDir();
app.use("/storage", express.static(storageDir));
app.use("/assets", express.static(assetsDir));

// Serve frontend from public/
const publicDir = path.resolve(__dirname, "../public");
app.use(express.static(publicDir));

// Multer for image uploads (always writes to local /tmp first)
const uploadDir = path.join(storageDir, "uploads");
fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    engine: "yokbaji-reaction-engine",
    version: "0.2.0",
    storage: isUsingBlobStorage() ? "blob" : "local",
  });
});

// List base assets (supports ?personality=WEAK&gender=F filtering with N-gender fallback)
app.get("/api/assets", (req, res) => {
  try {
    const assets = loadBaseAssets();
    // Return URL-safe paths instead of server-local filesystem paths
    let safeAssets = assets.map((a) => ({
      ...a,
      video_path: `/assets/base-videos/${a.code}.mp4`,
    }));

    const { personality, gender } = req.query;
    if (personality && gender) {
      // Filter by personality and gender, with N (neutral) fallback
      const exact = safeAssets.filter(
        (a) =>
          a.personality === personality &&
          (a.gender === gender || a.gender === "N")
      );
      // Prefer exact gender match, fall back to N
      const exactGender = exact.filter((a) => a.gender === gender);
      safeAssets = exactGender.length > 0 ? exactGender : exact;
    } else if (personality) {
      safeAssets = safeAssets.filter((a) => a.personality === personality);
    } else if (gender) {
      safeAssets = safeAssets.filter(
        (a) => a.gender === gender || a.gender === "N"
      );
    }

    res.json({ assets: safeAssets, count: safeAssets.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create character (multipart form with image file)
app.post("/api/characters", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "image file is required" });
      return;
    }
    const { personality_type, gender_type, name } = req.body;
    if (!personality_type || !gender_type) {
      res
        .status(400)
        .json({ error: "personality_type and gender_type are required" });
      return;
    }

    const validPersonalities: Personality[] = [
      "WEAK",
      "ANGRY",
      "SARCASTIC",
      "STOIC",
    ];
    const validGenders: Gender[] = ["M", "F", "N"];
    if (!validPersonalities.includes(personality_type)) {
      res.status(400).json({
        error: `personality_type must be one of: ${validPersonalities.join(", ")}`,
      });
      return;
    }
    if (!validGenders.includes(gender_type)) {
      res.status(400).json({
        error: `gender_type must be one of: ${validGenders.join(", ")}`,
      });
      return;
    }

    const character = await createCharacter({
      image_path: file.path,
      personality_type,
      gender_type,
      name,
    });

    res.status(201).json(character);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List characters
app.get("/api/characters", async (_req, res) => {
  try {
    const characters = await listCharacters();
    res.json({ characters, count: characters.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get character by ID
app.get("/api/characters/:id", async (req, res) => {
  try {
    const character = await getCharacter(req.params.id);
    if (!character) {
      res.status(404).json({ error: "Character not found" });
      return;
    }
    res.json(character);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete character by ID
app.delete("/api/characters/:id", async (req, res) => {
  try {
    const character = await getCharacter(req.params.id);
    if (!character) {
      res.status(404).json({ error: "Character not found" });
      return;
    }
    await deleteCharacter(req.params.id);
    res.json({ deleted: true, character_id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Generate reaction
app.post("/api/reactions", reactionRateLimiter, async (req, res) => {
  try {
    const { character_id, user_message } = req.body;
    if (!character_id || !user_message) {
      res
        .status(400)
        .json({ error: "character_id and user_message are required" });
      return;
    }

    const result = await generateReaction({ character_id, user_message });

    // Convert local file paths to serving URLs (only needed in local dev)
    if (
      result.video_url &&
      !result.video_url.startsWith("http")
    ) {
      const relativePath = path.relative(storageDir, result.video_url);
      if (!relativePath.startsWith("..")) {
        result.video_url = `/storage/${relativePath.replace(/\\/g, "/")}`;
      }
    }

    res.json(result);
  } catch (err: any) {
    const status = err.message?.includes("not found") ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// SPA fallback — serve index.html for non-API routes
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

export default app;
