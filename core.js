/* ============================================================
   Silhouette v2 — cœur : dates, état, progression, calcul des cercles
   ============================================================ */
'use strict';

let NOW = () => new Date();
const DAY_MS = 864e5;

/* ---------- Dates (midi local, à l'abri des changements d'heure) ---------- */
const pad = n => String(n).padStart(2, '0');
const toStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return toStr(d); };
const diff = (a, b) => Math.round((parse(b) - parse(a)) / DAY_MS);
const todayStr = () => toStr(NOW());
const longDate = s => parse(s).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = s => parse(s).toLocaleDateString('fr-BE', { weekday: 'short', day: 'numeric', month: 'short' });
const dayMonth = s => parse(s).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' });
const fmt = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const sum = a => a.reduce((x, y) => x + y, 0);

/* ---------- Cycle de 100 jours ---------- */
let START, END, ALL, DEFAULT;

function buildCycle(start) {
  START = start;
  END = addDays(start, CONFIG.cycleDays - 1);
  ALL = Array.from({ length: CONFIG.cycleDays }, (_, i) => addDays(start, i));
  DEFAULT = {};
  let k = 0;
  ALL.forEach(d => {
    if (CONFIG.onWeekdays.includes(parse(d).getDay())) {
      DEFAULT[d] = { type: 'ON', session: CONFIG.rotation[k % CONFIG.rotation.length] }; k++;
    } else DEFAULT[d] = { type: 'OFF', session: null };
  });
}
const clampDate = d => d < START ? START : d > END ? END : d;
buildCycle(CONFIG.start);

/* ---------- Réglages par défaut ---------- */
function defaultSettings() {
  return {
    startWeight: CONFIG.startWeight, targetWeight: CONFIG.targetWeight,
    theme: 'dark', palette: 'ambre', colors: clone(PALETTES.ambre), font: 1,
    rest: { on: true, muscu: 90, vshape: 60, vibrate: true, sound: true },
    loadStep: 2, neatGoal: 45,
    modules: { neat: true, read: true, pray: true, smoke: true },
    pray: { method: 3, school: 0, work: 'Brussels', home: 'Charleroi', homeDays: [0, 3, 6], arabic: true }
  };
}

function merge(base, over) {
  if (over === undefined || over === null) return base;
  if (typeof base !== 'object' || Array.isArray(base) || base === null) return over;
  const out = {};
  Object.keys(base).forEach(k => { out[k] = merge(base[k], over[k]); });
  Object.keys(over).forEach(k => { if (!(k in out)) out[k] = over[k]; });
  return out;
}

/* ---------- État ---------- */
const KEY = 'silhouette.v2';

function swapPlan(s, a, b) {
  const pa = clone(s.plan[a] || DEFAULT[a]);
  const pb = clone(s.plan[b] || DEFAULT[b]);
  s.plan[a] = pb; s.plan[b] = pa;
}

function fresh() {
  const s = {
    v: 2,
    cycle: { n: 0, start: CONFIG.start },
    settings: defaultSettings(),
    plan: {}, logs: {}, weights: {}, measures: {}, lastSwap: null,
    smoke: { since: NOW().toISOString(), relapses: [], best: { ms: 0, grade: 'Civil', from: null, to: null } },
    books: [], currentBook: null,
    prayer: {}, verses: {},
    history: { cycles: [], records: { force: 0, flex: 0, mind: 0, spirit: 0, health: 0 } }
  };
  CONFIG.initialSwaps.forEach(([a, b]) => swapPlan(s, a, b));
  return s;
}

const valid = s => s && s.v === 2 && s.settings && s.plan && s.logs && s.weights && s.smoke && s.cycle && s.history;

function normalize(s) {
  s.settings = merge(defaultSettings(), s.settings);
  s.measures = s.measures || {}; s.books = s.books || []; s.prayer = s.prayer || {}; s.verses = s.verses || {};
  return s;
}

function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (valid(s)) return normalize(s); } catch (e) { /* ignore */ }
  return fresh();
}

let S = load();
buildCycle(S.cycle.start);

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { if (typeof toast === 'function') toast('Sauvegarde impossible sur cet appareil'); }
}

const V = { view: 'day', date: clampDate(todayStr()), axis: 'muscu', modal: null, mdata: null, readBook: null };

/* ---------- Accès aux données ---------- */
const getPlan = d => S.plan[d] || DEFAULT[d];

function dayItems(d) {
  const p = getPlan(d);
  if (p.type === 'ON') { const s = SESSIONS[p.session]; return { muscu: s.muscu, vshape: s.vshape }; }
  return { muscu: [], vshape: OFF_VSHAPE };
}
function warmItems(d) {
  const p = getPlan(d);
  return p.type === 'ON' ? WARM_GEN.concat(SESSIONS[p.session].warm) : [];
}

function logFor(d) {
  if (!S.logs[d]) S.logs[d] = {};
  const L = S.logs[d];
  L.ex = L.ex || {}; L.flex = L.flex || {}; L.warm = L.warm || {};
  L.neat = L.neat || []; L.read = L.read || {}; L.pray = L.pray || {};
  return L;
}

