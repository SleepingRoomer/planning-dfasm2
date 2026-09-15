import React, { useState, useMemo, useEffect } from "react";
import { SEED_EVENTS, H, O, P, MI, PSY, G, C2 } from "./data/seed.js";

/* ------------------------------------------------------------------ *
 *  Planning DFASM2 2026-2027 — prototype v3
 *
 *  Règles de résolution appliquées :
 *   1. En cas de désaccord d'horaire entre l'emploi du temps et le
 *      déroulé, le déroulé l'emporte, sans signalement.
 *   2. Une promo scindée entre deux salles n'est pas une anomalie :
 *      on affiche les deux salles et on passe à autre chose.
 *   3. Le choix de stage du 11 novembre est maintenu malgré le férié.
 *
 *  Aucune donnée nominative. Le fichier d'affectation des ateliers
 *  reste dans le Drive de la faculté ; on n'en publie que la
 *  correspondance service → session, qui n'identifie personne.
 *
 *  --- Origine des événements ---
 *  Une partie du planning (cours magistraux, ED, conférences du cycle 2,
 *  examens de matière, EDN blanc) provient du déroulé et de l'onglet
 *  Cycle 2 du sheet de la faculté, synchronisés automatiquement par
 *  `scripts/ingest.mjs` dans `data/events.json`. Le reste (administratif,
 *  choix de stage, ateliers, ECOS, UE LCA, examens de fin de cycle) vient
 *  de la notice des stages et du mail de rentrée : aucun onglet du sheet
 *  ne les couvre pour l'instant, ils restent donc en dur dans
 *  `src/data/seed.js` et s'affichent en permanence, que la synchronisation
 *  fonctionne ou non.
 * ------------------------------------------------------------------ */

/* La date n'est jamais écrite en dur : tout se calcule à partir de
   l'horloge locale, et la vue se rafraîchit toute seule chaque minute. */
