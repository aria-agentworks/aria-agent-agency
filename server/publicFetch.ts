import { lookup } from "node:dns/promises";
import net from "node:net";

const DEFAULT_TIMEOUT_MS = 7000;
const DEFAULT_MAX_BYTES = 400_000;

function ipv4IsPrivate(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some(value => !Number.isInteger(value))) return true;
  const [a, b] = octets;
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function ipv6IsPrivate(address: string): boolean {
  const normalized = address.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:172.")
  );
}

export function isBlockedAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return ipv4IsPrivate(address);
  if (family === 6) return ipv6IsPrivate(address);
  return true;
}

export async function assertPublicHttpUrl(raw: string): Promise<URL> {
  const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(target);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
    throw new Error("Only public HTTP(S) URLs are allowed.");
  }
  if (!url.hostname || url.hostname === "localhost" || url.hostname.endsWith(".local")) {
    throw new Error("Private hostnames are not allowed.");
  }
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(entry => isBlockedAddress(entry.address))) {
    throw new Error("Private or non-routable hosts are not allowed.");
  }
  return url;
}

export async function fetchPublicHtml(
  raw: string,
  options: { timeoutMs?: number; maxBytes?: number; userAgent?: string } = {}
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  let current = await assertPublicHttpUrl(raw);

  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(current, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": options.userAgent ?? "AriaResearch/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect without a location.");
        current = await assertPublicHttpUrl(new URL(location, current).toString());
        continue;
      }
      if (!response.ok) throw new Error(`Remote site returned ${response.status}.`);
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
        throw new Error("Remote resource is not HTML.");
      }
      if (!response.body) return "";
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value) continue;
        const remaining = maxBytes - total;
        if (remaining <= 0) break;
        const chunk = value.byteLength <= remaining ? value : value.slice(0, remaining);
        chunks.push(chunk);
        total += chunk.byteLength;
        if (total >= maxBytes) break;
      }
      const bytes = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new TextDecoder().decode(bytes);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("Too many redirects.");
}
