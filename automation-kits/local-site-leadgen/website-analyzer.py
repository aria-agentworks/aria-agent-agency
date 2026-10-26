#!/usr/bin/env python3
"""leadgen-analyze: fetch a business website, score it 0-100, extract brand data as JSON.

Usage:
  python3 run.py <url> [--contact-paths /contact,/about] [--timeout 20]

Stdlib only (works on HTTPS-only sandboxes). Prints one JSON object.
"""
import argparse
import json
import re
import ssl
import sys
import urllib.request
from collections import Counter
from html.parser import HTMLParser

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
SOCIAL_PATTERNS = [
    ("facebook", r"facebook\.com/"), ("instagram", r"instagram\.com/"),
    ("twitter_x", r"(twitter|x)\.com/"), ("linkedin", r"linkedin\.com/"),
    ("youtube", r"youtube\.com/"), ("whatsapp", r"wa\.me/|whatsapp"),
    ("google_maps", r"maps\.google|goo\.gl/maps"),
]
HEX_RE = re.compile(r"#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")
PHONE_RE = re.compile(r"(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,5}\)?[\s-]?){2,4}\d{2,5}")
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
MEDIA_RE = re.compile(r"@media")


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False
        self.metas = []
        self.css_links = []
        self.links = []
        self.imgs = []
        self.styles = []
        self.headings = {"h1": [], "h2": [], "h3": []}
        self.lis = []
        self.paragraphs = []
        self.all_text_chunks = []
        self._cur_heading = None
        self._cur_text = []
        self._cur_p = None
        self._style_buf = None
        self._skip_depth = 0  # script/style/noscript

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "noscript", "head" if tag == "head" else "___"):
            pass
        if tag in ("script", "noscript"):
            self._skip_depth += 1
        if tag == "style":
            self._style_buf = []
        elif tag == "title":
            self.in_title = True
            self._cur_text = []
        elif tag == "meta":
            self.metas.append(a)
        elif tag == "link" and (a.get("rel") or "").lower() in ("stylesheet", "style"):
            self.css_links.append(a.get("href") or "")
        elif tag == "a":
            self.links.append(a)
        elif tag == "img":
            self.imgs.append(a)
        elif tag in ("h1", "h2", "h3"):
            self._cur_heading = tag
            self._cur_text = []
        elif tag == "li":
            self._cur_text = []
            self._cur_p = "li"
        elif tag == "p":
            self._cur_text = []
            self._cur_p = "p"
        elif tag in ("script", "noscript", "style"):
            pass

    def handle_endtag(self, tag):
        if tag == "style" and self._style_buf is not None:
            self.styles.append("".join(self._style_buf))
            self._style_buf = None
            self._skip_depth = max(0, self._skip_depth - 1)
            return
        if tag in ("script", "noscript"):
            self._skip_depth = max(0, self._skip_depth - 1)
        text = "".join(self._cur_text).strip() if self._cur_text else ""
        if tag == "title":
            self.title = " ".join(text.split())
            self.in_title = False
        elif self._cur_heading and tag == self._cur_heading and text:
            self.headings[tag].append(" ".join(text.split())[:200])
            self._cur_heading = None
        elif tag == "li" and self._cur_p == "li" and text:
            self.lis.append(" ".join(text.split())[:200])
            self._cur_p = None
        elif tag == "p" and self._cur_p == "p" and text:
            self.paragraphs.append(" ".join(text.split())[:600])
            self._cur_p = None
        self._cur_text = []

    def handle_data(self, data):
        if self._skip_depth:
            if self._style_buf is not None:
                self._style_buf.append(data)
            return
        if self.in_title or self._cur_heading or self._cur_p:
            self._cur_text.append(data)
        stripped = data.strip()
        if stripped:
            self.all_text_chunks.append(stripped)

    # style content can also arrive via attributes
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)


def fetch(url, timeout):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*;q=0.8",
                                               "Accept-Language": "en-US,en;q=0.9"})
    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        ctype = r.headers.get("Content-Type", "")
        raw = r.read(2_000_000)
        final = r.geturl()
    if "html" not in ctype and not raw.lstrip()[:100].lower().startswith(b"<!doctype") and b"<html" not in raw[:500].lower():
        return None, final, "non_html_content_type: " + ctype
    for enc in ("utf-8", "latin-1"):
        try:
            return raw.decode(enc, errors="replace"), final, None
        except Exception:
            continue
    return raw.decode("utf-8", errors="replace"), final, None


def parse(html):
    p = PageParser()
    try:
        p.feed(html)
    except Exception:
        pass
    return p


