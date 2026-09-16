/* ------------------------------------------------------------------ *
 *  Construction d'un flux .ics — pas de DOM ici (pas de Blob ni
 *  d'URL.createObjectURL) : utilisable tel quel côté navigateur
 *  (App.jsx) et côté Node (scripts/build-ics.mjs).
 * ------------------------------------------------------------------ */

const toDate = (d) => { const [y, m, j] = d.split("-").map(Number); return new Date(y, m - 1, j); };
const lieu = (ev) => [ev.place, ev.room].filter(Boolean).join(", ");

const VTZ = ["BEGIN:VTIMEZONE", "TZID:Europe/Paris", "BEGIN:DAYLIGHT", "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST", "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU", "END:DAYLIGHT", "BEGIN:STANDARD", "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET", "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU", "END:STANDARD", "END:VTIMEZONE"];
const esc = (s) => String(s || "").replace(/[\\;,]/g, (m) => "\\" + m).replace(/\n/g, "\\n");

export const RAPPELS_DEFAUT = { veille: true, heure: true };

/* `dtstamp` est injectable : App.jsx laisse la valeur par défaut (heure du
   clic), scripts/build-ics.mjs fixe une valeur unique pour tout le fichier
   généré à un instant donné — sinon chaque VEVENT aurait un DTSTAMP à la
   milliseconde près, et un diff Git du fichier changerait entièrement à
   chaque régénération même quand aucun événement n'a réellement bougé. */
export const buildICS = (events, titre, rappels = RAPPELS_DEFAUT, dtstamp = new Date()) => {
  const horodatage = dtstamp.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Planning DFASM2//FR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(titre)}`, ...VTZ];
  events.forEach((ev) => {
    const c = ev.d.replace(/-/g, "");
    L.push("BEGIN:VEVENT", `UID:${ev.id}@planning-dfasm2`, `DTSTAMP:${horodatage}`);
    if (ev.s) {
      L.push(`DTSTART;TZID=Europe/Paris:${c}T${ev.s.replace(":", "")}00`);
      L.push(`DTEND;TZID=Europe/Paris:${c}T${(ev.e || ev.s).replace(":", "")}00`);
    } else {
      const n = new Date(toDate(ev.d).getTime() + 86400000);
      L.push(`DTSTART;VALUE=DATE:${c}`, `DTEND;VALUE=DATE:${n.getFullYear()}${String(n.getMonth() + 1).padStart(2, "0")}${String(n.getDate()).padStart(2, "0")}`);
    }
    const titreEv = (ev.subj && ev.subj !== "Cycle 2" ? `${ev.subj} — ${ev.t}` : ev.t);
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
