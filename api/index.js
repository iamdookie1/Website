// ============================================================
const GENIUS_TOKEN = "zORAeDJHDFdrq8y5NH_jlzTmJ94K144i6VTYhO054lbdqir4QHzi3rsFq";
// ============================================================

const https = require("https");

function geniusFetch(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const options = {
      hostname: "api.genius.com",
      path: `/search?q=${encoded}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${GENIUS_TOKEN}`,
        "User-Agent": "BDSCRIPT-Proxy/1.0",
      },
    };
    const req = https.request(options, (res) => {
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
    const data = await geniusFetch(req.query.q);
    const hits = data?.response?.hits;
    if (!hits || hits.length === 0) {
      res.status(404).json({ error: "No results found" });
      return;
    }
    const result = hits[0].result;
    res.status(200).json({
      title: result.title || "",
      artist: result.primary_artist?.name || "",
      url: result.url || "",
      thumbnail: result.song_art_image_thumbnail_url || "",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
