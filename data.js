/* ============================================================
   Silhouette v2 — données statiques du programme
   Exercices, échauffements, routine, grades, versets : tout se règle ici.
   ============================================================ */

const CONFIG = {
  start: "2026-11-03",          // jour 1 du premier cycle
  cycleDays: 100,               // 3 nov 2026 → 10 fév 2027 ; remise à zéro au 101e jour
  weightEnd: "2027-01-31",      // échéance de l'objectif de poids
  startWeight: 90,
  targetWeight: 85,
  rotation: ["PUSH", "PULL", "LOWER"],
  onWeekdays: [1, 3, 5],        // lundi, mercredi, vendredi (0 = dimanche)
  // La reprise a lieu le mardi 3 novembre : la séance du mercredi 4 y est avancée.
  initialSwaps: [["2026-11-03", "2026-11-04"]],

  // Cibles correspondant à 100 % dans chacun des cinq cercles
  targets: {
    sessions: 42,       // 3 séances × 14 semaines
    flexDays: 98,       // routine de souplesse complète, 14 semaines
    prayerDays: 98,     // 5 prières × 98 jours
    readWeeks: 14,      // 14 semaines…
    pagesPerWeek: 50,   // …d'au moins 50 pages
    smokeDays: 100      // 100 jours sans fumer
  },
  // Poids d'une séance « correctement suivie » dans le cercle Force
  forceWeights: { muscu: 0.70, vshape: 0.20, warm: 0.10 }
};

/* load:true  -> champ « charge » affiché (kg)
   load:false -> poids du corps / temps : seules les séries se cochent */
const SESSIONS = {
  PUSH: {
    label: "Push", short: "Push", sub: "Pectoraux · Épaules · Triceps",
    warm: [
      { id: "wpu1", name: "Rotations externes à l'élastique", dur: "2 × 15" },
      { id: "wpu2", name: "Pompes lentes ou scapulaires", dur: "2 × 10" },
      { id: "wpu3", name: "Séries d'approche au développé couché", dur: "2 séries", note: "Barre à vide, puis environ 50 % de la charge de travail." }
    ],
    muscu: [
      { id: "pu1", name: "Développé couché barre",       sets: 4, reps: "8–10",  load: true },
      { id: "pu2", name: "Développé incliné haltères",   sets: 3, reps: "10–12", load: true },
      { id: "pu3", name: "Développé épaules machine",    sets: 3, reps: "10–12", load: true },
      { id: "pu4", name: "Écarté poulie vis-à-vis",      sets: 3, reps: "12–15", load: true },
      { id: "pu5", name: "Extension triceps à la corde", sets: 3, reps: "12–15", load: true }
    ],
    vshape: [
      { id: "pv1", name: "Élévations latérales haltères", sets: 4, reps: "12–15", load: true, note: "Coudes légèrement fléchis, montée contrôlée." },
      { id: "pv2", name: "Élévations latérales poulie (unilatéral)", sets: 3, reps: "15", load: true },
      { id: "pv3", name: "Vacuum abdominal", sets: 4, reps: "20 s", load: false, note: "Expiration complète, ventre aspiré." }
    ]
  },
  PULL: {
    label: "Pull", short: "Pull", sub: "Dos · Biceps",
    warm: [
      { id: "wpl1", name: "Activation des omoplates (suspension active)", dur: "2 × 10" },
      { id: "wpl2", name: "Face pull léger", dur: "2 × 15" },
      { id: "wpl3", name: "Séries d'approche au tirage vertical", dur: "2 séries", note: "Charge légère, tirage lent." }
    ],
    muscu: [
      { id: "pl1", name: "Tractions",                         sets: 4, reps: "6–10",  load: true, note: "Lest (+) ou assistance (−), en kg." },
      { id: "pl2", name: "Tirage vertical prise large",       sets: 4, reps: "10–12", load: true },
      { id: "pl3", name: "Rowing machine, poitrine appuyée",  sets: 3, reps: "10–12", load: true },
      { id: "pl4", name: "Curl incliné haltères",             sets: 3, reps: "10–12", load: true },
      { id: "pl5", name: "Curl marteau",                      sets: 3, reps: "12",    load: true }
    ],
    vshape: [
      { id: "plv1", name: "Élévations latérales haltères", sets: 3, reps: "15", load: true },
      { id: "plv2", name: "Pull-over poulie, bras tendus", sets: 3, reps: "12–15", load: true, note: "Sentir le grand dorsal, pas les triceps." },
      { id: "plv3", name: "Face pull", sets: 3, reps: "15", load: true }
    ]
  },
  LOWER: {
    label: "Legs", short: "Legs", sub: "Jambes · Fessiers",
    warm: [
      { id: "wlo1", name: "Squat au poids du corps", dur: "2 × 15" },
      { id: "wlo2", name: "Ponts fessiers", dur: "2 × 12" },
      { id: "wlo3", name: "Balancés de jambes et fentes dynamiques", dur: "10 / jambe" },
      { id: "wlo4", name: "Séries d'approche à la presse", dur: "2 séries", note: "Charge légère, amplitude complète." }
    ],
    muscu: [
      { id: "lo1", name: "Presse à cuisses",         sets: 4, reps: "10–12", load: true },
      { id: "lo2", name: "Fentes marchées haltères", sets: 3, reps: "12 / jambe", load: true },
      { id: "lo3", name: "Leg curl allongé",         sets: 3, reps: "12", load: true },
      { id: "lo4", name: "Hip thrust",               sets: 3, reps: "10–12", load: true },
      { id: "lo5", name: "Mollets debout",           sets: 4, reps: "15", load: true }
    ],
    vshape: [
      { id: "lov1", name: "Élévations latérales haltères", sets: 3, reps: "15", load: true },
      { id: "lov2", name: "Gainage latéral", sets: 3, reps: "30–40 s", load: false, note: "Par côté." },
      { id: "lov3", name: "Vacuum abdominal", sets: 4, reps: "20 s", load: false }
    ]
  }
};

