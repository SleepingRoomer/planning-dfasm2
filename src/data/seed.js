/* ------------------------------------------------------------------ *
 *  Événements du planning DFASM2 2026-2027, extraits du prototype.
 *
 *  Deux rôles pour ce fichier :
 *   1. Source de vérité pour les événements qu'aucun onglet du sheet ne
 *      couvre encore (administratif, stages, ateliers, ECOS, examens,
 *      UE LCA) — ils viennent de la notice des stages et du mail de
 *      rentrée, pas d'une colonne synchronisable. Ils restent affichés
 *      en permanence, que la synchronisation fonctionne ou non.
 *   2. Filet de secours complet si `data/events.json` est inaccessible
 *      ou manifestement tronqué (fetch en échec, moins de 50 événements).
 *
 *  N'invente aucune donnée : ce sont exactement les événements du
 *  prototype `planning-dfasm2.jsx` fourni par la faculté / la notice.
 * ------------------------------------------------------------------ */

export const H = "Hématologie",
  O = "Oncologie",
  P = "Pédiatrie",
  MI = "Médecine interne",
  PSY = "Psychiatrie",
  G = "Gériatrie",
  C2 = "Cycle 2";

const DEUX_SALLES = "salle 511 ou 616";

export const SEED_EVENTS = [
  // ---------- Administratif et stages ----------
  { d: "2026-09-03", s: "09:00", e: "17:00", t: "ED interrégional, deux épreuves de questions", type: "edn", place: "Salles info Saint-Antoine et amphi D" },
  { d: "2026-09-04", s: "09:00", e: "17:00", t: "ED interrégional, une épreuve de questions et LCA", type: "edn", place: "Salles info Saint-Antoine et amphi D" },
  { d: "2026-09-12", s: "09:30", e: "12:00", t: "Choix de stage n°1", type: "admin", place: "Zoom", note: "Un samedi." },
  { d: "2026-09-21", t: "Début du stage 1", type: "admin", note: "Jusqu'au 29 novembre, paye jusqu'au 6 décembre." },
  { d: "2026-10-01", s: "17:00", t: "Inscriptions à l'UE LCA renforcée", type: "admin", place: "Lien Survey Monkey publié dans le planning", note: "300 places. Présence obligatoire aux 4 séances et note au Wooclap. Un Zoom est prévu pour qui suit sans valider l'UE." },
  { d: "2026-10-05", s: "16:30", e: "18:30", t: "Forum des relations internationales", type: "admin", place: "Hall du 91" },
  { d: "2026-10-08", s: "16:30", t: "Information mobilités internationales", type: "admin", place: "Amphi D" },
  { d: "2026-10-15", t: "Date limite d'inscription à la faculté", type: "admin", note: "Deadline ultime. Les stages et les cours peuvent commencer sans inscription." },
  { d: "2026-10-19", s: "14:00", e: "16:00", t: "Forum des relations internationales", type: "admin", place: "Hall du 91" },
  { d: "2026-11-11", s: "09:00", e: "13:00", t: "Choix de stage n°2", type: "admin", place: "Zoom", note: "Maintenu bien que le 11 novembre soit férié. Topos par pôle, puis choix des postes." },
  { d: "2026-12-07", t: "Début du stage 2", type: "admin", note: "Jusqu'au 21 février." },
  { d: "2027-01-25", t: "Choix de stage n°3", type: "admin" },
  { d: "2027-02-22", t: "Début du stage 3", type: "admin", note: "Jusqu'au 9 mai, dont une semaine d'EDN blanc." },

  // ---------- Hématologie ----------
  { d: "2026-09-09", s: "14:00", e: "16:00", t: "Anémies carentielles", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-09-16", s: "14:00", e: "16:00", t: "Anémies hémolytiques", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-09-23", s: "14:00", e: "16:00", t: "LLC, splénomégalie, syndrome mononucléosique", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-09-30", s: "14:00", e: "16:00", t: "Myélodysplasies, leucémies aiguës, agranulocytose", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-10-07", s: "14:00", e: "16:00", t: "Lymphomes et ganglions", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-10-21", s: "14:00", e: "16:00", t: "Myélome et gammapathie monoclonale", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-10-28", s: "14:00", e: "16:00", t: "Thrombopénies, thrombopathies, hémostase primaire", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-11-04", s: "14:00", e: "16:00", t: "Vaquez, thrombocytémie, LMC, éosinophilie", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-11-18", s: "14:00", e: "16:00", t: "Anomalies de la coagulation", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-11-25", s: "14:00", e: "16:00", t: "Traitement antithrombotique et accidents des anticoagulants", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },
  { d: "2026-12-09", s: "13:30", e: "16:00", t: "Hémato-transfusion", subj: H, type: "ed", place: "PSL 91", room: DEUX_SALLES },

  // ---------- Oncologie ----------
  { d: "2026-09-09", s: "16:15", e: "18:15", t: "Épidémiologie, cancérogenèse, diagnostic et traitements", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },
  { d: "2026-09-16", s: "16:15", e: "18:15", t: "Tumeurs du col, du corps utérin et de l'ovaire", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },
  { d: "2026-09-23", s: "16:15", e: "18:15", t: "Tumeurs cutanées et tumeurs osseuses", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },
  { d: "2026-09-30", s: "16:15", e: "18:15", t: "Tumeurs de la prostate, du rein, du testicule et de la vessie", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },
  { d: "2026-10-07", s: "16:15", e: "18:15", t: "Tumeurs du poumon", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },
  { d: "2026-10-21", s: "16:15", e: "18:15", t: "Tumeurs de l'estomac, de l'œsophage et du pancréas", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },
  { d: "2026-10-28", s: "16:15", e: "18:15", t: "Tumeurs ORL et tumeurs intracrâniennes", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },
  { d: "2026-11-04", s: "16:15", e: "18:15", t: "Tumeurs du côlon, du rectum et du foie", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },
  { d: "2026-11-18", s: "16:15", e: "18:15", t: "Tumeurs du sein", subj: O, type: "cm", place: "PSL 91", room: "salle 511" },

  // ---------- Pédiatrie ----------
  { d: "2026-09-08", s: "13:45", e: "17:30", t: "Infectiologie puis pneumologie", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },
  { d: "2026-09-15", s: "14:00", e: "17:00", t: "Néonatalogie puis endocrinologie", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },
  { d: "2026-09-22", s: "14:00", e: "17:00", t: "Vaccinologie puis allergologie", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },
  { d: "2026-10-06", s: "14:00", e: "17:00", t: "Gastro-entérologie", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },
  { d: "2026-10-13", s: "13:00", e: "14:00", t: "Film préparatoire à l'atelier ACR", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel", pole: "Pédiatrie", note: "Préparation obligatoire avant l'atelier, avec test quiz." },
  { d: "2026-10-13", s: "14:00", e: "17:00", t: "Urgences puis néphrologie", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },
  { d: "2026-10-20", s: "14:00", e: "17:00", t: "Douleur puis hématologie", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },
  { d: "2026-11-10", s: "14:00", e: "17:00", t: "Chirurgie viscérale puis réanimation", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },
  { d: "2026-11-24", s: "14:00", e: "17:00", t: "Radio-pédiatrie puis chirurgie orthopédique", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },
  { d: "2026-12-08", s: "14:00", e: "17:00", t: "Neurologie", subj: P, type: "cm", place: "Trousseau", room: "amphi Sorrel" },

  // ---------- Médecine interne ----------
  { d: "2026-09-29", s: "14:00", e: "16:30", t: "Amaigrissement, réaction inflammatoire, éducation thérapeutique, déficit immunitaire", subj: MI, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-10-27", s: "14:00", e: "17:15", t: "Acrosyndromes, vascularites, fièvre chez l'immunodéprimé", subj: MI, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-11-03", s: "14:00", e: "17:00", t: "Fièvre prolongée, maladies auto-immunes, corticothérapie", subj: MI, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-11-17", s: "14:00", e: "17:00", t: "Lupus et syndrome des antiphospholipides", subj: MI, type: "cm", place: "PSL 91", room: "amphi C", note: "Sujets à préparer dans UNESS." },
  { d: "2026-12-15", s: "14:00", e: "16:30", t: "Splénomégalie, sarcoïdose, purpura, biothérapies", subj: MI, type: "cm", place: "PSL 91", room: "amphi C" },

  // ---------- Psychiatrie ----------
  { d: "2026-09-11", s: "14:00", e: "18:00", t: "Classifications, trouble bipolaire, trouble dépressif", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C", note: "Confs enregistrées en Panopto, supports sur Moodle." },
  { d: "2026-09-18", s: "14:00", e: "18:00", t: "Soins sans consentement, trouble délirant, schizophrénie", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-09-25", s: "14:00", e: "18:00", t: "Troubles du post-partum, trouble obsessionnel compulsif", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-10-02", s: "14:00", e: "18:00", t: "Troubles somatoformes, psychiatrie de l'enfant", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-10-09", s: "14:00", e: "18:00", t: "Addictions puis troubles psychiques du sujet âgé", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-10-23", s: "14:00", e: "18:00", t: "Conduites suicidaires, état de stress post-traumatique", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-11-06", s: "14:00", e: "18:00", t: "Tabac, alcool, crise d'angoisse et troubles anxieux", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-11-13", s: "14:00", e: "18:00", t: "Trouble bipolaire et dépression de l'adolescent", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-11-20", s: "14:00", e: "18:00", t: "Troubles anxieux et troubles des conduites alimentaires de l'enfant", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },
  { d: "2026-11-27", s: "14:00", e: "18:00", t: "Neurodéveloppement, sommeil, troubles du comportement", subj: PSY, type: "cm", place: "PSL 91", room: "amphi C" },

  // ---------- Gériatrie ----------
  { d: "2026-09-14", s: "14:00", e: "16:00", t: "Iatrogénie, plainte mnésique, troubles neurocognitifs", subj: G, type: "ed", place: "PSL 105", room: "amphi E", note: "Sujet à préparer dans Moodle. Peut se prolonger jusqu'à 17h." },
  { d: "2026-09-28", s: "14:00", e: "16:00", t: "Immobilisation, escarres, dépression et psychotropes", subj: G, type: "ed", place: "PSL 105", room: "amphi E" },
  { d: "2026-10-26", s: "14:00", e: "17:00", t: "Chutes, troubles de la marche, confusion", subj: G, type: "ed", place: "PSL 105", room: "amphi E" },
  { d: "2026-11-02", s: "14:00", e: "17:00", t: "Insuffisance cardiaque, fibrillation atriale, anémie", subj: G, type: "ed", place: "PSL 105", room: "amphi E" },
  { d: "2026-11-09", s: "14:00", e: "16:00", t: "Malaise, syncope, protection juridique", subj: G, type: "ed", place: "PSL 105", room: "amphi E" },
  { d: "2026-11-16", s: "14:00", e: "16:00", t: "Soins palliatifs, hypercalcémie, ostéoporose, diabète", subj: G, type: "ed", place: "PSL 105", room: "amphi E" },
  { d: "2026-11-23", s: "14:00", e: "16:00", t: "Nutrition, dénutrition, hyponatrémie, douleurs", subj: G, type: "ed", place: "PSL 105", room: "amphi E", note: "Corrections en ligne sur Moodle à la fin des ED, en décembre." },

  // ---------- Conférences du cycle 2 ----------
  { d: "2026-09-07", s: "18:30", e: "21:00", t: "Urgences", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-09-10", s: "18:30", e: "21:00", t: "Rhumatologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-09-14", s: "18:30", e: "21:00", t: "Urologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-09-17", s: "18:30", e: "21:00", t: "Néphrologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-09-21", s: "18:30", e: "21:00", t: "Neurologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-09-24", s: "18:30", e: "21:00", t: "Radiologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-09-28", s: "18:30", e: "21:00", t: "Gynéco-obstétrique", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-10-01", s: "18:30", e: "21:00", t: "Dermatologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-10-05", s: "18:30", e: "21:00", t: "Maladies infectieuses", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-10-08", s: "18:30", e: "21:00", t: "Hépato-gastro-entérologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-10-12", s: "18:30", e: "21:00", t: "Chirurgie maxillo-faciale", subj: C2, type: "conf", place: "Zoom" },
  { d: "2026-10-15", s: "18:30", e: "20:30", t: "Endocrinologie, diabétologie et nutrition (1)", subj: C2, type: "conf", place: "Hôpital PSL", room: "amphi Stomato" },
  { d: "2026-10-19", s: "18:30", e: "21:00", t: "Cardiologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-10-22", s: "18:30", e: "21:00", t: "Réanimation et anesthésie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-10-26", s: "18:30", e: "21:00", t: "Parasitologie et bactériologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-10-29", s: "18:30", e: "21:00", t: "Orthopédie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-11-02", s: "18:30", e: "21:00", t: "Hépato-gastro-entérologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-11-05", s: "18:30", e: "21:00", t: "Lecture critique d'article", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-11-09", s: "18:30", e: "21:00", t: "Endocrinologie, diabétologie et nutrition (2)", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-11-12", s: "18:30", e: "21:00", t: "Médecine physique et de réadaptation", subj: C2, type: "conf", place: "PSL 105", room: "amphi E" },
  { d: "2026-11-16", s: "18:30", e: "21:00", t: "Gynéco-obstétrique", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-11-19", s: "18:30", e: "21:00", t: "Pneumologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-11-23", s: "18:30", e: "21:00", t: "Réanimation et anesthésie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-11-26", s: "18:30", e: "21:00", t: "Hématologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-12-07", s: "18:30", e: "21:00", t: "Maladies infectieuses", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-12-10", s: "18:30", e: "21:00", t: "Santé publique", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-12-14", s: "18:30", e: "19:45", t: "Virologie", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-12-14", s: "19:45", e: "21:00", t: "Anatomie pathologique", subj: C2, type: "conf", place: "PSL 105", room: "amphi F" },
  { d: "2026-12-17", s: "18:30", e: "21:00", t: "Ophtalmologie", subj: C2, type: "conf", place: "PSL 105", room: "pas d'amphi attribué" },

  // ---------- UE LCA renforcée ----------
  { d: "2026-11-12", s: "14:00", e: "17:00", t: "UE LCA renforcée, séance 1", type: "cm", place: "PSL 105", room: "amphi F", opt: "lca" },
  { d: "2026-11-19", s: "14:00", e: "17:00", t: "UE LCA renforcée, séance 2", type: "cm", place: "PSL 105", room: "amphi F", opt: "lca" },
  { d: "2026-11-26", s: "14:00", e: "17:00", t: "UE LCA renforcée, séance 3", type: "cm", place: "PSL 105", room: "amphi F", opt: "lca" },

  // ---------- Ateliers de pédiatrie ----------
  { d: "2026-11-09", s: "09:00", e: "13:00", t: "Atelier ACR du nourrisson", type: "atelier", place: "Plateforme PULSE, Trousseau", room: "bâtiment Lemariey", pole: "Pédiatrie", note: "Trois phases d'une heure puis une évaluation obligatoire, qui conditionne la validation de la pédiatrie." },
  { d: "2026-11-10", s: "09:00", e: "13:00", t: "Atelier ACR du nourrisson", type: "atelier", place: "Plateforme PULSE, Trousseau", room: "bâtiment Lemariey", pole: "Pédiatrie" },
  { d: "2026-11-17", s: "09:00", e: "13:00", t: "Atelier ACR du nourrisson", type: "atelier", place: "Plateforme PULSE, Trousseau", room: "bâtiment Lemariey", pole: "Pédiatrie" },
  { d: "2026-11-18", s: "09:00", e: "13:00", t: "Atelier ACR du nourrisson", type: "atelier", place: "Plateforme PULSE, Trousseau", room: "bâtiment Lemariey", pole: "Pédiatrie" },
  { d: "2026-11-12", s: "08:30", e: "12:30", t: "ECOS de pédiatrie", type: "ecos", pole: "Pédiatrie", note: "Répartition entre les deux jours faite par le secrétariat du département." },
  { d: "2026-11-16", s: "08:30", e: "12:30", t: "ECOS de pédiatrie", type: "ecos", pole: "Pédiatrie" },

  // ---------- Examens ----------
  { d: "2026-11-30", s: "09:00", e: "17:30", t: "EDN blanc interrégional", type: "edn", place: "Saint-Antoine et PSL", room: "salles info et amphi D" },
  { d: "2026-12-01", s: "09:00", e: "17:30", t: "EDN blanc interrégional", type: "edn", place: "Saint-Antoine et PSL", room: "salles info et amphi D" },
  { d: "2026-12-02", s: "09:00", e: "18:00", t: "EDN blanc, corrections", type: "edn", place: "PSL ou Zoom", room: "amphi E" },
  { d: "2026-12-03", s: "09:00", e: "18:00", t: "EDN blanc, corrections", type: "edn", place: "PSL ou Zoom", room: "amphi E" },
  { d: "2026-12-04", s: "09:00", e: "18:00", t: "EDN blanc, corrections", type: "edn", place: "PSL ou Zoom", room: "amphi E" },
  { d: "2027-01-19", s: "13:30", e: "14:30", t: "Hématologie", type: "examen", place: "Saint-Antoine", room: "salles info 1-2-3 et amphi D" },
  { d: "2027-01-19", s: "15:00", e: "16:00", t: "Oncologie", type: "examen", place: "Saint-Antoine", room: "salles info 1-2-3 et amphi D" },
  { d: "2027-01-19", s: "16:30", e: "17:30", t: "Gériatrie", type: "examen", place: "Saint-Antoine", room: "salles info 1-2-3 et amphi D" },
  { d: "2027-01-21", s: "13:30", e: "14:30", t: "Pédiatrie", type: "examen", place: "Saint-Antoine", room: "salles info 1-2-3 et amphi D" },
  { d: "2027-01-21", s: "15:00", e: "16:00", t: "Médecine interne", type: "examen", place: "Saint-Antoine", room: "salles info 1-2-3 et amphi D" },
  { d: "2027-01-21", s: "16:30", e: "17:30", t: "Psychiatrie", type: "examen", place: "Saint-Antoine", room: "salles info 1-2-3 et amphi D" },
  { d: "2027-02-18", t: "ECOS facultaires n°2", type: "ecos", note: "Matin et après-midi. Compte pour 30 % de la note de contrôle continu." },
  { d: "2027-03-22", t: "Semaine de rattrapages", type: "examen", note: "Matinées et après-midis." },
  { d: "2027-04-29", t: "CCC écrit", type: "examen", note: "Deux épreuves de 3h sur le programme du deuxième cycle. Correction le 30 avril, rattrapage le 17 juin." },
];
