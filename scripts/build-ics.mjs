/* Régénère le flux .ics public à abonner, à partir de public/data/events.json
 * (déjà écrit par scripts/ingest.mjs dans le même job) et de src/data/seed.js.
 *
 * Un seul flux pour l'instant, volontairement : "tout le monde sauf ce qui
 * dépend d'un profil individuel". L'UE LCA (300 places, facultative) et
 * l'atelier vieillissement (une session par service de stage, résolue
 * uniquement dans le navigateur) restent réservés au téléchargement
 * personnalisé depuis le site — un flux public ne peut pas les résoudre
 * pour tout le monde à la fois.
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { fusionner, depuisSheet } from "../src/data/merge.js";
import { buildICS } from "../src/lib/ics.js";

const main = async () => {
  const data = JSON.parse(await readFile("public/data/events.json", "utf8"));
  const distants = data.events.map(depuisSheet);
  const evenements = fusionner(distants)
    .filter((ev) => ev.opt !== "lca")
    .sort((a, b) => (a.d === b.d ? (a.s || "").localeCompare(b.s || "") : a.d.localeCompare(b.d)));

  const ics = buildICS(evenements, "DFASM2 — Tout le planning", undefined, new Date(data.genere));

  await mkdir("public/ics", { recursive: true });
  // CRLF est requis par RFC 5545 ; ne pas le perdre en route.
  await writeFile("public/ics/tout.ics", ics + "\r\n");
  console.log(`${evenements.length} événements écrits dans public/ics/tout.ics`);
};

main().catch((e) => { console.error(e); process.exit(1); });