/* Échauffement commun à toutes les séances */
const WARM_GEN = [
  { id: "wg1", name: "Cardio léger : rameur, vélo ou marche rapide", dur: "5 min", note: "Jusqu'à une légère chaleur, sans essoufflement." },
  { id: "wg2", name: "Mobilité articulaire : épaules, hanches, colonne", dur: "2 min", note: "Cercles de bras, rotations de hanches, chat-vache." }
];

/* Jours OFF : mini-bloc V-Shape d'entretien (~10 min, à la maison) */
const OFF_VSHAPE = [
  { id: "ov1", name: "Vacuum abdominal",             sets: 4, reps: "20 s", load: false },
  { id: "ov2", name: "Gainage latéral",              sets: 3, reps: "30 s", load: false, note: "Par côté." },
  { id: "ov3", name: "Y-T-W au sol",                 sets: 3, reps: "10",   load: false, note: "Ouverture des épaules, omoplates serrées." },
  { id: "ov4", name: "Élévations latérales légères", sets: 2, reps: "20",   load: true,  note: "Haltères légers, sans lutter." }
];

/* Souplesse : routine quotidienne, environ 13 minutes */
const FLEX = [
  { id: "f1", name: "Respiration diaphragmatique 90/90", dur: "2 min", note: "Dos plaqué, jambes sur une chaise." },
  { id: "f2", name: "Chat-vache", dur: "1 min" },
  { id: "f3", name: "Fléchisseurs de hanche, fente basse", dur: "45 s / côté", note: "Bassin en rétroversion, fessier serré." },
  { id: "f4", name: "Rétraction du menton", dur: "2 × 10", note: "Contre la tête en avant." },
  { id: "f5", name: "Ouverture pectorale en encadrement de porte", dur: "45 s / côté", note: "Contre les épaules enroulées." },
  { id: "f6", name: "Rotation thoracique, thread the needle", dur: "8 / côté" },
  { id: "f7", name: "Pont fessier avec bascule du bassin", dur: "2 × 12" },
  { id: "f8", name: "Posture de l'enfant", dur: "1 min" }
];

