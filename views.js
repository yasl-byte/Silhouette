/* ============================================================
   Silhouette v2 — rendu des écrans
   ============================================================ */
'use strict';

const $ = id => document.getElementById(id);
const AXIS_NAME = { muscu: 'Musculation', vshape: 'V-Shape', flex: 'Souplesse', neat: 'NEAT', read: 'Lecture', pray: 'Prières' };
const AXIS_COLOR = { muscu: '--c-force', vshape: '--c-vshape', flex: '--c-flex', neat: '--c-neat', read: '--c-mind', pray: '--c-spirit' };

function enabledAxes() {
  const m = S.settings.modules, a = ['muscu', 'vshape', 'flex'];
  if (m.neat) a.push('neat');
  if (m.read) a.push('read');
  if (m.pray) a.push('pray');
  return a;
}

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2800);
}

/* ---------- Pastille circulaire ---------- */
function ring(pct, colorVar, label, sub) {
  const r = 34, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
  return `<div class="rg" role="img" aria-label="${label} : ${Math.round(p)} pour cent">
    <svg viewBox="0 0 84 84"><circle class="trk" cx="42" cy="42" r="${r}"/>
    <circle class="arc" cx="42" cy="42" r="${r}" style="stroke:var(${colorVar})" stroke-dasharray="${(c * p / 100).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 42 42)"/>
    <text x="42" y="48" text-anchor="middle">${Math.round(p)}%</text></svg>
    <div class="rl">${label}</div><div class="rs">${sub}</div></div>`;
}

function bar(pct, colorVar, id) {
  return `<div class="bar"${id ? ` id="${id}"` : ''}><i style="width:${Math.max(0, Math.min(100, pct))}%;background:var(${colorVar})"></i></div>`;
}

/* =====================  JOUR  ===================== */
function tabInfo(k, pr) {
  switch (k) {
    case 'muscu':  return [pr.muscu[1] ? `${pr.muscu[0]}/${pr.muscu[1]}` : '—', isComplete(pr.muscu)];
    case 'vshape': return [pr.vshape[1] ? `${pr.vshape[0]}/${pr.vshape[1]}` : '—', isComplete(pr.vshape)];
    case 'flex':   return [`${pr.flex[0]}/${pr.flex[1]}`, isComplete(pr.flex)];
    case 'neat':   return [`${pr.neat[0]}/${pr.neat[1]} min`, pr.neat[0] >= pr.neat[1]];
    case 'read':   return [`${pr.read[0]} p.`, pr.read[0] > 0];
    default:       return [`${pr.pray[0]}/5`, pr.pray[0] === 5];
  }
}

function viewDay() {
  const d = V.date, p = getPlan(d), pr = axisProgress(d), on = p.type === 'ON';
  const axes = enabledAxes();
  if (!axes.includes(V.axis)) V.axis = 'muscu';
  const idx = diff(START, d) + 1;
  const badge = on ? `ON · ${SESSIONS[p.session].label}` : 'OFF · Récupération';
  const w = S.weights[d], sm = smoothAt(d);

  const tabs = axes.map(k => {
    const [txt, done] = tabInfo(k, pr);
    return `<button class="axis ${V.axis === k ? 'active' : ''} ${done ? 'complete' : ''}" style="--ac:var(${AXIS_COLOR[k]})" data-a="axis" data-k="${k}">
      <div class="nm">${AXIS_NAME[k]}</div><div class="pg">${txt}</div></button>`;
  }).join('');

  return `
    <div class="head">
      <button class="iconbtn" data-a="day" data-n="-1" aria-label="Jour précédent" ${d <= START ? 'disabled' : ''}>‹</button>
      <div class="title"><div class="d">${longDate(d)}</div><div class="n">JOUR ${idx} / ${ALL.length}${S.cycle.n ? ` · CYCLE ${S.cycle.n + 1}` : ''}</div></div>
      <button class="iconbtn" data-a="day" data-n="1" aria-label="Jour suivant" ${d >= END ? 'disabled' : ''}>›</button>
    </div>
    <div class="row between mt">
      <span class="badge ${on ? 'on' : 'off'}">${badge}</span>
      <span class="row">
        ${d !== clampDate(todayStr()) ? `<button class="btn" data-a="today">Aujourd'hui</button>` : ''}
        <button class="btn" data-a="swap">Permuter</button>
      </span>
    </div>
    ${on ? `<div class="small mut mt">${SESSIONS[p.session].sub}</div>` : ''}

    <div class="card mt">
      <div class="weigh">
        <span class="grow small mut">Pesée du jour</span>
        <input id="wIn" type="number" inputmode="decimal" step="0.1" min="30" max="250" placeholder="kg" value="${w !== undefined ? w : ''}">
        <button class="btn primary" data-a="weigh">OK</button>
      </div>
      ${sm !== null ? `<div class="small mut mt0">Moyenne sur 7 jours : <b>${fmt(sm)} kg</b></div>` : ''}
    </div>

    <div class="axes">${tabs}</div>
    <div class="mt">${viewAxis(d)}</div>`;
}

function viewAxis(d) {
  switch (V.axis) {
    case 'flex': return flexList(d);
    case 'neat': return neatView(d);
    case 'read': return readView(d);
    case 'pray': return prayView(d);
    default: return (V.axis === 'muscu' ? warmCard(d) : '') + exList(d, V.axis);
  }
}

function warmCard(d) {
  const items = warmItems(d), L = S.logs[d];
  if (!items.length) return '';
  return `<div class="card" style="--ac:var(--c-force)">
    <div class="row between"><h3>Échauffement</h3><span class="small mut">${axisProgress(d).warm[0]}/${items.length}</span></div>
    <div class="small mut">Ne sautez pas cette étape : elle compte dans votre séance.</div>
    ${items.map(x => checkRow('warm', x, !!(L && L.warm && L.warm[x.id]))).join('')}
  </div>`;
}

function checkRow(action, x, done) {
  return `<button class="fx ${done ? 'done' : ''}" data-a="${action}" data-id="${x.id}">
    <span class="box">✓</span>
    <span><span class="nm">${x.name}</span>${x.note ? `<div class="note">${x.note}</div>` : ''}</span>
    <span class="dur">${x.dur}</span></button>`;
}

function exList(d, axis) {
  const items = dayItems(d)[axis];
  if (!items.length) {
    return `<div class="card"><h3>Jour de repos</h3>
      <p class="mut small">Aucune séance de musculation prévue ce jour. Pour la déplacer, utilisez « Permuter » afin de l'échanger avec un autre jour.</p></div>`;
  }
  const p = getPlan(d);
  const title = axis === 'vshape' && p.type === 'OFF' ? '<div class="small mut" style="margin-bottom:4px">Mini-bloc d\'entretien, une dizaine de minutes, à la maison.</div>' : '';
  return `<div class="card" style="--ac:var(${AXIS_COLOR[axis]})">${title}` + items.map((e, i) => {
    const l = (S.logs[d] && S.logs[d].ex && S.logs[d].ex[e.id]) || { w: null, s: Array(e.sets).fill(false) };
    const last = e.load ? lastLog(e.id, d) : null;
    const sug = e.load ? loadSuggestion(e.id, d) : null;
    return `<div class="ex" ${i ? 'style="border-top:1px solid var(--line);padding-top:12px"' : ''}>
      <div class="ex-h"><b>${e.name}</b><span class="sr">${e.sets} × ${e.reps}</span></div>
      ${e.note ? `<div class="note">${e.note}</div>` : ''}
      <div class="ex-r">
        ${e.load ? `<div class="load"><input type="number" inputmode="decimal" step="0.5" data-w="${e.id}" placeholder="${last ? fmt(last.w) : 'kg'}" value="${l.w !== null && l.w !== undefined ? l.w : ''}"><span class="hint">kg${last ? ` · avant : ${fmt(last.w)}` : ''}</span></div>` : ''}
        <div class="sets">${l.s.map((v, k) => `<button class="set ${v ? 'done' : ''}" data-a="set" data-ex="${e.id}" data-axis="${axis}" data-i="${k}" aria-pressed="${v}">${k + 1}</button>`).join('')}</div>
      </div>
      ${sug ? `<button class="chip" data-a="applyload" data-ex="${e.id}" data-w="${sug.w}">↑ Monter à ${fmt(sug.w)} kg <span>(séance précédente complète à ${fmt(sug.from)})</span></button>` : ''}
    </div>`;
  }).join('') + '</div>' +
    (axis === 'muscu' ? `<p class="small mut mt">Terminez par la routine de souplesse : elle fait partie du programme.</p>` : '');
}

