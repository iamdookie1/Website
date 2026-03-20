const data = [
  { msg: "You came in {u} mouth! 🤗", gif: "https://cdn.nsfwgify.com/92844/cumshots-scaled.webp" },
  { msg: "You came all over {u} face! 🥵", gif: "https://cdn.nsfwgify.com/84105/asian-glass-cleaner-scaled.webp" },
  { msg: "{u} is getting lots of cum from {a}! <3", gif: "https://cdn.nsfwgify.com/66599/blonde-cumslut-scaled.webp" }
];

export default function handler(req, res) {
  const index = Math.floor(Math.random() * data.length);
  res.status(200).send(`${data[index].msg}\n${data[index].gif}`);
}