def norm_url(u):
    if not u:
        return ""
    u = u.strip()
    if not u.startswith(("http://", "https://")):
        u = "https://" + u
    return u.rstrip("/")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("url")
    ap.add_argument("--contact-paths", default="/contact,/about")
    ap.add_argument("--timeout", type=int, default=20)
    args = ap.parse_args()
    base = norm_url(args.url)
    out = {"ok": False, "input_url": base, "final_url": None, "fetch_error": None,
           "score": 0, "score_breakdown": {}, "data": {}, "pages_checked": []}

    homepage_html, final_url, err = None, base, None
    try:
        homepage_html, final_url, err = fetch(base, args.timeout)
    except Exception as e:
        out["fetch_error"] = f"{type(e).__name__}: {e}"
        print(json.dumps(out))
        return
    if homepage_html is None:
        out["fetch_error"] = err or "could not fetch homepage"
        print(json.dumps(out))
        return

    root = final_url.rstrip("/")
    pages = [("/", final_url, parse(homepage_html), homepage_html)]
    checked = [final_url]
    for path in [p.strip() for p in args.contact_paths.split(",") if p.strip()]:
        try:
            candidate = root + (path if path.startswith("/") else "/" + path)
            html_c, final_c, _ = fetch(candidate, args.timeout)
            if html_c:
                pages.append((path, final_c, parse(html_c), html_c))
                checked.append(final_c)
        except Exception:
            continue
    home_p = pages[0][2]
    # fetch up to 3 external stylesheets from the homepage (for @media / colors)
    css_blob_parts = []
    from urllib.parse import urljoin
    css_hrefs = []
    for h in home_p.css_links:
        full = urljoin(final_url, h)
        if full.startswith("http") and full not in css_hrefs:
            css_hrefs.append(full)
    for h in css_hrefs[:3]:
        try:
            req2 = urllib.request.Request(h, headers={"User-Agent": UA})
            with urllib.request.urlopen(req2, timeout=args.timeout) as r2:
                css_blob_parts.append(r2.read(800_000).decode("utf-8", errors="replace"))
        except Exception:
            continue
    external_css = "\n".join(css_blob_parts)

    out["pages_checked"] = checked
    out["final_url"] = final_url

    blob = "\n".join(h.lower() for (_, _, _, h) in pages) + "\n" + external_css.lower()
    text_blob = "\n".join("\n".join(p.all_text_chunks) for (_, _, p, _) in pages)

    # ---------- extraction ----------
    meta = {m.get("name", m.get("property", "")).lower(): m.get("content", "")
            for (_, _, p, _) in pages for m in p.metas if m.get("content")}
    title = home_p.title
    biz_name = title
    for sep in ("|", "–", "—", "-", "::"):
        if sep in title:
            parts = [s.strip() for s in title.split(sep) if s.strip()]
            if parts:
                biz_name = parts[0]
            break

    hrefs = [a.get("href", "") for (_, _, p, _) in pages for a in p.links]
    text_links = " ".join(hrefs)

    emails = set(EMAIL_RE.findall(text_blob + " " + " ".join(hrefs)))
    # filter junk
    emails = {e.lower() for e in emails if not re.search(r"\.(png|jpg|jpeg|gif|webp|svg|css|js)$", e)
              and "example." not in e and "sentry" not in e and "wixpress" not in e}

    phones = set()
    for h in hrefs:
        if h.startswith("tel:"):
            phones.add(re.sub(r"[^\d+]", "", h[4:]))
    if not phones:
        m = PHONE_RE.search(text_blob)
        if m:
            phones.add(m.group(0))

    socials = {}
    for name, pat in SOCIAL_PATTERNS:
        for h in hrefs:
            if re.search(pat, h, re.I) and h.startswith("http"):
                socials.setdefault(name, h)
                break

    # address hints: schema.org or element class, else keyword-anchored text
    address_hint = ""
    m = re.search(r'"streetAddress"\s*:\s*"([^"]+)"', blob)
    if m:
        address_hint = m.group(1)
    else:
        am = re.search(r"(address|addr)\s*[:\-]?\s*([A-Z0-9][^\n<]{15,140})", text_blob, re.I)
        if am:
            address_hint = am.group(2).strip()

    # colors: hex codes in styles + inline styles
    colors = Counter(HEX_RE.findall(external_css + "\n".join("\n".join(p.styles) for (_, _, p, _) in pages) + " " +
                                    " ".join(str(a) for (_, _, p, _) in pages for a in p.links)))
    brand_colors = [{"hex": ("#" + c if not c.startswith("#") else c), "count": n}
                    for c, n in colors.most_common(6) if n >= 2][:5]

    logo_url = ""
    og_img = meta.get("og:image", "")
    for img in home_p.imgs:
        src = (img.get("src") or img.get("data-src") or "")
        alt = (img.get("alt") or "").lower()
        cls = (img.get("class") or "").lower()
        if "logo" in alt or "logo" in src.lower() or "logo" in cls:
            logo_url = src
            break
    if not logo_url and og_img:
        logo_url = og_img

    # services: h2/h3/li containing service keywords or near "services"
    svc_kw = ("service", "treatment", "offer", "package", "class", "program",
              "haircut", "facial", "clean", "implant", "whitening", "membership")
    services = []
    for h in home_p.headings["h2"] + home_p.headings["h3"]:
        if len(h) > 3 and h.lower() not in ("services", "our services"):
            services.append(h)
    for li in home_p.lis:
        if 3 < len(li) < 80 and not EMAIL_RE.search(li) and len(services) < 25:
            services.append(li)
    services = list(dict.fromkeys(services))[:20]

    about_text = ""
    for para in home_p.paragraphs + [p for (_, _, p, _) in pages[1:] for p in p.paragraphs]:
        if len(para) > 80 and ("we " in para.lower() or "our " in para.lower() or "established" in para.lower()):
            about_text = para
            break
    if not about_text and home_p.paragraphs:
        about_text = max(home_p.paragraphs, key=len)

    hero_text = " ".join(home_p.headings["h1"][:1]) or (" ".join(home_p.headings["h2"][:2]))

    data = {
        "business_name": biz_name.strip() if biz_name.strip() else "",
        "title": title,
        "meta_description": meta.get("description", ""),
        "phone": sorted(phones)[0] if phones else "",
        "emails": sorted(emails),
        "address_hint": address_hint,
        "social_links": socials,
        "services": services,
        "about_text": about_text,
        "hero_text": hero_text,
        "brand_colors": brand_colors,
        "logo_url": logo_url,
    }
    out["data"] = data
    out["raw_text_excerpt"] = " ".join(text_blob.split())[:3000]

    # ---------- scoring ----------
    br = {}
    br["ssl"] = 15 if final_url.startswith("https://") else 0
    has_viewport = any("width=device-width" in (m.get("content") or "") for m in home_p.metas if (m.get("name") or "").lower() == "viewport")
    br["mobile_viewport"] = 15 if has_viewport else 0
    media_count = blob.count("@media")
    br["responsive_css"] = 15 if media_count >= 5 else (10 if media_count >= 2 else (5 if media_count >= 1 else 0))
    fw = 0
    fw_notes = []
    for pat, pts, note in [
        (r"cdn\.tailwindcss\.com|tailwind", 15, "tailwind"),
        (r"bootstrap(\.min)?\.(css|js)|getbootstrap", 13, "bootstrap"),
        (r"static\.parastorage|wixstatic|wix\.com", 14, "wix"),
        (r"squarespace|static1\.sqspcdn", 14, "squarespace"),
        (r"wp-content|wp-includes", 8, "wordpress"),
        (r"shopify|cdn\.shopify", 12, "shopify"),
        (r"webflow|wf-page", 13, "webflow"),
        (r"react|vue|next\.js|_next", 10, "spa-framework"),
    ]:
        if re.search(pat, blob):
            fw = max(fw, pts)
            fw_notes.append(note)
    br["modern_framework"] = {"points": fw, "notes": fw_notes}
    br["contact_info"] = 10 if (data["phone"] or data["emails"]) else 0
    br["social_presence"] = 10 if socials else 0
    dq = 0
    dq_notes = []
    if any((m.get("rel") or "") == "icon" for m in home_p.metas):
        dq += 2; dq_notes.append("favicon")
    if home_p.imgs:
        dq += 3; dq_notes.append(f"{len(home_p.imgs)} imgs")
    if meta.get("description"):
        dq += 2; dq_notes.append("meta_description")
    if home_p.headings["h1"]:
        dq += 2; dq_notes.append("h1")
    if re.search(r"fonts\.googleapis|@font-face", blob):
        dq += 3; dq_notes.append("webfont")
    if "<table" in blob and blob.count("<td") > 20:
        dq -= 5; dq_notes.append("table_layout")
    br["design_quality"] = {"points": max(0, min(15, dq)), "notes": dq_notes}

    total = (br["ssl"] + br["mobile_viewport"] + br["responsive_css"] +
             br["modern_framework"]["points"] + br["contact_info"] +
             br["social_presence"] + br["design_quality"]["points"])
    out["score"] = max(0, min(100, total))
    out["score_breakdown"] = br
    essentials = data["business_name"] and (data["phone"] or data["emails"])
    out["ok"] = bool(essentials)
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
