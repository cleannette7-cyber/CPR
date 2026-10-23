# CPR Gestion — application web

Application de gestion simple pour CPR SASU. Identité visuelle bleu marine / or, logo CPR fourni.

## Fonctionnalités

- Tableau de bord : chantiers, devis, factures et impayés.
- Clients : fiches avec téléphone, adresse et e-mail.
- Chantiers : suivi des travaux, dates, états, notes, adresse et client associé.
- Devis : lignes de prestations, détails libres de chaque intervention, quantités, prix HT, TVA et montant TTC calculés automatiquement.
- Transformation d'un devis en **brouillon de facture** (à vérifier avant émission).
- Factures : états brouillon, émise, payée, en retard; impression.
- Impression A4 / « Enregistrer au format PDF » pour devis et factures.
- IBAN, BIC, conditions de paiement et coordonnées modifiables dans Paramètres.
- Export / import JSON local.

## Installation GitHub et publication

1. Créer un dépôt GitHub privé `cpr-gestion`.
2. Ajouter **l'ensemble** du contenu de ce dossier à la racine (index.html, app.js, styles.css et assets/logo-cpr.png).
3. Pour une démonstration, publier via Netlify (import du dépôt, build command vide, répertoire de publication `.`). Le site ne nécessite aucun build. Pour GitHub Pages, Settings > Pages > Deploy from a branch > main / root.
4. Ouvrir l'URL obtenue dans le navigateur et compléter les Paramètres (IBAN, contact).
5. Ajouter les clients, chantiers et devis, puis utiliser « Imprimer / PDF » et « Enregistrer au format PDF ».

## Limites et sécurité IMPORTANTES

**Prototype local, pas un logiciel de gestion multi-utilisateur prêt pour une exploitation sensible.** Les données sont enregistrées dans le `localStorage` du navigateur de l'appareil, et non dans GitHub ou un serveur. Aucun compte utilisateur, aucune authentification, aucune synchronisation, aucune sauvegarde automatique, aucun contrôle d'accès. Ne pas publier des données réelles clients sur un site accessible publiquement. Avant usage professionnel en production : mettre en place un backend, authentification, base de données, sauvegardes, RGPD, gestion des droits, audit et vérifications des mentions légales et obligations de facturation française.

Le numéro de facture proposé est calculé depuis les données locales; il **n'est pas garanti unique ou continu entre appareils**. La suppression des factures non brouillon est bloquée mais ce n'est pas un système d'inaltérabilité conforme. Aucun envoi de facture électronique réglementaire ni intégration aux plateformes agréées n'est inclus. Pour la facturation, faire valider les champs et procédures par un professionnel.

## Exemple du devis fourni

Le devis utilisateur affiche 2 800,00 € HT et une TVA de 280,00 € notée « 20 % »; les chiffres sont incohérents (20 % de 2 800 = 560 €). L'application **recalcule les totaux** selon les prix et le taux saisis, et ne reproduit pas l'erreur.

L'extrait Kbis remis (daté 02/06/2025) a été utilisé pour la raison sociale, le siège, le SIREN, le capital et le président. Actualiser ces informations si elles ont changé.
