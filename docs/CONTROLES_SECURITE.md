# Controles de securite prepares pour RebondPlay

Etat initial : fichiers prepares localement. Aucun workflow execute sur GitHub,
aucune correction de securite applicative deployee, aucun changement Supabase.

## Controle a chaque push / pull request et lancement manuel

`Security checks` comporte trois jobs independants :

- **Secrets - Gitleaks** : Gitleaks CLI 8.30.1, archive officielle et SHA-256 figes.
  L'historique accessible est recupere avec `fetch-depth: 0`. Les valeurs trouvees
  sont masquees avec `--redact=100`. Une exclusion ciblee dans `.gitleaks.toml`
  concerne uniquement les cles publiques `sb_publishable_`, jamais les fichiers
  entiers ni les cles privees `sb_secret_` / `service_role`. Aucune licence de l'action Gitleaks n'est
  requise : le workflow utilise le CLI et non `gitleaks-action`.
- **Dependances CDN - npm audit** : les `script src` externes HTML sont lus ; un
  manifeste npm temporaire est genere depuis leurs versions. La resolution se
  fait avec `--package-lock-only --ignore-scripts` : pas d'installation des
  bibliotheques ni d'execution de leurs scripts. Une alerte de gravite low ou
  superieure fait echouer le job. Une panne de registre fait aussi echouer le
  controle : elle ne doit pas etre confondue avec une absence d'alerte.
- **Versions fixes et couverture** : signale les versions flottantes (ex. `@2`),
  les scripts externes non reconnus et les imports JSR non audites par npm. Ce
  job reste rouge tant que ces points ne sont pas traites. Les imports JSR
  exigent une revue ou un controle dedie avant une validation globale.

Les actions checkout et setup-node sont referencees par un SHA de commit.
Le jeton GitHub ne dispose que de `contents: read` et n'est pas conserve par
checkout. Aucun mot de passe ni secret Supabase n'est requis par ces jobs.
Les controles ne contactent jamais le projet Supabase ni le site de production.

Le fichier `.github/dependabot.yml` prepare les mises a jour des actions GitHub.
Il ne met pas a jour les URL CDN applicatives. Le manifeste temporaire n'est
pas le manifeste de construction du site : sa resolution ne change pas les
scripts charges par les pages, et n'assure pas l'integrite de leurs octets.

## Limites de l'audit de dependances

Les paquets declares dans les URL jsDelivr npm, unpkg et esm.sh sont reconnus.
Une version flottante est resolue au moment du controle ; un navigateur ou un
cache peut encore charger une autre version. Les paquets npm transitifs et les
modules facultatifs peuvent etre signales meme s'ils ne sont pas utilises dans
le navigateur : l'applicabilite reste a qualifier.

Les imports JSR sont inventories mais pas audites par npm. Les imports distants
JS/TS hors `script src`, scripts crees dynamiquement, CSS, fichiers embarques ou
minifies locaux et code interne des bibliotheques ne sont pas couverts par
cet inventaire. Ajouter une nouvelle famille de dependances exige de mettre a
jour le controle. Une absence d'alerte n'est pas une garantie d'absence de faille.

Aucun `npm audit fix` automatique n'est lance. L'ancienne version jsPDF et les
versions flottantes deja observees doivent rester visibles dans les resultats.

## Verification ciblee des acces, hors CI de production

Sans historique complet de migrations et environnement de test isole, le
script `scripts/security/check_access.py` fournit un controle manuel de RPC,
en lecture seulement. Il ne constitue pas une campagne RLS complete.

Preparer deux sessions fictives distinctes, chacune avec une seule equipe
`AUDIT-...`, selon le protocole deja teste. Creer hors versionnement
`security-fixtures.local.json` :

```json
{
  "project_url": "https://REFERENCE_PROJET.supabase.co",
  "A": {"code": "CODE_A", "management_token": "UUID_A", "team_name": "AUDIT-EQUIPE-A"},
  "B": {"code": "CODE_B", "management_token": "UUID_B", "team_name": "AUDIT-EQUIPE-B"}
}
```

Fournir uniquement la cle publique publishable par `AUDIT_PUBLIC_KEY` dans le
terminal. Garder les cles de gestion dans le fichier local exclu de Git.

```
python3 scripts/security/check_access.py --fixtures security-fixtures.local.json
```

Le script controle les bonnes cles, cles croisees, aleatoire, NULL, vide et
mal formee sur les deux variantes de tableau de bord. Il exige les temoins
positifs : des fixtures supprimees ne produisent pas un faux resultat vert.
Il verifie aussi qu'aucune cle de gestion n'est renvoyee anonymement par
`rebond_retrouver_session` (AUD-03). Les valeurs secretes ne sont pas imprimees.
Le script doit actuellement signaler AUD-03 si ce defaut reste present.

Codes de sortie : 0 controles conformes, 1 au moins un refus attendu non respecte
ou un acces legitime incorrect, 2 verification incomplete/configuration/reseau.
Supprimer les fixtures et le fichier local apres le controle. Ce script ne
cree ni ne supprime de donnee, et n'appelle aucune fonction d'envoi.

## Mise en place et preuve d'execution

Appliquer les fichiers sur une branche de travail, examiner le diff puis ouvrir
une PR selon le fonctionnement du depot. Le premier resultat peut etre rouge
pour des problemes connus ; ne pas ajouter d'exclusion generale pour le rendre
vert. Examiner toute alerte et choisir une correction ou une exception precise
et justifiee.

Dependabot alerts et Dependency graph sont des reglages distincts du depot ;
ils ne sont pas actives par ce patch. CodeQL n'est pas configure par ce patch.
Si des branches sont protegees, rendre les checks obligatoires seulement apres
leur execution et traitement des alertes. Conserver les URL des executions et
leurs conclusions pour le rapport final. Des fichiers prepares ne prouvent pas
que les controles sont actifs sur GitHub.

Sources : documentation officielle npm audit, Gitleaks, actions/checkout et
 actions/setup-node. Versions et empreintes relevees pendant la preparation.

## Validation locale de la preparation

- 9 tests unitaires : passes, sans connexion a Supabase.
- Fichiers YAML : parses sans erreur ; aucune execution GitHub Actions locale
  n'est presentee comme une execution sur GitHub.
- Gitleaks 8.30.1 : historique accessible de 1 190 commits, dont 949 commits
  effectivement balayes par l'outil (6,74 Mo de patches). Les 13 signalements
  initiaux correspondent a des cles publiques publishable. Apres exclusion
  ciblee : aucune alerte. Une fausse cle privee est toujours detectee lors du
  test de sensibilite ; aucune vraie cle privee n'est creee ou utilisee.
- Inventaire : Supabase JS `@2`, html2canvas `1.4.1`, jsPDF `2.5.2`.
- Audit npm de l'arbre temporaire : 2 paquets signales, un high (DOMPurify 2.5.9,
  dependance facultative de jsPDF) et un critical (jsPDF 2.5.2). Ce sont les
  severites de l'outil, pas une qualification de l'exploitabilite du site.
- Le controle strict retourne volontairement un echec pour `@2` non fige et
  deux imports JSR non couverts par npm. Ces points ne sont pas masques.

Pour appliquer le patch depuis une copie locale du depot a la revision de base :

```
git apply --check RebondPlay_Controles_Securite.patch
git apply RebondPlay_Controles_Securite.patch
```

Examiner `git diff` avant commit. Le patch ajoute uniquement des fichiers de
controle et de documentation ; il ne corrige pas les vulnerabilites applicatives.
La revision de base est `1710ef9d4d374de0f9ab459ef48bb1ea7af18ae6`.
