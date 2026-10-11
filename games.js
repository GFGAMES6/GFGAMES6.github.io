/* ============================================================
   GF Studio — GAME CATALOG
   To add a game: copy one block below, paste it in the list,
   change the values, save. That's it.

   status : "released" | "testing" | "dev" | "soon"
   theme  : "violet" | "cyan" | "pink" | "green" | "amber"
   image  : optional cover, e.g. "img/my-game.jpg" (no image = abstract title artwork)
   links  : { label, href }  -> opens a link (Google Play, trailer, privacy…)
   ============================================================ */
window.GAMES = [
  {
    title: "Neon Shift",
    status: "testing",
    tagline: "A cosmic puzzle adventure. Shift, match, and ignite your way through a universe of vibrant challenges.",
    tags: ["Puzzle", "Mobile", "150 levels planned"],
    theme: "violet",
    links: [
      { label: "Privacy Policy", href: "https://gfgames6.github.io/-neon-shift-privacy/" }
    ]
  },
  {
    title: "Next game",
    status: "soon",
    tagline: "Something new is taking shape in the studio. Follow along to be first to know.",
    tags: ["Coming soon"],
    theme: "cyan",
    links: [
      { label: "Get updates", href: "#contact" }
    ]
  }
];

window.GAME_STATUS = {
  released: "AVAILABLE NOW",
  testing:  "IN CLOSED TESTING",
  dev:      "IN DEVELOPMENT",
  soon:     "COMING SOON"
};
