/**
 * Server-only page fetcher. Follows redirects (including share.google-style
 * wrappers and meta-refresh hops) and returns readable text plus link preview
 * metadata for any URL — job posting or not.
 */
export type LinkPreview = {
  requestedUrl: string;
  finalUrl: string;
  siteName: string;
  title: string;
  description: string;
  image: string;
  favicon: string;
};

function attr(html: string, re: RegExp): string {
  const m = html.match(re);
  return m?.[1]?.trim() ?? "";
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function meta(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, "i"),
  ];
  for (const p of patterns) {
    const v = attr(html, p);
    if (v) return decode(v);
  }
  return "";
}

function absolute(base: string, href: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return "";
  }
}

async function get(url: string): Promise<{ html: string; finalUrl: string }> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Could not open that link (HTTP ${res.status}).`);
  return { html: await res.text(), finalUrl: res.url || url };
}

/** Resolves wrapper/shortener pages that redirect via meta-refresh or JS. */
function nextHop(html: string, currentUrl: string): string | null {
  const refresh = attr(
    html,
    /<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^"']+)["']/i,
  );
  if (refresh) {
    const abs = absolute(currentUrl, decode(refresh));
    if (abs && abs !== currentUrl) return abs;
  }
  const js = attr(
    html,
    /(?:location\.(?:replace|href\s*=)|window\.location\s*=)\s*["']([^"']+)["']/i,
  );
  if (js) {
    const abs = absolute(currentUrl, decode(js));
    if (abs && abs !== currentUrl) return abs;
  }
  // Google/LinkedIn share wrappers often keep the destination in a canonical tag.
  try {
    const host = new URL(currentUrl).hostname;
    if (/(^|\.)(share\.google|goo\.gl|lnkd\.in|t\.co|bit\.ly|l\.facebook\.com)$/i.test(host)) {
      const canonical = attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      const abs = canonical ? absolute(currentUrl, decode(canonical)) : "";
      if (abs && new URL(abs).hostname !== host) return abs;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function toText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchReadableText(
  url: string,
): Promise<{ text: string; preview: LinkPreview }> {
  let current = url;
  let page = await get(current);
  current = page.finalUrl;

  for (let i = 0; i < 2; i++) {
    const hop = nextHop(page.html, current);
    if (!hop) break;
    page = await get(hop);
    current = page.finalUrl;
  }

  const html = page.html;
  let host = "";
  try {
    host = new URL(current).hostname.replace(/^www\./, "");
  } catch {
    /* ignore */
  }

  const rawTitle = attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const image = meta(html, "og:image") || meta(html, "twitter:image");
  const icon =
    attr(html, /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i) ||
    "/favicon.ico";

  const preview: LinkPreview = {
    requestedUrl: url,
    finalUrl: current,
    siteName: meta(html, "og:site_name") || host,
    title: meta(html, "og:title") || decode(rawTitle) || host,
    description: meta(html, "og:description") || meta(html, "description") || "",
    image: image ? absolute(current, image) : "",
    favicon: absolute(current, icon),
  };

  return { text: toText(html).slice(0, 18000), preview };
}