function exLog(d, ex) {
  const L = logFor(d);
  if (!L.ex[ex.id]) L.ex[ex.id] = { w: null, s: Array(ex.sets).fill(false) };
  return L.ex[ex.id];
}

const neatMinutes = d => { const L = S.logs[d]; return L && L.neat ? sum(L.neat.map(e => e.min)) : 0; };
const pagesOn = d => { const L = S.logs[d]; return L && L.read ? sum(Object.values(L.read)) : 0; };
const prayersDone = d => { const L = S.logs[d]; return L && L.pray ? PRAYERS.filter(p => L.pray[p.k]).length : 0; };

/* Progression d'un jour : chaque axe = [fait, total] */
function axisProgress(d) {
  const it = dayItems(d), L = S.logs[d];
  const cnt = arr => {
    let done = 0, total = 0;
    arr.forEach(e => { total += e.sets; const l = L && L.ex && L.ex[e.id]; if (l) done += l.s.filter(Boolean).length; });
    return [done, total];
  };
  const wi = warmItems(d);
  return {
    muscu: cnt(it.muscu),
    vshape: cnt(it.vshape),
    warm: [L && L.warm ? wi.filter(x => L.warm[x.id]).length : 0, wi.length],
    flex: [L && L.flex ? FLEX.filter(x => L.flex[x.id]).length : 0, FLEX.length],
    neat: [neatMinutes(d), S.settings.neatGoal],
    read: [pagesOn(d), 0],
    pray: [prayersDone(d), PRAYERS.length]
  };
}
const frac = pr => pr[1] ? Math.min(1, pr[0] / pr[1]) : 0;
const isComplete = pr => pr[1] > 0 && pr[0] >= pr[1];

/* Une date dont la séance est entamée ne peut plus être permutée. */
function hasActivity(d) {
  const L = S.logs[d];
  if (!L) return false;
  return Object.values(L.ex || {}).some(e => e.s.some(Boolean)) || Object.values(L.warm || {}).some(Boolean);
}

function lastLog(exId, d) {
  const dates = Object.keys(S.logs).filter(x => x < d).sort().reverse();
  for (const x of dates) {
    const e = S.logs[x].ex && S.logs[x].ex[exId];
    if (e && e.w !== null && e.w !== undefined) return { w: e.w, date: x, all: e.s.length > 0 && e.s.every(Boolean) };
  }
  return null;
}

/* Signal « monter la charge » : séance précédente terminée en entier. */
function loadSuggestion(exId, d) {
  const last = lastLog(exId, d);
  if (!last || !last.all) return null;
  const w = Math.round((last.w + S.settings.loadStep) * 10) / 10;
  const cur = S.logs[d] && S.logs[d].ex && S.logs[d].ex[exId];
  if (cur && cur.w !== null && cur.w !== undefined && cur.w >= w) return null;
  return { w, from: last.w };
}

/* ---------- Poids : moyenne lissée sur 7 jours ---------- */
const sortedWeights = () => Object.entries(S.weights).sort((a, b) => a[0].localeCompare(b[0]));
function smoothAt(d) {
  const v = [];
  for (let i = 0; i < 7; i++) { const x = addDays(d, -i); if (S.weights[x] !== undefined) v.push(S.weights[x]); }
  return v.length ? sum(v) / v.length : null;
}
function trajectoryAt(d) {
  const { startWeight, targetWeight } = S.settings;
  const span = diff(START, CONFIG.weightEnd);
  const e = Math.max(0, Math.min(span, diff(START, d)));
  return startWeight - (startWeight - targetWeight) * e / span;
}

/* ---------- Tabac : compteur, grades, record ---------- */
const smokeMs = () => Math.max(0, NOW().getTime() - new Date(S.smoke.since).getTime());

function gradeFor(ms) {
  const days = ms / DAY_MS;
  let g = GRADES[0];
  GRADES.forEach(x => { if (days >= x.d) g = x; });
  return g;
}
const nextGrade = ms => GRADES.find(x => x.d > ms / DAY_MS) || null;

function fmtDur(ms) {
  const m = Math.floor(ms / 6e4), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
  if (d > 0) return `${d} j ${pad(h)} h ${pad(mi)} min`;
  if (h > 0) return `${h} h ${pad(mi)} min`;
  return `${mi} min`;
}

function recordSmoke() {
  const live = smokeMs(), b = S.smoke.best;
  if (live > b.ms) return { ms: live, grade: gradeFor(live).n, from: S.smoke.since, to: null, live: true };
  return Object.assign({ live: false }, b);
}

function relapse() {
  const ms = smokeMs(), g = gradeFor(ms), rec = recordSmoke();
  const info = { ms, grade: g.n, dur: fmtDur(ms), record: `${fmtDur(rec.ms)} (${rec.grade})`, n: S.smoke.relapses.length };
  S.smoke.relapses.push({ at: NOW().toISOString(), ms, grade: g.n });
  if (ms > S.smoke.best.ms) S.smoke.best = { ms, grade: g.n, from: S.smoke.since, to: NOW().toISOString() };
  S.smoke.since = NOW().toISOString();
  save();
  return info;
}

