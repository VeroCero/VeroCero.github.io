// The town street: picks day/evening/night from the clock, draws the visitor number on the sign,
// and walks groups of people and Pokémon along the sidewalk following rules.json.
// Used by index.html (the preview) and tuner.html (sliders for the rules).
// Rules are read live, so changing them takes effect on the next group that walks on.

// rough sunrise/sunset by month for a mid-US latitude (local clock time, hours)
const SUN = [[7.2, 16.7], [6.8, 17.3], [6.9, 18.8], [6.2, 19.4], [5.5, 19.9], [5.2, 20.4],
             [5.3, 20.3], [5.9, 19.8], [6.5, 18.9], [7.1, 18.1], [6.6, 16.4], [7.1, 16.3]];
export function timeOfDay(now = new Date()) {
  const [rise, set] = SUN[now.getMonth()], h = now.getHours() + now.getMinutes() / 60;
  if (h >= set - 1 && h < set + 0.5) return 'evening';        // last hour before sunset to half an hour after
  if (h >= rise - 0.5 && h < rise + 0.75) return 'evening';   // dawn uses the same warm look
  if (h >= rise + 0.75 && h < set - 1) return 'day';
  return 'night';
}

// Every rule the crowd follows, with the values used when rules.json doesn't set them.
export const DEFAULT_RULES = {
  groups: 7,                       // groups walking at once
  directionBalance: 1,             // chance a new group takes the less-used direction
  lanes: 3,                        // depths of sidewalk
  walkerSize: 3.2,                 // sprite width, % of street width
  pokemonOnly: 0.12,               // chance a group is only Pokémon
  pokemonGroupSize: [0.72, 0.2, 0.08],   // a Pokémon-only group has 1, 2 or 3
  peopleGroupSize: [0.62, 0.28, 0.1],    // a people group has 1, 2 or 3 people
  companions: [0.5, 0.4, 0.1],           // ...and 0, 1 or 2 Pokémon with them
  personSpeed: [1.5, 3.0],         // a normal-paced person walks somewhere in here (% of street per second)
  pokemonSpeed: [1.2, 3.6],        // same for Pokémon
  paceShares: [0.2, 0.6, 0.2],     // share of characters that are always slow, normal, always fast
  slowFactor: 0.65, fastFactor: 1.45,
  trailGap: 2.3,                   // spacing inside a group, % of street width
  rushAhead: 5,                    // how far a fast member gets ahead before slowing down for the others
  rushPause: [1500, 5000],         // ms a fast member waits with the group before rushing again
  waitFactor: 0.35,                // speed of a member waiting for the others, as a share of the group's
  passLook: 6,                     // how close a slower group ahead has to be before a faster one goes around
  passMargin: 2.5,                 // how far past the slower group before moving back
  laneChangeTime: 0.7,             // seconds to change lane
  arriveDelay: [0, 4000],          // ms before a new group walks on after one leaves
  stepMs3: 150, stepMs2: 220,      // frame time at the normal pace: people's stand-step-stand-step walks, and 2-frame walks
  normalSpeed: 2.2,                // the pace those frame times are for
  musicians: 3,                    // most musicians playing at once (each plays at its own time of day; evening unless set)
  performerStepMs: 200,            // frame time for musicians and dancers
};

// saved rules on top of the defaults; older saves used different names for two of them
export function mergeRules(saved = {}) {
  const r = Object.assign(structuredClone(DEFAULT_RULES), saved);
  if (saved.pokemonAlone !== undefined && saved.pokemonOnly === undefined) r.pokemonOnly = saved.pokemonAlone;
  if (saved.pokemonAloneSpeed && !saved.pokemonSpeed) r.pokemonSpeed = saved.pokemonAloneSpeed;
  delete r.pokemonAlone; delete r.pokemonAloneSpeed;
  return r;
}

// 3x5 pixel font for sign option 1
const F3 = { 0: ['111','101','101','101','111'], 1: ['010','110','010','010','111'], 2: ['111','001','111','100','111'], 3: ['111','001','111','001','111'], 4: ['101','101','111','001','001'],
  5: ['111','100','111','001','111'], 6: ['111','100','111','101','111'], 7: ['111','001','010','010','010'], 8: ['111','101','111','101','111'], 9: ['111','101','111','001','111'],
  P: ['111','101','111','100','100'], O: ['111','101','101','101','111'] };

// stable 0..1 number from a string, so a character's pace is the same every visit
const hash01 = s => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };

