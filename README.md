# Site AK — AK World Business Services

Site vitrine one-page : actualités, formations et ebooks du cabinet, avec
capture de prospects reliée à un mini-CRM Google Sheets.

## Démarrage local

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). Tant que les Google
Sheets ne sont pas configurés (étape suivante), le site affiche un contenu de
démonstration avec une bannière discrète qui le signale — les formulaires
fonctionnent quand même mais renvoient une erreur propre plutôt qu'un faux
succès.

## Tableau de bord d'administration

Le contenu (actualités, formations, ebooks) se gère depuis `/admin` — le
personnel du cabinet n'a jamais besoin d'ouvrir Google Sheets. Le tableau de
bord écrit dans le classeur Google Sheets en arrière-plan, qui reste la
base de données du site (aucune base de données supplémentaire à héberger).

- Connexion : `/admin/login`, protégée par le mot de passe `ADMIN_PASSWORD`.
- Ajouter / modifier / supprimer une actualité, une formation ou un ebook,
  changer son ordre d'affichage ou le masquer sans le supprimer.
- Google Sheets reste utilisé pour **recevoir les prospects** (inscriptions,
  téléchargements) — c'est le mini-CRM, toujours en lecture seule pour le
  personnel.
- Pour les images (actualités, formations, ebooks) et les fichiers à
  télécharger (PDF...), le formulaire propose deux façons de faire :
  **"Depuis mon PC"** (importe directement un fichier de l'ordinateur) et
  **"Depuis Drive"** (réutilise un fichier déjà présent dans un dossier
  Google Drive). Coller une URL existante reste aussi possible.

### Où sont stockés les fichiers importés

**"Depuis mon PC"** : en local, le fichier est enregistré directement dans le
projet (`public/uploads`) — ça marche immédiatement, sans rien configurer.

En production (Vercel), le disque d'une fonction serverless n'est pas
persistant : il faut un **Blob Store** Vercel (stockage de fichiers).
Une fois créé et connecté au projet, `BLOB_READ_WRITE_TOKEN` est injecté
automatiquement — le code bascule dessus tout seul (aucun changement de
code, aucune manipulation côté cabinet) :

1. Dans le tableau de bord Vercel du projet → **Storage** → **Create
   Database** → **Blob**.
2. Connectez-le au projet (proposé automatiquement à la création).
3. Redéployez (ou attendez le prochain déploiement).

Sans Blob Store connecté, "Depuis mon PC" continue de fonctionner en
développement local mais les fichiers importés en production ne seront pas
conservés — utilisez alors "Depuis Drive" ou une URL externe en attendant.

**"Depuis Drive"** est optionnel, pour réutiliser des fichiers déjà présents
dans un dossier Google Drive existant :
1. Partagez ce dossier avec l'email du compte de service (le même que pour
   les Sheets) en rôle **Éditeur**.
2. Copiez l'ID du dossier depuis son URL (après `/folders/`) dans
   `GOOGLE_DRIVE_FOLDER_ID`.

(Google interdit à un compte de service de *déposer* un nouveau fichier dans
un Drive personnel — d'où le choix du stockage local/Vercel Blob pour
l'import direct. Lire *seulement* dans un dossier déjà partagé reste
autorisé, c'est ce qu'utilise "Depuis Drive".)

## Mode clair / sombre

Le site est sombre par défaut (identité de marque), avec un bouton dans le
header pour basculer en mode clair — le choix est mémorisé par visiteur
(stocké dans son navigateur).

## Emails de confirmation aux prospects

Après une inscription, une demande de téléchargement ou une demande d'info,
la personne reçoit un court email de confirmation (le cabinet examine sa
demande avant validation). Configuré via `GMAIL_USER` / `GMAIL_APP_PASSWORD` :

1. Sur le compte Gmail émetteur, activer la validation en 2 étapes
   (obligatoire pour générer un mot de passe d'application).
2. Aller sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords),
   créer un mot de passe d'application (nom libre, ex. "Site AK"), copier le
   code à 16 caractères généré.
3. `GMAIL_USER` = l'adresse Gmail complète, `GMAIL_APP_PASSWORD` = ce code
   (jamais le mot de passe normal du compte).

Sans ces variables, le site fonctionne normalement — l'email de confirmation
est simplement désactivé (échec silencieux, jamais bloquant pour la capture
du prospect).

## Newsletter (`/admin/newsletter`)

Envoi d'un email (texte + image(s)) à tout ou partie des contacts déjà
collectés, en réutilisant le même Gmail que les confirmations
(`GMAIL_USER` / `GMAIL_APP_PASSWORD` — aucune configuration supplémentaire).

- **Destinataires** : tous les contacts, ou filtrés par mot-clé recherché
  dans leurs centres d'intérêt (`interets_cumules`, formations, ebooks).
  Les contacts désabonnés sont automatiquement exclus.
