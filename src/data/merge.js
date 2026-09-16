/* ------------------------------------------------------------------ *
 *  Fusion sheet (data/events.json) ↔ événements en dur (seed.js).
 *
 *  Module pur, sans React ni DOM : utilisé côté navigateur par App.jsx
 *  et côté Node par scripts/build-ics.mjs, pour que les deux ne divergent
 *  jamais sur la définition de « ce qui compte comme sourcé du sheet ».
 * ------------------------------------------------------------------ */
import { SEED_EVENTS, H, O, P, MI, PSY, G, C2 } from "./seed.js";

/* Types que le sheet peut produire (cf. scripts/ingest.mjs). Tout événement
   d'un de ces types dans seed.js sert de filet de secours pour cette même
   portion du planning ; le reste (admin, ateliers, ECOS, UE LCA) n'est
   jamais sourcé du sheet et reste affiché en permanence. */
export const TYPES_SOURCABLES = new Set(["cm", "ed", "conf", "examen", "edn"]);
// Un horaire précis (s+e) est aussi requis : "Semaine de rattrapages" et
// "CCC écrit" sont de type "examen" mais sans plage horaire — ce sont des
// annonces de la notice, pas des lignes du déroulé, qui lui renseigne
// toujours un début et une fin.
export const estSourcable = (ev) => TYPES_SOURCABLES.has(ev.type) && ev.opt !== "lca" && Boolean(ev.s);

/* Identifiant stable pour un événement de seed.js, qui n'en a pas en dur :
   dérivé de son propre contenu (date + matière/titre + heure), donc il ne
   change que si l'événement change de sens. Indispensable pour un flux ICS
   abonné : sans id stable, chaque régénération créerait un doublon au lieu
   de mettre à jour l'événement existant dans le calendrier. */
export function idPourSeed(ev) {
  return `${ev.d}-${(ev.subj || ev.t || "x")}-${ev.s || "jj"}`
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

const avecId = (ev) => (ev.id ? ev : { ...ev, id: idPourSeed(ev) });

export const EVENEMENTS_PERMANENTS = SEED_EVENTS.filter((ev) => !estSourcable(ev)).map(avecId);
export const EVENEMENTS_SEED_SOURCABLES = SEED_EVENTS.filter(estSourcable).map(avecId);

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
export function normaliserMatiere(brut) {
  if (!brut) return undefined;
  const cle = brut
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim().toUpperCase();
  return CANON_MATIERE[cle] || brut;
}

/* Un événement de data/events.json (schéma `scripts/ingest.mjs`, cf.
   CHAMPS_PUBLIES) vers le schéma attendu par le reste de l'application.
   L'id du sheet (déjà stable, cf. `nettoyer` dans ingest.mjs) est conservé
   tel quel. */
export function depuisSheet(ev) {
  return {
    id: ev.id,
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

/* Toujours affichés (admin, ateliers, ECOS, UE LCA) + portion sourcable du
   sheet (déroulé/Cycle 2), déjà normalisée par `depuisSheet` — ou, si elle
   n'est pas fournie, la même portion en dur dans seed.js. */
export function fusionner(distants) {
  return [...EVENEMENTS_PERMANENTS, ...(distants ?? EVENEMENTS_SEED_SOURCABLES)];
}

export { H, O, P, MI, PSY, G, C2 };
