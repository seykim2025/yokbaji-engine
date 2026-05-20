// E-01, E-02: Face detection — pure JS, no native modules, Vercel-safe
// Uses @tensorflow-models/blazeface with CPU backend + sharp for image preprocessing.

import { EngineError, ERROR_MESSAGES } from "./errors";

// Lazy-loaded singletons to avoid re-initialization across requests in the same VM
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let model: any = null;
let tfReady = false;

async function ensureModel() {
  if (model) return model;

  // Pure JS backend — no native bindings required
  const tf = await import("@tensorflow/tfjs");
  await import("@tensorflow/tfjs-backend-cpu");

  if (!tfReady) {
    await tf.ready();
    tfReady = true;
  }

  const blazeface = await import("@tensorflow-models/blazeface");
  model = await blazeface.load();
  return model;
}

const MIN_FACE_SIZE_PX = 32;   // face box width/height minimum
const MIN_SCORE = 0.75;        // confidence threshold

export interface FaceCheckResult {
  detected: true;
  faceCount: number;
  faceCheckMs: number;
}

export async function checkFace(imageBuffer: Buffer): Promise<FaceCheckResult> {
  const t0 = Date.now();

  // Decode image with sharp — validates format and gives us pixel data
  let pixelData: { data: Buffer; width: number; height: number };
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(imageBuffer)
      .resize({ width: 256, height: 256, fit: "inside", withoutEnlargement: true })
      .removeAlpha()         // ensure RGB (3 channels)
      .raw()
      .toBuffer({ resolveWithObject: true });
    pixelData = { data, width: info.width, height: info.height };
  } catch {
    throw new EngineError("UNSUPPORTED_IMAGE", ERROR_MESSAGES.UNSUPPORTED_IMAGE);
  }

  // Build a Uint8Array in RGB format that blazeface can consume as an ImageData-like object
  const tf = await import("@tensorflow/tfjs");
  const { data, width, height } = pixelData;

  // blazeface expects an ImageData, HTMLImageElement, HTMLVideoElement, or tf.Tensor3D
  // We'll pass a tf.Tensor3D directly: shape [height, width, 3]
  const tensor = tf.tensor3d(new Uint8Array(data), [height, width, 3]);

  let detections: Array<{ topLeft: [number, number]; bottomRight: [number, number]; probability: number[] }>;
  try {
    const detector = await ensureModel();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    detections = await detector.estimateFaces(tensor as any, false);
  } finally {
    tensor.dispose();
  }

  const faceCheckMs = Date.now() - t0;

  // Filter by confidence
  const confident = detections.filter((d) => (d.probability?.[0] ?? 1) >= MIN_SCORE);

  if (confident.length === 0) {
    throw new EngineError("FACE_NOT_DETECTED", ERROR_MESSAGES.FACE_NOT_DETECTED);
  }

  // E-02: check face size (box dimensions)
  const primary = confident.sort(
    (a, b) => (b.probability?.[0] ?? 0) - (a.probability?.[0] ?? 0)
  )[0];
  const boxW = Math.abs(primary.bottomRight[0] - primary.topLeft[0]);
  const boxH = Math.abs(primary.bottomRight[1] - primary.topLeft[1]);

  if (boxW < MIN_FACE_SIZE_PX || boxH < MIN_FACE_SIZE_PX) {
    throw new EngineError("FACE_TOO_SMALL", ERROR_MESSAGES.FACE_TOO_SMALL);
  }

  // Multiple high-confidence faces
  if (confident.length > 1 && (confident[1].probability?.[0] ?? 0) >= MIN_SCORE) {
    throw new EngineError("MULTIPLE_FACES_DETECTED", ERROR_MESSAGES.MULTIPLE_FACES_DETECTED);
  }

  return { detected: true, faceCount: confident.length, faceCheckMs };
}

// Blur check via pixel variance on a greyscale thumbnail
export async function checkBlur(imageBuffer: Buffer): Promise<void> {
  const sharp = (await import("sharp")).default;
  const { data } = await sharp(imageBuffer)
    .resize(64, 64, { fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data as Buffer);
  const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;
  const variance = pixels.reduce((a, b) => a + (b - mean) ** 2, 0) / pixels.length;

  if (variance < 40) {
    throw new EngineError("FACE_TOO_BLURRY", ERROR_MESSAGES.FACE_TOO_BLURRY);
  }
}
