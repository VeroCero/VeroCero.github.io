// Set this to 'assets/mii.png' after adding your transparent Mii image.
const miiImagePath = '';
const avatar = document.querySelector('.avatar-placeholder');
if (avatar && miiImagePath) {
  const mii = new Image();
  mii.alt = 'Veronica’s Mii avatar';
  mii.width = 200;
  mii.height = 240;
  mii.style.cssText = 'width:200px;height:240px;object-fit:contain';
  mii.onload = () => avatar.replaceChildren(mii);
  mii.src = miiImagePath;
}

// Add a path and descriptive alt text here when an image is ready.
// Keys match data-image-slot attributes in the HTML. Empty paths keep placeholders.
const portfolioImages = {
  'home-game': { src: '', alt: '' },
  'home-linux': { src: '', alt: '' },
  'work-mri': { src: '', alt: '' },
  'work-slac': { src: '', alt: '' },
  'work-circuits': { src: '', alt: '' },
  'work-card-party': { src: '', alt: '' },
  'work-linux': { src: '', alt: '' },
  'about-portrait': { src: '', alt: '' },
  'about-personal': { src: '', alt: '' },
  'about-community': { src: '', alt: '' },
  'contact-mii': { src: '', alt: '' },
  'notes': { src: '', alt: '' },
  'gratitude': { src: '', alt: '' },
};
document.querySelectorAll('[data-image-slot]').forEach(slot => {
  const asset = portfolioImages[slot.dataset.imageSlot];
  if (!asset?.src || !asset.alt) return;
  const img = new Image();
  img.alt = asset.alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.onload = () => {
    slot.querySelector('.image-slot-space').replaceChildren(img);
    slot.classList.add('has-image');
    slot.querySelector('figcaption').textContent = asset.caption || asset.alt;
  };
  img.src = asset.src;
});
const noticeToggle = document.querySelector('.progress-toggle');
noticeToggle?.addEventListener('click', () => {
  const paused = noticeToggle.closest('.progress-notice').classList.toggle('is-paused');
  noticeToggle.setAttribute('aria-pressed', String(paused));
  noticeToggle.setAttribute('aria-label', paused ? 'Resume scrolling notice' : 'Pause scrolling notice');
  noticeToggle.textContent = paused ? '▷' : 'Ⅱ';
});
// The taped header tabs remain inactive; other links use the temporary page.
document.querySelectorAll('.nav-construction a').forEach(link => {
  link.addEventListener('click', event => event.preventDefault());
  link.addEventListener('auxclick', event => event.preventDefault());
});
// A one-time nod to “Hello, Zuko here,” before the real introduction.
const introName = document.querySelector('.intro-name');
if (introName && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const finalName = introName.textContent;
  introName.textContent = 'Zuko';
  introName.classList.add('is-zuko');
  document.fonts.ready.then(() => {
    // Reserve the final name's width so the heading doesn't jump during the joke.
    const measure = introName.cloneNode(true);
    measure.textContent = finalName;
    measure.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
    introName.parentElement.append(measure);
    const zukoMeasure = measure.cloneNode(true);
    zukoMeasure.textContent = 'Zuko';
    introName.parentElement.append(zukoMeasure);
    introName.style.setProperty('--strike-width', `${zukoMeasure.getBoundingClientRect().width}px`);
    zukoMeasure.remove();
    introName.style.minWidth = `${measure.getBoundingClientRect().width}px`;
    measure.remove();
    window.setTimeout(() => introName.classList.add('is-crossed'), 950);
    window.setTimeout(() => {
      introName.textContent = finalName;
      introName.classList.remove('is-zuko', 'is-crossed');
      introName.classList.add('is-revealed');
    }, 1350);
  });
}

