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
  keepToSide: 0.85,                // chance a group walks on its own side (going right: front lanes, going left: back lanes)
  walkerSize: 3.2,                 // sprite width, % of street width
  pokemonOnly: 0.12,               // chance a group is only Pokémon
  pokemonGroupSize: [0.72, 0.2, 0.08],   // a Pokémon-only group has 1, 2 or 3
  peopleGroupSize: [0.62, 0.28, 0.1],    // a people group has 1, 2 or 3 people
  companions: [0.5, 0.4, 0.1],           // ...and 0, 1 or 2 Pokémon with them
  bigGroups: 0.02,                 // chance a group may have more than 3 walkers in all (otherwise Pokémon companions stop at 3 total)
  personSpeed: [1.5, 3.0],         // a normal-paced person walks somewhere in here (% of street per second)
  pokemonSpeed: [1.2, 3.6],        // same for Pokémon
  paceShares: [0.2, 0.8, 0],       // random share always slow / normal / always fast (on top of the walkers she marks)
  slowFactor: 0.65, fastFactor: 1.45,
  trailGap: 2.3,                   // spacing inside a group, % of street width
  rushAhead: 5,                    // how far a fast member gets ahead before stopping to wait for the others
  rushPause: [1500, 5000],         // ms a fast member waits with the group before rushing again
  rushChance: 0.2,                 // each time it could, the chance a faster member actually runs ahead (and later waits)
  catchUp: 0.15,                   // while a fast friend waits for them, the rest of the group walks this much faster
  passLook: 6,                     // how close a slower group ahead has to be before a faster one goes around
  passMargin: 2.5,                 // how far past the slower group before moving back
  laneChangeTime: 0.7,             // seconds to change lane
  dodgeLook: 8,                    // an oncoming group this close in the same lane: step aside (0 = walk through each other)
  arriveDelay: [0, 4000],          // ms before a new group walks on after one leaves
  stepMs3: 150, stepMs2: 220,      // frame time at the normal pace: people's stand-step-stand-step walks, and 2-frame walks
  normalSpeed: 2.2,                // the pace those frame times are for
  watchChance: 0.35,               // chance a group with people stops to watch a performer act it walks past
  watchTime: [2000, 5000],         // ms they stand and watch
  watchRange: 2,                   // groups decide whether to watch when the middle of the group gets this close (plus 6) to an act
  performerStepMs: 200,            // frame time for musicians and dancers
};