/* NEAT : mouvement du quotidien, faisable à la maison. step = minutes ajoutées d'un geste. */
const NEAT_ACTS = [
  { id: "walk",   name: "Marche",                     step: 10, note: "Tour du quartier, après un repas, en téléphonant." },
  { id: "brisk",  name: "Marche rapide",              step: 10, note: "Assez vive pour parler, trop pour chanter." },
  { id: "stairs", name: "Escaliers",                  step: 5,  note: "Montez à pied dès que possible ; cinq minutes comptent." },
  { id: "rower",  name: "Rameur",                     step: 10, note: "Allure facile, poussée par les jambes, dos gainé." },
  { id: "bike",   name: "Vélo d'appartement",         step: 10, note: "Résistance légère, en regardant un épisode." },
  { id: "chores", name: "Tâches actives",             step: 15, note: "Ménage, jardin, bricolage, rangement : tout mouvement compte." },
  { id: "stand",  name: "Debout ou en marchant",      step: 10, note: "Appels, lecture, travail sur écran debout." },
  { id: "pause",  name: "Pause active",               step: 5,  note: "Toutes les heures assis : deux à cinq minutes de mouvement." }
];

/* Grades du compteur sans tabac (seuil en jours) */
const GRADES = [
  { d: 0,    n: "Civil" },
  { d: 1,    n: "Recrue" },
  { d: 3,    n: "Soldat de 1re classe" },
  { d: 7,    n: "Caporal" },
  { d: 14,   n: "Caporal-chef" },
  { d: 21,   n: "Sergent" },
  { d: 30,   n: "Sergent-chef" },
  { d: 45,   n: "Adjudant" },
  { d: 60,   n: "Adjudant-chef" },
  { d: 75,   n: "Major" },
  { d: 90,   n: "Sous-lieutenant" },
  { d: 100,  n: "Lieutenant" },
  { d: 150,  n: "Capitaine" },
  { d: 200,  n: "Commandant" },
  { d: 270,  n: "Lieutenant-colonel" },
  { d: 365,  n: "Colonel" },
  { d: 547,  n: "Général de brigade" },
  { d: 730,  n: "Général de division" },
  { d: 1095, n: "Maréchal" }
];

/* Sermons de rechute : sobres, graves, tournés vers la reprise. */
const SERMONS = [
  i => [
    "Soldat.",
    i.ms < 36e5
      ? "Vous n'aviez même pas tenu une heure : la défaite est brève, la leçon n'en est pas moins nette."
      : `Vous aviez tenu ${i.dur} et conquis le grade de ${i.grade}. Une cigarette vient de vous le reprendre.`,
    "Ne cherchez pas d'excuse. L'ennemi n'a pas enfoncé vos lignes : la porte a été ouverte de l'intérieur, et vous le savez.",
    `Mais un soldat qui tombe n'est pas un déserteur tant qu'il se relève. Le compteur repart de zéro ; votre record, ${i.record}, demeure gravé et vous attend.`,
    "Debout."
  ],
  i => [
    "Le constat est sans appel.",
    `Vous teniez ${i.dur} ; vous voici ramené au rang de civil. Ce n'est pas la nicotine qui l'a décidé : c'est un instant de faiblesse que vous aviez, au fond, vu venir.`,
    "Rappelez-vous l'heure, le lieu, ce qui l'a précédé. Voilà l'ennemi véritable, et c'est lui qu'il faudra vaincre la prochaine fois.",
    "Il n'y a ici ni honte ni absolution à bon compte : il y a une dette envers vous-même, et vous savez comment elle se paie.",
    "Recommencez."
  ],
  i => [
    i.ms < 36e5 ? "Un grade se paie en nuits difficiles et en envies refusées." : `Le grade de ${i.grade} n'était pas un cadeau : il se payait en nuits difficiles et en envies refusées.`,
    "Vous l'avez bradé pour quelques minutes de fumée. Pesez cet échange, gravement, et sans complaisance.",
    "Puis relevez la tête : les meilleurs états-majors ont connu des replis, et c'est le lendemain qu'on les juge.",
    `Votre record est de ${i.record} ; il n'a pas bougé. Allez le dépasser.`
  ],
  i => [
    "Vous venez de rompre le serment fait à votre propre corps.",
    "Soyez grave, et soyez juste : ce n'est pas une catastrophe, mais ce n'est pas un détail non plus.",
    i.ms < 36e5 ? "Le temps tenu est court, mais l'effort était réel." : `Les ${i.dur} que vous aviez tenus ne sont pas effacés : ils prouvent que vous en êtes capable.`,
    "Le compteur retombe à zéro, la preuve demeure.",
    "Au rapport demain matin, sans cigarette."
  ]
];

