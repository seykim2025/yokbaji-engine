import Replicate from "replicate";
import * as fs from "fs";
import * as path from "path";
import { downloadFile } from "./blob-storage";

const MODEL_VERSION =
  "zedge/live-portrait:9f8f5880eb2db3778cc689fa00ee6e090fa3d8388ac278b608d4cc526a44c5df";

function getApiToken(): string {
  const token =
    process.env.YOKBAJI_REPLICATE_API_TOKEN ||
    process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error(
      "Replicate API token not found. Set REPLICATE_API_TOKEN or YOKBAJI_REPLICATE_API_TOKEN env var."
    );
  }
  return token;
}

let _client: Replicate | null = null;

function getClient(): Replicate {
  if (!_client) {
    _client = new Replicate({ auth: getApiToken() });
  }
  return _client;
}

export interface LivePortraitInput {
  source_image_path: string; // local path OR Blob URL to user's face image
  driving_video_path: string; // local path to base driving video
}

export interface LivePortraitOutput {
  video_url: string; // URL of generated video from Replicate
}

/**
 * Read a file from either a local path or a remote URL and return a File
 * object that the Replicate SDK can auto-upload via the files API.
 */
async function toFile(
  pathOrUrl: string,
  defaultMime: string
): Promise<File> {
  const buffer = await downloadFile(pathOrUrl);
  const ext = path.extname(pathOrUrl).slice(1).toLowerCase();
  const basename = path.basename(pathOrUrl);

  let mime = defaultMime;
  if (ext === "png") mime = "image/png";
  else if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";
  else if (ext === "mp4") mime = "video/mp4";

  return new File([buffer], basename, { type: mime });
}

export async function generateReactionVideo(
  input: LivePortraitInput
): Promise<LivePortraitOutput> {
  const client = getClient();

  const imageFile = await toFile(input.source_image_path, "image/jpeg");
  const videoFile = await toFile(input.driving_video_path, "video/mp4");

  console.log(
    `[replicate] Calling live-portrait with image=${input.source_image_path}, video=${input.driving_video_path}`
  );

  const output = await client.run(
    MODEL_VERSION as `${string}/${string}:${string}`,
    {
      input: {
        source_image: imageFile,
        driving_video: videoFile,
      },
    }
  );

  // Output is typically a URL string or object with url
  let videoUrl: string;
  if (typeof output === "string") {
    videoUrl = output;
  } else if (output && typeof output === "object" && "url" in (output as any)) {
    videoUrl = (output as any).url;
  } else if (
    output &&
    typeof output === "object" &&
    Symbol.iterator in (output as any)
  ) {
    const arr = Array.isArray(output) ? output : [];
    videoUrl = typeof arr[0] === "string" ? arr[0] : String(output);
  } else {
    videoUrl = String(output);
  }

  console.log(`[replicate] Got result: ${videoUrl}`);

  return { video_url: videoUrl };
}

export async function downloadVideo(
  url: string,
  destPath: string
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download video: ${response.status} ${response.statusText}`
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  console.log(`[replicate] Downloaded video to ${destPath}`);
}
