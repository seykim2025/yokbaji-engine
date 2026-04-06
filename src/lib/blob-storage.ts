import * as fs from "fs";
import * as path from "path";
import { getStorageDir } from "./paths";

/**
 * Storage abstraction: uses Vercel Blob in production, local filesystem in dev.
 *
 * When BLOB_READ_WRITE_TOKEN is set, all reads/writes go to Vercel Blob.
 * Otherwise, falls back to file-based storage under getStorageDir().
 */

function isBlobEnabled(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// Lazy-load @vercel/blob to avoid errors when not installed or not configured
let _blobModule: typeof import("@vercel/blob") | null = null;
async function getBlobModule() {
  if (!_blobModule) {
    _blobModule = await import("@vercel/blob");
  }
  return _blobModule;
}

/**
 * Upload a file (Buffer or ReadableStream) and return a public URL.
 * In local mode, writes to disk and returns a relative path.
 */
export async function uploadFile(
  blobPath: string,
  data: Buffer | ReadableStream | Blob,
  contentType?: string
): Promise<string> {
  if (isBlobEnabled()) {
    const { put } = await getBlobModule();
    const blob = await put(blobPath, data, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      ...(contentType ? { contentType } : {}),
    });
    return blob.url;
  }

  // Local fallback: write to storage dir
  const localPath = path.join(getStorageDir(), blobPath);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  if (Buffer.isBuffer(data)) {
    fs.writeFileSync(localPath, data);
  } else if (data instanceof Blob) {
    const buf = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(localPath, buf);
  } else {
    // ReadableStream
    const chunks: Buffer[] = [];
    const reader = (data as ReadableStream).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
    fs.writeFileSync(localPath, Buffer.concat(chunks));
  }
  return localPath;
}

/**
 * Upload a JSON object. Returns the URL/path.
 */
export async function uploadJson(
  blobPath: string,
  data: unknown
): Promise<string> {
  const json = JSON.stringify(data, null, 2);
  return uploadFile(blobPath, Buffer.from(json, "utf-8"), "application/json");
}

/**
 * Download a file as a Buffer.
 * Accepts either a Blob URL (https://...) or a local path.
 */
export async function downloadFile(urlOrPath: string): Promise<Buffer> {
  if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
    const response = await fetch(urlOrPath);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  // Local path
  return fs.readFileSync(urlOrPath);
}

/**
 * Download and parse a JSON file.
 */
export async function downloadJson<T = unknown>(
  urlOrPath: string
): Promise<T | null> {
  try {
    const buf = await downloadFile(urlOrPath);
    return JSON.parse(buf.toString("utf-8")) as T;
  } catch {
    return null;
  }
}

/**
 * List blob paths with a given prefix.
 * In local mode, scans the storage directory.
 */
export async function listFiles(prefix: string): Promise<string[]> {
  if (isBlobEnabled()) {
    const { list } = await getBlobModule();
    const urls: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await list({
        prefix,
        ...(cursor ? { cursor } : {}),
      });
      for (const blob of result.blobs) {
        urls.push(blob.url);
      }
      cursor = result.hasMore ? result.cursor : undefined;
    } while (cursor);
    return urls;
  }

  // Local fallback: scan directory
  const dir = path.join(getStorageDir(), prefix);
  if (!fs.existsSync(dir)) return [];
  const entries: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else {
        entries.push(full);
      }
    }
  };
  walk(dir);
  return entries;
}

/**
 * Delete a file by URL or path.
 */
export async function deleteFile(urlOrPath: string): Promise<void> {
  if (
    isBlobEnabled() &&
    (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://"))
  ) {
    const { del } = await getBlobModule();
    await del(urlOrPath);
    return;
  }

  // Local fallback
  if (fs.existsSync(urlOrPath)) {
    fs.unlinkSync(urlOrPath);
  }
}

/**
 * Check if we're using Blob storage or local filesystem.
 */
export function isUsingBlobStorage(): boolean {
  return isBlobEnabled();
}
