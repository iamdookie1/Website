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

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  const q = (req.query || {}).q;

  // Health check
  if (!q) return res.status(200).json({ status: "ok" });

  try {
    // Step 1: Search Genius for title + artist
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
    const title = result.title || "";
    const artist = (result.primary_artist && result.primary_artist.name) || "";
    const url = result.url || "";

    // Step 2: Fetch lyrics from lyrics.ovh (free, no auth needed)
    let lyrics = null;
    try {
      const lyricRes = await get(
        "api.lyrics.ovh",
        "/v1/" + encodeURIComponent(artist) + "/" + encodeURIComponent(title)
      );
      if (lyricRes.status === 200) {
        const lyricData = JSON.parse(lyricRes.body);
        if (lyricData && lyricData.lyrics) {
          const raw = lyricData.lyrics.replace(/\n{3,}/g, "\n\n").trim();
          lyrics = raw.length > 1500 ? raw.substring(0, 1500) + "\n..." : raw;
        }
      }
    } catch (e) {}

    return res.status(200).json({
      title,
      artist,
      url,
      lyrics: lyrics || "Lyrics not available.",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown error" });
  }
};
