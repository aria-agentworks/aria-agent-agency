import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { getDb, getUserByEmail, upsertUser } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_MAX_LENGTH = 320;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

const loginAttempts = new Map<string, number[]>();

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const recent = (loginAttempts.get(key) ?? []).filter(t => now - t < LOGIN_WINDOW_MS);
  return recent.length >= LOGIN_MAX_ATTEMPTS;
}

function recordAttempt(key: string) {
  const now = Date.now();
  const recent = (loginAttempts.get(key) ?? []).filter(t => now - t < LOGIN_WINDOW_MS);
  recent.push(now);
  loginAttempts.set(key, recent);
}

function clearAttempts(key: string) {
  loginAttempts.delete(key);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string | null
): Promise<boolean> {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function isValidEmail(value: string): boolean {
  return value.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(value);
}

async function establishSession(
  res: Response,
  req: Request,
  openId: string,
  name: string
) {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
}

/**
 * Built-in email/password provider. Works on any server with zero platform
 * dependencies; the platform OAuth callback keeps working when configured.
 */
export function registerLocalAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    if (!ENV.localAuthEnabled) {
      res.status(403).json({ error: "Local accounts are disabled." });
      return;
    }
    const key = `register:${clientKey(req)}`;
    if (tooManyAttempts(key)) {
      res.status(429).json({ error: "Too many attempts. Please try later." });
      return;
    }
    recordAttempt(key);
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!name || name.length > 160) {
      res.status(400).json({ error: "Please provide your name." });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: "A valid email is required." });
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH || password.length > 200) {
      res.status(400).json({
        error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
      });
      return;
    }
    const db = await getDb();
    if (!db) {
      res.status(503).json({ error: "Accounts are unavailable right now." });
      return;
    }
    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        res.status(409).json({
          error: "An account with this email already exists. Please sign in.",
        });
        return;
      }
      const openId = `local_${nanoid(18)}`;
      const passwordHash = await hashPassword(password);
      const isAdmin =
        ENV.claimFirstAdmin &&
        (await db.select({ id: users.id }).from(users).limit(1)).length === 0;
      await upsertUser({
        openId,
        name,
        email,
        loginMethod: "email",
        passwordHash,
        role: isAdmin ? "admin" : "user",
        lastSignedIn: new Date(),
      });
      clearAttempts(key);
      await establishSession(res, req, openId, name);
      const created = await getUserByEmail(email);
      res.status(201).json({
        id: created?.id,
        name: created?.name,
        email: created?.email,
        role: created?.role,
      });
    } catch (error) {
      console.error(
        "[Auth] register failed",
        error instanceof Error ? error.message : "unknown"
      );
      res.status(503).json({ error: "Unable to create the account right now." });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    if (!ENV.localAuthEnabled) {
      res.status(403).json({ error: "Local accounts are disabled." });
      return;
    }
    const key = `login:${clientKey(req)}`;
    if (tooManyAttempts(key)) {
      res.status(429).json({ error: "Too many attempts. Please try later." });
      return;
    }
    recordAttempt(key);
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    if (!isValidEmail(email) || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }
    try {
      const user = await getUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        res.status(401).json({ error: "Incorrect email or password." });
        return;
      }
      await upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      clearAttempts(key);
      await establishSession(res, req, user.openId, user.name ?? "");
      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      console.error(
        "[Auth] login failed",
        error instanceof Error ? error.message : "unknown"
      );
      res.status(503).json({ error: "Sign-in is unavailable right now." });
    }
  });

  app.get("/api/auth/local-status", (_req: Request, res: Response) => {
    res.json({ enabled: ENV.localAuthEnabled });
  });
}