- **Images** : coller une URL déjà hébergée publiquement (Drive en partage
  "quiconque a le lien", Imgur...) — jamais un chemin local, qui ne
  s'afficherait pas chez le destinataire.
- **Aperçu** : le rendu affiché dans `/admin/newsletter` est exactement le
  HTML qui sera envoyé — à vérifier avant tout premier envoi réel.
- **Envoi** : un email à la fois, avec une pause d'environ 1,2s entre
  chaque, piloté depuis le navigateur (progression "X / N" affichée) — un
  échec individuel n'interrompt pas le reste de l'envoi. Pensé pour rester
  dans les limites de Vercel (pas d'envoi de masse bloquant côté serveur).
- **Désabonnement** : chaque email contient un lien unique par destinataire
  (`/unsubscribe?token=...`) qui marque le contact désabonné dans le Sheet,
  sans compte ni connexion requise.

**Limite à connaître** : un Gmail personnel délivre correctement jusqu'à
quelques centaines d'emails par jour ; au-delà (ou en cas d'envois
fréquents, ou d'images très lourdes), Gmail peut classer les envois comme
spam. L'interface avertit au-delà de 300 destinataires sélectionnés. Le
code d'envoi est isolé dans `lib/newsletter.ts` : le jour où il faut migrer
vers un service dédié (Brevo, Resend...), seule cette couche change, pas
l'interface ni le reste du site.

## Configurer Google Sheets (la base de données derrière le site et le tableau de bord)

### 1. Créer le compte de service Google

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/) avec le
   compte Google à utiliser (voir la note "Propriété" plus bas).
2. Créez un projet (ou utilisez un projet existant).
3. Activez l'API **Google Sheets API** pour ce projet.
4. Menu "IAM et administration" → "Comptes de service" → "Créer un compte de
   service". Donnez-lui un nom (ex. `ak-site`).
5. Une fois créé, ouvrez le compte de service → onglet "Clés" → "Ajouter une
   clé" → "Créer une clé" → format **JSON**. Un fichier JSON se télécharge :
   gardez-le en lieu sûr, ne le commitez jamais dans Git.
6. Dans ce fichier JSON, notez les champs `client_email` et `private_key`.

### 2. Créer le classeur Google Sheets (et ses onglets)

Créez un Google Sheet (via [sheets.google.com](https://sheets.google.com)),
partagez-le avec le compte de service (étape 3), collez son ID dans
`GOOGLE_SHEETS_CONTENT_ID` **et** `GOOGLE_SHEETS_CONTACTS_ID` (le même
classeur sert aux deux, via des onglets différents), puis lancez :

```bash
node --env-file=.env.local scripts/setup-sheets.mjs
```

Ce script crée automatiquement les 3 onglets ci-dessous avec leurs en-têtes
de colonnes, et ajoute le contenu de démonstration si l'onglet `Contenus` est
vide. Il peut être relancé sans risque (il ne touche pas aux onglets déjà
configurés). Vous pouvez aussi créer les onglets à la main si vous préférez —
le détail des colonnes attendues est ci-dessous.

Si vous préférez deux classeurs séparés, c'est possible : mettez des IDs
différents dans `GOOGLE_SHEETS_CONTENT_ID` et `GOOGLE_SHEETS_CONTACTS_ID`,
et relancez le script (il ne provisionne que le classeur "Contenu").

**Onglet `Contenus`** (rempli via le tableau de bord `/admin`, pas à la main),
avec en
ligne 1 ces en-têtes de colonnes (A à O) :

```
id | type | titre | chapo | corps | image_url | date_publication | date_fin | departement | cta_label | cta_action | fichier_url | visible | ordre | infos_pratiques
```

- `type` : une valeur parmi `actualite`, `formation`, `ebook`, `article`, `promotion`
- `cta_action` : une valeur parmi `inscription`, `telechargement`, `info`
- `visible` : `OUI` pour publier la ligne, tout le reste (ou vide) la masque
- `ordre` : un nombre pour trier l'affichage (les plus petits d'abord)
- `image_url` / `fichier_url` : un lien direct vers une image ou un PDF. Pour
  Google Drive, partagez le fichier en "Quiconque disposant du lien", puis
  utilisez un lien direct (ex. via un service comme `drive.google.com/uc?id=...`).
  Laissé vide, le site affiche un visuel animé à la place — ce n'est pas une
  erreur.

**Onglets `Prospects` et `Evenements`** (le mini-CRM, remplis automatiquement
par le site à chaque formulaire, jamais à la main) :

Onglet `Prospects` (colonnes A à M) :
```
id | nom | profession | activite | telephone | email | date_premiere_capture | date_derniere_activite | source_premiere | interets_cumules | formations_inscrites | ebooks_telecharges | articles_demandes
```

Onglet `Evenements` (colonnes A à G) :
```
timestamp | email | telephone | type | item_id | item_titre | departement
```

Ces deux onglets sont remplis **automatiquement** par le site — ne les modifiez
pas à la main, sous peine de fausser la déduplication.

### 3. Partager le Sheet avec le compte de service

Bouton "Partager" sur le classeur → collez l'email du compte de service
(`client_email` du JSON, ressemble à
`ak-site@mon-projet.iam.gserviceaccount.com`) → rôle **Éditeur** → Envoyer.
(Si vous avez deux classeurs séparés, répétez pour chacun.)

### 4. Renseigner les variables d'environnement

Copiez `.env.example` en `.env.local` et remplissez :

- `GOOGLE_SERVICE_ACCOUNT_EMAIL` → le `client_email` du JSON
- `GOOGLE_PRIVATE_KEY` → le `private_key` du JSON (collez-le tel quel, avec
  les `\n`)
- `GOOGLE_SHEETS_CONTENT_ID` → l'ID du classeur (dans son URL, entre `/d/` et
  `/edit`)
