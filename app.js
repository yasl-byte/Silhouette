/* ============================================================
   Silhouette v2 — événements, minuteur, réglages, démarrage
   ============================================================ */
'use strict';

const app = $('app');

/* ---------- Rendu ---------- */
function render() {
  const y = window.scrollY;
  const m = S.settings.modules;
  if (V.view === 'smoke' && !m.smoke) V.view = 'day';
  app.innerHTML = { day: viewDay, cal: viewCal, smoke: viewSmoke, stats: viewStats, set: viewSet }[V.view]();
  document.querySelectorAll('#nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.v === V.view);
    if (b.dataset.v === 'smoke') b.hidden = !m.smoke;
  });
  renderModal();
  window.scrollTo(0, y);
}

/* Rendu déclenché par le réseau : jamais pendant une saisie. */
function renderSoon(kind) {
  const ae = document.activeElement;
  if (ae && /^(INPUT|SELECT|TEXTAREA)$/.test(ae.tagName)) return;
  if (V.modal) return;
  if (V.view === 'day' && V.axis === kind) setTimeout(render, 0);
}

/* ---------- Apparence ---------- */
function applySettings() {
  const s = S.settings, root = document.documentElement;
  let theme = s.theme;
  if (theme === 'auto') theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  root.dataset.theme = theme;
  const c = s.colors;
  root.style.setProperty('--accent', c.accent);
  ['force', 'vshape', 'flex', 'mind', 'spirit', 'health', 'neat'].forEach(k => root.style.setProperty('--c-' + k, c[k]));
  root.style.fontSize = (16 * s.font) + 'px';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f5f8' : '#0e1117');
}

/* ---------- Minuteur de repos ---------- */
const REST = { end: 0, tick: null };
let AC = null;
const mmss = s => `${Math.floor(s / 60)}:${pad(s % 60)}`;

function prepareAudio() {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { /* pas d'audio */ }
}
function beep() {
  try {
    if (!AC) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.frequency.value = 880; g.gain.value = 0.15;
    o.connect(g); g.connect(AC.destination); o.start();
    setTimeout(() => o.stop(), 260);
  } catch (e) { /* ignore */ }
}

