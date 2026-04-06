import Replicate from "replicate";
import * as fs from "fs";
import * as path from "path";
import { downloadFile, uploadFile } from "./blob-storage";

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
 * Ensure a file input is available as a public URL that Replicate can fetch.
 * If it's already an HTTP(S) URL, return it directly.
 * Otherwise, read it from disk and upload to Vercel Blob.
 */
async function ensurePublicUrl(
  pathOrUrl: string,
  contentType: string
): Promise<string> {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const buffer = await downloadFile(pathOrUrl);
  const basename = path.basename(pathOrUrl);
  const blobPath = `replicate-inputs/${basename}`;
  return uploadFile(blobPath, buffer, contentType);
}

export async function generateReactionVideo(
  input: LivePortraitInput
): Promise<LivePortraitOutput> {
  const client = getClient();

  const imageUrl = await ensurePublicUrl(input.source_image_path, "image/jpeg");
  const videoUrl = await ensurePublicUrl(input.driving_video_path, "video/mp4");

  console.log(
    `[replicate] Calling live-portrait with image=${imageUrl}, video=${videoUrl}`
  );

  const output = await client.run(
    MODEL_VERSION as `${string}/${string}:${string}`,
    {
      input: {
        source_image: imageUrl,
        driving_input: videoUrl,
      },
    }
  );

  // Output is typically a URL string or object with url
  let resultUrl: string;
  if (typeof output === "string") {
    resultUrl = output;
  } else if (output && typeof output === "object" && "url" in (output as any)) {
    resultUrl = (output as any).url;
  } else if (
    output &&
    typeof output === "object" &&
    Symbol.iterator in (output as any)
  ) {
    const arr = Array.isArray(output) ? output : [];
    resultUrl = typeof arr[0] === "string" ? arr[0] : String(output);
  } else {
    resultUrl = String(output);
  }

  console.log(`[replicate] Got result: ${resultUrl}`);

  return { video_url: resultUrl };
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