// About page object pile: favorites and inspirations. Add an item here and it joins the pile.
// type: dvd, cassette, vinyl, golden, polaroid, cd, pcdisc, floppy, usb, novel, receipt.
// label is drawn on the object (toplabel: small line above it); kind/title/theme/blurb fill the card.
// cover (optional) is an image drawn on the object; img/alt (or images: [{ src, alt }]) fill the card.
// size is the object's width relative to the others; the layout code below arranges the pile.
const pileItems = [
  { type: 'vinyl', label: 'Bad Bunny Super Bowl', toplabel: 'DtMF', title: 'Bad Bunny Super Bowl', kind: 'Debí Tirar Más Fotos', theme: 'Audacity', blurb: '', color: '#ffde00', img: 'assets/bad-bunny-performance.webp', alt: 'Bad Bunny performing at the Super Bowl with string players behind him.', size: 1.4 },
  { type: 'cassette', label: 'La Copa de la Vida', sublabel: 'Ricky Martin · Spanglish', title: 'La Copa de la Vida', kind: 'Song · Ricky Martin · Spanglish version', theme: 'Determination', blurb: '', color: '#d00000', img: 'assets/la-copa-world-cup-album.webp', alt: 'Music of the World Cup album cover.', size: 1.05 },
  { type: 'cd', label: 'Hatsune Miku', title: 'Hatsune Miku', kind: 'Music', theme: 'Community', blurb: '', color: '#39c5bb', img: 'assets/miku-expo-concert.webp', alt: 'Hatsune Miku performing at a concert under blue and green lights.', size: 0.85 },
  { type: 'floppy', label: 'TETRIS', title: 'Tetris', kind: 'Game', theme: 'Simplicity', blurb: '', color: '#2b2b2b', img: 'assets/block-out-high-score.webp', alt: 'A Block Out game screen showing a new high score, ranked first in Gainesville.', size: 0.7 },
  { type: 'receipt', label: 'Honorable mentions', title: 'Honorable mentions', size: 0.5 },
  { type: 'golden', starColor: '#d9a933', label: 'VOYAGER 1', title: 'Control, I\'m Not Coming Back', kind: 'Game · Voyager 1', theme: 'Hope', blurb: '', img: 'assets/voyager-out-here.webp', alt: 'Voyager 1 drifting among stars, captioned Out here, it\'s beautiful.', size: 0.9 },
  { type: 'pcdisc', starColor: '#fffdf7', label: 'HADES', title: 'Hades', kind: 'Game · PC', theme: 'Perseverance', blurb: '', color: '#d00000', images: [{ src: 'assets/hades-garden.webp', alt: 'A garden scene from the game Hades.' }, { src: 'assets/sunset-cliff.webp', alt: 'A red sunset over the sea, seen from a snowy cliff in Hades.' }], size: 0.8 },
  { type: 'usb', label: 'minecraft', title: 'Minecraft', kind: 'Game', theme: 'Creativity', blurb: '', color: '#00ab44', img: 'assets/minecraft-end-poem.webp', alt: 'The Minecraft end poem in green and blue pixel text.', size: 0.36 },
  { type: 'novel', starColor: '#ff9ec7', label: 'HYOUKA', toplabel: '氷菓', sublabel: 'Honobu Yonezawa', title: 'Hyouka', kind: 'Anime · originally a light novel', theme: 'Curiosity', blurb: '', color: '#87cefa', images: [{ src: 'assets/hyouka-little-birds.webp', alt: 'Horsetail shoots by a bicycle wheel, captioned Little birds can remember.' }, { src: 'assets/hyouka-curiosity-bloom.webp', alt: 'Oreki and Chitanda in a school entryway surrounded by blooming vines and flowers.' }], size: 0.62 },
  { type: 'dvd', label: 'Everything Everywhere All at Once', title: 'Everything Everywhere All at Once', kind: 'Movie', theme: 'Love', blurb: '', color: '#87cefa', images: [{ src: 'assets/eeaao-googly-rock.webp', alt: 'A rock with googly eyes in the desert, captioned There are no rules!' }, { src: 'assets/eeaao-laundry-and-taxes.webp', alt: 'Waymond at night, captioned In another life, I would have really liked just doing laundry and taxes with you.' }], size: 0.85 },
];
// Constellation view: lines between favorites that share a theme. Items are named by their type above.
const pileConnections = [
  { from: 'dvd', to: 'golden', label: 'finding meaning' },
  { from: 'dvd', to: 'pcdisc', label: 'family & forgiveness' },
  { from: 'dvd', to: 'vinyl', label: 'love over hate' },
  { from: 'vinyl', to: 'cd', label: 'belonging' },
  { from: 'pcdisc', to: 'cassette', label: 'grit' },
  { from: 'usb', to: 'floppy', label: 'simplicity' },
  { from: 'novel', to: 'dvd', label: 'finding meaning' },
  { from: 'novel', to: 'golden', label: 'finding meaning' },
  { from: 'cd', to: 'usb', label: 'possibility' },
  { from: 'cassette', to: 'novel', label: 'passion' },
];
// Shown on the receipt card. Add a line to add a mention.
const honorableMentions = [
  { name: 'Princess Mononoke', format: 'VHS' },
  { name: 'Project Hail Mary', format: 'TICKET' },
  { name: 'Avatar: The Last Airbender', format: 'BLU-RAY' },
  { name: 'Fire Emblem Echoes: Shadows of Valentia', format: '3DS' },
  { name: 'Pokémon HeartGold', format: 'DS' },
  { name: 'Tomodachi Life: Living the Dream', format: 'SWITCH' },
  { name: 'PokéRogue', format: 'HOMEBREW' },
  { name: 'Console modding', format: 'WII' },
];
const escapeText = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Split a title into lines of roughly `max` characters for drawing inside a shape.
const wrapWords = (text, max) => text.split(' ').reduce((lines, word) => {
  const last = lines[lines.length - 1];
  if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = last + ' ' + word;
  else lines.push(word);
  return lines;
}, []);
const titleBlock = (text, cx, cy, width, fill = '#1a1a1a', max = 10) => {
  const lines = wrapWords(text.toUpperCase(), max);
  const longest = Math.max(...lines.map(line => line.length));
  const size = Math.min(11, width / (longest * 0.78));
  const top = cy - ((lines.length - 1) * size * 1.15) / 2 + size * 0.35;
  return `<text text-anchor="middle" font-family="Bungee, Arial, sans-serif" font-size="${size.toFixed(1)}" fill="${fill}">${lines.map((line, i) => `<tspan x="${cx}" y="${(top + i * size * 1.15).toFixed(1)}">${escapeText(line)}</tspan>`).join('')}</text>`;
};
const scrawl = (x, y, size, text, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" font-family="PatrickHand, Exo2, sans-serif" font-size="${size}" fill="#1a1a1a" ${extra}>${escapeText(text)}</text>`;
const ink = 'stroke="#1a1a1a" stroke-width="2.5" stroke-linejoin="round"';
const coverImage = (item, x, y, w, h, id) => item.cover
  ? `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><image href="${escapeText(item.cover)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`
  : '';
const shinyDisc = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#dfe5ea" ${ink}/><g fill="none" stroke-width="4" stroke-linecap="round" opacity=".55"><path d="M${cx + r * 0.3} ${cy - r * 0.85}A${r * 0.9} ${r * 0.9} 0 0 1 ${cx + r * 0.85} ${cy - r * 0.3}" stroke="#ff9ec7"/><path d="M${cx + r * 0.25} ${cy - r * 0.68}A${r * 0.72} ${r * 0.72} 0 0 1 ${cx + r * 0.68} ${cy - r * 0.25}" stroke="#87cefa"/></g><circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="#f5f5f5" ${ink}/><circle cx="${cx}" cy="${cy}" r="${r * 0.1}" fill="#fffdf7" ${ink}/>`;
const pileArt = {
  // Keep case: white "DVD" band, colored cover, and two googly eyes stuck on.
  dvd: (item, id) => [84, 124, `<rect x="2" y="2" width="80" height="120" rx="4" fill="#2a2a2a" ${ink}/><path d="M9 4V120" stroke="#555" stroke-width="2"/><rect x="13" y="8" width="64" height="15" fill="#fffdf7" ${ink}/><text x="45" y="19.5" text-anchor="middle" font-family="Bungee, Arial, sans-serif" font-size="10" fill="#1a1a1a">DVD</text><rect x="13" y="26" width="64" height="90" fill="${item.color}" ${ink}/>${coverImage(item, 13, 26, 64, 90, id)}${item.cover ? '' : titleBlock(item.label, 45, 80, 56)}<circle cx="33" cy="44" r="10" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/><circle cx="30" cy="48" r="5" fill="#1a1a1a"/><circle cx="58" cy="41" r="11" fill="#ffffff" stroke="#1a1a1a" stroke-width="2"/><circle cx="62" cy="37" r="5.5" fill="#1a1a1a"/>`],
  // Cassette single: shell, paper label, window with reels, tape guide at the bottom.
  cassette: (item) => [150, 98, `<rect x="2" y="2" width="146" height="94" rx="7" fill="${item.color}" ${ink}/><g fill="#1a1a1a"><circle cx="10" cy="10" r="2"/><circle cx="140" cy="10" r="2"/><circle cx="10" cy="88" r="2"/><circle cx="140" cy="88" r="2"/></g><rect x="14" y="8" width="122" height="48" rx="3" fill="#fffdf7" ${ink}/><path d="M14 18H136" stroke="${item.color}" stroke-width="3"/>${titleBlock(item.label, 75, 31, 70)}${item.sublabel ? scrawl(75, 52, 11, item.sublabel) : ''}<rect x="44" y="60" width="62" height="20" rx="3" fill="#dcdcdc" ${ink}/><circle cx="59" cy="70" r="7" fill="#fffdf7" ${ink}/><circle cx="91" cy="70" r="7" fill="#fffdf7" ${ink}/><path d="M28 96L36 84H114L122 96" fill="none" ${ink}/><g fill="#1a1a1a"><circle cx="52" cy="91" r="2.5"/><circle cx="98" cy="91" r="2.5"/></g>`],
  // LP: square sleeve with the black record half out of it.
  vinyl: (item, id) => [200, 140, `<circle cx="134" cy="70" r="63" fill="#161616" ${ink}/><g fill="none" stroke="#3d3d3d" stroke-width="1.2"><circle cx="134" cy="70" r="55"/><circle cx="134" cy="70" r="47"/><circle cx="134" cy="70" r="39"/><circle cx="134" cy="70" r="31"/></g><path d="M150 22A50 50 0 0 1 178 46" fill="none" stroke="#ffffff" stroke-width="3" opacity=".25" stroke-linecap="round"/><circle cx="134" cy="70" r="20" fill="${item.color}" ${ink}/><circle cx="134" cy="70" r="3" fill="#fffdf7"/><rect x="2" y="4" width="134" height="132" fill="${item.color}" ${ink}/>${coverImage(item, 2, 4, 134, 132, id)}${item.cover || !item.toplabel ? '' : `<text x="69" y="30" text-anchor="middle" font-family="Bungee, Arial, sans-serif" font-size="9" letter-spacing="2" fill="#1a1a1a">${escapeText(item.toplabel)}</text>`}${item.cover ? '' : titleBlock(item.label, 69, item.toplabel ? 74 : 62, 112)}${item.cover || !item.sublabel ? '' : scrawl(69, 112, 15, item.sublabel)}`],
  // The Voyager Golden Record: gold disc, grooves, etched lines, title around the edge.
  golden: (item, id) => [136, 136, `<circle cx="68" cy="68" r="64" fill="#d9a933" ${ink}/><g fill="none" stroke="#a87a14" stroke-width="1.2"><circle cx="68" cy="68" r="54"/><circle cx="68" cy="68" r="46"/><circle cx="68" cy="68" r="38"/></g><circle cx="68" cy="68" r="24" fill="#f0cf6a" ${ink}/><g stroke="#7a560a" stroke-width="1"><path d="M60 72L50 62M60 72L48 76M60 72L56 86M60 72L74 82M60 72L78 66"/></g><circle cx="68" cy="68" r="3" fill="#1a1a1a"/><path id="${id}-arc" d="M18 68A50 50 0 0 1 118 68" fill="none"/><text font-family="Bungee, Arial, sans-serif" font-size="10" fill="#5a3f06" letter-spacing="1"><textPath href="#${id}-arc" startOffset="50%" text-anchor="middle">${escapeText(item.label)}</textPath></text>`],
  // White frame with a photo spot and a handwritten caption.
  polaroid: (item, id) => [104, 124, `<rect x="2" y="2" width="100" height="120" fill="#ffffff" ${ink}/><rect x="11" y="11" width="82" height="80" fill="#e4eef0" stroke="#1a1a1a" stroke-width="1.5"/>${item.cover ? coverImage(item, 11, 11, 82, 80, id) : '<circle cx="72" cy="32" r="8" fill="#ffde00" stroke="#1a1a1a" stroke-width="1.5"/><path d="M11 91L38 58L56 76L68 64L93 91Z" fill="#00ab44" stroke="#1a1a1a" stroke-width="1.5" stroke-linejoin="round"/>'}${scrawl(52, 111, 13, item.label)}`],
  // Closed jewel case: dark spine, colored insert, glare on the plastic.
  cd: (item, id) => [116, 112, `<rect x="2" y="2" width="112" height="108" fill="#eaf7ff" ${ink}/><rect x="17" y="7" width="92" height="98" fill="${item.color}" stroke="#1a1a1a" stroke-width="1.5"/>${coverImage(item, 17, 7, 92, 98, id)}<rect x="2" y="2" width="12" height="108" fill="#333" ${ink}/><path d="M5 14H11M5 22H11M5 90H11M5 98H11" stroke="#777" stroke-width="1.5"/>${item.cover ? '' : titleBlock(item.label, 63, 52, 80)}<path d="M62 4L112 54V4Z" fill="#ffffff" opacity=".3"/><text x="98" y="101" text-anchor="middle" font-family="Bungee, Arial, sans-serif" font-size="8" fill="#1a1a1a">CD</text>`],
  // PC game disc in a paper sleeve with a window.
  pcdisc: (item) => [124, 128, `<rect x="2" y="2" width="120" height="124" fill="#fffdf7" ${ink}/><path d="M84 2A12 12 0 0 0 108 2" fill="#e8e3d6" ${ink}/>${shinyDisc(62, 54, 34)}<text x="10" y="16" font-family="Courier New, monospace" font-size="9" font-weight="700" fill="#1a1a1a">PC CD-ROM</text><rect x="2" y="96" width="120" height="30" fill="${item.color}" ${ink}/>${titleBlock(item.label, 62, 111, 100, '#fffdf7')}`],
  // 3.5" floppy with a little tetromino doodle on the label.
  floppy: (item) => [100, 100, `<path d="M4 4H84L96 16V96H4Z" fill="${item.color}" ${ink}/><rect x="26" y="4" width="46" height="30" fill="#c9c9c9" ${ink}/><rect x="54" y="9" width="10" height="20" fill="${item.color}"/><rect x="14" y="44" width="72" height="48" fill="#fffdf7" ${ink}/><g stroke="#1a1a1a" stroke-width="1"><rect x="28" y="50" width="7" height="7" fill="#d00000"/><rect x="35" y="50" width="7" height="7" fill="#d00000"/><rect x="42" y="50" width="7" height="7" fill="#d00000"/><rect x="35" y="57" width="7" height="7" fill="#d00000"/><rect x="56" y="57" width="7" height="7" fill="#87cefa"/><rect x="63" y="57" width="7" height="7" fill="#87cefa"/><rect x="63" y="50" width="7" height="7" fill="#87cefa"/><rect x="70" y="50" width="7" height="7" fill="#87cefa"/></g>${scrawl(50, 84, 16, item.label)}`],
  // USB stick with a crude tape label whose corner is peeling off.
  usb: (item) => [58, 130, `<rect x="17" y="6" width="22" height="28" fill="#d0d0d0" ${ink}/><rect x="22" y="13" width="4" height="5" fill="#1a1a1a"/><rect x="30" y="13" width="4" height="5" fill="#1a1a1a"/><rect x="11" y="32" width="34" height="94" rx="6" fill="${item.color}" ${ink}/><path d="M14 50L43 46L45 100L19 104Z" fill="#fff3b0" stroke="#1a1a1a" stroke-width="1.5"/><path d="M43 46L56 60L47 71L45 64Z" fill="#e8dc96" stroke="#1a1a1a" stroke-width="1.5"/>${scrawl(30, 80, 13, item.label, 'transform="rotate(-82 30 76)"')}`],
  // Thermal receipt with a torn zigzag bottom.
  // Bunko-size paperback: page edge on the right, cover art panel, and the obi (paper band) at the bottom.
  novel: (item, id) => [96, 136, `<path d="M10 4H88Q92 4 92 8V128Q92 132 88 132H10Z" fill="#f4eedd" ${ink}/><path d="M86 8V128M83 8V128" stroke="#cfc6ad" stroke-width="1"/><rect x="4" y="4" width="78" height="128" fill="#fffdf7" ${ink}/><rect x="10" y="10" width="66" height="70" fill="${item.color}" stroke="#1a1a1a" stroke-width="1.5"/>${coverImage(item, 10, 10, 66, 70, id)}${item.cover ? '' : `<circle cx="56" cy="34" r="11" fill="#fffdf7" opacity=".85"/><path d="M10 80L30 56L44 70L56 60L76 80Z" fill="#fffdf7" opacity=".55"/>`}${item.toplabel ? `<text x="43" y="94" text-anchor="middle" font-size="9" fill="#1a1a1a">${escapeText(item.toplabel)}</text>` : ''}<text x="43" y="107" text-anchor="middle" font-family="Bungee, Arial, sans-serif" font-size="11" fill="#1a1a1a">${escapeText(item.label)}</text><rect x="4" y="112" width="78" height="20" fill="#d00000" ${ink}/>${item.sublabel ? `<text x="43" y="125.5" text-anchor="middle" font-family="PatrickHand, Exo2, sans-serif" font-size="10" fill="#fffdf7">${escapeText(item.sublabel)}</text>` : ''}`],
  receipt: () => [96, 160, `<path d="M4 4H92V146L86 154L80 146L74 154L68 146L62 154L56 146L50 154L44 146L38 154L32 146L26 154L20 146L14 154L8 146L4 152Z" fill="#fbfbf8" ${ink}/><text x="48" y="22" text-anchor="middle" font-family="Courier New, monospace" font-size="10" font-weight="700" fill="#1a1a1a">HONORABLE</text><text x="48" y="34" text-anchor="middle" font-family="Courier New, monospace" font-size="10" font-weight="700" fill="#1a1a1a">MENTIONS</text><path d="M12 42H84" stroke="#1a1a1a" stroke-width="1.2" stroke-dasharray="3 3"/><g fill="#9a9a9a"><rect x="12" y="50" width="48" height="4"/><rect x="72" y="50" width="12" height="4"/><rect x="12" y="62" width="56" height="4"/><rect x="74" y="62" width="10" height="4"/><rect x="12" y="74" width="40" height="4"/><rect x="70" y="74" width="14" height="4"/><rect x="12" y="86" width="52" height="4"/><rect x="76" y="86" width="8" height="4"/><rect x="12" y="98" width="44" height="4"/><rect x="72" y="98" width="12" height="4"/><rect x="12" y="110" width="50" height="4"/></g><path d="M12 120H84" stroke="#1a1a1a" stroke-width="1.2" stroke-dasharray="3 3"/><text x="12" y="134" font-family="Courier New, monospace" font-size="9" font-weight="700" fill="#1a1a1a">TOTAL</text><text x="84" y="134" text-anchor="end" font-family="Courier New, monospace" font-size="9" font-weight="700" fill="#1a1a1a">${honorableMentions.length}</text>`],
};
// Pile layout: scatter the objects, then nudge them (simulated annealing) until there are no
// visual tangents: objects either overlap clearly (3.5–14% of the smaller one) or sit 16px apart,
// overlapping objects never share an edge angle, and nothing hugs the edge of the pile.
// Tilt directions alternate in a checkerboard so the pile never leans one way in any region.
// A fixed seed keeps the layout the same on every visit for a given width.
const pileSettings = { seed: 20261022, overlapMax: 0.14, overlapMin: 0.035, gapMin: 16, margin: 18, density: 0.55, tilt: 30, phoneTilt: 20, minTilt: 0.4, tiltPull: 6, steps: 4000, attempts: 2 };
// Parts of each object that nothing stacked on top may cover (titles, labels), as
// [left, top, right, bottom] fractions of the object's box.
const pileKeepClear = {
  dvd: [[0.1, 0.04, 0.9, 0.2], [0.12, 0.24, 0.96, 0.96]],
  vinyl: [[0.04, 0.25, 0.66, 0.9]],
  cassette: [[0.08, 0.06, 0.92, 0.6]],
  golden: [[0.15, 0.04, 0.85, 0.42]],
  polaroid: [[0.04, 0.8, 0.96, 0.98]],
  cd: [[0.18, 0.28, 0.96, 0.68]],
  pcdisc: [[0.03, 0.04, 0.62, 0.18], [0, 0.74, 1, 1]],
  floppy: [[0.12, 0.44, 0.86, 0.93]],
  usb: [[0.15, 0.34, 0.85, 0.82]],
  receipt: [[0.04, 0.04, 0.96, 0.26]],
  novel: [[0.06, 0.66, 0.84, 0.82]],
};
const seededRandom = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// Corners of a rotated box, or of the part of it given as [left, top, right, bottom] fractions.
const boxCorners = (b, [l, t, r, btm] = [0, 0, 1, 1]) => {
  const cos = Math.cos(b.r * Math.PI / 180), sin = Math.sin(b.r * Math.PI / 180);
  return [[l, t], [r, t], [r, btm], [l, btm]].map(([fx, fy]) => {
    const x = (fx - 0.5) * b.w, y = (fy - 0.5) * b.h;
    return [b.x + x * cos - y * sin, b.y + x * sin + y * cos];
  });
};
const polygonArea = poly => Math.abs(poly.reduce((sum, [x1, y1], i) => {
  const [x2, y2] = poly[(i + 1) % poly.length];
  return sum + x1 * y2 - x2 * y1;
}, 0)) / 2;
// Intersection of two convex polygons (Sutherland–Hodgman clipping).
const clipPolygon = (subject, clipper) => {
  let out = subject;
  for (let i = 0; i < clipper.length && out.length; i++) {
    const [ax, ay] = clipper[i], [bx, by] = clipper[(i + 1) % clipper.length];
    const side = ([px, py]) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    const input = out;
    out = [];
    input.forEach((p, j) => {
      const q = input[(j + 1) % input.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) {
        const t = sp / (sp - sq);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    });
  }
  return out;
};
const pointToSegment = ([px, py], [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};
const polygonGap = (a, b) => Math.min(...[[a, b], [b, a]].flatMap(([p, q]) =>
  p.flatMap(point => q.map((corner, i) => pointToSegment(point, corner, q[(i + 1) % q.length])))));
// Penalty for one pair of objects, and whether they overlap.
const pairCost = (boxes, polys, i, j) => {
  const { overlapMax, overlapMin, gapMin } = pileSettings;
  const shared = clipPolygon(polys[i], polys[j]);
  const overlap = shared.length > 2 ? polygonArea(shared) / Math.min(boxes[i].w * boxes[i].h, boxes[j].w * boxes[j].h) : 0;
  if (!overlap) {
    const gap = polygonGap(polys[i], polys[j]);
    let cost = gap < gapMin ? 20 * (gapMin - gap) / gapMin : 0;
    return { cost, touching: false };
  }
  let cost = 0;
  if (overlap > overlapMax) cost += 500 * (overlap - overlapMax);
  if (overlap < overlapMin) cost += 30 * (overlapMin - overlap) / overlapMin;
  // Overlapping objects should clearly differ in angle, so their edges never line up.
  const angleGap = Math.abs(boxes[i].r - boxes[j].r);
  if (angleGap < 14) cost += 8 * (14 - angleGap) / 14;
  // The smaller object sits on top; it must not cover the bigger one's title.
  const [under, over] = boxes[i].w * boxes[i].h >= boxes[j].w * boxes[j].h ? [i, j] : [j, i];
  boxes[under].keepClear.forEach(zone => {
    const zonePoly = boxCorners(boxes[under], zone);
    const covered = clipPolygon(zonePoly, polys[over]);
    // Even a nick on a title shows, so coverage costs a lot (square root: small nicks still count).
    if (covered.length > 2) cost += 120 * Math.sqrt(polygonArea(covered) / polygonArea(zonePoly));
  });
  return { cost, touching: true };
};
// Penalty for one object on its own: hugging the pile's edge, or sitting too straight.
const itemCost = (box, poly, width, height, tilt) => {
  const { margin, minTilt, tiltPull } = pileSettings, straight = tilt * minTilt;
  let cost = poly.reduce((sum, [x, y]) => sum + Math.max(0, margin - x, x - (width - margin)) + Math.max(0, margin - y, y - (height - margin)), 0);
  if (Math.abs(box.r) < straight) cost += tiltPull * (straight - Math.abs(box.r)) / straight;
  return cost;
};
// Every object should overlap at least one other, so it reads as one pile.
const loneCost = pairs => pairs.reduce((sum, row, i) => sum + (row.some((p, j) => j !== i && p.touching) ? 0 : 25), 0);
// shapes: [{ size, aspect, keepClear }] where aspect is height / width. Returns boxes and the pile height.
const arrangeOnce = (shapes, width, random) => {
  const phone = width < 460;
  const height = width * (phone ? 1.5 : width < 800 ? 0.8 : 0.56);
  const tilt = phone ? pileSettings.phoneTilt : pileSettings.tilt;
  const totalArea = shapes.reduce((sum, { size, aspect }) => sum + size * size * aspect, 0);
  const unit = Math.sqrt(pileSettings.density * width * height / totalArea);
  const cols = phone ? 3 : width < 800 ? 4 : 5;
  const rows = Math.ceil(shapes.length / cols), cellW = width / cols, cellH = height / rows;
  const order = shapes.map((_, i) => i).sort(() => random() - 0.5);
  const boxes = shapes.map(({ size, aspect, keepClear }, i) => {
    const k = order.indexOf(i);
    // Lean left or right in a checkerboard over the starting grid, so directions interleave
    // across the pile instead of whole regions tilting together. Only the amount is optimized.
    const lean = (k % cols + Math.floor(k / cols)) % 2 ? 1 : -1;
    return {
      keepClear, lean, w: size * unit, h: size * aspect * unit,
      x: (k % cols + 0.5) * cellW + (random() - 0.5) * cellW * 0.7,
      y: (Math.floor(k / cols) + 0.5) * cellH + (random() - 0.5) * cellH * 0.7,
      r: lean * tilt * (pileSettings.minTilt + random() * (1 - pileSettings.minTilt)),
    };
  });
  const polys = boxes.map(box => boxCorners(box));
  const none = { cost: 0, touching: false };
  const pairs = boxes.map((_, i) => boxes.map((_, j) => (i === j ? none : null)));
  boxes.forEach((_, i) => boxes.forEach((_, j) => { if (i < j) pairs[i][j] = pairs[j][i] = pairCost(boxes, polys, i, j); }));
  const singles = boxes.map((box, i) => itemCost(box, polys[i], width, height, tilt));
  const total = () => pairs.reduce((sum, row, i) => sum + row.reduce((s2, p, j) => s2 + (j > i ? p.cost : 0), 0), 0) + loneCost(pairs) + singles.reduce((a, b) => a + b, 0);
  let current = total();
  for (let step = 0; step < pileSettings.steps; step++) {
    const temperature = Math.pow(0.002, step / pileSettings.steps);
    const i = Math.floor(random() * boxes.length), before = { ...boxes[i] };
    const beforeRow = pairs[i].slice(), beforeSingle = singles[i];
    boxes[i].x += (random() - 0.5) * (60 * temperature + 3);
    boxes[i].y += (random() - 0.5) * (60 * temperature + 3);
    if (random() < 0.4) {
      const amount = Math.abs(boxes[i].r) + (random() - 0.5) * (10 * temperature + 1);
      boxes[i].r = boxes[i].lean * Math.max(tilt * 0.25, Math.min(tilt, amount));
    }
    polys[i] = boxCorners(boxes[i]);
    boxes.forEach((_, j) => { if (j !== i) pairs[i][j] = pairs[j][i] = pairCost(boxes, polys, i, j); });
    singles[i] = itemCost(boxes[i], polys[i], width, height, tilt);
    const next = total();
    if (next < current || random() < Math.exp((current - next) / (temperature * 8))) current = next;
    else {
      boxes[i] = before;
      polys[i] = boxCorners(before);
      boxes.forEach((_, j) => { if (j !== i) pairs[i][j] = pairs[j][i] = beforeRow[j]; });
      singles[i] = beforeSingle;
    }
  }
  return { boxes, height, cost: current };
};
// Run a few independent attempts from the same seed and keep the cleanest one.
const arrangePile = (shapes, width) => {
  const random = seededRandom(pileSettings.seed);
  let best = null;
  for (let attempt = 0; attempt < pileSettings.attempts; attempt++) {
    const result = arrangeOnce(shapes, width, random);
    if (!best || result.cost < best.cost) best = result;
  }
  return best;
};
const pile = document.querySelector('[data-media-pile]');
const pileCard = document.querySelector('.pile-card');
if (pile && pileCard) {
  const body = pileCard.querySelector('.pile-card-body');
  let openedFrom = null;
  const showItem = item => {
    pileCard.classList.remove('is-receipt');
    // An item can have one image (img/alt) or several (images: [{ src, alt }]).
    const pictures = item.images || (item.img ? [{ src: item.img, alt: item.alt || '' }] : []);
    pileCard.classList.toggle('has-multi', pictures.length > 1);
    const figures = pictures.length
      ? pictures.map(({ src, alt }) => `<figure class="image-slot pile-card-image has-image"><div class="image-slot-space"><img src="${escapeText(src)}" alt="${escapeText(alt)}"></div></figure>`).join('')
      : '<figure class="image-slot pile-card-image"><div class="image-slot-space"><span class="image-slot-label">Image placeholder</span></div></figure>';
    body.innerHTML = `<p class="eyebrow pile-card-type">${escapeText(item.kind || '')}</p><h3 id="pile-card-title">${escapeText(item.title)}</h3>${item.theme ? `<p class="pile-card-theme"><span>Theme</span>${escapeText(item.theme)}</p>` : ''}<p class="pile-card-blurb">${escapeText(item.blurb || 'Text placeholder.')}</p><div class="pile-card-images">${figures}</div>`;
  };
  const showReceipt = () => {
    pileCard.classList.add('is-receipt');
    body.innerHTML = `<p class="receipt-head" id="pile-card-title">HONORABLE MENTIONS</p><p class="receipt-sub">Subtitle placeholder</p><ul class="receipt-list">${honorableMentions.map(({ name, format }) => `<li><span>${escapeText(name.toUpperCase())}</span><span>${escapeText(format)}</span></li>`).join('')}</ul><p class="receipt-total"><span>TOTAL</span><span>${honorableMentions.length} ITEMS</span></p><p class="receipt-foot">Thank-you placeholder</p>`;
  };
  const shapes = [];
  const buttons = pileItems.map((item, index) => {
    const [width, height, art] = pileArt[item.type](item, `pile-${index}`);
    shapes.push({ size: item.size, aspect: height / width, keepClear: pileKeepClear[item.type] });
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pile-item';
    button.setAttribute('aria-label', `${item.title}, open details`);
    button.innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">${art}</svg>`;
    button.addEventListener('click', () => {
      openedFrom = button;
      if (item.type === 'receipt') showReceipt();
      else showItem(item);
      pileCard.showModal();
    });
    pile.append(button);
    return button;
  });
  // Layouts are computed for the width rounded down to 40px steps, then scaled to fit, so a
  // scrollbar appearing or a small resize scales the pile instead of reshuffling it.
  const layouts = new Map();
  let laidOutWidth = 0;
  // Constellation view: stars on each connected object, joined by lines with their shared theme.
  let centers = [];
  const sky = document.createElement('div');
  sky.className = 'pile-constellation';
  pile.append(sky);
  const typeIndex = type => pileItems.findIndex(item => item.type === type);
  const starShape = '<path d="M14 1Q16 12 27 14Q16 16 14 27Q12 16 1 14Q12 12 14 1Z"/>';
  // The honorable-mentions receipt connects to nothing, so it orbits as a little space station.
  const satelliteShape = '<g stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"><path d="M24 30H40" fill="none"/><rect x="2" y="22" width="22" height="16" fill="#87cefa"/><path d="M9.5 22V38M16.5 22V38M2 30H24" fill="none" stroke-width="1"/><rect x="40" y="22" width="22" height="16" fill="#87cefa"/><path d="M47.5 22V38M54.5 22V38M40 30H62" fill="none" stroke-width="1"/><rect x="26" y="23" width="12" height="14" rx="2" fill="#fffdf7"/><circle cx="32" cy="30" r="3" fill="#ffde00"/><path d="M32 23V15" fill="none"/><circle cx="32" cy="13" r="2.5" fill="#d00000"/></g>';
  // Lines that share a label (e.g. three favorites joined by one theme) get that label once,
  // in the middle of the stars they join; a lone line is labelled at its midpoint.
  const labelSpots = links => [...new Set(links.map(l => l.label))].map(label => {
    const group = links.filter(l => l.label === label);
    if (group.length === 1) return { label, x: (group[0].a[0] + group[0].b[0]) / 2, y: (group[0].a[1] + group[0].b[1]) / 2 };
    const points = [...new Map(group.flatMap(l => [l.a, l.b]).map(p => [p.join(), p])).values()];
    return { label, x: points.reduce((t, p) => t + p[0], 0) / points.length, y: points.reduce((t, p) => t + p[1], 0) / points.length };
  });
  const drawConstellation = () => {
    if (!centers.length) return;
    const links = pileConnections.map(({ from, to, label }) => ({ a: centers[typeIndex(from)], b: centers[typeIndex(to)], label })).filter(l => l.a && l.b);
    const receiptIndex = typeIndex('receipt');
    const used = [...new Set(pileConnections.flatMap(({ from, to }) => [typeIndex(from), typeIndex(to)]))].filter(i => i >= 0);
    // Stars are buttons in the object's own color; hovering shows its name, clicking opens its card.
    sky.innerHTML = `<svg width="${pile.clientWidth}" height="${pile.clientHeight}">${links.map(({ a, b, label }) => `<path class="constellation-line" data-group="${escapeText(label)}" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}"/><path class="constellation-hit" data-group="${escapeText(label)}" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}"/>`).join('')}</svg>`
      + (receiptIndex >= 0 && centers[receiptIndex] ? `<button type="button" class="constellation-star constellation-satellite" data-index="${receiptIndex}" style="left:${centers[receiptIndex][0]}px;top:${centers[receiptIndex][1]}px" aria-label="${escapeText(pileItems[receiptIndex].title)}, open details"><svg viewBox="0 0 64 44" aria-hidden="true">${satelliteShape}</svg><span>${escapeText(pileItems[receiptIndex].title)}</span></button>` : '')
      + used.map(i => `<button type="button" class="constellation-star" data-index="${i}" style="left:${centers[i][0]}px;top:${centers[i][1]}px;--star:${pileItems[i].starColor || pileItems[i].color || '#ffde00'}" aria-label="${escapeText(pileItems[i].title)}, open details"><svg viewBox="0 0 28 28" aria-hidden="true">${starShape}</svg><span>${escapeText(pileItems[i].title)}</span></button>`).join('')
      + labelSpots(links).map(({ x, y, label }) => `<span class="constellation-label" data-group="${escapeText(label)}" style="left:${x}px;top:${y}px">${escapeText(label)}</span>`).join('');
    pile.querySelectorAll('.pile-item').forEach((button, i) => button.classList.toggle('is-linked', used.includes(i)));
    placeStarNames(links);
    sky.querySelectorAll('.constellation-star').forEach(st => st.addEventListener('click', () => pile.querySelectorAll('.pile-item')[st.dataset.index].click()));
    // Nudge labels that overlap each other apart vertically, a few pixels at a time.
    const tags = [...sky.querySelectorAll('.constellation-label')];
    const stars = [...sky.querySelectorAll('.constellation-star')].map(st => st.getBoundingClientRect());
    for (let pass = 0; pass < 80; pass++) {
      let moved = false;
      // Labels step off any star they cover, in whichever direction is shorter.
      tags.forEach(t => stars.forEach(r => {
        const a = t.getBoundingClientRect();
        if (a.right < r.left || r.right < a.left || a.bottom + 2 < r.top || r.bottom + 2 < a.top) return;
        const step = a.top + a.height / 2 < r.top + r.height / 2 ? -3 : 3;
        t.style.top = `${parseFloat(t.style.top) + step}px`;
        moved = true;
      }));
      tags.forEach((t, i) => tags.slice(i + 1).forEach(u => {
        const a = t.getBoundingClientRect(), b = u.getBoundingClientRect();
        if (a.right + 6 < b.left || b.right + 6 < a.left || a.bottom + 4 < b.top || b.bottom + 4 < a.top) return;
        const [up, down] = a.top + a.height / 2 <= b.top + b.height / 2 ? [t, u] : [u, t];
        up.style.top = `${parseFloat(up.style.top) - 3}px`;
        down.style.top = `${parseFloat(down.style.top) + 3}px`;
        moved = true;
      }));
      if (!moved) break;
    }
  };
  // Labels stay hidden until a line is pointed at (or tapped); lines that share a theme light up together.
  // Does the segment p→q pass through the rectangle? (Liang–Barsky clipping.)
  const segmentHitsRect = ([x1, y1], [x2, y2], r) => {
    const dx = x2 - x1, dy = y2 - y1;
    let t0 = 0, t1 = 1;
    for (const [p, q] of [[-dx, x1 - r.left], [dx, r.right - x1], [-dy, y1 - r.top], [dy, r.bottom - y1]]) {
      if (p === 0) { if (q < 0) return false; continue; }
      const t = q / p;
      if (p < 0) { if (t > t1) return false; t0 = Math.max(t0, t); } else { if (t < t0) return false; t1 = Math.min(t1, t); }
    }
    return true;
  };
  // Each star's hover name tries spots around the star (above first) and takes the first one
  // that crosses no connection line, no other star, and stays inside the pile.
  const placeStarNames = links => {
    const buttons = [...sky.querySelectorAll('.constellation-star')];
    const starBoxes = buttons.map(b => {
      const [cx, cy] = centers[b.dataset.index], w = b.offsetWidth, h = b.offsetHeight;
      return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
    });
    const W = pile.clientWidth, H = pile.clientHeight, gap = 6;
    buttons.forEach((button, i) => {
      const name = button.querySelector('span');
      const [cx, cy] = centers[button.dataset.index];
      const bw = button.offsetWidth, bh = button.offsetHeight, w = name.offsetWidth, h = name.offsetHeight;
      const ox = bw / 2 + gap + w / 2, oy = bh / 2 + gap + h / 2;
      const ring = [[0, -oy], [0, oy], [ox, 0], [-ox, 0], [ox * 0.8, -oy], [-ox * 0.8, -oy], [ox * 0.8, oy], [-ox * 0.8, oy]];
      // A second, wider ring for crowded spots; the first clear spot wins.
      const spots = [...ring, ...ring.map(([x, y]) => [x * 1.6, y * 1.9]), ...ring.map(([x, y]) => [x * 2.2, y * 2.8])];
      const score = ([dx, dy]) => {
        const r = { left: cx + dx - w / 2, right: cx + dx + w / 2, top: cy + dy - h / 2, bottom: cy + dy + h / 2 };
        let bad = links.filter(({ a, b }) => segmentHitsRect(a, b, r)).length;
        bad += starBoxes.filter((sb, j) => j !== i && !(r.right < sb.left || sb.right < r.left || r.bottom < sb.top || sb.bottom < r.top)).length;
        if (r.left < 0 || r.right > W || r.top < 0 || r.bottom > H) bad += 5;
        return bad;
      };
      const best = spots.find(spot => score(spot) === 0) || spots.reduce((pick, spot) => (score(spot) < score(pick) ? spot : pick), spots[0]);
      name.style.left = `${bw / 2 + best[0] - w / 2}px`;
      name.style.top = `${bh / 2 + best[1] - h / 2}px`;
    });
  };
  const showGroup = group => {
    sky.querySelectorAll('[data-group]').forEach(el => el.classList.toggle('is-active', group !== null && el.dataset.group === group));
    if (group !== null) pile.classList.add('is-explored');
  };
  sky.addEventListener('pointerover', event => { if (event.target.matches('.constellation-hit')) showGroup(event.target.dataset.group); });
  sky.addEventListener('pointerout', event => { if (event.target.matches('.constellation-hit') && event.pointerType === 'mouse') showGroup(null); });
  sky.addEventListener('click', event => { if (event.target.matches('.constellation-hit')) showGroup(event.target.dataset.group); });
  // A faint hint when the view opens; it fades once someone explores a line.
  const hint = document.createElement('p');
  hint.className = 'constellation-hint';
  hint.setAttribute('aria-hidden', 'true');
  hint.textContent = matchMedia('(hover: none)').matches ? 'tap a line to see what connects them' : 'hover over a line to see what connects them';
  pile.append(hint);
  const skyToggle = document.querySelector('.constellation-toggle');
  skyToggle?.addEventListener('click', () => {
    const on = pile.classList.toggle('is-constellation');
    skyToggle.setAttribute('aria-pressed', String(on));
    skyToggle.setAttribute('aria-label', on ? 'Hide connections' : 'Show how my favorites connect');
    skyToggle.title = skyToggle.getAttribute('aria-label');
  });
  const placePile = () => {
    const width = pile.clientWidth;
    if (!width || Math.abs(width - laidOutWidth) < 0.5) return;
    laidOutWidth = width;
    const stepWidth = Math.max(280, Math.floor(width / 40) * 40);
    if (!layouts.has(stepWidth)) layouts.set(stepWidth, arrangePile(shapes, stepWidth));
    const { boxes, height } = layouts.get(stepWidth);
    const scale = width / stepWidth;
    pile.style.height = `${Math.round(height * scale)}px`;
    // Big things underneath, small things on top.
    const stack = boxes.map((_, i) => i).sort((a, b) => boxes[b].w * boxes[b].h - boxes[a].w * boxes[a].h);
    buttons.forEach((button, i) => {
      const box = boxes[i];
      button.style.cssText = `--x:${((box.x - box.w / 2) * scale).toFixed(1)}px;--y:${((box.y - box.h / 2) * scale).toFixed(1)}px;--w:${(box.w * scale).toFixed(1)}px;--r:${box.r.toFixed(1)}deg;z-index:${stack.indexOf(i) + 1}`;
    });    centers = boxes.map(box => [box.x * scale, box.y * scale]);
    drawConstellation();
  };
  placePile();
  // Glide to new spots after the first placement (two frames later, once it has been drawn,
  // so nothing animates in on load); re-arrange when the pile's width changes.
  requestAnimationFrame(() => requestAnimationFrame(() => pile.classList.add('is-placed')));
  let resizeTimer;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(placePile, 150);
  }).observe(pile);
  pileCard.querySelector('.pile-card-close').addEventListener('click', () => pileCard.close());
  // Backdrop clicks land on the dialog element itself, outside its box.
  pileCard.addEventListener('click', event => {
    if (event.target !== pileCard) return;
    const box = pileCard.getBoundingClientRect();
    const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
    if (!inside) pileCard.close();
  });
  pileCard.addEventListener('close', () => openedFrom?.focus());
}

