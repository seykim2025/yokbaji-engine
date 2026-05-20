// Asset storage via Vercel Blob (BLOB_READ_WRITE_TOKEN auto-injected by Vercel)

import { put } from "@vercel/blob";
import * as crypto from "crypto";

export async function saveImage(buffer: Buffer, ext: string): Promise<string> {
  const filename = `chars/${crypto.randomBytes(12).toString("hex")}.${ext}`;
  const { url } = await put(filename, buffer, {
    access: "public",
    contentType: ext === "png" ? "image/png" : "image/jpeg",
  });
  return url;
}

export async function saveVideo(buffer: Buffer, characterId: string, assetCode: string): Promise<string> {
  const filename = `reactions/${characterId}_${assetCode}.mp4`;
  const { url } = await put(filename, buffer, {
    access: "public",
    contentType: "video/mp4",
  });
  return url;
}
