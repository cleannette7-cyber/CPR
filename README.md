# CPR GESTION — Application Windows + Android + version installable sur navigateur

**Projet de CPR SASU** : chantiers, clients, devis, factures. Le **logo officiel CPR (blason)** est utilisé pour la fenêtre Windows, l'icône Android, le raccourci mobile, la connexion administrateur et les documents imprimés. Couleurs conservées : bleu marine, doré et blanc.

Cette version reprend les sources de **CPR Gestion Admin + Supabase** : les données restent sur votre projet Supabase existant, sous contrôle de la table `cpr_admins` et des règles RLS. Les fonctionnalités de modification des **chantiers, devis et factures** ont été conservées.

## ✅ AVANT TOUTE MISE À JOUR SUR GITHUB

**IMPORTANT — Garder votre clé publique déjà configurée !** Le fichier `config.js` dans ce ZIP indique l'URL correcte, mais contient intentionnellement une **clé publique de démonstration**. Pour ne pas casser l'application actuelle :

1. Ouvrir sur GitHub votre fichier `config.js` **actuel**. Le copier dans un fichier sûr / garder ses deux valeurs.
2. Après extraction de cette mise à jour, dans son `config.js`, recopier la valeur de `window.CPR_SUPABASE_ANON_KEY` depuis l'ancien fichier (la clé `sb_publishable_...` ou `anon`). L'URL `https://xeopsjsbdhbcveqvlomb.supabase.co` est déjà inscrite.
3. **Ne jamais** mettre le mot de passe admin, ni une clé `service_role` ou `secret` dans ce dépôt.
4. Régler si possible `window.CPR_PASSWORD_RESET_URL` à **l'URL HTTPS de l'application web déjà publiée** (par exemple `https://votre-site.netlify.app/`). Cette option rend **« Mot de passe oublié » fonctionnel depuis Windows et Android**. Dans Supabase → Authentication → URL Configuration, ajouter **exactement** cette adresse aux Redirect URLs.

**Ne relancez PAS `supabase/setup.sql` pour cette mise à jour** : le projet déjà installé et votre compte administrateur continuent d'être utilisés. Le script SQL est fourni seulement pour une installation totalement neuve.

## 💻 CRÉER L'APPLICATION WINDOWS (.exe) ET ANDROID (.apk) DEPUIS GITHUB — sans Android Studio

### 1. Envoyer le projet sur GitHub

- Décompresser ce ZIP.
- Ouvrir **le contenu** du dossier `CPR-Gestion` (fichiers `package.json`, `index.html`, `.github/...`, etc.).
- Sur le dépôt GitHub **cpr-gestion** existant, uploader les fichiers/dossiers **à la racine**. Important : inclure le dossier caché **`.github`**. `package.json` doit être directement à la racine, pas dans `CPR-Gestion/CPR-Gestion`.
- Au besoin, commencer par une copie sauvegardée du dépôt existant. Vérifier que votre `config.js` reste configuré avec la **clé publique** déjà fonctionnelle.

### 2. Lancer les deux compilations

1. Dans GitHub, ouvrir l'onglet **Actions**.
2. À gauche, choisir **« CPR Gestion - créer Windows et Android »**.
3. Cliquer sur **Run workflow**, choisir la branche principale, puis à nouveau **Run workflow**.
4. Attendre que les jobs **Windows - installateur EXE** et **Android - APK test** passent au vert.
5. Ouvrir le lancement terminé, descendre à **Artifacts** et télécharger :
   - **`CPR-Gestion-Windows-EXE`** : contient l'installateur `.exe` pour Windows 64 bits.
   - **`CPR-Gestion-Android-APK`** : contient un fichier `app-debug.apk` installable sur Android.
6. Sur Windows : exécuter l'installateur `.exe`. Sur Android : transférer le fichier `.apk` sur le téléphone puis l'ouvrir pour installer. Android peut demander l'autorisation d'installer une application provenant de cette source.

L'**APK debug est un APK de test**, signé automatiquement avec une clé de développement, **pas une publication Google Play**. Pour une distribution pérenne, générer et conserver une clé de signature de production. L'**EXE n'est pas signé** : SmartScreen peut afficher « Éditeur inconnu ». Les certificats de signature Windows seront à configurer avant une diffusion commerciale.

### 3. Tester les fonctions sur les deux appareils

- Se connecter avec **l'adresse e-mail et le mot de passe Supabase existants**.
- Ouvrir un chantier, cliquer **Modifier**, enregistrer ; contrôler la modification sur un autre appareil après **Actualiser**.
- Faire de même avec **devis, factures et clients**.
- Pour exporter un devis en PDF sous Windows : ouvrir le document → **Imprimer / PDF** → choisir « Microsoft Print to PDF » ou « Enregistrer en PDF ».
- Sur Android : ouvrir le document → **Imprimer / PDF** → dans l'interface Android, sélectionner **« Enregistrer au format PDF »**. Cette version ajoute un **pont natif Android d'impression**.
- Tester **Mot de passe oublié**, après avoir rempli `CPR_PASSWORD_RESET_URL`, et vérifier que le lien ouvre l'application web publiée via HTTPS.

