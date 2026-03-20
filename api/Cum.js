const data = [
  { msg: "You came in {u} mouth! 🤗", gif: "https://cdn.nsfwgify.com/92844/cumshots-scaled.webp" },
  { msg: "You came all over {u} face! 🥵", gif: "https://cdn.nsfwgify.com/84105/asian-glass-cleaner-scaled.webp" },
  { msg: "{u} is getting lots of cum from {a}! <3", gif: "https://cdn.nsfwgify.com/66599/blonde-cumslut-scaled.webp" }
];

function getIndex(seed) {
  if (seed !== undefined) return parseInt(seed) % data.length;
  return Math.floor(Date.now() / 10000) % data.length;
}

export default function handler(req, res) {
  const { type, u, a, i } = req.query;
  const index = getIndex(i);
  if (type === "gif") {
    res.status(200).send(data[index].gif.trim());
  } else {
    const msg = data[index].msg
      .replace("{u}", u ? `<@${u}>` : "{u}")
      .replace("{a}", a ? `<@${a}>` : "{a}");
    res.status(200).send(msg.trim());
  }
}
