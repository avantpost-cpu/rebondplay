# Audit des téléchargements — 27 octobre 2026

## État réel
Les liens vers les PDF/ZIP sous /ressources/ sont publics sur GitHub Pages. Le contrôle de session côté navigateur ne protège pas les octets des fichiers.

## Fichiers actuellement référencés dans Essentiel/ressources.html et RPessentielleplus/ressources.html
- ressources/coloriages_15x21.pdf
- ressources/affiches_kitcom.zip (présence du fichier source à vérifier)
- ressources/A4_Cocotte_Rebond_générique_1.pdf
- ressources/A4_Cocotte_Rebond_générique_2.pdf
- ressources/Kit du relayeur_Print_A5_18052026.pdf
- ressources/fresque_A3_A.pdf
- ressources/fresque_A3_B.pdf

## Autres PDF identifiés dans l'inventaire du dépôt
- diplome.pdf
- pageexpo/Version_40x30_neutre_2109206.pdf
- ressources/Affiches A3 Rebond_SignalSport-Tennis.pdf
- ressources/Affiches A3 Rebond_SignalSport_HD.pdf

## Conditions impératives pour considérer la migration terminée
1. Importer les fichiers binaires dans un bucket privé Supabase Storage (non effectué).
2. Appliquer et tester les politiques RLS Storage selon les droits d'abonnement côté serveur.
3. Remplacer les liens directs par des téléchargements authentifiés (URLs signées à courte durée).
4. Tester les trois offres et les cas sans session/abonnement expiré.
5. Supprimer les fichiers publics du dépôt, vérifier les réponses HTTP, tenir compte des caches et de l'historique Git.

NE PAS supprimer les fichiers publics avant que les copies privées et les téléchargements soient validés. Les pages Documents présentent surtout des références bibliographiques : ne pas déplacer les images de couverture par erreur.
