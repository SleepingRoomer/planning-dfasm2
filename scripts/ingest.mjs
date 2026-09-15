import { writeFile, mkdir, readFile } from "node:fs/promises";

const SHEET = "1byJwPIN3SBC9Ncqd2pKQ9Jpg-Le6NSZFhAAIljLCqTw";
const ONGLETS = {
  deroule: { gid: "0", promo: "DFASM2" },
  cycle2: { gid: "734412610", promo: "DFASM2" },
  grille: { gid: "1833865904", promo: "DFASM2" },
};

const csvUrl = (gid) =>
  `https://docs.google.com/spreadsheets/d/${SHEET}/export?format=csv&gid=${gid}`;

/* --- Liste blanche stricte. Tout ce qui n'est pas listé ne sort jamais. --- */
const CHAMPS_PUBLIES = [
  "date", "debut", "fin", "matiere", "libelle", "type", "site", "salle", "promo",
];

/* ------------------------------ CSV ------------------------------ */
/* Parseur RFC 4180 minimal : gère les guillemets et les retours ligne
   à l'intérieur des cellules, ce que `split(",")` ne fait pas. */
export function parseCSV(texte) {
  const lignes = [];
  let ligne = [], champ = "", dansGuillemets = false;
  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (dansGuillemets) {
      if (c === '"' && texte[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') dansGuillemets = false;
      else champ += c;
    } else if (c === '"') dansGuillemets = true;
    else if (c === ",") { ligne.push(champ); champ = ""; }
    else if (c === "\n") { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ""; }
    else if (c !== "\r") champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes;
}

/* --------------------------- normalisation --------------------------- */

const MOIS = {
  janvier: 1, février: 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6,
  juillet: 7, août: 8, aout: 8, septembre: 9, octobre: 10, novembre: 11,
  décembre: 12, decembre: 12,
};

/* "mercredi 9 septembre 2026" -> "2026-09-09" */
export function normDate(brut) {
  if (!brut) return null;
  const s = brut.toLowerCase().trim();
  const m = s.match(/(\d{1,2})\s+([a-zéû]+)\s+(\d{4})/);
  if (m && MOIS[m[2]]) {
    return `${m[3]}-${String(MOIS[m[2]]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  const iso = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (iso) return `${iso[3]}-${iso[2]}-${iso[1]}`;
  return null;
}

/* "14h", "16h15", "13h45" -> "14:00", "16:15", "13:45"
   "16h-17h" (fin ambiguë du déroulé gériatrie) -> null + drapeau */
export function normHeure(brut) {
  if (!brut) return { valeur: null, ambigu: false };
  const s = brut.trim().toLowerCase();
  if (/\d+h\d*\s*[-–]\s*\d+h/.test(s)) return { valeur: null, ambigu: true };
  const m = s.match(/^(\d{1,2})\s*h\s*(\d{2})?$/);
  if (!m) return { valeur: null, ambigu: true };
  return { valeur: `${m[1].padStart(2, "0")}:${m[2] || "00"}`, ambigu: false };
}

/* "18h30-21h00" -> { debut: "18:30", fin: "21:00" } */
export function normPlage(brut) {
  if (!brut) return {};
  const m = brut.match(/(\d{1,2})\s*h\s*(\d{2})?\s*[-–à]\s*(\d{1,2})\s*h\s*(\d{2})?/);
  if (!m) return {};
  return {
    debut: `${m[1].padStart(2, "0")}:${m[2] || "00"}`,
    fin: `${m[3].padStart(2, "0")}:${m[4] || "00"}`,
  };
}

/* --------------------- lecture de "déroulé et lieux" --------------------- */

export function lireDeroule(lignes, promo) {
  const [entetes, ...corps] = lignes;
  const col = (nom) => entetes.findIndex((e) => e.trim().toLowerCase() === nom);
  const iPromo = 0, iMat = col("matière"), iLib = col("libelé du cours"),
        iType = col("type"), iDate = col("date"), iDeb = col("début"),
        iFin = col("fin"), iSite = col("site"), iSalle = col("préférence de lieu");

  return corps.flatMap((r) => {
    const date = normDate(r[iDate]);
    if (!date) return [];
    // La colonne promo fait foi : le sheet DFASM2 contient des lignes DFASM3.
    if (r[iPromo]?.trim().toUpperCase() !== promo) return [];
    const deb = normHeure(r[iDeb]), fin = normHeure(r[iFin]);
    return [{
      date,
      debut: deb.valeur,
      fin: fin.valeur,
      matiere: r[iMat]?.trim() || null,
      libelle: (r[iLib] || "").trim().slice(0, 300),
      type: (r[iType] || "").trim().toUpperCase() === "EXAMEN" ? "examen" : "cours",
      site: r[iSite]?.trim() || null,
      salle: r[iSalle]?.trim() || null,
      promo,
      _source: "deroule",
      _ambigu: deb.ambigu || fin.ambigu,
    }];
  });
}

/* ------------------------- lecture de "Cycle 2" ------------------------- */

export function lireCycle2(lignes, promo) {
  const [, ...corps] = lignes;   // A=type, B=matière, C=date, F=horaire, G=site, H=amphi
  return corps.flatMap((r) => {
    const date = normDate(r[2]);
    if (!date) return [];
    const { debut, fin } = normPlage(r[5]);
    const brutType = (r[0] || "").trim().toLowerCase();
    const type = !brutType ? "edn" : brutType.includes("quiz") ? "quiz"
               : brutType.includes("rang") ? "rangA" : "conf";
    return [{
      date, debut: debut ?? null, fin: fin ?? null,
      matiere: "Cycle 2",
      libelle: r[1]?.trim() || (type === "edn" ? "EDN blanc interrégional" : "Séance"),
      type, site: r[6]?.trim() || null, salle: r[7]?.trim() || null, promo,
      _source: "cycle2",
      _ambigu: !debut,
    }];
  });
}

/* ------------------------------ pipeline ------------------------------ */

const recuperer = async (gid) => {
  const rep = await fetch(csvUrl(gid), { redirect: "follow" });
  if (!rep.ok) throw new Error(`Onglet ${gid} : HTTP ${rep.status}`);
  return parseCSV(await rep.text());
};

const nettoyer = (ev) => {
  const propre = {};
  for (const champ of CHAMPS_PUBLIES) if (ev[champ] != null) propre[champ] = ev[champ];
  propre.id = `${ev.date}-${(ev.matiere || "x")}-${ev.debut || "jj"}`
    .toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  if (ev._ambigu) propre.aVerifier = "Horaire non interprétable dans le sheet";
  propre.source = ev._source;
  return propre;
};

const main = async () => {
  const [deroule, cycle2] = await Promise.all([
    recuperer(ONGLETS.deroule.gid),
    recuperer(ONGLETS.cycle2.gid),
  ]);

  // TODO : la grille "Emploi du temps" n'est pas encore parsée. Elle apporte
  // les ateliers, les choix de stage et les liens Zoom. Sa structure visuelle
  // demande une passe dédiée, à écrire une fois le reste stabilisé.

  const events = [
    ...lireDeroule(deroule, "DFASM2"),
    ...lireCycle2(cycle2, "DFASM2"),
  ]
    .map(nettoyer)
    .sort((a, b) => (a.date === b.date
      ? (a.debut || "").localeCompare(b.debut || "")
      : a.date.localeCompare(b.date)));

  // Fusion des corrections manuelles, qui l'emportent toujours sur le sheet.
  let overrides = [];
  try {
    overrides = JSON.parse(await readFile("config/overrides.json", "utf8"));
  } catch { /* pas d'overrides, cas normal */ }
  const parId = new Map(events.map((e) => [e.id, e]));
  for (const o of overrides) {
    if (o.supprimer) parId.delete(o.id);
    else parId.set(o.id, { ...(parId.get(o.id) || {}), ...o, corrige: true });
  }

  const final = [...parId.values()];
  await mkdir("public/data", { recursive: true });
  await writeFile("public/data/events.json", JSON.stringify({
    promo: "DFASM2",
    annee: "2026-2027",
    genere: new Date().toISOString(),
    nb: final.length,
    events: final,
  }, null, 2));

  const suspects = final.filter((e) => e.aVerifier).length;
  console.log(`${final.length} événements écrits, ${suspects} à vérifier.`);
  if (final.length < 50) {
    // Garde-fou : un sheet vidé ou une URL cassée ne doit pas écraser
    // le planning par un fichier vide.
    throw new Error("Trop peu d'événements, le commit est annulé.");
  }
};

// N'exécute le pipeline réseau que lorsque le script est lancé directement
// (`node scripts/ingest.mjs`), pas quand ses fonctions sont importées pour
// être testées unitairement contre un CSV synthétique.
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
