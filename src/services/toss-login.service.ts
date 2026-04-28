import https from "https";
import crypto from "crypto";

const TOSS_API_BASE = "https://apps-in-toss-api.toss.im";
const TOKEN_PATH = "/api-partner/v1/apps-in-toss/user/oauth2/generate-token";
const USER_PATH = "/api-partner/v1/apps-in-toss/user/oauth2/login-me";

function getMtlsAgent(): https.Agent | undefined {
  const cert = process.env.TOSS_MTLS_CERT;
  const key = process.env.TOSS_MTLS_KEY;
  if (!cert || !key) return undefined;
  return new https.Agent({ cert, key });
}

function httpsPost(path: string, body: object, agent: https.Agent): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options: https.RequestOptions = {
      hostname: "apps-in-toss-api.toss.im",
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
      agent,
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode ?? 0, data: {} }); }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function httpsGet(path: string, accessToken: string, agent: https.Agent): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: "apps-in-toss-api.toss.im",
      path,
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      agent,
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => { raw += chunk; });
      res.on("end", () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode ?? 0, data: {} }); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

// AES-256-GCM decrypt — key: base64, iv prepended to ciphertext, aad provided separately
function decryptField(encryptedB64: string, keyB64: string, aad: string): string {
  const IV_LEN = 12;
  const buf = Buffer.from(encryptedB64, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(buf.length - 16);
  const ct = buf.subarray(IV_LEN, buf.length - 16);
  const key = Buffer.from(keyB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  decipher.setAAD(Buffer.from(aad));
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export interface TossLoginResult {
  userKey: number;
  name?: string;
}

export async function exchangeAuthCode(
  authorizationCode: string,
  referrer: string
): Promise<TossLoginResult> {
  const agent = getMtlsAgent();
  if (!agent) {
    throw Object.assign(new Error("mTLS not configured"), { code: "MTLS_NOT_CONFIGURED" });
  }

  // 1. Exchange authorizationCode for accessToken
  const tokenRes = await httpsPost(TOKEN_PATH, { authorizationCode, referrer }, agent);
  const tokenData = tokenRes.data as Record<string, unknown>;
  if (tokenRes.status !== 200 || !tokenData.accessToken) {
    throw Object.assign(new Error("Token exchange failed"), { code: "TOKEN_EXCHANGE_FAILED" });
  }
  const accessToken = tokenData.accessToken as string;

  // 2. Fetch user info
  const userRes = await httpsGet(USER_PATH, accessToken, agent);
  const userData = userRes.data as Record<string, unknown>;
  if (userRes.status !== 200 || typeof userData.userKey !== "number") {
    throw Object.assign(new Error("User fetch failed"), { code: "USER_FETCH_FAILED" });
  }

  const result: TossLoginResult = { userKey: userData.userKey as number };

  // 3. Optionally decrypt name (if decryption key is configured and name is present)
  const decryptKey = process.env.TOSS_DECRYPT_KEY;
  const decryptAad = process.env.TOSS_DECRYPT_AAD;
  if (decryptKey && decryptAad && typeof userData.name === "string") {
    try {
      result.name = decryptField(userData.name, decryptKey, decryptAad);
    } catch {
      // name decryption failure is non-fatal; omit field
    }
  }

  return result;
}

export function verifyUnlinkCallback(authHeader: string): boolean {
  const expected = process.env.TOSS_UNLINK_BASIC_AUTH;
  if (!expected) return true; // not configured → accept (log only)
  const encoded = Buffer.from(expected).toString("base64");
  return authHeader === `Basic ${encoded}`;
}