function flexList(d) {
  const L = S.logs[d];
  return `<div class="small mut">Routine quotidienne · environ 13 minutes · dos, hanches, nuque, épaules</div>` +
    FLEX.map(x => checkRow('flex', x, !!(L && L.flex && L.flex[x.id]))).join('');
}

/* ----- NEAT ----- */
function neatView(d) {
  const L = S.logs[d], goal = S.settings.neatGoal, mins = neatMinutes(d);
  const entries = L && L.neat ? L.neat : [];
  return `<div class="card" style="--ac:var(--c-neat)">
      <div class="row between"><h3>Mouvement du quotidien</h3><span class="small mut">objectif ${goal} min</span></div>
      ${bar(mins / goal * 100, '--c-neat')}
      <div class="small mut mt0"><b style="color:var(--tx)">${mins} min</b> aujourd'hui${mins >= goal ? ' · objectif atteint' : ` · encore ${goal - mins} min`}</div>
      <p class="small mut">Le NEAT, c'est tout ce qui bouge hors séance. Il pèse lourd dans la dépense de la journée, et il se fait à la maison.</p>
    </div>
    ${NEAT_ACTS.map(a => `<div class="fx act">
      <span><span class="nm">${a.name}</span><div class="note">${a.note}</div></span>
      <button class="btn" data-a="neatadd" data-id="${a.id}" data-min="${a.step}">+${a.step} min</button></div>`).join('')}
    <div class="card mt">
      <h3>Autre durée</h3>
      <div class="row mt0">
        <select id="neatSel">${NEAT_ACTS.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}</select>
        <input id="neatMin" type="number" inputmode="numeric" min="1" max="300" placeholder="min" style="width:80px">
        <button class="btn primary" data-a="neatcustom">Ajouter</button>
      </div>
    </div>
    ${entries.length ? `<h3 class="mt2">Aujourd'hui</h3>` + entries.map((e, i) => {
      const a = NEAT_ACTS.find(x => x.id === e.a);
      return `<div class="fx act"><span class="nm">${a ? a.name : esc(e.a)}</span><span class="dur">${e.min} min</span>
        <button class="iconbtn sm" data-a="neatdel" data-i="${i}" aria-label="Retirer">×</button></div>`;
    }).join('') : ''}`;
}

/* ----- Lecture ----- */
const bookPages = id => sum(Object.values(S.logs).map(L => (L.read && L.read[id]) || 0));

function currentReadBook() {
  const bs = S.books;
  const ok = id => id === 'free' || bs.some(b => b.id === id);
  if (V.readBook && ok(V.readBook)) return V.readBook;
  if (S.currentBook && bs.some(b => b.id === S.currentBook && !b.done)) return S.currentBook;
  const first = bs.find(b => !b.done);
  return first ? first.id : 'free';
}

function readView(d) {
  const T = CONFIG.targets, L = S.logs[d];
  const wk = Math.floor(diff(START, d) / 7);
  const active = V.readBook = currentReadBook();
  const book = S.books.find(b => b.id === active);
  const today = (L && L.read && L.read[active]) || 0;
  const wp = wk < T.readWeeks ? weekPages(wk) : null;
  const done = book ? bookPages(book.id) : 0;
  return `<div class="card" style="--ac:var(--c-mind)">
      <div class="row between"><h3>Cette semaine</h3><span class="small mut">${wp !== null ? `semaine ${wk + 1} / ${T.readWeeks}` : 'hors décompte'}</span></div>
      ${wp !== null ? `${bar(wp / T.pagesPerWeek * 100, '--c-mind')}<div class="small mut mt0"><b style="color:var(--tx)">${wp}</b> / ${T.pagesPerWeek} pages${wp >= T.pagesPerWeek ? ' · semaine validée' : ''}</div>` : ''}
    </div>
    <div class="card mt" style="--ac:var(--c-mind)">
      <h3>Pages lues aujourd'hui</h3>
      <div class="row mt0">
        <select data-rb>${S.books.filter(b => !b.done || b.id === active).map(b => `<option value="${b.id}" ${b.id === active ? 'selected' : ''}>${esc(b.title)}</option>`).join('')}<option value="free" ${active === 'free' ? 'selected' : ''}>Autre lecture</option></select>
      </div>
      <div class="row mt0">
        <input id="readIn" type="number" inputmode="numeric" min="0" max="1000" value="${today || ''}" placeholder="0" style="width:90px">
        <span class="small mut">pages</span>
        <span class="grow"></span>
        ${[5, 10, 20].map(n => `<button class="btn" data-a="readadd" data-n="${n}">+${n}</button>`).join('')}
      </div>
      ${book && book.pages ? `<div class="mt0">${bar(done / book.pages * 100, '--c-mind')}<div class="small mut mt0">${esc(book.title)} : ${done} / ${book.pages} pages</div></div>` : ''}
    </div>
    <div class="row between mt2"><h3>Bibliothèque</h3><button class="btn primary" data-a="booksopen">Ajouter un livre</button></div>
    ${S.books.length ? S.books.map(b => {
      const p = bookPages(b.id);
      return `<div class="book ${b.done ? 'finished' : ''}">
        ${b.cover ? `<img src="${esc(b.cover)}" alt="" loading="lazy">` : '<div class="nocover"></div>'}
        <div class="grow"><b>${esc(b.title)}</b><div class="small mut">${esc(b.authors || '')}${b.year ? ` · ${esc(b.year)}` : ''}</div>
          <div class="small mut">${p}${b.pages ? ` / ${b.pages}` : ''} pages${b.done ? ' · terminé' : ''}</div>
          <div class="row mt0" style="flex-wrap:wrap"><button class="btn sm" data-a="bookdone" data-id="${b.id}">${b.done ? 'Reprendre' : 'Terminé'}</button>
          <button class="btn sm danger" data-a="bookdel" data-id="${b.id}">Retirer</button></div></div></div>`;
    }).join('') : `<p class="small mut">Aucun livre pour l'instant. Ajoutez-en un par recherche, ou saisissez-le à la main.</p>`}`;
}

/* ----- Prières ----- */
function nextPrayerKey(t) {
  const n = NOW(), cur = n.getHours() * 60 + n.getMinutes();
  for (const p of PRAYERS) { const [h, m] = t[p.k].split(':').map(Number); if (h * 60 + m > cur) return p.k; }
  return null;
}

function prayView(d) {
  const L = S.logs[d], t = prayerTimes(d), city = cityFor(d);
  const ref = verseRef(d), v = S.verses[ref];
  const next = t && d === todayStr() ? nextPrayerKey(t) : null;
  return `<div class="card verse" style="--ac:var(--c-spirit)">
      <div class="small mut">Verset à méditer</div>
      ${v && !v.bad ? `${S.settings.pray.arabic && v.ar ? `<div class="ar" lang="ar" dir="rtl">${esc(v.ar)}</div>` : ''}
        <p class="vfr">${esc(v.fr)}</p>
        <div class="small mut">Sourate ${v.s} (${esc(v.sn)}), verset ${v.n} · traduction Hamidullah</div>`
        : `<p class="mut small">Verset en cours de chargement. Une connexion est nécessaire la première fois, ensuite il reste disponible hors ligne.</p>
           <button class="btn" data-a="retryverse">Réessayer</button>`}
    </div>
    <div class="row between mt">
      <div class="seg">${Object.keys(CITIES).map(c => `<button class="${city === c ? 'active' : ''}" data-a="city" data-c="${c}">${CITIES[c]}</button>`).join('')}</div>
      <span class="small mut">${axisProgress(d).pray[0]}/5</span>
    </div>
    ${t ? PRAYERS.map(p => {
      const done = !!(L && L.pray && L.pray[p.k]);
      return `<button class="fx ${done ? 'done' : ''} ${next === p.k ? 'next' : ''}" style="--ac:var(--c-spirit)" data-a="pray" data-k="${p.k}">
        <span class="box">✓</span><span><span class="nm">${p.n}</span><div class="note">${p.fr}${next === p.k ? ' · prochaine' : ''}</div></span>
        <span class="dur big">${t[p.k]}</span></button>`;
    }).join('') : `<div class="card mt"><p class="small mut">Horaires indisponibles pour ${CITIES[city]} : une connexion est nécessaire la première fois, ensuite ils restent disponibles hors ligne.</p>
      <button class="btn" data-a="retrypray">Réessayer</button></div>
      ${PRAYERS.map(p => { const done = !!(L && L.pray && L.pray[p.k]); return `<button class="fx ${done ? 'done' : ''}" style="--ac:var(--c-spirit)" data-a="pray" data-k="${p.k}"><span class="box">✓</span><span class="nm">${p.n}</span><span class="dur">${p.fr}</span></button>`; }).join('')}`}
    ${t ? `<p class="small mut mt">Horaires pour ${CITIES[city]} · ${PRAYER_METHODS.find(m => m.id === S.settings.pray.method)?.n || 'méthode personnalisée'}.</p>` : ''}`;
}

/* =====================  CALENDRIER  ===================== */
function cellDots(d) {
  const pr = axisProgress(d), on = getPlan(d).type === 'ON', m = S.settings.modules;
  const dots = [['m', on && isComplete(pr.muscu)], ['v', isComplete(pr.vshape)], ['s', isComplete(pr.flex)]];
  if (m.neat) dots.push(['n', pr.neat[0] >= pr.neat[1]]);
  if (m.read) dots.push(['l', pr.read[0] > 0]);
  if (m.pray) dots.push(['p', pr.pray[0] === 5]);
  return dots.map(([c, f]) => `<i class="dot ${c} ${f ? 'f' : ''}"></i>`).join('');
}

function viewCal() {
  const lead = (parse(START).getDay() + 6) % 7;
  const cells = Array(lead).fill(null).concat(ALL);
  while (cells.length % 7) cells.push(null);
  let html = `<h2>Calendrier</h2><div class="small mut">Du ${shortDate(START)} au ${shortDate(END)} · touchez un jour pour l'ouvrir</div>
    <div class="cal-h">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<span>${x}</span>`).join('')}</div>`;
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7), first = week.find(Boolean);
    html += `<div class="cal-lab">Semaine du ${dayMonth(first)}</div><div class="cal-w">` +
      week.map(d => {
        if (!d) return '<div class="cell pad"></div>';
        const p = getPlan(d), on = p.type === 'ON';
        return `<button class="cell ${on ? 'on' : ''} ${d === todayStr() ? 'today' : ''}" data-a="open" data-d="${d}" aria-label="${longDate(d)}">
          <span class="dn">${parse(d).getDate()}</span>
          <span class="sn">${on ? SESSIONS[p.session].short : ''}</span>
          <span class="dots">${cellDots(d)}</span></button>`;
      }).join('') + '</div>';
  }
  const m = S.settings.modules;
  html += `<div class="legend"><span><i style="background:var(--c-force)"></i>Force</span><span><i style="background:var(--c-vshape)"></i>V-Shape</span><span><i style="background:var(--c-flex)"></i>Souplesse</span>
    ${m.neat ? '<span><i style="background:var(--c-neat)"></i>NEAT</span>' : ''}${m.read ? '<span><i style="background:var(--c-mind)"></i>Lecture</span>' : ''}${m.pray ? '<span><i style="background:var(--c-spirit)"></i>Prières</span>' : ''}</div>`;
  return html;
}

