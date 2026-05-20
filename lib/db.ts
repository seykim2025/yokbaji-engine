// PostgreSQL via @neondatabase/serverless (DATABASE_URL auto-injected by Vercel/Neon)

import { neon } from "@neondatabase/serverless";
import type { CharacterRecord } from "./types";

function getSql() {
  return neon(process.env.DATABASE_URL!);
}

export async function ensureSchema(): Promise<void> {
  const sql = getSql();

  // Detect old Prisma-based schema (has 'session_id' column) and migrate
  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'characters' AND table_schema = 'public'
  `;
  const colNames = (cols as Array<{ column_name: string }>).map((c) => c.column_name);
  if (colNames.length > 0 && !colNames.includes("character_id")) {
    await sql`DROP TABLE IF EXISTS characters CASCADE`;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS characters (
      character_id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Unnamed',
      personality_type TEXT NOT NULL,
      gender_type TEXT NOT NULL,
      image_path TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function insertCharacter(c: CharacterRecord): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO characters (character_id, name, personality_type, gender_type, image_path, created_at)
    VALUES (${c.character_id}, ${c.name}, ${c.personality_type}, ${c.gender_type}, ${c.image_path}, ${c.created_at})
  `;
}

export async function listAllCharacters(): Promise<CharacterRecord[]> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM characters ORDER BY created_at DESC`;
  return rows as CharacterRecord[];
}

export async function getCharacterById(id: string): Promise<CharacterRecord | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM characters WHERE character_id = ${id} LIMIT 1`;
  return (rows[0] as CharacterRecord) ?? null;
}