const pad2 = (n) => String(n).padStart(2, "0");
const isoLocal = (dt) => `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;

const SERVICES = {
  AMOURA: 1, BARBAUD: 1, BENVENISTE: 1, BOUKARI: 1, BOUVARD: 1, FAIN: 1,
  LACOMBE: 1, LIDOVE: 1, PIALOUX: 1, POURCHER: 1, STEICHEN: 1,
  CHARGARI: 2, CHOQUET: 2, "FERRERI-FOSSATI": 2, FOLIGNE: 2, FOSSATI: 2,
  GLIGOROV: 2, HUGUET: 2, LAROCHE: 2, LUCIDARME: 2, MOHTY: 2, PERETTI: 2,
  PICCI: 2, "SERRESSE PSL": 2, "SERRESSE-ROUHABI": 2, SPANO: 2, THAY: 2,
  THOMASSIN: 2, TUBACH: 2, WAGNER: 2,
};

const SESSIONS = {
  1: { dates: ["2026-10-13", "2026-10-14", "2026-10-15"], label: "session 1, en octobre" },
  2: { dates: ["2026-11-17", "2026-11-18", "2026-11-19"], label: "session 2, en novembre" },
  3: { dates: ["2027-01-12", "2027-01-13", "2027-01-14"], label: "session 3, en janvier" },
  4: { dates: ["2027-02-02", "2027-02-03", "2027-02-04"], label: "session 4, en février" },
};

const POLES = [
  "Médecine interne et maladies infectieuses",
  "Onco-hémato-psychiatrie",
  "Pédiatrie",
  "Néphro-endocrino-gynéco",
];

const STAGES = [
  { n: 1, debut: "2026-09-21", fin: "2026-11-29" },
  { n: 2, debut: "2026-12-07", fin: "2027-02-21" },
  { n: 3, debut: "2027-02-22", fin: "2027-05-09" },
  { n: 4, debut: "2027-05-10", fin: "2027-07-10" },
];

const TYPES = {
  examen:  { label: "Examen",         c: "var(--grenat)" },
  edn:     { label: "EDN blanc",      c: "var(--grenat)" },
  ecos:    { label: "ECOS",           c: "var(--grenat)" },
  cm:      { label: "Cours",          c: "var(--eau)" },
  ed:      { label: "ED",             c: "var(--eau)" },
  conf:    { label: "Conférence",     c: "var(--sauge)" },
  // "quiz" et "rangA" ne viennent que du sheet (onglet Cycle 2), jamais de
  // src/data/seed.js : ajoutés ici pour que le rendu ne casse pas une fois
  // la synchronisation active.
  quiz:    { label: "Quiz",           c: "var(--sauge)" },
  rangA:   { label: "Rang A",         c: "var(--sauge)" },
  atelier: { label: "Atelier",        c: "var(--ambre)" },
  admin:   { label: "Administratif",  c: "var(--doux)" },
};

/* Les groupes servent deux fois : comme onglets de navigation et comme
   cases à cocher de l'export. Une seule définition, deux usages. */
const matiere = (m) => (ev) => ev.subj === m || (ev.type === "examen" && ev.t === m);

const GROUPES = [
  { id: "cycle2",   nom: "Cycle 2",           test: (ev) => ev.subj === C2 },
  { id: "hemato",   nom: H,                   test: matiere(H) },
  { id: "onco",     nom: O,                   test: matiere(O) },
  { id: "pediatrie", nom: P,                  test: matiere(P) },
  { id: "interne",  nom: MI,                  test: matiere(MI) },
  { id: "psy",      nom: PSY,                 test: matiere(PSY) },
  { id: "geriatrie", nom: G,                  test: matiere(G) },
  { id: "ateliers", nom: "Ateliers et ECOS",  test: (ev) => ev.type === "atelier" || ev.type === "ecos" },
  { id: "edn",      nom: "EDN blancs",        test: (ev) => ev.type === "edn" },
  { id: "lca",      nom: "UE LCA renforcée",  test: (ev) => ev.opt === "lca" },
  { id: "promo",    nom: "Vie de la promo",   test: (ev) => ev.type === "admin" },
];

/* --------------------- fusion sheet ↔ événements en dur --------------------- */

/* Types que le sheet peut produire (cf. scripts/ingest.mjs). Tout événement
   d'un de ces types dans seed.js sert de filet de secours pour cette même
   portion du planning ; le reste (admin, ateliers, ECOS, UE LCA) n'est
   jamais sourcé du sheet et reste affiché en permanence. */
const TYPES_SOURCABLES = new Set(["cm", "ed", "conf", "examen", "edn"]);
// Un horaire précis (s+e) est aussi requis : "Semaine de rattrapages" et
// "CCC écrit" sont de type "examen" mais sans plage horaire — ce sont des
// annonces de la notice, pas des lignes du déroulé, qui lui renseigne
// toujours un début et une fin.
const estSourcable = (ev) => TYPES_SOURCABLES.has(ev.type) && ev.opt !== "lca" && Boolean(ev.s);

const EVENEMENTS_PERMANENTS = SEED_EVENTS.filter((ev) => !estSourcable(ev));
const EVENEMENTS_SEED_SOURCABLES = SEED_EVENTS.filter(estSourcable);

/* "cours" (déroulé) -> cm/ed sont indiscernables une fois publiés ; le
   déroulé ne distingue que cours/examen, donc tout "cours" retombe sur la
   couleur "cm" (identique à "ed" dans TYPES). */
const TYPE_DEPUIS_SHEET = {
  cours: "cm", examen: "examen", edn: "edn", quiz: "quiz", rangA: "rangA", conf: "conf",
};

/* Le sheet écrit la matière en capitales sans accent, parfois suffixée
   ("HEMATOLOGIE (non enregistré)") : à normaliser vers les constantes
   H/O/P/MI/PSY/G/C2 utilisées par GROUPES, sans quoi aucun événement
   synchronisé ne rejoindrait jamais son onglet de matière. Vérifié contre
   la sortie réelle du premier passage du workflow. Une matière qui ne
   matche aucune entrée connue est laissée telle quelle plutôt que perdue :
   l'événement reste visible dans "Tout à venir", simplement sans onglet dédié. */
const CANON_MATIERE = {
  HEMATOLOGIE: H, ONCOLOGIE: O, PEDIATRIE: P,
  "MEDECINE INTERNE": MI, PSYCHIATRIE: PSY, GERIATRIE: G,
  "CYCLE 2": C2,
};
function normaliserMatiere(brut) {
  if (!brut) return undefined;
  const cle = brut
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim().toUpperCase();
  return CANON_MATIERE[cle] || brut;
}

/* Un événement de data/events.json (schéma `scripts/ingest.mjs`, cf.
   CHAMPS_PUBLIES) vers le schéma attendu par le reste du composant. */
function depuisSheet(ev) {
  return {
    d: ev.date,
    s: ev.debut || undefined,
    e: ev.fin || undefined,
    t: ev.libelle || ev.matiere || "Séance",
    subj: normaliserMatiere(ev.matiere),
    type: TYPE_DEPUIS_SHEET[ev.type] || "cm",
    place: ev.site || undefined,
    room: ev.salle || undefined,
    note: ev.aVerifier || undefined,
  };
}

const atelierVieillissement = (session, jour) => {
  if (!session) return [];
  const { dates, label } = SESSIONS[session];
  const connu = jour && dates.includes(jour);
  return dates
    .filter((d) => !connu || d === jour)
    .map((d) => ({
      d, s: "09:00", e: "13:00",
      t: "Atelier vieillissement",
      type: "atelier",
      place: "Plateforme de simulation DEESSES",
      room: "au-dessus de l'amphi Charcot",
      aPreciser: !connu,
      note: connu
        ? "Évaluation à réaliser dans Moodle."
        : `Vous êtes sur la ${label}. Votre demi-journée est dans le fichier de la scolarité ; indiquez-la en haut pour ne garder que la vôtre.`,
    }));
};

/* ------------------------------ utilitaires ------------------------------ */

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const toDate = (d) => { const [y, m, j] = d.split("-").map(Number); return new Date(y, m - 1, j); };
const diff = (a, b) => Math.round((toDate(a) - toDate(b)) / 86400000);
const frDate = (d) => { const t = toDate(d); return `${JOURS[t.getDay()]} ${t.getDate()} ${MOIS[t.getMonth()]}`; };
const frCourt = (d) => { const t = toDate(d); return `${t.getDate()} ${MOIS[t.getMonth()]}`; };
const moisAnnee = (d) => { const t = toDate(d); return `${MOIS[t.getMonth()]} ${t.getFullYear()}`; };
const horaire = (ev) => !ev.s ? "Toute la journée" : ev.e ? `${ev.s.replace(":", "h")} – ${ev.e.replace(":", "h")}` : `à partir de ${ev.s.replace(":", "h")}`;
const lieu = (ev) => [ev.place, ev.room].filter(Boolean).join(", ");
const nom = (ev) => (ev.subj && ev.subj !== ev.t ? ev.t : ev.t);

const stageCourant = (today) => {
  for (const s of STAGES) {
    if (today < s.debut) return { ...s, statut: "avant", jours: diff(s.debut, today) };
    if (today <= s.fin) {
      const total = Math.ceil(diff(s.fin, s.debut) / 7);
      return { ...s, statut: "pendant", semaine: Math.floor(diff(today, s.debut) / 7) + 1, total };
    }
  }
  return null;
};

/* Bornes réelles d'un événement. Sans horaire, il occupe la journée entière :
   il reste donc « à venir » jusqu'à minuit et pas jusqu'à 00h00. */
const bornes = (ev) => {
  const [y, m, j] = ev.d.split("-").map(Number);
  if (!ev.s) return [new Date(y, m - 1, j, 0, 0), new Date(y, m - 1, j, 23, 59, 59)];
  const [h1, n1] = ev.s.split(":").map(Number);
  const [h2, n2] = (ev.e || ev.s).split(":").map(Number);
  return [new Date(y, m - 1, j, h1, n1), new Date(y, m - 1, j, h2, n2)];
};

const relatif = (ev, now, today) => {
  const [debut, fin] = bornes(ev);
  if (now >= debut && now <= fin) return "en cours";
  const ms = debut - now;
  if (ms < 3600000) return `dans ${Math.max(1, Math.round(ms / 60000))} minutes`;
  if (ms < 12 * 3600000) return `dans ${Math.round(ms / 3600000)} heures`;
  const j = diff(ev.d, today);
  if (j === 0) return "plus tard aujourd'hui";
  if (j === 1) return "demain";
  if (j <= 6) return `dans ${j} jours`;
  return null;
};

/* Formule du compte à rebours : « 76 jours avant », « demain », « aujourd'hui ». */
const compte = (j) => {
  if (j <= 0) return { gros: null, texte: "C'est aujourd'hui" };
  if (j === 1) return { gros: "1", texte: "jour avant" };
  return { gros: String(j), texte: "jours avant" };
};

/* ------------------------------ export ICS ------------------------------ */

const VTZ = ["BEGIN:VTIMEZONE", "TZID:Europe/Paris", "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT", "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD", "END:VTIMEZONE"];
const esc = (s) => String(s || "").replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");

const RAPPELS_DEFAUT = { veille: true, heure: true };

const buildICS = (events, titre, rappels = RAPPELS_DEFAUT) => {
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Planning DFASM2//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(titre)}`, ...VTZ];
  events.forEach((ev) => {
    const c = ev.d.replace(/-/g, "");
    L.push("BEGIN:VEVENT", `UID:${ev.id}@planning-dfasm2`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`);
    if (ev.s) {
      L.push(`DTSTART;TZID=Europe/Paris:${c}T${ev.s.replace(":", "")}00`);
      L.push(`DTEND;TZID=Europe/Paris:${c}T${(ev.e || ev.s).replace(":", "")}00`);
    } else {
      const n = new Date(toDate(ev.d).getTime() + 86400000);
      L.push(`DTSTART;VALUE=DATE:${c}`, `DTEND;VALUE=DATE:${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}`);
    }
    const titreEv = (ev.subj && ev.subj !== C2 ? `${ev.subj} — ${ev.t}` : ev.t);
    L.push(`SUMMARY:${esc(ev.aPreciser ? `${titreEv} (date à préciser)` : titreEv)}`);
    if (lieu(ev)) L.push(`LOCATION:${esc(lieu(ev))}`);
    if (ev.note) L.push(`DESCRIPTION:${esc(ev.note)}`);
    if (rappels.veille) {
      L.push("BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${esc(titreEv)} — demain`, "END:VALARM");
    }
    // Un rappel à une heure n'a pas de sens sur un événement sans horaire.
    if (rappels.heure && ev.s) {
      L.push("BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", `DESCRIPTION:${esc(titreEv)} — dans une heure`, "END:VALARM");
    }
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.join("\r\n");
};