/* =====================  TABAC  ===================== */
function toLocalInput(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const stamp = iso => { const d = new Date(iso); return `${d.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })} à ${pad(d.getHours())} h ${pad(d.getMinutes())}`; };

function smokeLive() {
  const ms = smokeMs(), g = gradeFor(ms), nx = nextGrade(ms);
  const days = Math.floor(ms / DAY_MS), h = Math.floor(ms % DAY_MS / 36e5), m = Math.floor(ms % 36e5 / 6e4), s = Math.floor(ms % 6e4 / 1e3);
  let barPct = 100, nxt = 'Grade maximal atteint';
  if (nx) {
    const lo = g.d * DAY_MS, hi = nx.d * DAY_MS;
    barPct = (ms - lo) / (hi - lo) * 100;
    nxt = `Prochain grade : ${nx.n}, dans ${fmtDur(hi - ms)}`;
  }
  return { counter: `${days} j ${pad(h)} h ${pad(m)} min ${pad(s)} s`, grade: g.n, nxt, barPct };
}

function viewSmoke() {
  const live = smokeLive(), rec = recordSmoke(), ms = smokeMs();
  const days = smokeDaysInCycle(), health = Math.min(100, days / CONFIG.targets.smokeDays * 100);
  return `
    <h2>Tabac</h2>
    <div class="card mt smoke" style="--ac:var(--c-health)">
      <div class="small mut">Sans cigarette depuis le ${stamp(S.smoke.since)}</div>
      <div class="grade" id="smGrade">${live.grade}</div>
      <div class="counter" id="smCounter">${live.counter}</div>
      ${bar(live.barPct, '--c-health', 'smBar')}
      <div class="small mut mt0" id="smNext">${live.nxt}</div>
    </div>
    <div class="grid2 mt">
      <div class="stat"><div class="v" style="font-size:20px">${fmtDur(rec.ms)}</div><div class="l">Record · ${rec.grade}${rec.live ? ' (en cours)' : ''}</div></div>
      <div class="stat"><div class="v">${Math.round(health)}<span class="mut small"> %</span></div><div class="l">Cercle Santé du cycle (100 j = 100 %)</div></div>
    </div>
    ${rec.from && !rec.live ? `<p class="small mut">Record établi du ${stamp(rec.from)} au ${stamp(rec.to)}.</p>` : ''}
    <button class="btn danger mt wide" data-a="relapseopen">J'ai craqué</button>

    <h3 class="mt2">Les grades</h3>
    <div class="ladder mt0">${GRADES.map(g => {
      const got = ms / DAY_MS >= g.d, cur = gradeFor(ms).n === g.n, best = rec.ms / DAY_MS >= g.d;
      return `<div class="rung ${got ? 'got' : best ? 'was' : ''} ${cur ? 'cur' : ''}"><span>${g.n}</span><span class="small">${g.d === 0 ? 'départ' : g.d === 1 ? '1 jour' : g.d + ' jours'}</span></div>`;
    }).join('')}</div>

    ${S.smoke.relapses.length ? `<h3 class="mt2">Rechutes</h3>` + S.smoke.relapses.slice().reverse().slice(0, 8).map(r =>
      `<div class="fx act"><span><span class="nm">${stamp(r.at)}</span><div class="note">Après ${fmtDur(r.ms)} · ${r.grade}</div></span></div>`).join('') : ''}

    <details class="card mt2">
      <summary>Corriger la date de la dernière cigarette</summary>
      <div class="row mt0"><input id="smSince" type="datetime-local" value="${toLocalInput(S.smoke.since)}" max="${toLocalInput(NOW().toISOString())}">
      <button class="btn primary" data-a="smokesince">Enregistrer</button></div>
      <p class="small mut">Par défaut, le compteur part de la première ouverture de l'application.</p>
    </details>`;
}

/* =====================  PROGRÈS  ===================== */
function viewStats() {
  const pct = computePct(); updateRecords(pct);
  const rec = S.history.records, keys = activePct();
  const avg = sum(keys.map(k => pct[k])) / keys.length;
  const today = clampDate(todayStr()), elapsed = diff(START, today) + 1;
  const last = S.history.cycles[S.history.cycles.length - 1];
  const T = CONFIG.targets;

  const subs = {
    force: `${fmt(sum(ALL.filter(d => getPlan(d).type === 'ON').map(d => forceCredit(axisProgress(d)))))} / ${T.sessions} séances`,
    flex: `${fmt(sum(ALL.map(d => frac(axisProgress(d).flex))))} / ${T.flexDays} jours`,
    mind: `${sum(Array.from({ length: T.readWeeks }, (_, k) => weekPages(k) >= T.pagesPerWeek ? 1 : 0))} / ${T.readWeeks} semaines`,
    spirit: `${sum(ALL.map(d => prayersDone(d)))} / ${5 * T.prayerDays} prières`,
    health: `${Math.floor(smokeDaysInCycle())} / ${T.smokeDays} jours`
  };

  const ws = sortedWeights(), lastW = ws.length ? ws[ws.length - 1] : null;
  const { startWeight, targetWeight } = S.settings;
  const sm = lastW ? smoothAt(lastW[0]) : null;
  const lost = sm !== null ? startWeight - sm : null, remain = sm !== null ? sm - targetWeight : null;
  const gap = sm !== null ? sm - trajectoryAt(lastW[0]) : null;
  const daysLeft = Math.max(0, diff(todayStr(), CONFIG.weightEnd));
  const rate = remain !== null && daysLeft > 0 ? remain / (daysLeft / 7) : null;

  const neatDays = ALL.filter(d => d <= todayStr() && neatMinutes(d) >= S.settings.neatGoal).length;
  const neatAvg = elapsed > 0 ? sum(ALL.filter(d => d <= todayStr()).map(neatMinutes)) / Math.max(1, ALL.filter(d => d <= todayStr()).length) : 0;

  return `
    <h2>Progrès</h2>
    <div class="small mut">Cycle ${S.cycle.n + 1} · jour ${Math.max(1, elapsed)} / ${CONFIG.cycleDays} · du ${dayMonth(START)} au ${dayMonth(END)}</div>
    <div class="card mt">
      <div class="row between"><h3>Les cinq cercles</h3><span class="small mut">moyenne <b style="color:var(--tx)">${Math.round(avg)} %</b></span></div>
      <div class="rings">${keys.map(k => ring(pct[k], PCT_COLORS[k], PCT_NAMES[k], `${subs[k]}<br>record ${Math.round(rec[k] || 0)} %`)).join('')}</div>
      ${last ? `<div class="small mut mt0">Cycle précédent : ${PCT_KEYS.filter(k => keys.includes(k)).map(k => `${PCT_NAMES[k]} ${Math.round(last.pct[k])} %`).join(' · ')}</div>` : ''}
    </div>
    <details class="card mt">
      <summary>Comment les pourcentages sont calculés</summary>
      <div class="small mut howto">
        <p><b>Force</b> : 42 séances (3 × 14 semaines) = 100 %. Une séance parfaite vaut : 70 % musculation (séries cochées), 20 % V-Shape, 10 % échauffement. Une séance incomplète compte au prorata.</p>
        <p><b>Souplesse</b> : routine complète pendant 98 jours = 100 %, au prorata des mouvements cochés.</p>
        <p><b>Esprit</b> : au moins 50 pages par semaine pendant 14 semaines = 100 %. Chaque semaine compte pour 1/14, au prorata des pages.</p>
        <p><b>Spiritualité</b> : 5 prières × 98 jours = 100 %.</p>
        <p><b>Santé</b> : 100 jours sans fumer = 100 %. Une rechute remet le cercle à zéro.</p>
        <p>Au 101e jour, les pourcentages du cycle sont archivés et les compteurs repartent de zéro ; les records sont conservés.</p>
      </div>
    </details>

    ${S.settings.modules.neat ? `<div class="card mt" style="--ac:var(--c-neat)">
      <div class="row between"><h3>NEAT (bonus)</h3><span class="small mut">objectif ${S.settings.neatGoal} min / jour</span></div>
      ${bar(neatDays / Math.max(1, ALL.filter(d => d <= todayStr()).length) * 100, '--c-neat')}
      <div class="small mut mt0">Objectif atteint <b style="color:var(--tx)">${neatDays}</b> jour${neatDays > 1 ? 's' : ''} sur ${Math.max(1, ALL.filter(d => d <= todayStr()).length)} · moyenne ${Math.round(neatAvg)} min / jour</div>
    </div>` : ''}

    <h3 class="mt2">Poids</h3>
    <div class="small mut">${fmt(startWeight)} kg → ${fmt(targetWeight)} kg d'ici le ${parse(CONFIG.weightEnd).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' })} · moyenne lissée sur 7 jours</div>
    <div class="card mt">${chart(ws)}</div>
    <div class="grid2 mt">
      <div class="stat"><div class="v">${sm !== null ? fmt(sm) : '—'}</div><div class="l">Poids lissé (kg)${lastW ? ` · dernière pesée ${fmt(lastW[1])}` : ''}</div></div>
      <div class="stat ${lost > 0 ? 'good' : ''}"><div class="v">${lost !== null ? fmt(lost) : '—'}</div><div class="l">Perdu depuis le départ (kg)</div></div>
      <div class="stat"><div class="v">${remain !== null ? fmt(Math.max(0, remain)) : '—'}</div><div class="l">Reste à perdre (kg)</div></div>
      <div class="stat ${gap !== null ? (gap <= 0.3 ? 'good' : 'bad') : ''}"><div class="v">${gap !== null ? (gap > 0 ? '+' : '') + fmt(gap) : '—'}</div><div class="l">Écart à la trajectoire (kg)</div></div>
    </div>
    ${rate !== null && remain > 0 ? `<p class="small mut mt">${daysLeft} jours avant l'échéance : environ ${fmt(rate)} kg par semaine à perdre.</p>` : ''}
    ${rate !== null && rate > 1 ? `<div class="alert mt">Ce rythme dépasse 1 kg par semaine : mieux vaut repousser l'échéance que sacrifier la masse maigre.</div>` : ''}

    <h3 class="mt2">Mesures V-Shape</h3>
    ${measuresCard()}

    <h3 class="mt2">Médailles</h3>
    <div class="badges mt">${medals(lost, elapsed).map(b => `<div class="bdg ${b[2] ? 'got' : ''}"><b>${b[0]}</b><span>${b[1]}</span></div>`).join('')}</div>`;
}

function measuresCard() {
  const ms = Object.entries(S.measures).sort((a, b) => a[0].localeCompare(b[0]));
  const lastM = ms.length ? ms[ms.length - 1][1] : {}, first = ms.length ? ms[0][1] : null;
  const ratio = m => m.waist && m.shoulders ? (m.shoulders / m.waist).toFixed(2).replace('.', ',') : '—';
  const dl = (k) => first && lastM[k] && first[k] ? (lastM[k] - first[k] > 0 ? '+' : '') + fmt(lastM[k] - first[k]) : null;
  return `<div class="card mt">
    <div class="small mut">Une fois par semaine, matin à jeun, au même endroit. Mesures en centimètres.</div>
    <div class="mrow mt0">
      <label>Taille<input id="mWaist" type="number" inputmode="decimal" step="0.1" value="${lastM.waist || ''}"></label>
      <label>Épaules<input id="mShoulders" type="number" inputmode="decimal" step="0.1" value="${lastM.shoulders || ''}"></label>
      <label>Bras<input id="mArm" type="number" inputmode="decimal" step="0.1" value="${lastM.arm || ''}"></label>
    </div>
    <button class="btn primary mt0" data-a="measure">Enregistrer pour le ${shortDate(clampDate(todayStr()))}</button>
    ${ms.length ? `<div class="mtable mt0"><div class="mh"><span>Date</span><span>Taille</span><span>Épaules</span><span>Bras</span><span>Ratio</span></div>
      ${ms.slice(-5).reverse().map(([d, m]) => `<div><span>${parse(d).toLocaleDateString('fr-BE', { day: 'numeric', month: 'numeric' })}</span><span>${m.waist ? fmt(m.waist) : '—'}</span><span>${m.shoulders ? fmt(m.shoulders) : '—'}</span><span>${m.arm ? fmt(m.arm) : '—'}</span><span>${ratio(m)}</span></div>`).join('')}</div>
      ${ms.length > 1 ? `<div class="small mut mt0">Depuis la première mesure : taille ${dl('waist') || '—'} cm · épaules ${dl('shoulders') || '—'} cm · bras ${dl('arm') || '—'} cm. Le ratio épaules / taille monte quand la silhouette se dessine.</div>` : ''}` : ''}
  </div>`;
}

function maxFlexStreak() {
  let best = 0, c = 0;
  ALL.forEach(d => { if (isComplete(axisProgress(d).flex)) { c++; best = Math.max(best, c); } else c = 0; });
  return best;
}

function medals(lost, elapsed) {
  const sessions = ALL.filter(d => getPlan(d).type === 'ON' && isComplete(axisProgress(d).muscu)).length;
  const rec = recordSmoke(), recDays = rec.ms / DAY_MS;
  const booksDone = S.books.filter(b => b.done).length;
  const fullPray = ALL.filter(d => prayersDone(d) === 5).length;
  const w = lost !== null ? lost : 0;
  return [
    ['Première séance', 'Une séance de musculation terminée', sessions >= 1],
    ['5 séances', 'Cinq séances terminées', sessions >= 5],
    ['25 séances', 'Vingt-cinq séances terminées', sessions >= 25],
    ['−1 kg', 'Premier kilo envolé (lissé)', w >= 1],
    ['−3 kg', 'Trois kilos de moins', w >= 3],
    ['Objectif de poids', `${fmt(S.settings.targetWeight)} kg`, lost !== null && S.settings.startWeight - lost <= S.settings.targetWeight],
    ['7 jours souples', 'Routine de souplesse sept jours d\'affilée', maxFlexStreak() >= 7],
    ['Caporal', 'Sept jours sans tabac', recDays >= 7],
    ['Sergent-chef', 'Trente jours sans tabac', recDays >= 30],
    ['Lieutenant', 'Cent jours sans tabac', recDays >= 100],
    ['Premier livre', 'Un livre terminé', booksDone >= 1],
    ['Dix journées complètes', 'Cinq prières, dix jours', fullPray >= 10]
  ];
}

function chart(ws) {
  const { startWeight, targetWeight } = S.settings;
  const W = 360, H = 200, L = 34, R = 10, T = 12, B = 26;
  const span = diff(START, END);
  const sm = ws.map(([d]) => [d, smoothAt(d)]);
  const vals = ws.map(x => x[1]).concat([startWeight, targetWeight]);
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const X = d => L + (Math.max(0, Math.min(span, diff(START, d))) / span) * (W - L - R);
  const Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  let g = '';
  const step = (hi - lo) > 10 ? 2 : 1;
  for (let v = lo; v <= hi; v += step) g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" fill="var(--mut)" font-size="10">${v}</text>`;
  ALL.forEach(d => { if (d.endsWith('-01') || d === START) g += `<text x="${X(d)}" y="${H - 8}" fill="var(--mut)" font-size="10" text-anchor="${d === START ? 'start' : 'middle'}">${parse(d).toLocaleDateString('fr-BE', { month: 'short' })}</text>`; });
  const wEnd = CONFIG.weightEnd <= END ? CONFIG.weightEnd : END;
  const target = `<polyline fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5 4" points="${X(START)},${Y(startWeight)} ${X(wEnd)},${Y(targetWeight)} ${X(END)},${Y(targetWeight)}"/>`;
  const raw = ws.map(([d, v]) => `<circle cx="${X(d)}" cy="${Y(v)}" r="2.6" fill="var(--c-vshape)" opacity=".45"/>`).join('');
  const path = sm.length > 1 ? `<polyline fill="none" stroke="var(--c-vshape)" stroke-width="2.4" stroke-linejoin="round" points="${sm.map(([d, v]) => `${X(d)},${Y(v)}`).join(' ')}"/>` : '';
  const dots = sm.length === 1 ? `<circle cx="${X(sm[0][0])}" cy="${Y(sm[0][1])}" r="3.6" fill="var(--c-vshape)"/>` : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de poids lissée et trajectoire cible">${g}${target}${raw}${path}${dots}</svg>
    <div class="legend" style="margin-top:6px"><span><i style="background:var(--c-vshape)"></i>Moyenne 7 jours</span><span><i style="background:var(--c-vshape);opacity:.45"></i>Pesées</span><span><i style="background:var(--accent)"></i>Trajectoire cible</span></div>`;
}

/* =====================  RÉGLAGES  ===================== */
function viewSet() {
  const s = S.settings, p = s.pray;
  const sel = (path, opts, val, num) => `<select data-set="${path}" ${num ? 'data-t="n"' : ''}>${opts.map(([v, n]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  const chk = (path, val) => `<input type="checkbox" data-set="${path}" data-t="b" ${val ? 'checked' : ''}>`;
  const num = (path, val, step, min, max) => `<input type="number" data-set="${path}" data-t="n" step="${step || 1}" min="${min}" max="${max}" value="${val}">`;
  const cityOpts = Object.keys(CITIES).map(c => [c, CITIES[c]]);
  return `
    <h2>Réglages</h2>

    <div class="card mt"><h3>Apparence</h3>
      <div class="field"><span>Thème</span>${sel('theme', [['dark', 'Sombre'], ['light', 'Clair'], ['auto', 'Automatique']], s.theme)}</div>
      <div class="field"><span>Taille du texte</span>${sel('font', [[0.9, 'Petite'], [1, 'Normale'], [1.12, 'Grande'], [1.25, 'Très grande']], s.font, true)}</div>
      <div class="field"><span>Palette</span>${sel('palette', Object.keys(PALETTES).map(k => [k, PALETTES[k].label]).concat([['custom', 'Personnalisée']]), s.palette)}</div>
      <div class="swatches mt0">${Object.keys(COLOR_LABELS).map(k => `<label class="sw"><input type="color" data-set="colors.${k}" value="${s.colors[k]}"><span>${COLOR_LABELS[k]}</span></label>`).join('')}</div>
    </div>

    <div class="card mt"><h3>Modules</h3>
      <div class="small mut">Un module masqué disparaît du jour, du calendrier et des cercles.</div>
      <div class="field"><span>NEAT</span>${chk('modules.neat', s.modules.neat)}</div>
      <div class="field"><span>Lecture</span>${chk('modules.read', s.modules.read)}</div>
      <div class="field"><span>Prières</span>${chk('modules.pray', s.modules.pray)}</div>
      <div class="field"><span>Tabac</span>${chk('modules.smoke', s.modules.smoke)}</div>
    </div>

    <div class="card mt"><h3>Séances</h3>
      <div class="field"><span>Minuteur de repos</span>${chk('rest.on', s.rest.on)}</div>
      <div class="field"><span>Repos musculation (s)</span>${num('rest.muscu', s.rest.muscu, 15, 15, 600)}</div>
      <div class="field"><span>Repos V-Shape (s)</span>${num('rest.vshape', s.rest.vshape, 15, 15, 600)}</div>
      <div class="field"><span>Vibration en fin de repos</span>${chk('rest.vibrate', s.rest.vibrate)}</div>
      <div class="field"><span>Bip en fin de repos</span>${chk('rest.sound', s.rest.sound)}</div>
      <div class="field"><span>Pas de progression (kg)</span>${num('loadStep', s.loadStep, 0.5, 0.5, 10)}</div>
      <div class="field"><span>Objectif NEAT (min / jour)</span>${num('neatGoal', s.neatGoal, 5, 5, 300)}</div>
    </div>

    <div class="card mt"><h3>Prières</h3>
      <div class="field"><span>Méthode de calcul</span>${sel('pray.method', PRAYER_METHODS.map(m => [m.id, m.n]), p.method, true)}</div>
      <div class="field"><span>Asr</span>${sel('pray.school', [[0, 'Standard (Shafi\'i, Maliki, Hanbali)'], [1, 'Hanafi']], p.school, true)}</div>
      <div class="field"><span>Ville les jours de bureau</span>${sel('pray.work', cityOpts, p.work)}</div>
      <div class="field"><span>Ville les jours à la maison</span>${sel('pray.home', cityOpts, p.home)}</div>
      <div class="small mut mt0">Jours à la maison</div>
      <div class="days">${[1, 2, 3, 4, 5, 6, 0].map(wd => `<label><input type="checkbox" data-homeday="${wd}" ${p.homeDays.includes(wd) ? 'checked' : ''}><span>${['D', 'L', 'M', 'M', 'J', 'V', 'S'][wd]}</span></label>`).join('')}</div>
      <div class="field"><span>Afficher le texte arabe</span>${chk('pray.arabic', p.arabic)}</div>
      <p class="small mut">Charleroi et Bruxelles ne diffèrent que d'une minute environ. Si votre mosquée suit un calendrier précis, choisissez la méthode qui s'en rapproche.</p>
    </div>

    <div class="card mt"><h3>Objectif de poids</h3>
      <div class="field"><span>Poids de départ (kg)</span>${num('startWeight', s.startWeight, 0.1, 40, 250)}</div>
      <div class="field"><span>Poids cible (kg)</span>${num('targetWeight', s.targetWeight, 0.1, 40, 250)}</div>
    </div>

    <div class="card mt"><h3>Permutations</h3>
      <p class="small mut">« Permuter » échange tout le contenu de deux dates. Une date dont la séance est entamée ne peut plus être permutée.</p>
      ${S.lastSwap ? `<p class="small">Dernière permutation : ${shortDate(S.lastSwap[0])} ↔ ${shortDate(S.lastSwap[1])}</p><button class="btn" data-a="undo">Annuler cette permutation</button>` : '<p class="small mut">Aucune permutation à annuler.</p>'}
    </div>

    <div class="card mt"><h3>Sauvegarde</h3>
      <p class="small mut">Les données restent sur cet appareil. Exportez-les de temps en temps : c'est la seule copie.</p>
      <div class="row" style="flex-wrap:wrap"><button class="btn" data-a="export">Exporter</button>
      <label class="btn" for="imp">Importer</label><input id="imp" type="file" accept="application/json,.json" hidden></div>
    </div>

    <div class="card mt"><h3>Remise à zéro</h3>
      <p class="small mut">Efface pesées, charges, livres, compteur de tabac et permutations.</p>
      <button class="btn danger" data-a="reset">Tout effacer</button>
    </div>`;
}

/* =====================  FENÊTRES  ===================== */
function renderModal() {
  const m = $('modal');
  if (!V.modal) { m.hidden = true; m.innerHTML = ''; return; }
  m.hidden = false;
  if (V.modal === 'swap') {
    const d = V.date, p = getPlan(d);
    const from = clampDate(addDays(d, -7)), to = clampDate(addDays(d, 21));
    const list = ALL.filter(x => x >= from && x <= to && x !== d);
    m.innerHTML = `<div class="sheet" role="dialog" aria-label="Permuter">
      <div class="row between"><h3>Permuter ${shortDate(d)}</h3><button class="btn" data-a="close">Fermer</button></div>
      <p class="small mut">Aujourd'hui : ${p.type === 'ON' ? `ON · ${SESSIONS[p.session].label}` : 'OFF'}. Choisissez la date avec laquelle échanger.</p>
      ${list.map(x => { const q = getPlan(x), on = q.type === 'ON';
        return `<button class="pick ${on ? 'on' : ''}" data-a="doswap" data-d="${x}"><span>${shortDate(x)}</span><span class="s">${on ? 'ON · ' + SESSIONS[q.session].label : 'OFF'}</span></button>`; }).join('')}
    </div>`;
  } else if (V.modal === 'books') {
    const md = V.mdata || { q: '', res: null, busy: false, err: '' };
    m.innerHTML = `<div class="sheet" role="dialog" aria-label="Ajouter un livre">
      <div class="row between"><h3>Ajouter un livre</h3><button class="btn" data-a="close">Fermer</button></div>
      <div class="row mt0"><input id="bq" type="search" placeholder="Titre ou auteur" value="${esc(md.q)}" class="grow"><button class="btn primary" data-a="booksearch">Chercher</button></div>
      ${md.busy ? '<p class="small mut">Recherche en cours…</p>' : ''}${md.err ? `<p class="small" style="color:var(--warn)">${esc(md.err)}</p>` : ''}
      ${md.res ? (md.res.length ? md.res.map((b, i) => `<div class="book">${b.cover ? `<img src="${esc(b.cover)}" alt="">` : '<div class="nocover"></div>'}
        <div class="grow"><b>${esc(b.title)}</b><div class="small mut">${esc(b.authors)}${b.year ? ` · ${esc(b.year)}` : ''}${b.pages ? ` · ${b.pages} p.` : ''}</div>
        <button class="btn sm mt0" data-a="bookadd" data-i="${i}">Ajouter</button></div></div>`).join('') : '<p class="small mut">Aucun résultat.</p>') : ''}
      <details class="mt"><summary>Saisie manuelle</summary>
        <div class="mrow mt0" style="grid-template-columns:1fr"><label>Titre<input id="bmT" type="text"></label>
        <label>Auteur<input id="bmA" type="text"></label><label>Pages<input id="bmP" type="number" inputmode="numeric" min="1"></label></div>
        <button class="btn mt0" data-a="bookmanual">Ajouter</button></details>
    </div>`;
  } else if (V.modal === 'relapse') {
    const ms = smokeMs();
    m.innerHTML = `<div class="sheet center" role="alertdialog" aria-label="Confirmer la rechute">
      <h3>Confirmer la défaite ?</h3>
      <p>Vous tenez depuis <b>${fmtDur(ms)}</b> et portez le grade de <b>${gradeFor(ms).n}</b>. Le compteur repartira de zéro ; votre record restera inscrit.</p>
      <div class="row" style="justify-content:center;flex-wrap:wrap"><button class="btn primary" data-a="close">Non, je tiens bon</button><button class="btn danger" data-a="relapseyes">Oui, j'ai fumé</button></div>
    </div>`;
  } else if (V.modal === 'sermon') {
    const lines = SERMONS[V.mdata.n % SERMONS.length](V.mdata);
    m.innerHTML = `<div class="sheet center sermon" role="alertdialog" aria-label="Rapport de défaite">
      <div class="small mut">RAPPORT DE DÉFAITE</div>
      ${lines.map((l, i) => i === 0 ? `<h3>${l}</h3>` : `<p>${l}</p>`).join('')}
      <button class="btn primary mt" data-a="close">Je me relève</button>
    </div>`;
  }
}
