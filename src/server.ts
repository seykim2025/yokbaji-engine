import app from "./app";
import { loadBaseAssets } from "./lib/asset-selector";

const PORT = parseInt(process.env.PORT || "3200", 10);
app.listen(PORT, () => {
  const assets = loadBaseAssets();
  console.log(`[yokbaji] API server running on http://localhost:${PORT}`);
  console.log(`[yokbaji] Base assets loaded: ${assets.length}`);
  console.log(`[yokbaji] Endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  GET  /api/assets`);
  console.log(`  POST /api/characters  (multipart: image, personality_type, gender_type, name?)`);
  console.log(`  GET  /api/characters`);
  console.log(`  GET  /api/characters/:id`);
  console.log(`  POST /api/reactions   (json: character_id, user_message)`);
});
