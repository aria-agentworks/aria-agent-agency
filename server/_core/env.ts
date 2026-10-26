// Platform values are read at use time. See the Webdev service/authentication skills.
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Zero-config fallback secret: the first start generates a stable secret and
 * persists it under data/ so sessions survive restarts without any setup.
 */
function persistedFallbackSecret(): string {
  try {
    const dir = path.resolve(process.cwd(), "data");
    const file = path.join(dir, "auth-secret");
    if (existsSync(file)) {
      const existing = readFileSync(file, "utf8").trim();
      if (existing.length >= 32) return existing;
    }
    const generated = randomBytes(48).toString("base64url");
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, generated, { mode: 0o600 });
    return generated;
  } catch {
    // Last resort for read-only filesystems: a stable derived value.
    return createHash("sha256")
      .update(`aria-fallback-${process.cwd()}`)
      .digest("hex");
  }
}

export const ENV = {
  get appId() {
    return (
      process.env.MANUS_PROJECT_ID ??
      process.env.APP_ID ??
      "aria-agent-agency"
    );
  },
  get cookieSecret() {
    return (
      process.env.MANUS_JWT_SECRET ??
      process.env.AUTH_SECRET ??
      persistedFallbackSecret()
    );
  },
  get databaseUrl() { return process.env.DATABASE_URL ?? ""; },
  get oAuthServerUrl() { return process.env.MANUS_OAUTH_API_URL ?? ""; },
  // Preserve the legacy hint when supplied; otherwise roles remain application data.
  get ownerOpenId() { return process.env.OWNER_OPEN_ID ?? ""; },
  get isProduction() { return process.env.NODE_ENV === "production"; },
  get forgeApiUrl() { return process.env.MANUS_API_URL ?? ""; },
  get forgeApiKey() { return process.env.MANUS_API_KEY ?? ""; },
  /** When true, the built-in email/password provider is used for sign-in. */
  get localAuthEnabled() {
    return process.env.DISABLE_LOCAL_AUTH !== "1";
  },
  /** First registered account becomes the agency owner (admin). */
  get claimFirstAdmin() {
    return process.env.CLAIM_FIRST_ADMIN !== "0";
  },
};