// Phone menu: the three-bar button opens and closes the nav.
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.getElementById('site-nav');
if (menuToggle && siteNav) {
  const setMenu = open => {
    siteNav.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  menuToggle.addEventListener('click', () => setMenu(!siteNav.classList.contains('is-open')));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && siteNav.classList.contains('is-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) setMenu(false);
  });
}

// PDF pop-up: research posters and the homepage resume open here instead of a new tab.
const posterDialog = document.querySelector('.poster-dialog');
if (posterDialog) {
  const frame = posterDialog.querySelector('.poster-frame');
  const openLink = posterDialog.querySelector('.poster-open');
  let openedRoll = null;
  document.querySelectorAll('[data-poster-src]').forEach(roll => {
    roll.addEventListener('click', event => {
      event.preventDefault();
      openedRoll = roll;
      posterDialog.querySelector('.poster-dialog-kind').textContent = roll.dataset.posterKind || 'POSTER';
      posterDialog.querySelector('h3').textContent = roll.dataset.posterTitle;
      const stamp = posterDialog.querySelector('.poster-stamp');
      if (stamp) stamp.hidden = roll.dataset.posterRedacted !== 'true';
      // Images show as a picture; PDFs load in the frame.
      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(roll.dataset.posterSrc);
      const image = posterDialog.querySelector('.poster-image');
      frame.hidden = isImage;
      if (image) image.hidden = !isImage;
      if (isImage && image) {
        image.src = roll.dataset.posterSrc;
        image.alt = roll.dataset.posterTitle;
      } else {
        frame.title = roll.dataset.posterTitle;
        frame.src = `${roll.dataset.posterSrc}#view=FitH`;
      }
      openLink.href = roll.dataset.posterSrc;
      posterDialog.showModal();
    });
  });
  posterDialog.querySelector('.poster-dialog-close').addEventListener('click', () => posterDialog.close());
  posterDialog.addEventListener('click', event => {
    if (event.target !== posterDialog) return;
    const box = posterDialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) posterDialog.close();
  });
  posterDialog.addEventListener('close', () => {
    frame.removeAttribute('src');
    posterDialog.querySelector('.poster-image')?.removeAttribute('src');
    openedRoll?.focus();
  });
}
