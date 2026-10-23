# CPR Gestion — version Supabase sécurisée

Application web de gestion **CPR SASU** : clients, chantiers, devis et factures. Logo CPR conservé ; thème bleu marine, or, blanc. Design responsive ordinateur / téléphone.

## Évolutions de cette version

- Connexion à un **espace administrateur** avec **adresse e-mail + mot de passe** via Supabase Auth.
- **Mot de passe oublié** : envoi d'un lien de récupération, puis formulaire de saisie du nouveau mot de passe.
- Contrôle des autorisations côté Supabase : seuls les comptes inscrits dans `cpr_admins` peuvent lire / modifier les données (RLS activé).
- Données partagées entre ordinateurs et téléphones dans `cpr_store`, en ligne et non dans le stockage local du navigateur.
- Bouton **Déconnexion** et bouton **Actualiser** pour récupérer les modifications venant d'un autre appareil.
- Modification **après création** : fiches chantiers (adresse, client, dates, notes, statut), devis (prestations, quantités, prix, TVA, client, chantier, statut) et factures (mêmes champs, dates d'échéance, paiement). Bouton **Modifier** dans chaque tableau.
- Conversion devis → brouillon de facture, logo CPR sur les documents imprimés, IBAN et pied de page configurables.
- Sauvegarde JSON exportable ; import possible de sauvegardes de l'ancienne version locale.

## Configuration Supabase (OBLIGATOIRE avant utilisation)

### 1. Créer votre projet

1. Créer un projet sur Supabase.
2. Aller dans **SQL Editor**, ouvrir `supabase/setup.sql` (inclus dans ce ZIP), copier tout son contenu puis cliquer **Run**.
3. Aller dans **Authentication > Providers** : activer **Email** et, pour un accès admin uniquement, **désactiver l'inscription publique / Allow new users to sign up**. L'application n'a pas de formulaire d'inscription publique.
4. Aller dans **Authentication > Users**, cliquer **Add user** pour créer le compte administrateur avec son e-mail et son mot de passe. Choisir la confirmation de l'e-mail selon votre configuration. Ne pas mettre de mots de passe dans GitHub.
5. Retourner dans **SQL Editor** et exécuter, en remplaçant l'e-mail entre quotes par celui de l'admin :

   ```sql
   INSERT INTO public.cpr_admins (user_id)
   SELECT id FROM auth.users WHERE email = 'VOTRE_EMAIL_ADMIN@EXEMPLE.FR'
   ON CONFLICT (user_id) DO NOTHING;
   ```

6. Vérifier que l'administrateur est présent dans **Table Editor > cpr_admins**. Tout utilisateur non présent sera refusé, même avec un mot de passe valide.

### 2. Renseigner la connexion dans `config.js`

Dans **Project Settings / Connect / API Keys** selon l'interface Supabase, copier :

- URL du projet (format `https://votre-projet.supabase.co`).
- **Clé publique `publishable` (ou `anon`) UNIQUEMENT** — ces deux valeurs peuvent figurer dans le frontend grâce aux règles RLS.

Modifier les deux valeurs dans `config.js` :

```js
window.CPR_SUPABASE_URL = 'https://votre-projet.supabase.co';
window.CPR_SUPABASE_ANON_KEY = 'votre_cle_publique';
```

⚠️ **Ne jamais mettre `service_role`, de clé `secret`, ni de mot de passe administrateur dans un fichier GitHub.** Le fichier SQL configure le vrai contrôle d'accès, côté base de données. Une simple page de connexion sans RLS ne serait pas une sécurité suffisante.

### 3. Déployer avec GitHub

1. Créer un dépôt GitHub privé (par exemple `cpr-gestion`).
2. Décompresser l'archive et envoyer les fichiers `index.html`, `styles.css`, `app.js`, `auth.js`, `config.js`, `assets/logo-cpr.png` et `supabase/setup.sql` au dépôt.
3. Publier le dépôt via Netlify (**build command : vide ; publish directory : `.`**), ou GitHub Pages (Settings > Pages > Deploy from a branch). HTTPS requis en production.
4. Dans Supabase **Authentication > URL Configuration**, renseigner la **Site URL** exacte de l'application publiée (`https://.../`), et la même URL dans **Redirect URLs**. C'est indispensable au « Mot de passe oublié ».
5. Ouvrir le site publié, entrer l'e-mail et le mot de passe du compte admin, puis compléter les paramètres entreprise (IBAN, BIC, coordonnées, etc.).

**Ne pas ouvrir `index.html` en `file://` pour tester le mot de passe oublié** : utiliser l'adresse HTTPS du site (ou un serveur de développement local ajouté aux URLs autorisées).

### 4. Tester avant utilisation

- Compte admin reconnu : la gestion s'affiche et les données se sauvegardent sur Supabase.
- Sans connexion : impossible de consulter les tables ; l'application reste sur l'écran de connexion.
- Compte non administrateur : connexion refusée à l'administration et données inaccessibles grâce aux politiques RLS.
- Mot de passe oublié : mail reçu ; clic sur le lien ; formulaire de nouveau mot de passe ; reconnexion.
- Modifier un chantier, devis, facture ; enregistrer, recharger le navigateur, rouvrir l'élément et vérifier sa persistance.
- Ouvrir le site sur un autre appareil ; cliquer sur **Actualiser** pour voir les changements.

## Conservation de l'application existante

Les données de la version locale précédente (si elle a déjà servi) ne sont **pas importées automatiquement** : connectez-vous, puis utilisez **Paramètres > Importer une sauvegarde** avec le JSON exporté depuis l'ancienne version. Cela remplace les données Supabase (confirmation demandée).

## Gestion des conflits et sauvegarde

Cette version conserve les données métier dans **un document JSON partagé**, dans la table `cpr_store`. Les écritures sont ordonnées dans le navigateur et protégées par un numéro de révision : si un autre appareil a modifié les données, la nouvelle écriture est **refusée plutôt que d'écraser silencieusement** les changements. Dans ce cas, exportez immédiatement le JSON depuis Paramètres, puis utilisez « Actualiser » pour récupérer les dernières données cloud. **Pas de fusion automatique** de modifications simultanées. Pour une utilisation intensive multi-admin, prévoir des tables métier séparées et un historique des modifications.

## Limites réglementaires importantes

- Les factures sont **modifiables dans l'interface**, comme demandé. Cependant une facture déjà émise ne devrait pas être réécrite librement pour corriger une transaction : les corrections nécessitent en pratique une procédure appropriée (avoir, documents traçables, numérotation conforme). Le prototype **n'assure pas** une piste d'audit / inaltérabilité ou un journal complet des versions.
- Le numéro de facture proposé n'est pas un générateur transactionnel garanti (conflits évités au niveau du stockage, mais pas gestion comptable). La solution ne remplace pas un logiciel de facturation conforme ou un outil de facturation électronique réglementaire.
- Faire vérifier les mentions légales et fiscales, la TVA, les données clients, la protection RGPD, l'archivage et les obligations de facturation avant exploitation réelle.
- Le PDF est obtenu par **Imprimer / Enregistrer au format PDF** dans le navigateur. Il n'est pas envoyé par e-mail automatiquement.
- Configurez SMTP personnalisé dans Supabase pour un envoi de mails fiable en production ; le service de mail par défaut est limité.
- Les données stockées dans Supabase doivent être sauvegardées par une stratégie indépendante, même si vous disposez d'un export JSON manuel.

L'entreprise et son logo proviennent des documents fournis : CPR SASU, 9 Rue Alfred Ottino, 93400 Saint-Ouen-sur-Seine, 945 083 186 RCS Bobigny, capital 1 500 €. Vérifiez les données sur un extrait Kbis actualisé avant émission de documents.
