const messages = [
  {
    text: "You came in {u} mouth! 🤗",
    gif: "https://cdn.nsfwgify.com/92844/cumshots-scaled.webp"
  },
  {
    text: "You came all over {u} face! 🥵",
    gif: "https://cdn.nsfwgify.com/84105/asian-glass-cleaner-scaled.webp"
  },
  {
    text: "{u} is getting lots of cum from {a}! <3",
    gif: "https://cdn.nsfwgify.com/66599/blonde-cumslut-scaled.webp"
  }
];

export default function handler(req, res) {
  const pick = messages[Math.floor(Math.random() * messages.length)];
  res.status(200).json(pick);
}