// base: folder the street's files live in (e.g. "assets/town/" on the site, "" for the preview tools)
export async function createStreet(scene, { rules, data, bubbleHTML = '', base = '' }) {
  const B = base;
  const d = data || await (await fetch(B + 'data.json', { cache: 'no-store' })).json();
  const R = rules || mergeRules(await (await fetch(B + 'rules.json', { cache: 'no-store' })).json());
  // sprites come from one packed image (d.atlas) on the site, or from single frame files in the preview tools
  const atlas = d.atlas;
  const newSprite = () => {
    const el = atlas ? document.createElement('span') : new Image();
    el.className = 'walker';
    if (atlas) { el.style.backgroundImage = `url(${B}${atlas.file})`; el.style.backgroundSize = `${atlas.cols * 100}% ${atlas.rows * 100}%`; }
    else el.alt = '';
    return el;
  };
  const showFrame = (el, name) => {
    if (el.dataset.f === name) return;
    el.dataset.f = name;
    if (!atlas) { el.src = B + 'frames/' + name; return; }
    const i = atlas.index[name];
    el.style.backgroundPosition = `${(i % atlas.cols) / (atlas.cols - 1) * 100}% ${Math.floor(i / atlas.cols) / Math.max(1, atlas.rows - 1) * 100}%`;
  };
  scene.style.aspectRatio = `${d.w} / ${d.h}`;
  scene.innerHTML = `<div class="walkway" style="height:${100 - d.ground}%"></div>
    <img class="base" alt="A row of brick buildings and little shops along a sidewalk">`;
  const baseImg = scene.querySelector('.base');

  // the sign: the sign's own pixel texture without its legs, tilted in front of the street's frame
  const frame = scene.closest('.street');
  let wrap = frame.parentElement;
  if (!wrap.classList.contains('street-wrap')) {
    wrap = document.createElement('div'); wrap.className = 'street-wrap';
    frame.replaceWith(wrap); wrap.append(frame);
  }
  wrap.querySelector('.townsign')?.remove();
  const sign = document.createElement('button'); sign.type = 'button'; sign.className = 'townsign'; sign.setAttribute('aria-label', 'Visitor count');
  sign.innerHTML = `<canvas width="32" height="25"></canvas><span class="bubble">${bubbleHTML} #<span class="num"></span></span>`;
  sign.onclick = () => sign.classList.toggle('open');
  wrap.append(sign);
  const cv = sign.querySelector('canvas'), ctx = cv.getContext('2d');
  const board = new Image(); board.src = B + d.sign.image;
  let count = null, night = null, timeKey = 'day', performerTime = null;
  const drawSign = () => {
    const str = count === null ? '' : String(Math.max(0, Math.min(9999, Math.round(count))));   // null: number not known yet
    ctx.clearRect(0, 0, 32, 25); if (board.complete) ctx.drawImage(board, 0, 0);
    ctx.fillStyle = d.sign.white; ctx.fillRect(5, 8, 16, 10);
    const text = (t, x, y) => { ctx.fillStyle = d.sign.grey; for (const ch of t) { F3[ch].forEach((row, r) => [...row].forEach((b, c) => { if (b === '1') ctx.fillRect(x + c, y + r, 1, 1); })); x += 4; } };
    text('POP', 6, 8); text(str, 20 - (str.length * 4 - 1), 13);
    sign.querySelector('.num').textContent = str;
  };
  board.onload = drawSign;

  const setTime = key => {
    timeKey = key === 'auto' ? timeOfDay() : key;
    const t = d.times[timeKey];
    if (!baseImg.src.endsWith(t.file)) baseImg.src = B + t.file;
    night = timeKey === 'night' ? t : null;
    wrap.dataset.time = timeKey; drawSign();
    if (typeof setPerformers === 'function' && performerTime !== timeKey) { performerTime = timeKey; setPerformers(timeKey); }
  };

  // ---- the crowd ----
  // musicians and dancers don't walk: they perform in place (evening and day)
  const people = d.walkers.filter(w => w.type === 'person' && !w.role);
  const mons = d.walkers.filter(w => w.type === 'pokemon' && !w.role);
  // when each performer appears: musicians in the evening and dancers in the day, unless set otherwise
  const whenOf = w => w.when || (w.role === 'musician' ? 'evening' : 'day');
  const performersAt = key => d.walkers.filter(w => w.role && whenOf(w) === key);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pickWeighted = ws => { const tot = ws.reduce((a, b) => a + b, 0) || 1; let r = Math.random() * tot; for (let i = 0; i < ws.length; i++) { if ((r -= ws[i]) < 0) return i; } return ws.length - 1; };
  const paceOf = w => { if (w.pace) return w.pace; const h = hash01(w.id + ':pace'), [sl, no] = R.paceShares, t = sl + no + R.paceShares[2] || 1; return h < sl / t ? 'slow' : h < (sl + no) / t ? 'normal' : 'fast'; };
  const naturalSpeed = w => {
    const [lo, hi] = w.type === 'person' ? R.personSpeed : R.pokemonSpeed, p = paceOf(w);
    return (lo + (hi - lo) * hash01(w.id + ':speed')) * (p === 'slow' ? R.slowFactor : p === 'fast' ? R.fastFactor : 1);
  };
  const LATERAL = [0, 0.42, -0.42, 0.22, -0.22, 0.5];      // members of a group spread a little across the sidewalk
  let groups = [], pending = 0;
  const totals = { groups: 0, right: 0, left: 0, passes: 0, kinds: {} };
  const onScreen = () => new Set(groups.flatMap(g => g.members.map(m => m.w.id)));
  // a walker with frames for only one direction walks the other way with those frames mirrored
  const framesFor = (w, dir) => w[dir] ? { files: w[dir], flip: false } : { files: w[dir === 'left' ? 'right' : 'left'], flip: true };
  const pickFrom = (pool, dir, taken) => {
    const ok = pool.filter(w => (w.left || w.right) && !taken.has(w.id));
    const w = ok[Math.floor(Math.random() * ok.length)]; if (w) taken.add(w.id); return w;
  };
  const laneCount = () => Math.max(1, Math.round(R.lanes));

  const makeGroup = startInside => {
    const right = groups.filter(g => g.dir === 'right').length, left = groups.length - right;
    const fewer = left === right ? null : (left < right ? 'left' : 'right');
    const dir = fewer && Math.random() < R.directionBalance ? fewer : (Math.random() < .5 ? 'left' : 'right');
    const taken = onScreen(), members = [];
    let np = 0, nm = 0;
    if (Math.random() < R.pokemonOnly) {
      const want = 1 + pickWeighted(R.pokemonGroupSize);
      for (let i = 0; i < want; i++) { const m = pickFrom(mons, dir, taken); if (m) { members.push(m); nm++; } }
    } else {
      const want = 1 + pickWeighted(R.peopleGroupSize);
      for (let i = 0; i < want; i++) { const p = pickFrom(people, dir, taken); if (p) { members.push(p); np++; } }
      if (np) { const c = pickWeighted(R.companions); for (let i = 0; i < c; i++) { const m = pickFrom(mons, dir, taken); if (m) { members.push(m); nm++; } } }
    }
    if (!members.length) return null;
    const kind = np ? `${np} ${np === 1 ? 'person' : 'people'}${nm ? ` + ${nm} Pokémon` : ''}` : `${nm} Pokémon`;
    const lanes = laneCount();
    const laneUse = [...Array(lanes)].map((_, i) => groups.filter(g => g.home === i).length);
    const home = laneUse.indexOf(Math.min(...laneUse));
    const length = (members.length - 1) * R.trailGap * 0.75;
    const sgn = dir === 'left' ? -1 : 1;
    const x = startInside ? (sgn > 0 ? rand(5 + length, 95) : rand(5, 95 - length)) : (sgn > 0 ? -R.walkerSize - 1 : 101);
    const nat = members.map(naturalSpeed), speed = Math.min(...nat);
    const g = { dir, sgn, x, speed, eff: speed, home, lane: home, laneF: home, passing: null, kind, members: [] };
    members.forEach((w, i) => {
      const img = newSprite(); img.style.width = R.walkerSize + '%';
      const { files, flip } = framesFor(w, dir);
      if (flip) img.style.transform = 'scaleX(-1)';
      scene.append(img);
      const fast = nat[i] > speed * 1.15;      // noticeably faster than the slowest: rushes ahead, then waits
      g.members.push({ w, img, files, along: -i * R.trailGap * 0.75, lat: LATERAL[i] || 0, nat: nat[i], e: 0, phase: Math.random() * 3,
        mode: fast ? 'pause' : 'keep', t: rand(...R.rushPause) * Math.random() });
    });
    groups.push(g);
    totals.groups++; totals[dir]++; totals.kinds[kind] = (totals.kinds[kind] || 0) + 1;
    return g;
  };
  const removeGroup = g => { g.members.forEach(m => m.img.remove()); groups = groups.filter(x => x !== g); };
  const refill = startInside => {
    while (groups.length + pending < R.groups) {
      if (startInside) { if (!makeGroup(true)) { setTimeout(() => refill(false), 1000); break; } }
      else {
        pending++;
        setTimeout(() => {
          pending--;
          // if nobody suitable is free right now, try again shortly instead of leaving the street a group short
          if (groups.length < R.groups && !makeGroup(false)) setTimeout(() => refill(false), 1000);
        }, rand(...R.arriveDelay));
      }
    }
    while (groups.length > R.groups) removeGroup(groups[groups.length - 1]);
  };

  // where a group's members are, in "progress" units (distance travelled in its own direction)
  const extent = g => {
    const p = g.members.map(m => g.sgn * g.x + m.along + m.e);
    return { head: Math.max(...p), tail: Math.min(...p) };   // both measured at a sprite's back edge
  };
  const span = g => { const xs = g.members.map(m => g.x + g.sgn * (m.along + m.e)); return [Math.min(...xs) - 1, Math.max(...xs) + R.walkerSize + 1]; };
  const laneFree = (g, lane, from, to) => !groups.some(h => h !== g && Math.abs(h.laneF - lane) < 0.7 && (() => {
    const [a, b] = span(h); return b > from && a < to; })());

  // performers: placed apart from each other, set back near the buildings, playing their frames in place
  let performers = [];
  const setPerformers = key => {
    performers.forEach(p => p.img.remove()); performers = [];
    // performers who share an act (a band, the dancers) stand together; solo musicians each get a spot,
    // and at most R.musicians of those play at once
    const here = performersAt(key), groupsOfActs = {};
    for (const w of here) { const a = w.act || (w.role === 'dancer' ? 'dancers' : null); if (a) (groupsOfActs[a] = groupsOfActs[a] || []).push(w); }
    const solos = here.filter(w => !w.act && w.role !== 'dancer').sort(() => Math.random() - .5).slice(0, Math.round(R.musicians));
    const acts = [...Object.values(groupsOfActs), ...solos.map(w => [w])];
    if (!acts.length) return;
    const spots = [];
    const free = (x, n) => spots.every(([o, m]) => x + n * R.walkerSize < o - R.walkerSize * 2 || x > o + m * R.walkerSize + R.walkerSize * 2);
    for (const act of acts) {
      let x = 0, tries = 0;
      do { x = rand(4, 94 - act.length * R.walkerSize * 1.05); } while (!free(x, act.length) && ++tries < 60);
      spots.push([x, act.length]);
      act.forEach((w, i) => {
        // their own performance frames if they have them, otherwise their walk frames played in place
        const side = w.left && w.right ? (Math.random() < .5 ? 'left' : 'right') : (w.left ? 'left' : 'right');
        const files = w.perform || w[side];
        const img = newSprite(); img.style.width = R.walkerSize + '%';
        scene.append(img);
        performers.push({ img, files, x: x + i * R.walkerSize * 1.05, phase: Math.random() * 4 });
      });
    }
  };

  let last = performance.now();
  const tick = now => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const lanes = laneCount();
    // groups further along go first, so a follower sees its leader's speed this frame
    const order = [...groups].sort((a, b) => extent(b).head - extent(a).head);
    for (const g of order) {
      const me = extent(g);
      let eff = g.speed, blocker = null;
      for (const h of groups) {
        if (h === g || h.dir !== g.dir || Math.abs(h.laneF - g.laneF) > 0.6) continue;
        const gap = extent(h).tail - me.head - R.walkerSize;   // space between my front sprite and their last one
        if (gap > -R.walkerSize && gap < R.passLook && h.eff < g.speed - 0.05 && (!blocker || gap < blocker.gap)) blocker = { h, gap };
      }
      if (g.passing) {
        const b = g.passing.h, done = !groups.includes(b) || me.tail - extent(b).head - R.walkerSize > R.passMargin;
        if (done) {
          const [a, c] = span(g);
          if (g.lane !== g.home && laneFree(g, g.home, a, c)) { g.lane = g.home; g.passing = null; }
          else if (g.lane === g.home) g.passing = null;
        }
      } else if (blocker) {
        const [a] = span(g), [, c] = span(blocker.h);
        const from = Math.min(a, c) - R.passMargin, to = Math.max(a, c) + R.passMargin;
        const options = [g.lane - 1, g.lane + 1].filter(l => l >= 0 && l < lanes && laneFree(g, l, from, to));
        if (options.length) { g.lane = options[Math.floor(Math.random() * options.length)]; g.passing = { h: blocker.h }; totals.passes++; }
        else eff = Math.min(eff, blocker.h.eff);   // no room: fall in behind
      }
      g.eff = eff;
      g.x += g.sgn * eff * dt;
      const step = dt / Math.max(0.1, R.laneChangeTime);
      g.laneF += Math.max(-step, Math.min(step, g.lane - g.laneF));

      for (const m of g.members) {
        let v = eff;
        if (m.mode === 'pause') { m.t -= dt * 1000; if (m.t <= 0) m.mode = 'rush'; }
        else if (m.mode === 'rush') { v = Math.max(eff, m.nat); m.e += (v - eff) * dt; if (m.e >= R.rushAhead) m.mode = 'wait'; }
        else if (m.mode === 'wait') { v = eff * R.waitFactor; m.e -= (eff - v) * dt; if (m.e <= 0) { m.e = 0; m.mode = 'pause'; m.t = rand(...R.rushPause); } }
        const x = g.x + g.sgn * (m.along + m.e), files = m.files;
        m.phase += dt * 1000 * Math.max(0.05, v) / ((files.length >= 3 ? R.stepMs3 : R.stepMs2) * R.normalSpeed);
        showFrame(m.img, files[Math.floor(m.phase) % files.length]);
        const depth = Math.max(0, Math.min(lanes - 1 + 0.5, g.laneF + m.lat));
        const spread = (100 - d.ground) - 8;
        m.img.style.left = x + '%';
        m.img.style.bottom = (2 + (lanes > 1 ? depth * spread / (lanes - 1) : 0)) + '%';
        m.img.style.zIndex = String(30 - Math.round(depth * 4));
        let filt = '';
        if (night) {   // dim in the dark, brighter under a lamp (same falloff as the street's lamp light)
          let k = 0; const cx = x + R.walkerSize / 2;
          for (const lp of night.lamps) { const dd = Math.abs(cx - lp.x) / night.lampRadius; if (dd < 1) k += lp.k * (1 - dd) ** 1.8; }
          filt = `brightness(${Math.min(1.05, 0.38 + 0.8 * k).toFixed(2)}) sepia(${Math.min(0.35, k * 0.4).toFixed(2)}) saturate(${(0.8 + 0.3 * Math.min(1, k)).toFixed(2)})`;
        }
        if (m.img.style.filter !== filt) m.img.style.filter = filt;
      }
      const [a, c] = span(g);
      if ((g.sgn > 0 && a > 101) || (g.sgn < 0 && c < -1)) { removeGroup(g); refill(false); }
    }
    const lanesNow = laneCount(), backDepth = lanesNow - 1 + 0.6, spreadNow = (100 - d.ground) - 8;
    for (const p of performers) {
      p.phase += dt * 1000 / R.performerStepMs;
      const [name, mod] = p.files[Math.floor(p.phase) % p.files.length].split('|');
      showFrame(p.img, name);
      p.img.style.transform = mod === 'm' ? 'scaleX(-1)' : '';
      if (night) {   // night performers are lit by the nearest lamps, like the walkers
        let k = 0; const cx = p.x + R.walkerSize / 2;
        for (const lp of night.lamps) { const dd = Math.abs(cx - lp.x) / night.lampRadius; if (dd < 1) k += lp.k * (1 - dd) ** 1.8; }
        p.img.style.filter = `brightness(${Math.min(1.05, 0.38 + 0.8 * k).toFixed(2)}) sepia(${Math.min(0.35, k * 0.4).toFixed(2)})`;
      } else p.img.style.filter = '';
      p.img.style.left = p.x + '%';
      p.img.style.bottom = (2 + (lanesNow > 1 ? backDepth * spreadNow / (lanesNow - 1) : 6)) + '%';
      p.img.style.zIndex = '5';
    }
    requestAnimationFrame(tick);
  };

  setTime('auto');
  refill(true); requestAnimationFrame(tick);
  setInterval(() => { if (api.timeSetting === 'auto') setTime('auto'); }, 5 * 60 * 1000);

  const api = {
    rules: R, data: d, timeSetting: 'auto',
    setTime: key => { api.timeSetting = key; setTime(key); },
    get timeKey() { return timeKey; },
    setCount: n => { count = n; drawSign(); },
    respawn: () => { [...groups].forEach(removeGroup); refill(true); setPerformers(timeKey); },
    refill: () => refill(true),
    resetTotals: () => { totals.groups = totals.right = totals.left = totals.passes = 0; totals.kinds = {}; },
    stats: () => {
      const r = groups.filter(g => g.dir === 'right').length, kinds = {};
      groups.forEach(g => kinds[g.kind] = (kinds[g.kind] || 0) + 1);
      return { now: { groups: groups.length, right: r, left: groups.length - r, kinds, passing: groups.filter(g => g.passing).length,
        sprites: groups.reduce((a, g) => a + g.members.length, 0) }, totals: structuredClone(totals) };
    },
  };
  return api;
}
