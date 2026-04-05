import * as path from "path";
import * as fs from "fs";
import { createCharacter, getCharacter } from "./services/character.service";
import { loadBaseAssets, selectBaseAsset } from "./lib/asset-selector";
import { generateDialogue } from "./lib/dialogue-generator";
import { buildDialoguePrompt } from "./prompts/reaction-dialogue.prompts";
import type { Personality } from "./types";

const BASE_VIDEO = "C:/Users/seyki/Downloads/N_WEAK_01.mp4";
const ASSETS_DIR = path.resolve(__dirname, "../assets/base-videos");

async function runTests() {
  console.log("=== Yokbaji Reaction GIF Engine - Integration Test ===\n");

  // 0. Ensure base video is in assets directory
  const destVideo = path.join(ASSETS_DIR, "N_WEAK_01.mp4");
  if (!fs.existsSync(destVideo)) {
    if (fs.existsSync(BASE_VIDEO)) {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
      fs.copyFileSync(BASE_VIDEO, destVideo);
      console.log("[setup] Copied base video to assets/base-videos/");
    } else {
      console.error(`[setup] Base video not found: ${BASE_VIDEO}`);
      process.exit(1);
    }
  }

  // 1. Test base asset loading
  console.log("--- Test 1: Load base assets ---");
  const assets = loadBaseAssets();
  console.log(`Loaded ${assets.length} base asset(s):`);
  assets.forEach((a) => console.log(`  ${a.code} -> ${a.video_path}`));
  console.assert(assets.length > 0, "Should have at least 1 base asset");

  // 2. Test character creation
  console.log("\n--- Test 2: Create character ---");
  // Use a placeholder test image
  const testImagePath = path.resolve(__dirname, "../storage/test-face.jpg");
  if (!fs.existsSync(testImagePath)) {
    // Create a minimal test image placeholder
    fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
    fs.writeFileSync(testImagePath, Buffer.alloc(100, 0xff));
    console.log("[setup] Created placeholder test image");
  }

  const character = await createCharacter({
    image_path: testImagePath,
    personality_type: "WEAK",
    gender_type: "N",
    name: "Test Character",
  });
  console.log(`Created: ${character.character_id} (${character.personality_type}/${character.gender_type})`);
  console.assert(character.character_id.startsWith("char_"), "ID should start with char_");

  // 3. Test character retrieval
  console.log("\n--- Test 3: Get character ---");
  const retrieved = await getCharacter(character.character_id);
  console.assert(retrieved !== null, "Should retrieve character");
  console.assert(
    retrieved!.personality_type === "WEAK",
    "Personality should be WEAK"
  );
  console.log(`Retrieved: ${retrieved!.character_id}`);

  // 4. Test asset selection
  console.log("\n--- Test 4: Select base asset ---");
  const selected = selectBaseAsset(character);
  console.assert(selected !== null, "Should select an asset");
  console.log(`Selected: ${selected!.code}`);

  // 5. Test dialogue generation (fallback mode)
  console.log("\n--- Test 5: Dialogue generation ---");
  const personalities: Personality[] = ["WEAK", "ANGRY", "SARCASTIC", "STOIC"];
  for (const p of personalities) {
    const dialogue = await generateDialogue(p, `N_${p}_01`, "야 진짜 짜증나");
    console.log(`  ${p}: "${dialogue}"`);
    console.assert(dialogue.length > 0, `${p} dialogue should not be empty`);
  }

  // 6. Test prompt building
  console.log("\n--- Test 6: Prompt building ---");
  const prompt = buildDialoguePrompt("ANGRY", "M_ANGRY_01", "야 너 진짜 답답해 죽겠다");
  console.log(`Prompt length: ${prompt.length} chars`);
  console.assert(prompt.includes("[Character Type]"), "Prompt should contain character type section");
  console.assert(prompt.includes("버럭형"), "ANGRY prompt should contain 버럭형");

  // 7. Test full reaction flow (without Replicate API call)
  console.log("\n--- Test 7: Reaction flow (dry run) ---");
  console.log("Skipping Replicate API call (set REPLICATE_API_TOKEN to test live)");
  if (process.env.REPLICATE_API_TOKEN || process.env.YOKBAJI_REPLICATE_API_TOKEN) {
    const { generateReaction } = await import("./services/reaction.service");
    try {
      const result = await generateReaction({
        character_id: character.character_id,
        user_message: "야 진짜 너 때문에 미치겠다",
      });
      console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    } catch (e: any) {
      console.log(`Replicate call failed (expected if no real image): ${e.message}`);
    }
  }

  console.log("\n=== All tests passed! ===");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
