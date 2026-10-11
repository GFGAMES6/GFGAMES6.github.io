/* GF Studio / Beyond — catalog and accessible interactions */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Local-file/private mode remains usable. */ } }
  };
  $('#year').textContent = new Date().getFullYear();

  // These are the only global appearance controls; the renderer listens for changes.
  const palettes = ['lime', 'lilac', 'ice'];
  const storedPalette = storage.get('gf-palette');
  let palette = palettes.includes(storedPalette) ? storedPalette : 'lime';
  let motion = !reducedMotion.matches && storage.get('gf-motion') !== 'off';
  function applyAppearance() {
    document.body.dataset.palette = palette;
    document.body.dataset.motion = motion ? 'on' : 'off';
    $('#palette-label').textContent = palette.toUpperCase();
    $('#palette-toggle').setAttribute('aria-label', `Change atmosphere. Current: ${palette}`);
    $('#motion-toggle').setAttribute('aria-pressed', String(!motion));
    $('#motion-toggle').setAttribute('aria-label', motion ? 'Pause background animation' : 'Resume background animation');
    $('#motion-icon').textContent = motion ? 'Ⅱ' : '▷';
    $('#motion-label').textContent = motion ? 'PAUSE MOTION' : 'RESUME MOTION';
    window.dispatchEvent(new CustomEvent('gf:appearance'));
  }
  applyAppearance();
  $('#palette-toggle').addEventListener('click', () => {
    palette = palettes[(palettes.indexOf(palette) + 1) % palettes.length];
    storage.set('gf-palette', palette); applyAppearance();
  });
  $('#motion-toggle').addEventListener('click', () => {
    motion = !motion; storage.set('gf-motion', motion ? 'on' : 'off'); applyAppearance();
  });
  const onMotionPreference = () => { motion = !reducedMotion.matches && storage.get('gf-motion') !== 'off'; applyAppearance(); };
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onMotionPreference);

  // Catalog data stays in games.js. Titles, tags, links and images remain editable there.
  const games = Array.isArray(window.GAMES) ? window.GAMES : [];
  const status = window.GAME_STATUS || {};
  const grid = $('#game-grid');
  const filters = $('#filters');
  const allowedThemes = ['violet', 'cyan', 'pink', 'green', 'amber'];
  function node(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function safeURL(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const u = new URL(value, document.baseURI);
      return ['https:', 'http:', 'mailto:'].includes(u.protocol) || (u.protocol === 'file:' && !/^[a-z][a-z\d+.-]*:/i.test(value)) ? value : null;
    } catch { return null; }
  }
  function posterFor(game) {
    const poster = node('div', 'game-poster');
    const title = node('div', 'poster-title');
    String(game.title || 'Untitled').split(' ').forEach(word => title.append(node('span', '', word)));
    poster.append(title, node('span', 'poster-outline', String(game.title || '').split(' ').pop()), node('span', 'poster-line'), node('span', 'poster-spark', '✳'), node('span', 'poster-tag', 'GF STUDIO / A NEW WORLD TO EXPLORE'));
    return poster;
  }
  function cardFor(game, index) {
    const theme = allowedThemes.includes(game.theme) ? game.theme : 'violet';
    const card = node('article', `gcard theme-${theme}${game.status === 'soon' ? ' is-soon' : ''}`);
    card.dataset.status = game.status;
    card.setAttribute('data-reveal', '');
    const art = node('div', 'gcard-art');
    art.setAttribute('aria-hidden', 'true'); // Abstract title treatment, not a gameplay screenshot.
    if (game.image && safeURL(game.image)) {
      const img = node('img'); img.src = safeURL(game.image); img.alt = ''; img.loading = 'lazy';
      img.addEventListener('error', () => { img.remove(); art.prepend(posterFor(game)); }, { once: true });
      art.append(img);
    } else if (game.status === 'soon') art.append(node('span', 'soon-glyph', '✳'));
    else art.append(posterFor(game));
    art.append(node('span', 'game-number', `GF / ${String(index + 1).padStart(2, '0')}`));
    const body = node('div', 'gcard-body');
    const chip = node('span', 'chip'); chip.append(node('span', 'live-dot'), document.createTextNode(status[game.status] || game.status || 'IN DEVELOPMENT'));
    const h = node('h3', '', game.title || 'Untitled');
    const p = node('p', '', game.tagline || '');
    const tags = node('div', 'tags'); (game.tags || []).forEach(t => tags.append(node('span', '', t)));
    const actions = node('div', 'gcard-actions');
    (game.links || []).forEach((link, i) => {
      const href = safeURL(link.href); if (!href) return;
      const a = node('a', 'btn ' + (i ? 'ghost' : 'primary'), link.label);
      a.href = href;
      if (/^https?:/i.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      const arrow = node('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true'); a.append(arrow); actions.append(a);
    });
    body.append(chip, h, p, tags, actions); card.append(art, body); return card;
  }
  games.forEach((game, i) => grid.append(cardFor(game, i)));
  const statuses = [...new Set(games.map(g => g.status))];
  const countLabel = count => `${String(count).padStart(2, '0')} ${count === 1 ? 'WORLD' : 'WORLDS'} TO EXPLORE`;
  $('#catalog-count').textContent = countLabel(games.length);
  $('#catalog-empty').hidden = games.length > 0;
  if (statuses.length > 1) {
    [['all', 'ALL GAMES'], ...statuses.map(s => [s, status[s] || s])].forEach(([value, label], i) => {
      const b = node('button', 'fchip', label); b.type = 'button'; b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => {
        $$('.fchip', filters).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        let visible = 0;
        $$('.gcard', grid).forEach(card => { card.hidden = value !== 'all' && card.dataset.status !== value; if (!card.hidden) { visible++; card.classList.add('in'); } });
        $('#catalog-count').textContent = countLabel(visible); $('#catalog-empty').hidden = visible > 0;
      });
      filters.append(b);
    });
  } else filters.hidden = true;

  const nav = $('#nav'), toggle = $('.menu-toggle');
  const navLinks = $$('#nav a');
  function setMenu(open, restoreFocus = false) {
    nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  navLinks.forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false, true); });
  document.addEventListener('click', e => { if (nav.classList.contains('open') && !e.target.closest('.site-header')) setMenu(false); });
  const desktop = matchMedia('(min-width: 761px)');
  if (desktop.addEventListener) desktop.addEventListener('change', () => setMenu(false));

  // One scheduled scroll update per frame; no expensive work on pointer movement.
  const sections = navLinks.map(a => $(a.hash)).filter(Boolean);
  let scrollPending = false;
  function updateScroll() {
    document.querySelector('.site-header').classList.toggle('scrolled', scrollY > 30);
    const range = document.documentElement.scrollHeight - innerHeight;
    $('.progress').style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0})`;
    let current = '';
    for (const section of sections) if (section.getBoundingClientRect().top < innerHeight * .42) current = section.id;
    navLinks.forEach(a => { const active = a.hash === '#' + current; a.classList.toggle('active', active); if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    scrollPending = false;
  }
  addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();

  // Content is visible if JavaScript/IntersectionObserver is unavailable.
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
    document.documentElement.classList.add('reveal-ready');
    $$('[data-reveal]').forEach((el, i) => { el.style.setProperty('--d', `${(i % 3) * .065}s`); io.observe(el); });
  }
  let toastTimer;
  $('#copy-mail').addEventListener('click', async () => {
    const mail = $('#contact-link').getAttribute('href').slice(7);
    clearTimeout(toastTimer);
    try { await navigator.clipboard.writeText(mail); $('#toast').textContent = 'Email copied. Let’s talk!'; toastTimer = setTimeout(() => { $('#toast').textContent = ''; }, 4000); }
    catch { $('#toast').textContent = mail; } // Selectable fallback stays visible in local-file mode.
  });
})();