const telecharger = (events, titre, fichier, rappels) => {
  const blob = new Blob([buildICS(events, titre, rappels)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = fichier; a.click();
  URL.revokeObjectURL(url);
};

/* ------------------------------ styles ------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Archivo+Narrow:wght@500;600;700&family=Spectral:wght@500;600&display=swap');

.pl{
  --nuit:#1E2045; --profond:#2C2F63; --papier:#F2F2F6; --craie:#fff;
  --trait:#DEDEE7; --doux:#63668C; --pale:#8C8FAC;
  --grenat:#A81B37; --eau:#3D5F91; --sauge:#4C6E5A; --ambre:#8A6220;
  font-family:'Archivo',system-ui,sans-serif; background:var(--papier);
  color:var(--nuit); padding:26px 18px 70px; -webkit-font-smoothing:antialiased;
}
.pl-w{max-width:720px;margin:0 auto}

/* ---- masthead ---- */
.pl-tete{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.pl-nom{font-family:'Spectral',Georgia,serif;font-weight:600;font-size:18px;letter-spacing:.005em;margin:0}
.pl-an{font-family:'Archivo Narrow',sans-serif;font-size:13px;color:var(--pale);letter-spacing:.06em}
.pl-regle{height:2px;width:54px;background:var(--grenat);margin:9px 0 0;border-radius:1px}

/* ---- prochainement ---- */
.pl-next{margin-top:24px}
.pl-next-l{font-size:12.5px;color:var(--pale);margin:0 0 6px}
.pl-next-m{font-family:'Archivo Narrow',sans-serif;font-size:13.5px;font-weight:600;color:var(--eau);margin:0}
.pl-next-t{font-size:25px;font-weight:600;line-height:1.18;letter-spacing:-.015em;margin:2px 0 0}
.pl-next-d{font-size:14px;color:var(--doux);margin:7px 0 0;line-height:1.45}

.pl-cd{display:flex;align-items:center;gap:14px;margin-top:20px;padding:14px 16px;
  background:var(--craie);border:1px solid var(--trait);border-left:2px solid var(--grenat);border-radius:2px}
.pl-cd-n{font-family:'Archivo Narrow',sans-serif;font-size:38px;font-weight:700;line-height:.85;color:var(--grenat)}
.pl-cd-x{font-size:13.5px;line-height:1.4;color:var(--doux)}
.pl-cd-x b{color:var(--nuit);font-weight:600}

/* ---- bandeau stage ---- */
.pl-stage{display:flex;align-items:center;gap:10px;margin-top:14px;
  font-family:'Archivo Narrow',sans-serif;font-size:13px;color:var(--doux)}
.pl-stage-n{font-weight:700;color:var(--profond)}
.pl-barre{flex:1;height:3px;background:var(--trait);border-radius:2px;overflow:hidden;min-width:40px}
.pl-barre i{display:block;height:100%;background:var(--profond)}

/* ---- profil ---- */
.pl-profil{margin-top:22px;padding:15px 16px;background:var(--craie);
  border:1px solid var(--trait);border-radius:2px}
.pl-rangee{display:flex;flex-wrap:wrap;gap:13px}
.pl-rangee>div{flex:1 1 200px;min-width:0}
.pl-champ{display:block;font-size:12.5px;color:var(--doux);margin-bottom:5px}
select{font-family:inherit;font-size:14px;width:100%;padding:8px 10px;
  border:1px solid var(--trait);border-radius:2px;background:#FAFAFC;color:var(--nuit)}
.pl-case{display:flex;align-items:center;gap:8px;font-size:14px;margin-top:13px;color:var(--nuit)}
.pl-case input{width:16px;height:16px;accent-color:var(--profond)}
.pl-aide{font-size:12.5px;color:var(--doux);margin:11px 0 0;line-height:1.5}

/* ---- onglets ---- */
.pl-onglets{display:flex;gap:4px;margin-top:26px;border-bottom:1px solid var(--trait);
  overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.pl-onglets::-webkit-scrollbar{display:none}
.pl-onglet{font-family:inherit;font-size:14px;font-weight:500;background:none;border:none;
  border-bottom:2px solid transparent;padding:9px 13px;color:var(--doux);cursor:pointer;
  margin-bottom:-1px;white-space:nowrap;flex:0 0 auto}
.pl-onglet[aria-selected="true"]{color:var(--profond);border-bottom-color:var(--profond);font-weight:600}
.pl-onglet:focus-visible,button:focus-visible,select:focus-visible{outline:2px solid var(--eau);outline-offset:2px}

/* ---- barre d'export contextuelle, sous les onglets ---- */
.pl-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:11px 0 0;font-size:13px;color:var(--doux)}
.pl-bar-n{font-family:'Archivo Narrow',sans-serif;font-weight:600;color:var(--profond)}
.pl-bar button{font-family:inherit;font-size:13px;font-weight:500;padding:6px 12px;
  border:1px solid var(--profond);border-radius:2px;background:var(--profond);color:#fff;
  cursor:pointer;white-space:nowrap}
.pl-bar button:hover{background:var(--nuit);border-color:var(--nuit)}

/* ---- séparateur de mois ---- */
.pl-mois{display:flex;align-items:center;gap:12px;margin:30px 0 4px}
.pl-mois span{font-family:'Archivo Narrow',sans-serif;font-size:13px;font-weight:700;
  color:var(--profond);letter-spacing:.04em;white-space:nowrap}
.pl-mois i{flex:1;height:1px;background:var(--trait)}

/* ---- journée ---- */
.pl-jour{display:flex;gap:15px;margin-top:16px}
.pl-rail{flex:0 0 44px;text-align:right;padding-top:3px}
.pl-rail-j{font-family:'Archivo Narrow',sans-serif;font-size:12px;color:var(--pale);line-height:1.1}
.pl-rail-n{font-family:'Archivo Narrow',sans-serif;font-size:26px;font-weight:700;line-height:1.05;color:var(--profond)}
.pl-rail.auj .pl-rail-j{color:var(--grenat);font-weight:700}
.pl-rail.auj .pl-rail-n{color:var(--grenat)}
.pl-pile{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}

.pl-ev{background:var(--craie);border:1px solid var(--trait);border-left:3px solid var(--doux);
  border-radius:2px;padding:11px 13px;position:relative}
.pl-ev-h{font-family:'Archivo Narrow',sans-serif;font-size:12.5px;font-weight:600;letter-spacing:.02em}
.pl-ev-t{font-size:15px;font-weight:500;line-height:1.35;margin:2px 0 0;padding-right:66px}
.pl-ev-s{font-size:13px;color:var(--doux);margin:3px 0 0}
.pl-ev-n{font-size:12.5px;color:var(--doux);margin:7px 0 0;line-height:1.5;
  padding-left:9px;border-left:1px solid var(--trait)}
.pl-ev.exam{background:#FCF6F7;border-color:#E9D2D6}
.pl-ev.flou{background:repeating-linear-gradient(135deg,#fff,#fff 7px,#FAFAFC 7px,#FAFAFC 14px)}
.pl-add{position:absolute;top:10px;right:10px;font-family:'Archivo Narrow',sans-serif;
  font-size:12px;font-weight:600;background:none;border:1px solid var(--trait);
  border-radius:2px;padding:3px 8px;color:var(--pale);cursor:pointer}
.pl-add:hover{color:var(--profond);border-color:var(--doux)}

.pl-vide{background:var(--craie);border:1px dashed var(--trait);border-radius:2px;
  padding:28px 18px;text-align:center;margin-top:24px}
.pl-vide p{margin:0;font-size:14px;color:var(--doux)}

/* ---- panneau d'export ---- */
.pl-lots{margin-top:36px;padding-top:22px;border-top:1px solid var(--trait)}
.pl-lots h2{font-family:'Spectral',Georgia,serif;font-size:16px;font-weight:600;margin:0 0 3px}
.pl-lots>p{font-size:13px;color:var(--doux);margin:0 0 15px;line-height:1.5}
.pl-entete{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:9px}
.pl-entete h3{font-size:12.5px;font-weight:500;color:var(--doux);margin:0}
.pl-lien{font-family:inherit;font-size:12.5px;background:none;border:none;padding:0;
  color:var(--eau);cursor:pointer;text-decoration:underline;text-underline-offset:2px}
.pl-grille{display:flex;flex-wrap:wrap;gap:7px}
.pl-lot{font-family:inherit;font-size:13.5px;padding:8px 12px;border:1px solid var(--trait);
  border-radius:2px;background:var(--craie);color:var(--doux);cursor:pointer;
  display:flex;gap:8px;align-items:center;line-height:1.2}
.pl-lot:hover{border-color:var(--doux)}
.pl-lot em{font-style:normal;font-family:'Archivo Narrow',sans-serif;font-size:12.5px;color:var(--pale)}
.pl-lot::before{content:"";width:13px;height:13px;flex:0 0 auto;border:1px solid var(--trait);
  border-radius:2px;background:var(--craie)}
.pl-lot.on{background:#EDEEF6;border-color:var(--profond);color:var(--nuit);font-weight:500}
.pl-lot.on::before{background:var(--profond);border-color:var(--profond);
  box-shadow:inset 0 0 0 2px #EDEEF6}
.pl-lot.on em{color:var(--doux)}

.pl-rappels{margin-top:18px;padding:13px 15px;background:var(--craie);
  border:1px solid var(--trait);border-radius:2px}
.pl-rappels p{font-size:12.5px;color:var(--doux);margin:0 0 9px}
.pl-rap{display:flex;align-items:center;gap:8px;font-size:13.5px;margin-top:7px;color:var(--nuit)}
.pl-rap input{width:15px;height:15px;accent-color:var(--profond)}

.pl-final{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:16px}
.pl-final button{font-family:inherit;font-size:14.5px;font-weight:600;padding:12px 20px;
  border:1px solid var(--profond);border-radius:2px;background:var(--profond);color:#fff;cursor:pointer}
.pl-final button:hover:not(:disabled){background:var(--nuit);border-color:var(--nuit)}
.pl-final button:disabled{background:var(--trait);border-color:var(--trait);color:var(--pale);cursor:not-allowed}
.pl-final span{font-size:13px;color:var(--doux)}

.pl-pied{margin-top:30px;padding-top:16px;border-top:1px solid var(--trait);
  font-size:12.5px;color:var(--pale);line-height:1.6}

@media(max-width:520px){
  .pl-next-t{font-size:21px}
  .pl-rail{flex-basis:38px}
  .pl-ev-t{padding-right:0;margin-top:5px}
  .pl-add{position:static;display:inline-block;margin-top:9px}
}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`;

/* ------------------------------ composants ------------------------------ */

function Evenement({ ev, rappels }) {
  const m = TYPES[ev.type];
  return (
    <div className={`pl-ev ${["examen", "edn"].includes(ev.type) ? "exam" : ""} ${ev.aPreciser ? "flou" : ""}`}
         style={{ borderLeftColor: m.c }}>
      <button className="pl-add" onClick={() => telecharger([ev], nom(ev), `${ev.id}.ics`, rappels)}>Ajouter</button>
      <div className="pl-ev-h" style={{ color: m.c }}>{horaire(ev)}</div>
      <p className="pl-ev-t">{ev.subj && ev.subj !== C2 ? `${ev.subj} — ${ev.t}` : ev.t}</p>
      {lieu(ev) && <p className="pl-ev-s">{lieu(ev)}</p>}
      {ev.note && <p className="pl-ev-n">{ev.note}</p>}
    </div>
  );
}

function Journee({ date, events, rappels, today }) {
  const t = toDate(date);
  const auj = date === today;
  return (
    <div className="pl-jour">
      <div className={`pl-rail ${auj ? "auj" : ""}`}>
        <div className="pl-rail-j">{auj ? "auj." : JOURS[t.getDay()].slice(0, 3)}</div>
        <div className="pl-rail-n">{t.getDate()}</div>
      </div>
      <div className="pl-pile">{events.map((ev) => <Evenement key={ev.id} ev={ev} rappels={rappels} />)}</div>
    </div>
  );
}

export default function Planning() {
  const [service, setService] = useState("");
  const [pole, setPole] = useState("");
  const [jour, setJour] = useState("");
  const [lca, setLca] = useState(false);
  const [vue, setVue] = useState("avenir");
  const [rappels, setRappels] = useState(RAPPELS_DEFAUT);
  const [choisis, setChoisis] = useState(() => new Set(GROUPES.map((g) => g.id)));
  const [now, setNow] = useState(() => new Date());

  // Événements synchronisés depuis data/events.json (déroulé + Cycle 2
  // uniquement) ; null tant que rien n'a encore été chargé avec succès,
  // auquel cas on retombe sur les mêmes séances en dur dans seed.js. Un
  // échec de fetch reste silencieux : un planning légèrement périmé vaut
  // mieux qu'une page blanche.
  const [distants, setDistants] = useState(null);

  useEffect(() => {
    let annule = false;
    fetch(`${import.meta.env.BASE_URL}data/events.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (annule) return;
        if (!Array.isArray(data.events) || data.events.length < 50) {
          throw new Error("data/events.json contient trop peu d'événements");
        }
        setDistants(data.events.map(depuisSheet));
      })
      .catch(() => { if (!annule) setDistants(null); });
    return () => { annule = true; };
  }, []);

  // Une minute suffit : c'est la granularité des horaires du planning.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const today = isoLocal(now);

  const session = SERVICES[service] || null;
  const poleEffectif = session === 1 ? POLES[0] : session === 2 ? POLES[1] : pole;
  const stage = stageCourant(today);

  // Toujours affichés (admin, ateliers, ECOS, UE LCA) + portion sourcable
  // du sheet (déroulé/Cycle 2), synchronisée quand elle est disponible,
  // sinon la même portion en dur dans seed.js.
  const E = useMemo(
    () => [...EVENEMENTS_PERMANENTS, ...(distants ?? EVENEMENTS_SEED_SOURCABLES)],
    [distants],
  );

  const mesEvents = useMemo(() => {
    return [...E, ...atelierVieillissement(session, jour)]
      .filter((ev) => {
        if (ev.opt === "lca" && !lca) return false;
        if (ev.pole && ev.pole !== poleEffectif) return false;
        return true;
      })
      .map((ev, i) => ({ ...ev, id: `evt-${i}` }))
      .sort((a, b) => (a.d === b.d ? (a.s || "").localeCompare(b.s || "") : a.d.localeCompare(b.d)));
  }, [E, session, jour, lca, poleEffectif]);

  // Un cours de 14h à 17h reste affiché à 15h : on compare à l'heure de fin,
  // pas à la date du jour.
  const futurs = useMemo(() => mesEvents.filter((ev) => bornes(ev)[1] >= now), [mesEvents, now]);

  /* Groupes réellement peuplés pour ce profil : un onglet vide est une
     impasse, on ne l'affiche pas. */
  const groupesActifs = useMemo(
    () => GROUPES.map((g) => ({ ...g, ev: mesEvents.filter(g.test) })).filter((g) => g.ev.length),
    [mesEvents]
  );

  const onglets = useMemo(() => [
    { id: "semaine", nom: "7 prochains jours" },
    { id: "avenir", nom: "Tout à venir" },
    { id: "examens", nom: "Examens" },
    ...groupesActifs.map((g) => ({ id: g.id, nom: g.nom })),
  ], [groupesActifs]);

  // Décocher la LCA peut faire disparaître l'onglet ouvert : on retombe sur la vue générale.
  const vueOk = onglets.some((o) => o.id === vue) ? vue : "avenir";

  const affiches = useMemo(() => {
    if (vueOk === "examens") return futurs.filter((ev) => ["examen", "edn", "ecos"].includes(ev.type));
    if (vueOk === "semaine") return futurs.filter((ev) => diff(ev.d, today) <= 7);
    const g = GROUPES.find((x) => x.id === vueOk);
    return g ? futurs.filter(g.test) : futurs;
  }, [futurs, vueOk, today]);

  /* Sélection de l'export. Un événement coché deux fois n'est exporté qu'une. */
  const selection = useMemo(() => {
    const vus = new Set();
    const out = [];
    groupesActifs.filter((g) => choisis.has(g.id)).forEach((g) =>
      g.ev.forEach((ev) => { if (!vus.has(ev.id)) { vus.add(ev.id); out.push(ev); } })
    );
    return out.sort((a, b) => (a.d === b.d ? (a.s || "").localeCompare(b.s || "") : a.d.localeCompare(b.d)));
  }, [groupesActifs, choisis]);

  const basculer = (id) => setChoisis((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const tousChoisis = groupesActifs.length > 0 && groupesActifs.every((g) => choisis.has(g.id));
  const nomExport = choisis.size === 1
    ? groupesActifs.find((g) => choisis.has(g.id))?.nom
    : tousChoisis ? "Tout mon planning" : `${choisis.size} matières`;

  /* Regroupement en mois puis en jours. */
  const blocs = useMemo(() => {
    const out = [];
    let moisCourant = null, jourCourant = null;
    affiches.forEach((ev) => {
      const m = moisAnnee(ev.d);
      if (m !== moisCourant) { moisCourant = m; jourCourant = null; out.push({ type: "mois", cle: m, label: m }); }
      if (ev.d !== jourCourant) { jourCourant = ev.d; out.push({ type: "jour", cle: ev.d, date: ev.d, events: [] }); }
      out[out.length - 1].events.push(ev);
    });
    return out;
  }, [affiches]);

  const prochain = futurs[0];
  const prochainExam = futurs.find((ev) => ["examen", "edn"].includes(ev.type));

  return (
    <div className="pl">
      <style>{CSS}</style>
      <div className="pl-w">

        <div className="pl-tete">
          <h1 className="pl-nom">Planning DFASM2</h1>
          <span className="pl-an">2026 · 2027</span>
        </div>
        <div className="pl-regle" />

        <div className="pl-next">
          <p className="pl-next-l">Prochainement</p>
          {prochain ? (
            <>
              {prochain.subj && <p className="pl-next-m">{prochain.subj}</p>}
              <p className="pl-next-t">{prochain.t}</p>
              <p className="pl-next-d">
                {(() => {
                  const r = relatif(prochain, now, today);
                  return r ? `${r.charAt(0).toUpperCase()}${r.slice(1)}, ` : "";
                })()}
                {frDate(prochain.d)}, {horaire(prochain).toLowerCase()}
                {lieu(prochain) && <><br />{lieu(prochain)}</>}
              </p>
            </>
          ) : <p className="pl-next-t">Rien de programmé</p>}

          {prochainExam && (() => {
            const c = compte(diff(prochainExam.d, today));
            const quoi = prochainExam.type === "edn" ? "l'EDN blanc" : `l'examen de ${prochainExam.t.toLowerCase()}`;
            return (
              <div className="pl-cd">
                {c.gros && <span className="pl-cd-n">{c.gros}</span>}
                <span className="pl-cd-x">
                  {c.gros ? <>{c.texte} <b>{quoi}</b></> : <><b>{quoi}</b> a lieu aujourd'hui</>}
                  <br />{frDate(prochainExam.d)}
                </span>
              </div>
            );
          })()}
        </div>

        {stage && (
          <div className="pl-stage">
            <span className="pl-stage-n">Stage {stage.n}</span>
            {stage.statut === "pendant" ? (
              <>
                <span>semaine {stage.semaine} sur {stage.total}</span>
                <span className="pl-barre"><i style={{ width: `${(stage.semaine / stage.total) * 100}%` }} /></span>
                <span>jusqu'au {frCourt(stage.fin)}</span>
              </>
            ) : (
              <>
                <span>commence dans {stage.jours} jours</span>
                <span className="pl-barre"><i style={{ width: "0%" }} /></span>
                <span>{frCourt(stage.debut)} → {frCourt(stage.fin)}</span>
              </>
            )}
          </div>
        )}

        <div className="pl-profil">
          <div className="pl-rangee">
            <div>
              <label className="pl-champ" htmlFor="svc">Mon service de stage 1</label>
              <select id="svc" value={service} onChange={(e) => { setService(e.target.value); setJour(""); }}>
                <option value="">Choisir…</option>
                {Object.keys(SERVICES).sort().map((s) => <option key={s}>{s}</option>)}
                <option value="autre">Autre service</option>
              </select>
            </div>
            {service === "autre" && (
              <div>
                <label className="pl-champ" htmlFor="pol">Mon pôle</label>
                <select id="pol" value={pole} onChange={(e) => setPole(e.target.value)}>
                  <option value="">Choisir…</option>
                  {POLES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            )}
            {session && (
              <div>
                <label className="pl-champ" htmlFor="jr">Ma matinée d'atelier vieillissement</label>
                <select id="jr" value={jour} onChange={(e) => setJour(e.target.value)}>
                  <option value="">Je ne sais pas encore</option>
                  {SESSIONS[session].dates.map((d) => <option key={d} value={d}>{frDate(d)}</option>)}
                </select>
              </div>
            )}
          </div>
          <label className="pl-case">
            <input type="checkbox" checked={lca} onChange={(e) => setLca(e.target.checked)} />
            Je suis inscrit à l'UE LCA renforcée
          </label>
          <p className="pl-aide">
            {session
              ? `Votre service vous place sur la ${SESSIONS[session].label}. Les trois matinées possibles restent affichées tant que vous n'avez pas indiqué la vôtre.`
              : "Votre service détermine votre session d'atelier. Rien de ce que vous saisissez ne quitte votre appareil."}
          </p>
        </div>

        <div className="pl-onglets" role="tablist">
          {onglets.map((o) => (
            <button key={o.id} role="tab" aria-selected={vueOk === o.id} className="pl-onglet"
              onClick={() => setVue(o.id)}>{o.nom}</button>
          ))}
        </div>

        {affiches.length > 0 && (
          <div className="pl-bar">
            <span><span className="pl-bar-n">{affiches.length}</span> {affiches.length > 1 ? "événements" : "événement"} à venir</span>
            <button onClick={() => telecharger(
              affiches,
              `DFASM2 — ${onglets.find((o) => o.id === vueOk)?.nom}`,
              `dfasm2-${vueOk}.ics`,
              rappels
            )}>
              Ajouter cet onglet au calendrier
            </button>
          </div>
        )}

        {blocs.length === 0
          ? <div className="pl-vide"><p>Rien sur cette période.</p></div>
          : blocs.map((b) => b.type === "mois"
              ? <div className="pl-mois" key={`m-${b.cle}`}><span>{b.label}</span><i /></div>
              : <Journee key={b.cle} date={b.date} events={b.events} rappels={rappels} today={today} />)}

        <div className="pl-lots">
          <h2>Composer un calendrier</h2>
          <p>Cochez ce que vous voulez emporter, tout est coché au départ. Un seul fichier est produit.</p>

          <div className="pl-entete">
            <h3>Matières et groupes</h3>
            <button className="pl-lien"
              onClick={() => setChoisis(tousChoisis ? new Set() : new Set(groupesActifs.map((g) => g.id)))}>
              {tousChoisis ? "Tout décocher" : "Tout cocher"}
            </button>
          </div>

          <div className="pl-grille">
            {groupesActifs.map((g) => (
              <button key={g.id} className={`pl-lot ${choisis.has(g.id) ? "on" : ""}`}
                aria-pressed={choisis.has(g.id)} onClick={() => basculer(g.id)}>
                {g.nom} <em>{g.ev.length}</em>
              </button>
            ))}
          </div>

          <div className="pl-rappels">
            <p>Rappels ajoutés à chaque événement</p>
            <label className="pl-rap">
              <input type="checkbox" checked={rappels.veille}
                onChange={(e) => setRappels({ ...rappels, veille: e.target.checked })} />
              La veille, à la même heure
            </label>
            <label className="pl-rap">
              <input type="checkbox" checked={rappels.heure}
                onChange={(e) => setRappels({ ...rappels, heure: e.target.checked })} />
              Une heure avant
            </label>
          </div>

          <div className="pl-final">
            <button disabled={!selection.length}
              onClick={() => telecharger(selection, `DFASM2 — ${nomExport}`, "dfasm2-planning.ics", rappels)}>
              Télécharger {selection.length} {selection.length > 1 ? "événements" : "événement"}
            </button>
            <span>{selection.length ? nomExport : "Rien de sélectionné"}</span>
          </div>
        </div>

        <p className="pl-pied">
          Données issues du planning de la faculté, de la notice des stages et du mail de rentrée.
          Quand deux sources divergent sur un horaire, celui du déroulé est retenu. En cas de doute,
          le document de la faculté fait foi. Aucune donnée personnelle n'est stockée ni transmise.
          Ce site est une initiative étudiante, sans lien officiel avec la faculté.
        </p>
      </div>
    </div>
  );
}
