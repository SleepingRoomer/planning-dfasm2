# Planning DFASM2

Dashboard étudiant du planning DFASM2 2026-2027, publié sur GitHub Pages et
synchronisé automatiquement avec le sheet de la faculté.

Initiative étudiante, **sans lien officiel avec la faculté**. En cas de
doute sur un horaire ou un lieu, le document officiel de la faculté fait foi.

## Ce que ça fait

- Vue « Prochainement » et compte à rebours avant le prochain examen.
- Suivi automatique du stage en cours (semaine sur X, dates).
- Un onglet par matière / groupe, filtré selon le service de stage et le
  pôle renseignés (rien de ce qui est saisi ne quitte le navigateur).
- Export `.ics` : un événement, un onglet ou tout le planning, avec rappels
  configurables (la veille, une heure avant).
- Abonnement `.ics` (`public/ics/tout.ics`, régénéré à chaque synchronisation
  réussie) : contrairement au téléchargement, le calendrier de l'étudiant
  revient vérifier lui-même les mises à jour — pas instantané (dépend de la
  fréquence de rafraîchissement de Google/Apple/Outlook), mais sans rien
  refaire à la main. Ne couvre pas l'UE LCA (facultative, non résoluble pour
  tout le monde à la fois côté serveur).

## D'où viennent les données

Deux origines, combinées en permanence :

1. **Synchronisée automatiquement** : les cours, ED, conférences du cycle 2
   et examens de matière viennent des onglets « déroulé » et « Cycle 2 » du
   sheet de la faculté. `scripts/ingest.mjs` les récupère, les normalise et
   les publie dans `public/data/events.json` par liste blanche de colonnes
   (`date, debut, fin, matiere, libelle, type, site, salle, promo` — rien
   d'autre ne sort du sheet, en particulier aucune adresse mail ni
   commentaire interne).
2. **En dur dans `src/data/seed.js`** : l'administratif, les choix de
   stage, les ateliers, les ECOS, l'UE LCA et les examens de fin de cycle
   viennent de la notice des stages et du mail de rentrée. Aucun onglet du
   sheet ne les couvre pour l'instant (l'onglet visuel « Emploi du temps »
   n'est pas encore parsé), donc ils restent affichés en permanence, que la
   synchronisation fonctionne ou non.

Si la récupération du sheet échoue, ou renvoie manifestement trop peu
d'événements (moins de 50 — un onglet renommé ou un partage coupé ne doit
pas vider le planning), l'application retombe silencieusement sur la
version en dur de `seed.js` pour la partie synchronisée : un planning
légèrement périmé vaut mieux qu'une page blanche.

## Comment ça se met à jour

`.github/workflows/sync.yml` tourne toutes les heures (et sur demande,
onglet Actions → « Synchroniser le planning » → Run workflow). Il télécharge
les deux onglets du sheet en CSV, les normalise, et ne commite que si le
résultat a réellement changé. `.github/workflows/deploy.yml` reconstruit et
republie le site à chaque push sur `main` — donc uniquement quand la
synchronisation a détecté un vrai changement, pas à chaque passage horaire.

## Corriger une erreur

Si une donnée synchronisée est fausse ou mal interprétée (horaire ambigu
signalé « à vérifier », salle manquante...), sans attendre que la faculté
corrige le sheet : ajouter une entrée dans `config/overrides.json`.

```json
[
  { "id": "2026-09-09-hématologie-14-00", "salle": "amphi B" },
  { "id": "2026-09-16-oncologie-16-15", "supprimer": true }
]
```

L'`id` est celui publié dans `public/data/events.json` pour l'événement
concerné. Une correction l'emporte toujours sur le sheet ; `supprimer: true`
retire l'événement au lieu de le corriger. Les overrides sont réappliqués à
chaque synchronisation, donc ils restent valables tant que l'événement
n'est pas supprimé du sheet.

## Développement local

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build de production dans dist/
npm run ingest    # relance scripts/ingest.mjs en local
```

## Ce qui n'est pas encore fait

- Le parseur de l'onglet visuel « Emploi du temps » (ateliers, choix de
  stage, liens Zoom) — sa structure en grille demande une passe dédiée.
- Des flux d'abonnement par groupe/matière (un seul flux global existe pour
  l'instant, `public/ics/tout.ics`).
- La généralisation à d'autres promos que DFASM2.

## Confidentialité

Aucune donnée personnelle n'est publiée. Le fichier d'affectation des
étudiants aux ateliers reste dans le Drive de la faculté ; ce dépôt ne
publie que la correspondance service de stage → session d'atelier, qui
n'identifie aucun étudiant. `*.xlsx` et `*.xls` sont exclus du dépôt dès le
`.gitignore`.
