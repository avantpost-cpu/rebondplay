# RebondPlay — Inventaire des références vidéo

Audit du 26 octobre 2026. Ce tableau recense les chemins vidéo référencés dans trois pages HTML. Il ne prouve pas la visibilité effective d'un contenu dans chaque offre et ne couvre pas les scripts externes, sous-pages ni toutes les ressources des dépôts.

| Chemin vidéo | Full | Essentiel+ | E-learning | Autorisation future |
|---|---|---|---|---|
| `pagevideo/Angie_Les violences dans le sport.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/Angie_conséquence1.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_conséquence2.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_conséquence3.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_emprise1.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/Angie_emprise1_en.mp4` | — | — | ✓ | À définir |
| `pagevideo/Angie_emprise2.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/Angie_emprise2_en.mp4` | — | — | ✓ | À définir |
| `pagevideo/Angie_emprise3.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/Angie_emprise3_en.mp4` | — | — | ✓ | À définir |
| `pagevideo/Angie_facteursaggravants1.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_facteursaggravants2.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_facteursaggravants3.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_liberation1.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_liberation2.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_liberation3.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_raisonsilence1.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/Angie_raisonsilence2.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_raisonsilence3.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/Angie_raisonssilence_en.mp4` | — | — | ✓ | À définir |
| `pagevideo/Film_Expo-e-preuves_bdf2.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/animations/1 enfant sur 7.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/animations/Exemple Franck Nicotra.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/animations/La France en 2023%E2%80%A6.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/animations/Le consentement.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/animations/Le secret.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/animations/Les auteurs.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/animations/Les facteurs aggravants.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/animations/Re%CC%81sultat enque%CC%82te.mp4` | ✓ | ✓ | — | À définir |
| `pagevideo/animations/Signaler n'est pas de%CC%81noncer.mp4` | — | — | ✓ | À définir |
| `pagevideo/animations/strategie_demprise.mp4` | ✓ | ✓ | ✓ | À définir |
| `pagevideo/teaserexpo.mp4` | ✓ | ✓ | — | À définir |

## Points de vigilance

- Full et Essentiel+ référencent le même ensemble de vidéos dans leurs pages d'accueil. Ne pas interpréter cette présence comme une permission d'accès.
- La règle Storage actuellement déployée compare l'offre à un dossier unique : elle ne sait pas encore gérer une ressource partagée entre plusieurs offres. Concevoir une matrice d'autorisations avant migration.
- Les chemins accentués, encodés en URL et les variantes de nom doivent être normalisés avec une table de correspondance explicite.
- Les vidéos encore présentes sur GitHub Pages restent publiques tant qu'elles ne sont pas retirées des dépôts et de leurs éventuels miroirs.
- Les liens signés sont temporaires, mais utilisables par leur détenteur jusqu'à expiration. La protection contre la copie parfaite n'est pas garantie.

## Migration proposée

1. Valider la matrice Full / Essentiel+ / Essentiel / e-learning pour chaque ressource.
2. Créer un manifeste source → chemin privé et remplacer les URL seulement dans une page pilote.
3. Tester les trois offres, les comptes désactivés, l'expiration, le chargement et le déplacement dans la vidéo.
4. Migrer progressivement les autres pages puis retirer les copies publiques après validation.