/* Les cinq prières (clé = champ de l'API Aladhan) */
const PRAYERS = [
  { k: "Fajr",    n: "Fajr",    fr: "Aube" },
  { k: "Dhuhr",   n: "Dhuhr",   fr: "Midi" },
  { k: "Asr",     n: "Asr",     fr: "Après-midi" },
  { k: "Maghrib", n: "Maghrib", fr: "Coucher du soleil" },
  { k: "Isha",    n: "Isha",    fr: "Nuit" }
];
const CITIES = { Charleroi: "Charleroi", Brussels: "Bruxelles" };
const PRAYER_METHODS = [
  { id: 3,  n: "Ligue islamique (MWL)" },
  { id: 12, n: "UOIF (France)" },
  { id: 2,  n: "ISNA" },
  { id: 13, n: "Diyanet (Turquie)" },
  { id: 15, n: "Moonsighting Committee" }
];

/* Versets à méditer : références sourate:verset. Le texte français (Hamidullah)
   est récupéré en ligne puis conservé sur l'appareil. L'ordre est tiré une fois
   pour toutes au hasard, sans répétition avant la fin de la liste. */
const VERSES = [
  "2:45","2:152","2:153","2:155","2:186","2:195","2:216","2:255","2:286",
  "3:8","3:26","3:31","3:133","3:139","3:159","3:185","3:190","3:191","3:200",
  "4:28","4:29","4:103","5:2","5:8","6:162","7:199","8:46","9:51",
  "11:114","11:115","12:87","13:11","13:28","14:7","15:99","16:90","16:97","16:127",
  "17:23","17:24","17:78","18:10","18:46","18:110","20:14","20:25","20:114","20:130",
  "21:87","21:107","23:1","23:2","24:35","25:63","25:74","29:45","29:69","30:21",
  "31:17","31:18","31:19","33:41","39:10","39:53","40:60","41:34","49:10","49:13",
  "50:16","55:13","57:20","59:18","62:10","64:16","65:2","65:3","67:2","79:40",
  "87:14","91:9","93:3","93:4","93:5","93:11","94:5","94:6","94:7","94:8",
  "99:7","99:8","103:1","103:2","103:3","112:1",
  "1:5","1:6","2:148","2:156","2:201","7:23","14:40","17:80","20:46","23:118",
  "26:80","51:55","52:48","65:7","94:1","96:19","110:3","113:1","114:1"
];

/* Palettes : accent + couleur de chaque axe. Chacune reste modifiable une à une. */
const PALETTES = {
  ambre:    { label: "Ambre",    accent: "#f2a93b", force: "#f2a93b", vshape: "#38c3b0", flex: "#a78bfa", mind: "#6aa9ff", spirit: "#e5c76b", health: "#5ad08a", neat: "#ef8a6b" },
  ocean:    { label: "Océan",    accent: "#4aa3ff", force: "#4aa3ff", vshape: "#2dd4bf", flex: "#a5b4fc", mind: "#7dd3fc", spirit: "#fde68a", health: "#86efac", neat: "#f59e8b" },
  foret:    { label: "Forêt",    accent: "#7bc67e", force: "#d9a441", vshape: "#4fb39a", flex: "#b59bd8", mind: "#7fb3d5", spirit: "#e8d17a", health: "#7bc67e", neat: "#c3d36b" },
  bordeaux: { label: "Bordeaux", accent: "#e0566b", force: "#e0566b", vshape: "#e8a15a", flex: "#c792ea", mind: "#78a9ff", spirit: "#f0d58a", health: "#6fcf97", neat: "#f2a65a" },
  violet:   { label: "Violet",   accent: "#a78bfa", force: "#c084fc", vshape: "#5eead4", flex: "#a78bfa", mind: "#60a5fa", spirit: "#fcd34d", health: "#4ade80", neat: "#f9a8d4" },
  mono:     { label: "Monochrome", accent: "#e8ebf2", force: "#e8ebf2", vshape: "#b8c0d0", flex: "#9aa4b8", mind: "#cfd6e4", spirit: "#aeb7c9", health: "#dfe5f0", neat: "#cbd2e0" }
};
const COLOR_LABELS = { accent: "Accent", force: "Force", vshape: "V-Shape", flex: "Souplesse", mind: "Esprit", spirit: "Spiritualité", health: "Santé", neat: "NEAT" };