// saved rules on top of the defaults; older saves used different names for two of them
export function mergeRules(saved = {}) {
  const r = Object.assign(structuredClone(DEFAULT_RULES), saved);
  if (saved.pokemonAlone !== undefined && saved.pokemonOnly === undefined) r.pokemonOnly = saved.pokemonAlone;
  if (saved.pokemonAloneSpeed && !saved.pokemonSpeed) r.pokemonSpeed = saved.pokemonAloneSpeed;
  delete r.pokemonAlone; delete r.pokemonAloneSpeed; delete r.musicians;   // musicians: an old cap on solo musicians, no longer used
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
    const h = hash01(w.id + ':speed');
    // always-fast walkers start from the top of the range, so they're quicker than anyone normal
    if (p === 'fast') return hi * R.fastFactor * (0.9 + 0.2 * h);
    return (lo + (hi - lo) * h) * (p === 'slow' ? R.slowFactor : 1);
  };
  const LATERAL = [0, 0.42, -0.42, 0.22, -0.22, 0.5];      // members of a group spread a little across the sidewalk
  let groups = [], pending = 0, groupSeq = 0;
  const totals = { groups: 0, right: 0, left: 0, passes: 0, kinds: {} };
  const onScreen = () => new Set(groups.flatMap(g => g.members.map(m => m.w.id)));
  // a walker with frames for only one direction walks the other way with those frames mirrored
  const framesFor = (w, dir) => w[dir] ? { files: w[dir], flip: false } : { files: w[dir === 'left' ? 'right' : 'left'], flip: true };
  // pace rule: always-fast walkers only group with other always-fast walkers, so they never wait for anyone
  const isFast = w => paceOf(w) === 'fast';
  let groupFast = null;   // set by the first member picked for a group
  const pickFrom = (pool, dir, taken) => {
    const ok = pool.filter(w => (w.left || w.right) && !taken.has(w.id) && (groupFast === null || isFast(w) === groupFast));
    const w = ok[Math.floor(Math.random() * ok.length)]; if (w) taken.add(w.id); return w;
  };
  const laneCount = () => Math.max(1, Math.round(R.lanes));

  const makeGroup = startInside => {
    const right = groups.filter(g => g.dir === 'right').length, left = groups.length - right;
    const fewer = left === right ? null : (left < right ? 'left' : 'right');
    const dir = fewer && Math.random() < R.directionBalance ? fewer : (Math.random() < .5 ? 'left' : 'right');
    const taken = onScreen(), members = [];
    groupFast = null;
    let np = 0, nm = 0;
    if (Math.random() < R.pokemonOnly) {
      const want = 1 + pickWeighted(R.pokemonGroupSize);
      for (let i = 0; i < want; i++) { const m = pickFrom(mons, dir, taken); if (m) { members.push(m); nm++; if (groupFast === null) groupFast = isFast(m); } }
    } else {
      const want = 1 + pickWeighted(R.peopleGroupSize);
      for (let i = 0; i < want; i++) { const p = pickFrom(people, dir, taken); if (p) { members.push(p); np++; if (groupFast === null) groupFast = isFast(p); } }
      if (np) { const c = Math.random() < R.bigGroups ? pickWeighted(R.companions) : Math.min(pickWeighted(R.companions), 3 - np); for (let i = 0; i < c; i++) { const m = pickFrom(mons, dir, taken); if (m) { members.push(m); nm++; } } }
    }
    if (!members.length) return null;
    const kind = np ? `${np} ${np === 1 ? 'person' : 'people'}${nm ? ` + ${nm} Pokémon` : ''}` : `${nm} Pokémon`;
    const lanes = laneCount();
    // walking on your side: right-goers use the front half of the lanes, left-goers the back half (the middle is shared)
    const half = Math.ceil(lanes / 2), all = [...Array(lanes).keys()];
    const side = dir === 'right' ? all.slice(0, half) : all.slice(lanes - half);
    const choices = Math.random() < R.keepToSide ? side : all;
    const used = l => groups.filter(g => g.home === l).length;
    const fewest = Math.min(...choices.map(used));
    const pool = choices.filter(l => used(l) === fewest);
    const home = pool[Math.floor(Math.random() * pool.length)];
    const length = (members.length - 1) * friendGap();
    const sgn = dir === 'left' ? -1 : 1;
    const x = startInside ? (sgn > 0 ? rand(5 + length, 95) : rand(5, 95 - length)) : (sgn > 0 ? -R.walkerSize - 1 : 101);
    const nat = members.map(naturalSpeed), speed = Math.min(...nat);
    const g = { fast: !!groupFast, dir, sgn, x, speed, eff: speed, home, lane: home, laneF: home, passing: null, kind, members: [], seen: new Set(), watchUntil: 0, off: 0, offT: 0, side: 0, sideT: 0, spread: 1, dmax: laneCount() - 0.5, id: ++groupSeq };
    // friends walk in a line, the quickest in front (so whoever runs ahead never has to go through the others)
    const rank = nat.map((v, i) => i).sort((a, b) => nat[b] - nat[a]);
    members.forEach((w, i) => {
      const img = newSprite(); img.style.width = R.walkerSize + '%'; img.dataset.id = w.id;
      const { files, flip } = framesFor(w, dir);
      if (flip) img.style.transform = 'scaleX(-1)';
      scene.append(img);
      // noticeably faster than the slowest: rushes ahead, then waits (never in an all-fast group: they keep together)
      const fast = !groupFast && nat[i] > speed * 1.15;
      g.members.push({ w, img, files, flip, along: -rank.indexOf(i) * friendGap(), lat: LATERAL[i] || 0, nat: nat[i], e: 0, phase: Math.random() * 3,
        mode: fast ? 'pause' : 'keep', t: rand(...R.rushPause) * Math.random() });
    });
    // never appear on top of someone: inside the street try other spots, at the edge wait and try again shortly
    const crowded = () => groups.some(h => h.members.some(hm => g.members.some(m => sep(posOf(g, m, lanes), posOf(h, hm, lanes)) < 1.3)));
    for (let tries = 0; crowded() && startInside && tries < 40; tries++) g.x = sgn > 0 ? rand(5 + length, 95) : rand(5, 95 - length);
    if (crowded()) { g.members.forEach(m => m.img.remove()); return null; }
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
  // personal space: two walkers from different groups may never stand on the same spot of sidewalk
  const BODY_X = 0.6, BODY_D = 0.9;   // closer than this along the street (x sprite width) AND across it (lanes) = overlapping; a lane is only about a quarter of a sprite's height on screen, so it takes most of a lane to look like passing in front rather than through
  const SINGLE_FILE = 6;               // this close (% of street) to another group, walk in single file
  const STEP_BACK_SPEED = 1.0;         // how fast a stuck group walks back to make room (% of street per second)
  // friends in a group keep at least a body apart too (they may walk side by side, but not inside each other)
  const friendGap = () => Math.max(R.trailGap, BODY_X * R.walkerSize + 0.3);
  const isFront = (g, m) => g.members.every(o => o === m || o.along + o.e < m.along + m.e);
  // re-order a group's line from where everyone actually is: front-most takes the front place, and so on (no jumps:
  // each keeps its position and eases into its new place)
  const reline = g => {
    const slots = g.members.map(m => m.along).sort((a, b) => b - a);
    [...g.members].sort((a, b) => (b.along + b.e) - (a.along + a.e)).forEach((m, k) => { const p = m.along + m.e; m.along = slots[k]; m.e = p - m.along; });
  };
  const LOOK_AHEAD = 6;                // how far ahead (% of street) walkers notice someone in their path and start stepping aside
  const depthOf = (g, m, lanes) => Math.max(-0.5, Math.min(g.dmax ?? lanes - 1 + 0.5, g.laneF + g.off + g.side + m.lat * g.spread));
  const posOf = (g, m, lanes) => [g.x + g.sgn * (m.along + m.e), depthOf(g, m, lanes)];
  const sep = (a, b) => Math.max(Math.abs(a[0] - b[0]) / (BODY_X * R.walkerSize), Math.abs(a[1] - b[1]) / BODY_D);   // under 1 = overlapping
  // does g, where it is now, have a walker overlapping someone it wasn't already at least that close to? (before: its positions last frame)
  // the nearest walker a few steps ahead of g that it would walk into: someone coming the other way, or someone
  // standing or much slower in front (same-way groups that are only a bit slower get overtaken instead)
  const lookAhead = (g, lanes) => {
    let best = null;
    const mine = g.members.map(m => posOf(g, m, lanes));
    for (const h of groups) {
      if (h === g || (h.dir === g.dir && h.eff > g.eff * 0.5)) continue;
      for (const hm of h.members) {
        const p = posOf(h, hm, lanes);
        for (const q of mine) {
          const ahead = g.sgn * (p[0] - q[0]);
          if (ahead <= 0 || ahead > LOOK_AHEAD + BODY_X * R.walkerSize || Math.abs(p[1] - q[1]) >= BODY_D + 0.05) continue;
          if (!best || ahead < best.ahead) best = { h, me: q[1], p: p[1], ahead };
        }
      }
    }
    return best;
  };
  const hasRightOfWay = (g, h) => h.wasBlocked && g.id < h.id && !(h.stuck > 1.5) && !(g.watchUntil > performance.now());   // watchers never have right of way
  const blockedBy = (g, before, lanes) => {
    const mine = g.members.map(m => posOf(g, m, lanes));
    for (const h of groups) {
      if (h === g) continue;
      for (const hm of h.members) {
        const p = posOf(h, hm, lanes);
        for (let i = 0; i < mine.length; i++) { const s = sep(mine[i], p); if (s < 1 && s < sep(before[i], p) - 1e-9) return { h, p, me: before[i] }; }
      }
    }
    return null;
  };
  // a lane is free to pass in if nobody going the same way is in that stretch of it
  // (oncoming groups don't count: they pass by in their own time)
  const laneFreeAll = (g, lane, from, to) => !groups.some(h => h !== g && (Math.abs(h.laneF - lane) < 0.7 || h.lane === lane) && (() => {
    const [a, b] = span(h); return b > from && a < to; })());
  const laneFree = (g, lane, from, to) => !groups.some(h => h !== g && h.dir === g.dir && Math.abs(h.laneF - lane) < 0.7 && (() => {
    const [a, b] = span(h); return b > from && a < to; })());

  // performers: placed apart from each other, set back near the buildings, playing their frames in place
  let performers = [], actSpots = [];
  const PERFORMER_BACK = 0.95;   // how far behind the back lane performers stand (in lanes)
  const PERFORMER_GAP = 0.6;     // walkers beside an act keep this far in front of it (in lanes)
  const setPerformers = key => {
    performers.forEach(p => p.img.remove()); performers = []; actSpots = [];
    // performers who share an act (a band, the dancers) stand together; a solo musician gets a spot of their own
    const here = performersAt(key), groupsOfActs = {};
    for (const w of here) { const a = w.act || (w.role === 'dancer' ? 'dancers' : null); if (a) (groupsOfActs[a] = groupsOfActs[a] || []).push(w); }
    const solos = here.filter(w => !w.act && w.role !== 'dancer');
    const acts = [...Object.values(groupsOfActs), ...solos.map(w => [w])];
    if (!acts.length) return;
    const spots = [];
    const free = (x, n) => spots.every(([o, m]) => x + n * R.walkerSize < o - R.walkerSize * 2 || x > o + m * R.walkerSize + R.walkerSize * 2);
    for (const act of acts) {
      let x = 0, tries = 0;
      do { x = rand(4, 94 - act.length * R.walkerSize * 1.05); } while (!free(x, act.length) && ++tries < 60);
      spots.push([x, act.length]);
      actSpots.push({ x0: x, x1: x + act.length * R.walkerSize * 1.05, id: actSpots.length });
      act.forEach((w, i) => {
        // their own performance frames if they have them, otherwise their walk frames played in place
        const side = w.left && w.right ? (Math.random() < .5 ? 'left' : 'right') : (w.left ? 'left' : 'right');
        const files = w.perform || w[side];
        const img = newSprite(); img.style.width = R.walkerSize + '%'; img.dataset.id = w.id;
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
        if (done && g.passing.squeeze) { g.offT = 0; g.passing = null; }
        else if (done) {
          const [a, c] = span(g);
          if (g.lane !== g.home && laneFree(g, g.home, a, c)) { g.lane = g.home; g.passing = null; }
          else if (g.lane === g.home) g.passing = null;
        }
      } else if (!blocker) g.following = false;
      if (!g.passing && blocker) {
        const [a] = span(g), [, c] = span(blocker.h);
        const from = Math.min(a, c) - R.passMargin, to = Math.max(a, c) + R.passMargin;
        // try the lanes next to it first, then any other lane
        const near = [g.lane - 1, g.lane + 1].filter(l => l >= 0 && l < lanes && laneFree(g, l, from, to));
        const options = near.length ? near : [...Array(lanes).keys()].filter(l => l !== g.lane && laneFree(g, l, from, to));
        if (options.length) { g.lane = options[Math.floor(Math.random() * options.length)]; g.passing = { h: blocker.h }; totals.passes++; }
        else if (g.fast) {   // fast groups don't wait behind anyone: squeeze by, half a lane over
          g.offT = g.lane === 0 ? 0.5 : g.lane === lanes - 1 ? -0.5 : (Math.random() < .5 ? 0.5 : -0.5);
          g.passing = { h: blocker.h, squeeze: true }; totals.passes++;
        }
        // someone stopped to watch a performer: never queue behind them, step around them (the look-ahead below steers us)
        else if (blocker.h.watchUntil > now) {}
        else { eff = Math.min(eff, blocker.h.eff); if (!g.following) { g.following = true; totals.follows = (totals.follows || 0) + 1; } }   // no room: fall in behind
      }
      // oncoming group in my lane: step aside into a free lane, let it pass, then step back
      if (R.dodgeLook > 0) {
        const [ga, gb] = span(g);
        if (g.squeezing) {
          const h = g.squeezing, [ha, hb] = groups.includes(h) ? span(h) : [0, 0];
          if (!groups.includes(h) || (g.sgn > 0 ? hb < ga : ha > gb)) { g.squeezing = null; g.offT = 0; }
        }
        if (g.dodging) {
          const h = g.dodging, [ha, hb] = groups.includes(h) ? span(h) : [0, 0];
          const crossed = !groups.includes(h) || (g.sgn > 0 ? hb < ga : ha > gb);
          if (crossed && (g.lane === g.home || laneFreeAll(g, g.home, ga - 1, gb + 1))) { g.lane = g.home; g.dodging = null; }
        } else if (!g.passing && !g.squeezing) {
          for (const h of groups) {
            if (h === g || h.dir === g.dir || h.lane !== g.lane || h.dodging) continue;
            const [ha, hb] = span(h), gap = g.sgn > 0 ? ha - gb : ga - hb;   // space between us, ahead of me
            if (gap < -R.walkerSize || gap > R.dodgeLook) continue;
            const from = Math.min(ga, ha) - 1, to = Math.max(gb, hb) + 1;
            const opts = [g.lane - 1, g.lane + 1].filter(l => l >= 0 && l < lanes && laneFreeAll(g, l, from, to));
            if (opts.length) { g.lane = opts[Math.floor(Math.random() * opts.length)]; g.dodging = h; totals.dodges = (totals.dodges || 0) + 1; }
            else {
              // no free lane: squeeze past, each edging half a lane away from the other
              const theirs = h.laneF + h.off, away = g.lane === 0 ? 0.5 : g.lane === lanes - 1 ? -0.5 : (theirs > g.laneF ? -0.5 : 0.5);
              g.offT = theirs + 0.01 >= g.laneF && h.offT > 0 && away > 0 ? -0.5 : away;
              g.squeezing = h; totals.squeezes = (totals.squeezes || 0) + 1;
            }
            break;
          }
        }
      }

      // performers reserve the back of the sidewalk: near an act, anyone in the back lane walks one lane in front of it
      if (lanes > 1 && actSpots.length) {
        const [ga, gb] = span(g), backL = lanes - 1, margin = R.walkerSize * 3;
        const near = actSpots.some(a => gb > a.x0 - margin && ga < a.x1 + margin);
        g.actDodge = near;
        if (near && g.offT > 0 && g.lane + g.offT > backL) g.offT = 0;   // no squeezing back into them
      }

      // coming up to a performer act: a group with people may decide to watch. They keep walking until the middle of
      // the group is in front of a spot inside the act (picked at random, still ahead of them), then stop there
      const mid = () => { const xs = g.members.map(m => g.x + g.sgn * (m.along + m.e)); return (Math.min(...xs) + Math.max(...xs)) / 2 + R.walkerSize / 2; };
      // only groups where everyone has walking-up frames watch (they all walk up to the act); anyone without them
      // can still be in a group, that group just walks on by
      if (!g.watchUntil && g.watchAt == null && !g.fast && g.members.some(m => m.w.type === 'person') && g.members.every(m => m.w.up))
        for (const a of actSpots) {
          const c = mid(), near = g.sgn > 0 ? c > a.x0 - R.watchRange - 6 && c < a.x0 : c < a.x1 + R.watchRange + 6 && c > a.x1;
          if (g.seen.has(a.id) || !near) continue;
          g.seen.add(a.id);
          if (Math.random() < R.watchChance) { g.watchAt = rand(a.x0 + R.walkerSize * 0.5, a.x1 - R.walkerSize * 0.5); g.watchFor = rand(...R.watchTime); }
        }
      if (g.watchAt != null && g.sgn * (mid() - g.watchAt) >= 0) {
        g.watchUntil = now + g.watchFor; g.watchAt = null; totals.watches = (totals.watches || 0) + 1;
      }
      if (g.watchUntil && now >= g.watchUntil) g.watchUntil = 0;
      const watching = g.watchUntil > now;
      if (watching) eff = 0;
      // a fast friend is stopped, waiting for them: the others hurry a little (not into a group they're stuck behind)
      else if (!g.following && g.members.some(m => m.mode === 'wait')) eff *= 1 + R.catchUp;
      // the move this frame, in two parts: walking along the street, and stepping across it
      const before = g.members.map(m => posOf(g, m, lanes));
      const fwd0 = { x: g.x, ms: g.members.map(m => [m.e, m.mode, m.t, m.along]) }, lat0 = [g.laneF, g.off, g.side, g.spread, g.dmax];
      g.x += g.sgn * eff * dt;
      for (const m of g.members) {
        if (watching) continue;   // everyone stands still while watching
        if (m.mode === 'pause') {
          m.t -= dt * 1000;
          // only the friend at the front of the line runs ahead (nobody runs through their friends)
          if (m.t <= 0) { if (Math.random() < R.rushChance && isFront(g, m)) m.mode = 'rush'; else m.t = rand(...R.rushPause); }   // not this time: try again later
        }
        else if (m.mode === 'rush') { m.e += (Math.max(eff, m.nat) - eff) * dt; if (m.e >= R.rushAhead) m.mode = 'wait'; }
        // waiting: stopped on the spot, turned round to face the others; walks on as soon as the first of them reaches
        // them (the line is re-ordered from where everyone actually is, so nobody walks through anybody)
        else if (m.mode === 'wait') {
          m.e -= eff * dt;
          const mine = m.along + m.e, caught = g.members.some(o => o !== m && o.along + o.e >= mine - friendGap() - 0.05);
          if (m.e <= 0 || caught) { m.mode = 'pause'; m.t = rand(...R.rushPause); reline(g); }
        }
        // back in the line: ease into their place in it
        if (m.mode !== 'rush' && m.mode !== 'wait' && m.e) m.e -= Math.sign(m.e) * Math.min(Math.abs(m.e), 0.5 * dt);
      }
      const fwd1 = { x: g.x, ms: g.members.map(m => [m.e, m.mode, m.t, m.along]) };
      const step = dt / Math.max(0.1, R.laneChangeTime);
      g.laneF += Math.max(-step, Math.min(step, g.lane - g.laneF));
      g.off += Math.max(-step, Math.min(step, g.offT - g.off));
      g.side += Math.max(-step, Math.min(step, g.sideT - g.side));
      // coming up close to another group: fall into single file, so the two can pass without getting tangled
      const [sa, sb] = span(g), depthMid = g.laneF + g.off + g.side;
      const crowd = groups.some(h => { if (h === g) return false; const [ha, hb] = span(h); return hb > sa - SINGLE_FILE && ha < sb + SINGLE_FILE && Math.abs(h.laneF + h.off + h.side - depthMid) < 1.6; });
      g.spread += Math.max(-step, Math.min(step, (crowd ? 0 : 1) - g.spread));
      // beside an act the back edge of the sidewalk moves forward (smoothly, like any other sidestep)
      g.dmax += Math.max(-step, Math.min(step, (g.actDodge ? lanes - 1 + PERFORMER_BACK - PERFORMER_GAP : lanes - 1 + 0.5) - g.dmax));
      const lat1 = [g.laneF, g.off, g.side, g.spread, g.dmax];
      const setFwd = f => { g.x = f.x; g.members.forEach((m, i) => [m.e, m.mode, m.t, m.along] = f.ms[i]); };
      const setLat = l => [g.laneF, g.off, g.side, g.spread, g.dmax] = l;
      // personal space: take the whole move if it doesn't walk anyone into someone else, otherwise
      // just the sideways part, otherwise just the forward part, otherwise stand still this frame
      let hit = blockedBy(g, before, lanes), fwdOk = true;
      if (hit) {
        setFwd(fwd0);
        if (!blockedBy(g, before, lanes)) fwdOk = false;
        else { setLat(lat0); setFwd(fwd1); if (blockedBy(g, before, lanes)) { setFwd(fwd0); fwdOk = false; } }
      }
      if (!fwdOk && !watching) { totals.blockedSecs = (totals.blockedSecs || 0) + dt * g.members.length; if (!g.wasBlocked) totals.bumps = (totals.bumps || 0) + 1; }
      g.wasBlocked = !fwdOk && !watching;
      g.stuck = fwdOk || watching ? 0 : (g.stuck || 0) + dt;
      // stuck a moment (walkers of two groups interlocked, nobody can step aside): the group without right of way
      // turns round and walks back a couple of steps to make room, then carries on
      g.backing = false;
      if (g.stuck > 1.2 && !watching && !(hit && hasRightOfWay(g, hit.h))) {
        const lat = [g.laneF, g.off, g.side, g.spread, g.dmax];
        g.x = fwd0.x - g.sgn * STEP_BACK_SPEED * dt;
        if (blockedBy(g, before, lanes)) { setLat(lat0); if (blockedBy(g, before, lanes)) { g.x = fwd0.x; setLat(lat); if (blockedBy(g, before, lanes)) setLat(lat0); } }
        g.backing = g.x !== fwd0.x;
      }
      // sidestep away from whoever is in the way (they do the same), or who will be in a few steps, toward whichever side has room
      const sideMax = g.dmax;
      const steer = (h, myD, theirD) => {
        // which way is "away" is decided by where the two groups are walking (not single walkers), so both always
        // step apart, never toward each other; level with each other, people going right step forward, going left step back
        const mine = g.laneF + g.off + g.side, theirs = h.laneF + h.off + h.side;
        const away = Math.abs(mine - theirs) > 0.01 ? Math.sign(mine - theirs) : (g.sgn > 0 ? -1 : 1);
        const need = BODY_D - Math.abs(myD - theirD) + 0.08;
        // at the edge of the sidewalk there's no more room that way: stay put and let the other group make the room
        const target = Math.max(-0.5 - g.laneF - g.off, Math.min(sideMax - g.laneF - g.off, g.side + away * need));
        if (away * (target - g.sideT) > 0) g.sideT = target;
      };
      if (watching) g.sideT = sideMax - g.laneF - g.off;   // watchers step back toward the act, out of the walkway
      // two groups held up by each other don't both move at once (they'd mirror each other): the one that came onto
      // the street first has right of way and holds its line; the other makes room. Only if the other one is pinned
      // (it's been stuck a while) does the first one move too
      else if (!fwdOk) { if (!hasRightOfWay(g, hit.h)) steer(hit.h, hit.me[1], hit.p[1]); }
      else {
        const ahead = lookAhead(g, lanes);
        if (ahead) steer(ahead.h, ahead.me, ahead.p);
        else if (!hit) g.sideT = 0;   // nobody in the way: drift back to where we were walking
      }
      eff = fwdOk ? eff : 0;
      const sidestepping = [g.laneF, g.off, g.side, g.spread, g.dmax].some((v, i) => Math.abs(v - lat0[i]) > 1e-4);
      const climbing = watching && sidestepping;   // watchers still stepping up toward the act
      g.eff = eff;

      for (const m of g.members) {
        const v = eff === 0 && !(m.mode === 'rush' && fwdOk) ? 0 : m.mode === 'rush' ? Math.max(eff, m.nat) : m.mode === 'wait' ? 0 : eff;
        const [x, depth] = posOf(g, m, lanes), files = m.files;
        if (watching && climbing && m.w.up) {
          // stepping up toward the performers: their walking-up frames
          m.phase += dt * 1000 / ((m.w.up.length >= 4 ? R.stepMs3 : R.stepMs2) * 1.3);
          showFrame(m.img, m.w.up[Math.floor(m.phase) % m.w.up.length]);
          m.img.style.transform = '';
        } else if (watching) {
          // turned toward the performers: their back view if they have one, otherwise just standing
          showFrame(m.img, m.w.back || files[0]);
          m.img.style.transform = m.w.back ? '' : (m.flip ? 'scaleX(-1)' : '');
        } else if (m.mode === 'wait') {
          // standing frame of the walk that faces back toward the group
          const back = framesFor(m.w, g.dir === 'left' ? 'right' : 'left');
          showFrame(m.img, back.files[0]);
          m.img.style.transform = back.flip ? 'scaleX(-1)' : '';
        } else if (g.backing && m.mode !== 'wait') {
          // walking back a couple of steps to make room: turned round, using the walk that faces the other way
          const back = framesFor(m.w, g.dir === 'left' ? 'right' : 'left');
          m.phase += dt * 1000 / ((back.files.length >= 3 ? R.stepMs3 : R.stepMs2) * 1.3);
          showFrame(m.img, back.files[Math.floor(m.phase) % back.files.length]);
          m.img.style.transform = back.flip ? 'scaleX(-1)' : '';
        } else if (v === 0 && sidestepping) {
          // stopped, stepping sideways out of someone's way: they walk it, they're not slid
          m.phase += dt * 1000 / ((files.length >= 3 ? R.stepMs3 : R.stepMs2) * 1.3);
          showFrame(m.img, files[Math.floor(m.phase) % files.length]);
          m.img.style.transform = m.flip ? 'scaleX(-1)' : '';
        } else if (v === 0) {
          // held up by someone in the way: standing frame
          showFrame(m.img, files[0]);
          m.img.style.transform = m.flip ? 'scaleX(-1)' : '';
        } else {
          m.phase += dt * 1000 * Math.max(0.05, v) / ((files.length >= 3 ? R.stepMs3 : R.stepMs2) * R.normalSpeed);
          showFrame(m.img, files[Math.floor(m.phase) % files.length]);
          m.img.style.transform = m.flip ? 'scaleX(-1)' : '';
        }
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
    const lanesNow = laneCount(), backDepth = lanesNow - 1 + PERFORMER_BACK, spreadNow = (100 - d.ground) - 8;
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
    get _groups() { return groups; }, get _acts() { return actSpots; },   // for the test harness
    setTime: key => { api.timeSetting = key; setTime(key); },
    get timeKey() { return timeKey; },
    setCount: n => { count = n; drawSign(); },
    respawn: () => { [...groups].forEach(removeGroup); refill(true); setPerformers(timeKey); },
    refill: () => refill(true),
    resetTotals: () => { totals.groups = totals.right = totals.left = totals.passes = totals.watches = totals.dodges = totals.squeezes = 0; totals.kinds = {}; },
    stats: () => {
      const r = groups.filter(g => g.dir === 'right').length, kinds = {};
      groups.forEach(g => kinds[g.kind] = (kinds[g.kind] || 0) + 1);
      return { now: { groups: groups.length, right: r, left: groups.length - r, kinds, passing: groups.filter(g => g.passing).length,
        waiting: groups.reduce((a, g) => a + g.members.filter(m => m.mode === 'wait').length, 0),
        watching: groups.filter(g => g.watchUntil > performance.now()).length,
        phasing: (() => { const L = laneCount(), all = groups.flatMap(g => g.members.map(m => [g, posOf(g, m, L)])).filter(([, p]) => p[0] > -R.walkerSize && p[0] < 100); let n = 0;
          for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (all[i][0] !== all[j][0] && sep(all[i][1], all[j][1]) < 1) n++; return n; })(),
        speedFast: groups.filter(g => g.fast).map(g => g.eff), speedOthers: groups.filter(g => !g.fast).map(g => g.eff),
        // walkers standing inside a performer act (deep enough on the sidewalk to overlap them)
        performerOverlap: groups.reduce((n, g) => n + g.members.filter(m => {
          const L = laneCount(), [x, depth] = posOf(g, m, L);
          return depth > L - 1 + PERFORMER_BACK - PERFORMER_GAP + 0.05 && actSpots.some(a => x + R.walkerSize > a.x0 && x < a.x1);
        }).length, 0),
        fastWaiting: groups.reduce((a, g) => a + g.members.filter(m => m.mode === 'wait' && isFast(m.w)).length, 0),
        mixedFastGroups: groups.filter(g => new Set(g.members.map(m => isFast(m.w))).size > 1).length,
        sprites: groups.reduce((a, g) => a + g.members.length, 0) }, totals: structuredClone(totals) };
    },
  };
  return api;
}
