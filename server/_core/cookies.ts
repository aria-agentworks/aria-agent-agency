import type { CookieOptions, Request } from "express";

/**
 * Preview is public HTTPS in a cross-site frame even when the upstream request
 * is HTTP. For standalone deployments served over plain HTTP (e.g. an office
 * server), fall back to a relaxed cookie so sign-in still works.
 */
export function getSessionCookieOptions(req: Request): CookieOptions {
  const proto =
    (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim() ||
    req.protocol ||
    "http";
  const isHttps = proto === "https";
  return isHttps
    ? { httpOnly: true, path: "/", sameSite: "none", secure: true }
    : { httpOnly: true, path: "/", sameSite: "lax", secure: false };
}