- `GOOGLE_SHEETS_CONTACTS_ID` → le même ID (ou celui d'un second classeur)
- `ADMIN_PASSWORD` → le mot de passe du tableau de bord `/admin`
- `ADMIN_SESSION_SECRET` → une chaîne aléatoire quelconque

Lancez `node --env-file=.env.local scripts/setup-sheets.mjs` puis relancez
`npm run dev` : la bannière de démonstration disparaît et le site lit le vrai
contenu.

## Mettre à jour le site au quotidien (sans coder)

Tout se fait depuis `/admin` (voir plus haut) : ajouter, modifier, réordonner
ou masquer une actualité, une formation ou un ebook. Les changements
apparaissent sur le site public dans la minute qui suit (au plus), sans
redéploiement.

Les fiches prospects et le journal des inscriptions/téléchargements se
trouvent dans les onglets `Prospects` et `Evenements` du classeur Google
Sheets — lecture seule pour le personnel, alimentés automatiquement par le
site.

## Propriété du compte Google — migration vers le cabinet

Le projet démarre connecté au compte Google **personnel** du stagiaire, pour
aller vite. Rien dans le code ne dépend de ce compte précis : tout passe par
les variables d'environnement ci-dessus. Pour transférer la propriété au
cabinet une fois qu'il disposera de son propre compte Google (Workspace ou
Gmail dédié) :

1. Refaire les étapes 1 à 3 ci-dessus avec le compte Google du cabinet
   (nouveau compte de service, nouveau Sheet, nouveau partage), puis relancer
   `scripts/setup-sheets.mjs` sur le nouveau classeur.
2. Remplacer les 4 variables Google (en local et sur Vercel) par les
   nouvelles valeurs. `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` ne changent
   pas — ils n'ont rien à voir avec le compte Google.
3. Redéployer. Aucune ligne de code à changer.

## Déploiement sur Vercel

1. Poussez le projet sur un dépôt GitHub.
2. Sur [vercel.com](https://vercel.com/new), importez ce dépôt.
3. Dans les réglages du projet Vercel → "Environment Variables", ajoutez
   toutes les variables du `.env.local` (attention à bien coller
   `GOOGLE_PRIVATE_KEY` en entier, avec ses `\n`).
4. Déployez.

## Structure du projet

```
app/page.tsx                    page publique, lit le contenu (Sheets ou démo)
app/admin/page.tsx               tableau de bord (protégé par mot de passe)
app/admin/login/page.tsx         connexion admin
app/admin/newsletter/page.tsx    envoi de newsletter
app/unsubscribe/page.tsx         page publique de désabonnement
app/api/lead/route.ts            réception des formulaires publics, écrit dans Sheets
app/api/admin/contenus/          API CRUD utilisée par le tableau de bord
app/api/admin/newsletter/        API de liste des destinataires + envoi
lib/newsletter.ts                logique d'envoi newsletter (isolée pour migration future)
lib/newsletter-template.ts       rendu HTML de l'email (partagé aperçu/envoi)
middleware.ts                    protège /admin et /api/admin par cookie de session
lib/sheets.ts                     tout l'accès Google Sheets (lecture + écriture + dédup)
lib/auth.ts                       session admin (cookie signé)
lib/types.ts                      schéma partagé du contenu et des prospects
lib/validation.ts                 validation/normalisation email + téléphone
lib/placeholders.ts               contenu de démonstration (fallback)
scripts/setup-sheets.mjs          provisionne les onglets + en-têtes du classeur
components/                       sections de la page, carte de contenu, modale de capture
components/admin/                 interface du tableau de bord
```
