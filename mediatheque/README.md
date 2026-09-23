# Médiathèque RebondPlay — dossier d’intégration

Cette page reprend le principe visuel de la bibliothèque de référence : bandeau, navigation alphabétique, cartes avec aperçu et actions. Elle ajoute une recherche transversale par thème, titre, description et documents associés.

## Fichiers

- `index.html` : page autonome à placer dans le dossier `mediatheque/` du dépôt `avantpost-cpu/rebondplay`.
- `ressources.json` : catalogue initial des 26 modules repris de `depot-quiz/bibliotheque.html`.

Les entrées du catalogue disposent de `themes` et `documents` pour indexer plusieurs occurrences ou fichiers liés à un sujet. Les liens actuels pointent encore vers les modules hébergés sur GitHub Pages de `depot-quiz`; ils ne copient pas leur contenu. Les fichiers de chaque ressource pourront être ajoutés dans `mediatheque/fichiers/` et référencés dans `documents`.

## Intégration au dépôt

1. Ajouter ce dossier à la racine du dépôt RebondPlay.
2. Ajouter un bouton ou bloc « Médiathèque » sur les deux accueils :
   - Full : `pagefull/index.html`, lien `../mediatheque/index.html`.
   - Essentiel+ : `RPessentielleplus/index.html`, lien `../mediatheque/index.html`.
3. Cette page est actuellement une maquette autonome. Le contrôle d’abonnement doit être appliqué selon le mécanisme d’accès déjà utilisé par les pages RebondPlay avant publication.

## Ajouter une ressource

Ajouter un objet dans `ressources.json` :

```json
{
  "title": "Nom de la ressource",
  "url": "https://…",
  "type": "Module interactif",
  "summary": "Description courte",
  "themes": ["emprise", "prévention", "sport"],
  "documents": [
    { "label": "Support PDF", "url": "fichiers/support.pdf", "type": "PDF" }
  ]
}
```

Un même document peut être retrouvé par plusieurs thèmes en listant ceux-ci dans `themes`. Plusieurs documents associés sont affichés dans la fiche de la ressource.
