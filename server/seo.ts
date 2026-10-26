import type { Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { escapeHtml, getPageContent, publicPaths } from "../shared/pageContent";
export function registerPublicPages(app: Express) {
  const template = fs.readFileSync(
    path.resolve(process.cwd(), "dist/public/index.html"),
    "utf8"
  );
  const origin = process.env.PUBLIC_SITE_ORIGIN?.replace(/\/$/, "");
  app.get("/sitemap.xml", (_req, res) => {
    res
      .type("application/xml")
      .send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${origin ? publicPaths.map(p => `<url><loc>${escapeHtml(origin + p)}</loc></url>`).join("") : ""}</urlset>`
      );
  });
  app.get("/robots.txt", (_req, res) =>
    res
      .type("text/plain")
      .send(
        origin
          ? `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /orders\nDisallow: /cart\nSitemap: ${origin}/sitemap.xml\n`
          : "User-agent: *\nDisallow: /\n"
      )
  );
  app.use((req, res, next) => {
    if (
      req.method !== "GET" ||
      req.path.startsWith("/api/") ||
      req.path.startsWith("/manus-storage/") ||
      req.path.startsWith("/__") ||
      /\.[a-z0-9]+$/i.test(req.path)
    )
      return next();
    if (req.path !== "/" && req.path.endsWith("/")) {
      const normalized = req.path.replace(/\/+$/, "");
      if (!normalized.startsWith("//"))
        return res.redirect(
          301,
          normalized + req.originalUrl.slice(req.path.length)
        );
    }
    const data = getPageContent(req.path);
    const title = escapeHtml(data.title),
      desc = escapeHtml(data.description);
    const absolute = origin ? `${origin}${req.path}` : undefined;
    const image = origin ? `${origin}/aria-mark.svg` : undefined;
    const tags = `<title>${title}</title><meta name="description" content="${desc}"/><meta name="robots" content="${data.noindex ? "noindex,nofollow" : "index,follow"}"/><meta property="og:type" content="website"/><meta property="og:site_name" content="Aria Agent Agency"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${desc}"/>${absolute ? `<link rel="canonical" href="${escapeHtml(absolute)}"/><meta property="og:url" content="${escapeHtml(absolute)}"/>` : ""}${image ? `<meta property="og:image" content="${escapeHtml(image)}"/>` : ""}<meta name="twitter:card" content="summary"/><meta name="twitter:title" content="${title}"/><meta name="twitter:description" content="${desc}"/>${image ? `<meta name="twitter:image" content="${escapeHtml(image)}"/>` : ""}`;
    const markup = `<header class="site-header"><div class="header-inner"><a class="brand" href="/">aria.</a><nav class="navigation" aria-label="Main navigation"><a href="/automations">Automations</a><a href="/industries">Industries</a><a href="/how-it-works">How it works</a><a href="/demo">Try a demo</a></nav><a class="button dark small" href="/implementation">Let us build it</a></div></header><main class="container"><div class="page-heading"><h1>${escapeHtml(data.heading)}</h1></div>${data.body}</main><footer class="site-footer"><p>Aria Agent Agency · Configurable business automation. <a href="/faq">FAQs and support</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Purchase information</a></p></footer>`;
    const html = template
      .replace(/<title>.*?<\/title>/s, "")
      .replace(/<meta\s+name="description"[^>]*>/g, "")
      .replace("</head>", tags + "</head>")
      .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
    res
      .status(data.missing ? 404 : 200)
      .set("Cache-Control", data.noindex ? "private, no-store" : "no-cache")
      .type("html")
      .send(html);
  });
}
