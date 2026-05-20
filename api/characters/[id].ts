// GET /api/characters/:id

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as fs from "fs";
import * as path from "path";
import type { CharacterRecord } from "../../lib/types";

const DB_PATH = path.join(process.cwd(), "data", "characters.json");

function readDB(): CharacterRecord[] {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as CharacterRecord[];
  } catch { return []; }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { id } = req.query;
  const character = readDB().find((c) => c.character_id === id);
  if (!character) return res.status(404).json({ error: "Not found" });
  return res.json(character);
}
