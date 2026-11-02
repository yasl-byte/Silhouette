/* ============================================================
   Silhouette v2 — accès réseau (Aladhan, versets, Google Books)
   Tout est mis en cache sur l'appareil : seul le premier chargement exige une connexion.
   ============================================================ */
'use strict';

const _inflight = new Set();
const ALADHAN = 'https://api.aladhan.com/v1';
const QURAN = 'https://api.alquran.cloud/v1';

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) { const e = new Error('http ' + r.status); e.status = r.status; throw e; }
  return r.json();
}

/* ----- Horaires de prière (calendrier du mois, par ville) ----- */
async function loadPrayerMonth(city, y, m) {
  const key = prayerKey(city, y, m);
  if (S.prayer[key] || _inflight.has(key)) return;
  _inflight.add(key);
  try {
    const p = S.settings.pray;
    const j = await getJson(`${ALADHAN}/calendarByCity/${y}/${m}?city=${encodeURIComponent(city)}&country=Belgium&method=${p.method}&school=${p.school}`);
    if (j.code !== 200 || !Array.isArray(j.data)) throw new Error('réponse inattendue');
    const days = {};
    j.data.forEach(x => {
      const [dd, mm, yy] = x.date.gregorian.date.split('-');
      const t = x.timings, hm = v => String(v).slice(0, 5);
      days[`${yy}-${mm}-${dd}`] = { Fajr: hm(t.Fajr), Sunrise: hm(t.Sunrise), Dhuhr: hm(t.Dhuhr), Asr: hm(t.Asr), Maghrib: hm(t.Maghrib), Isha: hm(t.Isha) };
    });
    S.prayer[key] = { at: NOW().getTime(), days };
    save();
    if (typeof renderSoon === 'function') renderSoon('pray');
  } catch (e) { /* hors ligne : on réessaiera à la prochaine ouverture */ }
  finally { _inflight.delete(key); }
}

/* Mois en cours et suivant, pour les deux villes. */
function prefetchPrayer() {
  const n = NOW();
  [0, 1, 2].forEach(off => {
    const dt = new Date(n.getFullYear(), n.getMonth() + off, 1);
    Object.keys(CITIES).forEach(c => loadPrayerMonth(c, dt.getFullYear(), dt.getMonth() + 1));
  });
}

/* ----- Versets (traduction Hamidullah) ----- */
async function loadVerse(ref) {
  const k = 'v' + ref;
  if (S.verses[ref] || _inflight.has(k)) return;
  _inflight.add(k);
  try {
    const [fr, ar] = await Promise.all([
      getJson(`${QURAN}/ayah/${ref}/fr.hamidullah`),
      getJson(`${QURAN}/ayah/${ref}/quran-uthmani`).catch(() => null)
    ]);
    if (fr.code !== 200 || !fr.data || !fr.data.text) throw Object.assign(new Error('verset introuvable'), { status: 404 });
    S.verses[ref] = {
      fr: fr.data.text,
      ar: ar && ar.data ? ar.data.text : '',
      sn: fr.data.surah.englishName, s: fr.data.surah.number, n: fr.data.numberInSurah
    };
    save();
    if (typeof renderSoon === 'function') renderSoon('pray');
  } catch (e) {
    if (e.status === 404 || e.status === 400) { S.verses[ref] = { bad: true }; save(); }
  } finally { _inflight.delete(k); }
}

/* Aujourd'hui et les six jours suivants, pour tenir hors ligne. */
function prefetchVerses() {
  const t = clampDate(todayStr());
  for (let i = 0; i < 7; i++) {
    const d = addDays(t, i);
    if (d <= END) loadVerse(verseRef(d));
  }
}

/* ----- Livres (Google Books) ----- */
async function searchBooks(q) {
  const j = await getJson(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=10&printType=books`);
  return (j.items || []).map(it => {
    const v = it.volumeInfo || {};
    return {
      gid: it.id, title: v.title || 'Sans titre', authors: (v.authors || []).join(', '),
      pages: v.pageCount || 0, year: String(v.publishedDate || '').slice(0, 4),
      cover: ((v.imageLinks || {}).thumbnail || '').replace('http://', 'https://')
    };
  });
}
