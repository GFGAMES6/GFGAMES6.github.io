GF STUDIO - GITHUB PAGES

1. Create a PUBLIC repository named GFGAMES6.github.io under GFGAMES6.
2. Upload EVERYTHING in this folder to the repository root
   (index.html, styles.css, script.js, sculpture.js, favicon.svg, og-image.png, 404.html,
   robots.txt, sitemap.xml, games.js, .nojekyll). Make sure .nojekyll is included.
3. Settings > Pages > Deploy from a branch > main > /(root) > Save.
4. Check https://gfgames6.github.io/ once deployed.
5. Existing Neon Shift privacy policy remains at
   https://gfgames6.github.io/-neon-shift-privacy/ (linked in the footer).
6. app-ads.txt: get the real AdMob publisher ID from AdMob > Settings >
   Account information. Rename app-ads.EXAMPLE.txt to app-ads.txt, replace the
   placeholder ID, upload to root. NEVER publish the placeholder.
   AdMob may not verify app-ads.txt on a shared github.io subdomain; if it
   fails, use a custom domain you control.
7. Add https://gfgames6.github.io/ to the Google Play developer website field.

HOW TO ADD A NEW GAME
- Open games.js, copy one game block, paste it below, change title/status/
  tagline/tags/theme/links, save. A new card (and status filter) appears.
- Optional artwork: put an image in an img/ folder and set image: "img/name.jpg".

NEW IN THIS VERSION — BEYOND
- New graphite / warm white / lime visual identity and editorial layouts.
- Animated metallic 3D trefoil, generated locally using WebGL.
- Smooth per-pixel lighting, depth testing, subtle cursor response.
- Canvas 2D fallback; static SVG when canvas rendering is unavailable.
- Lime / Lilac / Ice atmosphere switch, remembered on this device.
- Pause / resume control; automatic reduced-motion preference support.
- Animation stops while its scene is offscreen or the tab is hidden.
- Capped rendering resolution and lower animation rate on touch devices.
- Refreshed game cards, abstract title artwork, preserved catalog filters.
- New studio section, contact section, footer, favicon and sharing image.
- Keyboard-accessible menu, Escape handling, skip link and focus outlines.
- Copy-email fallback stays visible if the browser blocks clipboard access.
- No package installation, build step or external JavaScript dependency.

QUICK PREVIEW
- Extract this archive, then open index.html in your browser.
- Google Fonts load when online; system fonts are used otherwise.
- Website functions remain available without external font access.
- Use Lime / Lilac / Ice at the bottom of the intro to change atmosphere.
- Use Pause motion to freeze the background animation.
- A browser/OS reduced-motion preference starts the site without animation.

EASY EDITS
- Game titles, descriptions, statuses, images and links: games.js.
- Primary palette: --accent and --accent-rgb at the top of styles.css.
- Main copy and contact email: index.html.
- Background geometry, lighting and rotation speed: sculpture.js.

VALIDATION
- JavaScript syntax checked.
- Animation, palette, pause/resume and hidden-tab handling checked at
  desktop and mobile canvas sizes.
- Production vertex/fragment shaders compiled and linked in OpenGL ES;
  production geometry rendered and inspected with depth testing.
- Static HTML, local asset references and CSS structure checked.
- Full-page browser layout/device testing was unavailable in this session.

This package is ready to upload to your existing hosting. It was not
published or connected to a new domain during this update.
