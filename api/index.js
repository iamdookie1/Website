// ============================================================
//  PUT YOUR GENIUS API TOKEN HERE
// ============================================================
const GENIUS_TOKEN = "katvCx1KErRSVpJY6gOtm7tU8P1yzsD2clfJztznu4PK5HWdU_maguT9imejCGzM";
// ============================================================

const https = require("https");
const { URL } = require("url");

function httpsGet(hostname, path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname,
      path,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const u = new URL(res.headers.location.startsWith("http") ? res.headers.location : "https://genius.com" + res.headers.location);
        return resolve(httpsGet(u.hostname, u.pathname + u.search));
      }
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.end();
  });
}

function geniusSearch(query) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.genius.com",
      path: `/search?q=${encodeURIComponent(query)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${GENIUS_TOKEN}`,
        "User-Agent": "BDSCRIPT-Proxy/1.0",
      },
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error("Failed to parse Genius response")); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

function scrapeLyrics(html) {
  // Method 1: Try __NEXT_DATA__ JSON blob (modern Genius)
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const json = JSON.parse(nextDataMatch[1]);
      // Walk the tree to find lyrics children
      const song = json?.props?.pageProps?.songPage?.lyricsData?.body?.children;
      if (song) {
        const extractText = (node) => {
          if (typeof node === "string") return node;
          if (Array.isArray(node)) return node.map(extractText).join("");
          if (node?.children) return extractText(node.children);
          return "";
        };
        const lyrics = extractText(song).replace(/\n{3,}/g, "\n\n").trim();
        if (lyrics.length > 10) return lyrics;
      }
    } catch {}
  }

  // Method 2: data-lyrics-container divs (older Genius pages)
  let lyrics = "";
  const containerRegex = /data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/gi;
  let match;
  while ((match = containerRegex.exec(html)) !== null) {
    lyrics += match[1] + "\n";
  }

  if (lyrics.length > 10) {
    lyrics = lyrics
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6])>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return lyrics;
  }

  return null;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (!req.query.q) {
    res.status(200).json({ status: "ok", message: "Genius proxy is running!" });
    return;
  }

  if (!GENIUS_TOKEN || GENIUS_TOKEN === "PASTE_YOUR_GENIUS_TOKEN_HERE") {
    res.status(500).json({ error: "No Genius token set in index.js" });
    return;
  }

  try {
    const data = await geniusSearch(req.query.q);
    const hits = data?.response?.hits;
    if (!hits || hits.length === 0) {
      res.status(404).json({ error: "No results found" });
      return;
    }

    const result = hits[0].result;
    const u = new URL(result.url);
    const html = await httpsGet(u.hostname, u.pathname + u.search);
    const lyrics = scrapeLyrics(html);

    const trimmed = lyrics
      ? lyrics.substring(0, 1500) + (lyrics.length > 1500 ? "\n..." : "")
      : null;

    res.status(200).json({
      title: result.title || "",
      artist: result.primary_artist?.name || "",
      url: result.url || "",
      lyrics: trimmed || "Lyrics not found.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
  }

  if (containers.length === 0) return null;

  let lyrics = containers.join("\n");
  lyrics = lyrics.replace(/<br\s*\/?>/gi, "\n");
  lyrics = lyrics.replace(/<\/(p|div|h[1-6])>/gi, "\n");
  lyrics = lyrics.replace(/<[^>]+>/g, "");
  lyrics = lyrics
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'");
  lyrics = lyrics.replace(/\n{3,}/g, "\n\n").trim();
  return lyrics;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  if (!req.query.q) {
    res.status(200).json({ status: "ok", message: "Genius proxy is running!" });
    return;
  }

  if (!GENIUS_TOKEN || GENIUS_TOKEN === "PASTE_YOUR_GENIUS_TOKEN_HERE") {
    res.status(500).json({ error: "No Genius token set in index.js" });
    return;
  }

  try {
    const data = await geniusSearch(req.query.q);
    const hits = data?.response?.hits;
    if (!hits || hits.length === 0) {
      res.status(404).json({ error: "No results found" });
      return;
    }

    const result = hits[0].result;
    const lyricsPageUrl = result.url;
    const u = new URL(lyricsPageUrl);

    const html = await httpsGet({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
    });

    const lyrics = scrapeLyrics(html);

    res.status(200).json({
      title: result.title || "",
      artist: result.primary_artist?.name || "",
      url: lyricsPageUrl,
      lyrics: lyrics
        ? lyrics.substring(0, 1800) + (lyrics.length > 1800 ? "\n..." : "")
        : "Lyrics not found.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
