-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F', 'N');

-- CreateEnum
CREATE TYPE "Personality" AS ENUM ('WEAK', 'ANGRY', 'SARCASTIC', 'STOIC');

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "image_path" TEXT NOT NULL,
    "personality_type" "Personality" NOT NULL,
    "gender_type" "Gender" NOT NULL,
    "name" TEXT,
    "used_base_numbers" TEXT[],
    "generated_assets_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cache_entries" (
    "id" TEXT NOT NULL,
    "character_id" TEXT NOT NULL,
    "base_asset_code" TEXT NOT NULL,
    "video_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cache_entries_character_id_base_asset_code_key" ON "cache_entries"("character_id", "base_asset_code");

-- AddForeignKey
ALTER TABLE "cache_entries" ADD CONSTRAINT "cache_entries_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
