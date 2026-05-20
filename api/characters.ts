// POST /api/characters — create character (with E-01 face check)
// GET  /api/characters — list all characters

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as crypto from "crypto";
import { checkFace, checkBlur } from "../lib/face-detection";
import { saveImage } from "../lib/storage";
import { EngineError } from "../lib/errors";
import { ensureSchema, insertCharacter, listAllCharacters } from "../lib/db";
import type { CharacterRecord } from "../lib/types";
import { Timer } from "../lib/timing";

function setCORS(res: VercelResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORS(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    try {
      await ensureSchema();
      const characters = await listAllCharacters();
      return res.json({ characters });
    } catch (err) {
      console.error("[characters] list error:", err);
      return res.status(500).json({ error: "Failed to list characters" });
    }
  }

  if (req.method === "POST") return handleCreate(req, res);
  return res.status(405).json({ error: "Method not allowed" });
}

async function parseMultipart(req: VercelRequest): Promise<{
  fields: Record<string, string>;
  fileBuffer: Buffer;
  fileName: string;
}> {
  const { IncomingForm } = await import("formidable");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs") as typeof import("fs");
  const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(fields)) {
        flat[k] = Array.isArray(v) ? v[0] : (v ?? "");
      }
      const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
      if (!imageFile) return reject(new Error("No image file"));
      const buf: Buffer = fs.readFileSync(imageFile.filepath);
      resolve({ fields: flat, fileBuffer: buf, fileName: imageFile.originalFilename ?? "image.jpg" });
    });
  });
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const timer = new Timer();
  try {
    await ensureSchema();
    const { fields, fileBuffer, fileName } = await parseMultipart(req);

    const { personality_type, gender_type, name = "" } = fields;
    if (!personality_type || !gender_type) {
      return res.status(400).json({ error: "Missing required fields: personality_type, gender_type" });
    }

    const ext = fileName.split(".").pop() ?? "jpg";

    // E-01: Face validation — must pass before any external work or DB write
    timer.mark("face_check_start");
    await checkBlur(fileBuffer);
    const faceResult = await checkFace(fileBuffer);
    timer.mark("face_check_end");

    // Upload image to Vercel Blob
    const image_path = await saveImage(fileBuffer, ext);

    const character: CharacterRecord = {
      character_id: crypto.randomUUID(),
      name: name || "Unnamed",
      personality_type: personality_type as CharacterRecord["personality_type"],
      gender_type: gender_type as CharacterRecord["gender_type"],
      image_path,
      created_at: new Date().toISOString(),
    };

    await insertCharacter(character);

    void faceResult;
    return res.status(201).json(character);
  } catch (err) {
    if (err instanceof EngineError) return res.status(422).json(err.toResponse());
    console.error("[characters] create error:", err);
    return res.status(500).json(new EngineError("UNKNOWN_ERROR", "알 수 없는 오류").toResponse());
  }
}
