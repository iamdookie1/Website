// ============================================================
//  PUT YOUR GENIUS API TOKEN HERE
// ============================================================
const GENIUS_TOKEN = "katvCx1KErRSVpJY6gOtm7tU8P1yzsD2clfJztznu4PK5HWdU_maguT9imejCGzM";
// ============================================================

const https = require("https");

function get(hostname, path, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: "GET", headers: headers || {} },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      }
    );
    req.setTimeout(7000, () => { req.destroy(); reject(new Error("timeout")); });
    req.on("error", reject);
    req.end();
  });
}

function splitLyrics(lyrics, chunkSize) {
  const chunks = [];
  const lines = lyrics.split("\n");
  let current = "";
  for (const line of lines) {
    const next = current ? current + "\n" + line : line;
    if (next.length > chunkSize) {
      if (current) chunks.push(current.trim());
      current = line;
    } else {
      current = next;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function sanitize(text) {
  return text
    // Remove [Section] headers like [Chorus], [Fetty Wap], [Verse 1] etc.
    .replace(/\[.*?\]/g, "")
    // Clean up extra blank lines left behind
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const q = (req.query || {}).q;
  if (!q) return res.status(200).json({ status: "ok" });

  try {
    // Step 1: Search Genius
    const searchRes = await get(
      "api.genius.com",
      "/search?q=" + encodeURIComponent(q),
      { Authorization: "Bearer " + GENIUS_TOKEN, "User-Agent": "proxy/1.0" }
    );

    const searchData = JSON.parse(searchRes.body);
    const hits = searchData && searchData.response && searchData.response.hits;
    if (!hits || hits.length === 0) {
      return res.status(404).json({ error: "No results found" });
    }

    const result = hits[0].result;
    const title  = result.title || "";
    const artist = (result.primary_artist && result.primary_artist.name) || "";
    const url    = result.url || "";

    // Step 2: Fetch lyrics from lyrics.ovh
    let chunks = [];
    try {
      const lyricRes = await get(
        "api.lyrics.ovh",
        "/v1/" + encodeURIComponent(artist) + "/" + encodeURIComponent(title)
      );
      if (lyricRes.status === 200) {
        const lyricData = JSON.parse(lyricRes.body);
        if (lyricData && lyricData.lyrics) {
          const raw = sanitize(lyricData.lyrics);
          // 1800 chars per chunk — safe buffer under Discord's 2000 limit
          chunks = splitLyrics(raw, 1800);
        }
      }
    } catch (e) {}

    return res.status(200).json({
      title,
      artist,
      url,
      total:   chunks.length || 0,
      lyrics1: chunks[0] || "Lyrics not available.",
      lyrics2: chunks[1] || "",
      lyrics3: chunks[2] || "",
      lyrics4: chunks[3] || "",
      lyrics5: chunks[4] || "",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
};