## 📱 Autre méthode très simple : installer la version PWA, sans .apk ni .exe

Pour installer l'application directement sur **Windows ou Android** :

1. Publier le contenu de `www/` (voir la section ci-dessous) sur un hébergement **HTTPS** tel que Netlify ou GitHub Pages.
2. Sur **Windows / Edge**, ouvrir l'URL → menu **… → Applications → Installer ce site en tant qu'application**.
3. Sur **Android / Chrome**, ouvrir la même URL → menu **⋮ → Installer l'application / Ajouter à l'écran d'accueil**.

La PWA a le logo CPR comme icône. C'est la **voie la plus rapide** si les binaires ne sont pas encore compilés. L'interface peut s'ouvrir depuis son icône même en l'absence temporaire de réseau ; la connexion Supabase et l'accès aux données nécessitent cependant Internet.

## 🌐 Publier la PWA avec GitHub

- Sur GitHub : `Settings → Pages`, sélectionner **GitHub Actions** comme source de déploiement.
- Onglet `Actions` → **« CPR Gestion - publier version installable PWA »** → **Run workflow**.
- GitHub affiche ensuite l'adresse HTTPS du site. Ajouter cette adresse aux **Redirect URLs** Supabase si elle sert pour la récupération de mot de passe.

Pour Netlify : connecter le dépôt et définir `Build command` : `npm install && npm run build:web` ; `Publish directory` : `www`.

## 🔧 Utilisateurs techniques — installation sur ordinateur

Prérequis : Node.js 22+, npm ; pour Android natif, Android Studio + SDK et Java 21 si vous ne compilez pas dans GitHub Actions.

```bash
npm install
npm run build:web
npm run desktop            # ouvrir CPR sous Electron Windows/Linux/macOS (développement)
npm run build:windows      # sur Windows : générer .exe dans release-windows/
npm run android:add        # première fois : générer android/ + icône + bridge PDF
npm run android:sync       # chaque mise à jour du code web
# Android Studio : ouvrir android/ puis Build APK(s)
```

La compilation ne doit jamais inclure votre **mot de passe** ou vos **clés Supabase secrètes**. Seuls l'URL et la clé **publishable/anon** sont destinées au client. Vos données sont protégées côté serveur par RLS.

## ⚠️ Limites à connaître

- **Aucun EXE ou APK n'est pré-compilé dans cette archive source.** Les fichiers d'installation seront générés par la procédure GitHub Actions indiquée ci-dessus. Les workflows nécessitent l'accès aux dépendances npm, aux composants Android et aux exécutables Electron.
- Les deux applications utilisent la **même base Supabase**, donc vos chantiers et devis sont communs. La connexion réseau reste nécessaire. Le service worker **ne met pas en cache les données clients ou les informations de facturation**.
- Les données sont enregistrées dans un seul document JSON Supabase avec détection de conflit : des modifications simultanées depuis plusieurs appareils doivent être évitées, et utiliser le bouton **Actualiser** entre utilisateurs.
- Les devis et factures se modifient via l'interface, mais **une facture déjà émise ne devrait pas être réécrite sans procédure légale de correction / avoir**. Cet outil n'est pas certifié conforme aux exigences comptables / facturation électronique.
- Vous pouvez utiliser votre projet Supabase actuel : **aucun nouveau projet ou nouvel utilisateur ne doit être créé**.

### Structure des fichiers

- `index.html`, `app.js`, `auth.js`, `styles.css` : interface CPR Gestion existante (fonctionnalités préservées).
- `config.js` : connexion au **même** Supabase ; mot de passe oublié via HTTPS.
- `assets/` : logo original, icônes Windows / Android / PWA.
- `scripts/build-web.mjs` : bundle des bibliothèques nécessaires, sans dépendre d'une URL CDN Supabase à chaque chargement.
- `electron/main.cjs` : application Windows Electron, sandbox et intégration du navigateur pour l'impression PDF.
- `capacitor.config.json`, `native/android`, `scripts/prepare-android.mjs` : application Android, icône, système d'impression/PDF natif.
- `.github/workflows/` : deux compilations automatiques Windows et Android + publication PWA.
- `supabase/setup.sql` : **conservé à titre de référence**, à ne pas rejouer.

### Références de technologie

Capacitor : https://capacitorjs.com/docs/getting-started  |  Electron Builder : https://www.electron.build/v26/docs/win/  |  Android impression : https://developer.android.com/training/printing/html-docs  |  Supabase Auth : https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
