// ============================================================
//  PUT YOUR GENIUS API TOKEN HERE
// ============================================================
const GENIUS_TOKEN = "katvCx1KErRSVpJY6gOtm7tU8P1yzsD2clfJztznu4PK5HWdU_maguT9imejCGzM";
// ============================================================

const https = require("https");

function request(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("Request timed out")); });
    req.on("error", reject);
    req.end();
  });
}

async function searchGenius(query) {
  const r = await request({
    hostname: "api.genius.com",
    path: "/search?q=" + encodeURIComponent(query),
    method: "GET",
    headers: {
      Authorization: "Bearer " + GENIUS_TOKEN,
      "User-Agent": "Mozilla/5.0",
    },
  });
  return JSON.parse(r.body);
}

async function fetchPage(url) {
  // Parse url manually to avoid URL constructor issues
  const noProto = url.replace("https://", "");
  const slashIdx = noProto.indexOf("/");
  const hostname = noProto.substring(0, slashIdx);
  const path = noProto.substring(slashIdx);

  const r = await request({
    hostname: hostname,
    path: path,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  // Follow one redirect if needed
  if (r.status >= 300 && r.status < 400 && r.headers.location) {
    let loc = r.headers.location;
    if (!loc.startsWith("http")) loc = "https://genius.com" + loc;
    return fetchPage(loc);
  }

  return r.body;
}

function extractLyrics(html) {
  try {
    // Try __NEXT_DATA__ first
    const m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
    if (m) {
      const json = JSON.parse(m[1]);
      const children =
        json?.props?.pageProps?.songPage?.lyricsData?.body?.children ||
        json?.props?.pageProps?.song?.lyrics?.body?.children;
      if (children) {
        const walk = (n) => {
          if (typeof n === "string") return n;
          if (Array.isArray(n)) return n.map(walk).join("");
          if (n && typeof n === "object" && n.children) return walk(n.children);
          return "";
        };
        const text = walk(children).replace(/\n{3,}/g, "\n\n").trim();
        if (text.length > 20) return text;
      }
    }
  } catch (e) {}

  try {
    // Fallback: data-lyrics-container
    let out = "";
    const re = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/gi;
    let m;
    while ((m = re.exec(html)) !== null) out += m[1] + "\n";
    if (out.length > 20) {
      return out
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?(p|div|h\d)[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"').replace(/&#039;/g, "'")
        .replace(/\n{3,}/g, "\n\n").trim();
    }
  } catch (e) {}

  return null;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const q = req.query && req.query.q;

  if (!q) {
    return res.status(200).json({ status: "ok" });
  }

  if (!GENIUS_TOKEN || GENIUS_TOKEN === "PASTE_YOUR_GENIUS_TOKEN_HERE") {
    return res.status(500).json({ error: "No token configured" });
  }

  try {
    const search = await searchGenius(q);
    const hits = search && search.response && search.response.hits;

    if (!hits || hits.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    const result = hits[0].result;

    let lyrics = null;
    try {
      const html = await fetchPage(result.url);
      lyrics = extractLyrics(html);
    } catch (e) {
      lyrics = null;
    }

    const trimmed = lyrics
      ? (lyrics.length > 1500 ? lyrics.substring(0, 1500) + "\n..." : lyrics)
      : "Lyrics unavailable — view on Genius.";

    return res.status(200).json({
      title: result.title || "",
      artist: (result.primary_artist && result.primary_artist.name) || "",
      url: result.url || "",
      lyrics: trimmed,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
};