function startRest(sec) {
  if (!S.settings.rest.on) return;
  REST.end = Date.now() + sec * 1000;
  $('rest').hidden = false;
  clearInterval(REST.tick);
  REST.tick = setInterval(updateRest, 250);
  updateRest();
}
function updateRest() {
  const left = Math.ceil((REST.end - Date.now()) / 1000);
  if (left <= 0) { finishRest(true); return; }
  $('restTime').textContent = mmss(left);
}
function finishRest(alert) {
  clearInterval(REST.tick); REST.tick = null;
  $('rest').hidden = true;
  if (!alert) return;
  if (S.settings.rest.vibrate && navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (S.settings.rest.sound) beep();
  toast('Repos terminé : série suivante');
}

/* ---------- Actions ---------- */
function findEx(d, id) {
  const it = dayItems(d);
  return it.muscu.concat(it.vshape).find(e => e.id === id);
}

function setWeight() {
  const inp = $('wIn'), v = parseFloat(String(inp.value).replace(',', '.'));
  if (!isFinite(v) || v < 30 || v > 250) {
    if (inp.value === '' && S.weights[V.date] !== undefined) { delete S.weights[V.date]; save(); toast('Pesée supprimée'); render(); return; }
    toast('Poids invalide'); return;
  }
  S.weights[V.date] = Math.round(v * 10) / 10;
  save(); toast(`Pesée enregistrée : ${fmt(v)} kg`); render();
}

function doSwap(a, b) {
  if (hasActivity(a) || hasActivity(b)) { toast('Une de ces dates est déjà entamée'); return; }
  const pa = getPlan(a), pb = getPlan(b);
  if (pa.type === pb.type && pa.session === pb.session) { toast('Ces deux jours sont identiques'); return; }
  swapPlan(S, a, b);
  S.lastSwap = [a, b];
  save(); V.modal = null; toast(`${shortDate(a)} ↔ ${shortDate(b)}`); render();
}

function undoSwap() {
  if (!S.lastSwap) return;
  const [a, b] = S.lastSwap;
  if (hasActivity(a) || hasActivity(b)) { toast('Impossible : une de ces dates est entamée'); return; }
  swapPlan(S, a, b); S.lastSwap = null;
  save(); toast('Permutation annulée'); render();
}

function addNeat(id, min) {
  const L = logFor(V.date);
  L.neat.push({ a: id, min });
  save(); render();
}

function addBook(b) {
  const id = 'b' + NOW().getTime().toString(36) + Math.random().toString(36).slice(2, 5);
  S.books.push({ id, title: b.title, authors: b.authors || '', pages: b.pages || 0, year: b.year || '', cover: b.cover || '', done: false });
  if (!S.currentBook) S.currentBook = id;
  V.readBook = id; V.modal = null;
  save(); toast('Livre ajouté'); render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `silhouette-${todayStr()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result);
      if (!valid(s)) throw new Error('format');
      S = normalize(s); buildCycle(S.cycle.start);
      V.date = clampDate(todayStr());
      save(); applySettings(); toast('Données importées'); render();
    } catch (e) { toast('Fichier invalide'); }
  };
  r.readAsText(file);
}

function setPath(path, val) {
  const keys = path.split('.'); let o = S.settings;
  for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
  o[keys[keys.length - 1]] = val;
}

function applySetting(path, val) {
  if (path === 'palette') {
    if (PALETTES[val]) { const p = clone(PALETTES[val]); delete p.label; S.settings.colors = p; }
    S.settings.palette = val;
  } else if (path.startsWith('colors.')) {
    setPath(path, val); S.settings.palette = 'custom';
  } else if (path === 'targetWeight' || path === 'startWeight') {
    const s = S.settings, a = path === 'startWeight' ? val : s.startWeight, b = path === 'targetWeight' ? val : s.targetWeight;
    if (b >= a) { toast('Le poids cible doit être inférieur au poids de départ'); render(); return; }
    setPath(path, val);
  } else setPath(path, val);
  save(); applySettings();
  if (path.startsWith('pray.') && path !== 'pray.arabic') prefetchPrayer();
  if (path.startsWith('modules.') && !enabledAxes().includes(V.axis)) V.axis = 'muscu';
  render();
}

/* ---------- Clics ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (!t) return;
  const a = t.dataset.a;
  switch (a) {
    case 'nav': V.view = t.dataset.v; V.modal = null; render(); window.scrollTo(0, 0); break;
    case 'day': V.date = clampDate(addDays(V.date, +t.dataset.n)); render(); break;
    case 'today': V.date = clampDate(todayStr()); render(); break;
    case 'axis': V.axis = t.dataset.k; render(); break;
    case 'open': V.date = t.dataset.d; V.view = 'day'; render(); window.scrollTo(0, 0); break;
    case 'weigh': setWeight(); break;

    case 'set': {
      const ex = findEx(V.date, t.dataset.ex); if (!ex) break;
      const l = exLog(V.date, ex), i = +t.dataset.i;
      l.s[i] = !l.s[i]; save(); render();
      if (l.s[i]) { prepareAudio(); startRest(t.dataset.axis === 'vshape' ? S.settings.rest.vshape : S.settings.rest.muscu); }
      break;
    }
    case 'warm': { const L = logFor(V.date); L.warm[t.dataset.id] = !L.warm[t.dataset.id]; save(); render(); break; }
    case 'flex': { const L = logFor(V.date); L.flex[t.dataset.id] = !L.flex[t.dataset.id]; save(); render(); break; }
    case 'applyload': {
      const ex = findEx(V.date, t.dataset.ex); if (!ex) break;
      exLog(V.date, ex).w = +t.dataset.w; save(); render(); break;
    }

    case 'neatadd': addNeat(t.dataset.id, +t.dataset.min); break;
    case 'neatcustom': {
      const min = parseInt($('neatMin').value, 10);
      if (!isFinite(min) || min < 1 || min > 300) { toast('Durée invalide'); break; }
      addNeat($('neatSel').value, min); break;
    }
    case 'neatdel': { const L = logFor(V.date); L.neat.splice(+t.dataset.i, 1); save(); render(); break; }

    case 'readadd': {
      const L = logFor(V.date), id = V.readBook || 'free';
      L.read[id] = (L.read[id] || 0) + (+t.dataset.n); save(); render(); break;
    }
    case 'booksopen': V.modal = 'books'; V.mdata = { q: '', res: null, busy: false, err: '' }; render(); break;
    case 'booksearch': {
      const q = ($('bq').value || '').trim(); if (!q) break;
      V.mdata = { q, res: null, busy: true, err: '' }; renderModal();
      searchBooks(q).then(res => { V.mdata = { q, res, busy: false, err: '' }; if (V.modal === 'books') renderModal(); })
        .catch(() => { V.mdata = { q, res: null, busy: false, err: 'Recherche impossible (connexion ?). Utilisez la saisie manuelle.' }; if (V.modal === 'books') renderModal(); });
      break;
    }
    case 'bookadd': addBook(V.mdata.res[+t.dataset.i]); break;
    case 'bookmanual': {
      const title = ($('bmT').value || '').trim(), pages = parseInt($('bmP').value, 10);
      if (!title) { toast('Indiquez un titre'); break; }
      addBook({ title, authors: ($('bmA').value || '').trim(), pages: isFinite(pages) ? pages : 0 }); break;
    }
    case 'bookdone': {
      const b = S.books.find(x => x.id === t.dataset.id); if (!b) break;
      b.done = !b.done; if (b.done && S.currentBook === b.id) S.currentBook = null;
      if (!b.done && !S.currentBook) S.currentBook = b.id;
      V.readBook = null; save(); render(); break;
    }
    case 'bookdel': {
      if (!confirm('Retirer ce livre de la bibliothèque ? Les pages déjà comptées restent comptées.')) break;
      S.books = S.books.filter(x => x.id !== t.dataset.id);
      if (S.currentBook === t.dataset.id) S.currentBook = null;
      V.readBook = null; save(); render(); break;
    }

    case 'pray': { const L = logFor(V.date); L.pray[t.dataset.k] = !L.pray[t.dataset.k]; save(); render(); break; }
    case 'city': {
      const L = logFor(V.date); L.city = t.dataset.c; save(); render();
      const [y, m] = V.date.split('-'); loadPrayerMonth(t.dataset.c, +y, +m); break;
    }
    case 'retrypray': {
      const [y, m] = V.date.split('-'); loadPrayerMonth(cityFor(V.date), +y, +m).then(() => { if (!prayerTimes(V.date)) toast('Toujours indisponible : vérifiez la connexion'); }); break;
    }
    case 'retryverse': loadVerse(verseRef(V.date)).then(() => { if (!S.verses[verseRef(V.date)]) toast('Verset indisponible : vérifiez la connexion'); }); break;

    case 'swap': V.modal = 'swap'; render(); break;
    case 'close': V.modal = null; render(); break;
    case 'doswap': doSwap(V.date, t.dataset.d); break;
    case 'undo': undoSwap(); break;

    case 'relapseopen': V.modal = 'relapse'; render(); break;
    case 'relapseyes': { const info = relapse(); V.modal = 'sermon'; V.mdata = info; render(); break; }
    case 'smokesince': {
      const v = $('smSince').value, d = new Date(v);
      if (!v || isNaN(d) || d.getTime() > NOW().getTime()) { toast('Date invalide'); break; }
      S.smoke.since = d.toISOString(); save(); toast('Date enregistrée'); render(); break;
    }

    case 'measure': {
      const g = id => { const x = parseFloat(String($(id).value).replace(',', '.')); return isFinite(x) && x > 0 ? x : null; };
      const m = { waist: g('mWaist'), shoulders: g('mShoulders'), arm: g('mArm') };
      if (!m.waist && !m.shoulders && !m.arm) { toast('Saisissez au moins une mesure'); break; }
      S.measures[clampDate(todayStr())] = m; save(); toast('Mesures enregistrées'); render(); break;
    }

    case 'export': exportData(); break;
    case 'reset':
      if (confirm('Tout effacer ? Cette action est irréversible.')) {
        S = fresh(); buildCycle(S.cycle.start); V.date = clampDate(todayStr()); V.axis = 'muscu';
        save(); applySettings(); toast('Données effacées'); render();
      }
      break;

    case 'restminus': REST.end -= 15000; updateRest(); break;
    case 'restplus': REST.end += 15000; updateRest(); break;
    case 'restskip': finishRest(false); break;
  }
});

/* ---------- Champs ---------- */
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.w) {
    const ex = findEx(V.date, t.dataset.w); if (!ex) return;
    const l = exLog(V.date, ex), v = parseFloat(String(t.value).replace(',', '.'));
    l.w = isFinite(v) ? v : null; save(); render();
  } else if (t.dataset.set) {
    let val = t.value;
    if (t.dataset.t === 'b') val = t.checked;
    else if (t.dataset.t === 'n') { val = parseFloat(val); if (!isFinite(val)) return; }
    applySetting(t.dataset.set, val);
  } else if (t.dataset.homeday !== undefined) {
    const wd = +t.dataset.homeday, list = S.settings.pray.homeDays.filter(x => x !== wd);
    if (t.checked) list.push(wd);
    S.settings.pray.homeDays = list; save(); render();
  } else if (t.dataset.rb !== undefined) {
    V.readBook = t.value;
    if (t.value !== 'free') S.currentBook = t.value;
    save(); render();
  } else if (t.id === 'readIn') {
    const L = logFor(V.date), id = V.readBook || 'free', n = parseInt(t.value, 10);
    if (isFinite(n) && n > 0) L.read[id] = n; else delete L.read[id];
    save(); render();
  } else if (t.id === 'imp' && t.files && t.files[0]) importData(t.files[0]);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'bq') { e.preventDefault(); const b = document.querySelector('[data-a="booksearch"]'); if (b) b.click(); }
});

$('modal').addEventListener('click', e => { if (e.target.id === 'modal' && V.modal !== 'sermon') { V.modal = null; render(); } });

/* ---------- Horloge : compteur de tabac, minuit, retour au premier plan ---------- */
let _ticks = 0;
setInterval(() => {
  _ticks++;
  if (V.view === 'smoke' && !V.modal) {
    const l = smokeLive(), c = $('smCounter');
    if (c) {
      c.textContent = l.counter; $('smGrade').textContent = l.grade; $('smNext').textContent = l.nxt;
      const b = $('smBar'); if (b) b.firstElementChild.style.width = Math.max(0, Math.min(100, l.barPct)) + '%';
    }
  }
  if (_ticks % 30 === 0 && rollCycles()) render();
}, 1000);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (REST.tick) updateRest();
  if (rollCycles()) render();
});

/* ---------- Démarrage ---------- */
rollCycles();
applySettings();
save();
render();
prefetchPrayer();
prefetchVerses();

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* hors ligne non critique */ });
}

window.__silhouette = {
  get S() { return S; }, V, getPlan, axisProgress, computePct, rollCycles, smokeMs, gradeFor, verseRef, prayerTimes, cityFor,
  loadSuggestion, smoothAt, recordSmoke, get START() { return START; }, get END() { return END; }, get ALL() { return ALL; },
  setNow(fn) { NOW = fn; }, render
};