/* Jours sans fumer comptés dans le cycle courant (plafonnés à 100 par le calcul de pourcentage). */
function smokeDaysInCycle(asOf) {
  const cs = parse(START); cs.setHours(0, 0, 0, 0);
  const to = (asOf || NOW()).getTime();
  const from = Math.max(new Date(S.smoke.since).getTime(), cs.getTime());
  return Math.max(0, (to - from) / DAY_MS);
}

/* ---------- Les cinq cercles ---------- */
const cap = x => Math.max(0, Math.min(100, x * 100));

function forceCredit(pr) {
  const w = CONFIG.forceWeights;
  return w.muscu * frac(pr.muscu) + w.vshape * frac(pr.vshape) + w.warm * frac(pr.warm);
}

const weekPages = k => { let t = 0; for (let i = 0; i < 7; i++) t += pagesOn(addDays(START, 7 * k + i)); return t; };

function computePct(asOf) {
  const T = CONFIG.targets;
  let force = 0, flex = 0, pray = 0;
  ALL.forEach(d => {
    const pr = axisProgress(d);
    if (getPlan(d).type === 'ON') force += forceCredit(pr);
    flex += frac(pr.flex);
    pray += pr.pray[0];
  });
  let mind = 0;
  for (let k = 0; k < T.readWeeks; k++) mind += Math.min(1, weekPages(k) / T.pagesPerWeek);
  return {
    force: cap(force / T.sessions),
    flex: cap(flex / T.flexDays),
    mind: cap(mind / T.readWeeks),
    spirit: cap(pray / (5 * T.prayerDays)),
    health: cap(smokeDaysInCycle(asOf) / T.smokeDays)
  };
}

const PCT_KEYS = ['force', 'flex', 'mind', 'spirit', 'health'];
const PCT_NAMES = { force: 'Force', flex: 'Souplesse', mind: 'Esprit', spirit: 'Spiritualité', health: 'Santé' };
const PCT_COLORS = { force: '--c-force', flex: '--c-flex', mind: '--c-mind', spirit: '--c-spirit', health: '--c-health' };
const activePct = () => PCT_KEYS.filter(k => k === 'force' || k === 'flex' || (k === 'mind' && S.settings.modules.read) || (k === 'spirit' && S.settings.modules.pray) || (k === 'health' && S.settings.modules.smoke));

/* Met à jour les records (meilleur pourcentage jamais atteint par cercle). */
function updateRecords(pct) {
  const r = S.history.records; let ch = false;
  PCT_KEYS.forEach(k => { const v = Math.round(pct[k] * 10) / 10; if (v > (r[k] || 0)) { r[k] = v; ch = true; } });
  if (ch) save();
}

/* Au 101e jour : on archive les pourcentages et un nouveau cycle commence, compteurs à zéro. */
function rollCycles() {
  let rolled = 0;
  while (todayStr() > END) {
    const asOf = parse(END); asOf.setHours(23, 59, 59, 999);
    const pct = computePct(asOf);
    updateRecords(pct);
    S.history.cycles.push({ n: S.cycle.n, start: START, end: END, pct, avg: sum(PCT_KEYS.map(k => pct[k])) / PCT_KEYS.length });
    S.cycle = { n: S.cycle.n + 1, start: addDays(START, CONFIG.cycleDays) };
    buildCycle(S.cycle.start);
    rolled++;
  }
  if (rolled) { V.date = clampDate(todayStr()); save(); }
  return rolled;
}

/* ---------- Prières : ville du jour ---------- */
function cityFor(d) {
  const L = S.logs[d];
  if (L && L.city) return L.city;
  return S.settings.pray.homeDays.includes(parse(d).getDay()) ? S.settings.pray.home : S.settings.pray.work;
}
const prayerKey = (city, y, m) => `${S.settings.pray.method}|${S.settings.pray.school}|${city}|${y}-${pad(m)}`;
function prayerTimes(d) {
  const [y, m] = d.split('-');
  const c = S.prayer[prayerKey(cityFor(d), +y, +m)];
  return c && c.days[d] ? c.days[d] : null;
}

/* ---------- Verset du jour : ordre aléatoire fixe, sans répétition ---------- */
const VERSE_ORDER = (() => {
  const a = VERSES.slice();
  let t = 20261103;
  const rnd = () => { t += 0x6D2B79F5; let x = Math.imul(t ^ (t >>> 15), 1 | t); x ^= x + Math.imul(x ^ (x >>> 7), 61 | x); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
})();

function verseRef(d) {
  const n = VERSE_ORDER.length, base = S.cycle.n * CONFIG.cycleDays + diff(START, d);
  for (let j = 0; j < 8; j++) {
    const ref = VERSE_ORDER[(((base + j) % n) + n) % n];
    if (!(S.verses[ref] && S.verses[ref].bad)) return ref;
  }
  return VERSE_ORDER[0];
}
