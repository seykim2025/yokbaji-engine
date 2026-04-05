import path from "path";

const IS_VERCEL = !!process.env.VERCEL;

/** Project root — used for assets bundled with the deployment */
export function getProjectRoot(): string {
  return path.resolve(__dirname, "../..");
}

/** Writable storage directory — /tmp on Vercel, ./storage locally */
export function getStorageDir(): string {
  if (IS_VERCEL) {
    return "/tmp/yokbaji-storage";
  }
  return path.resolve(getProjectRoot(), "storage");
}

/** Assets directory — bundled with the project in both environments */
export function getAssetsDir(): string {
  return path.resolve(getProjectRoot(), "assets");
}
