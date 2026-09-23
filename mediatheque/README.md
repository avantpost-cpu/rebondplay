# Médiathèque RebondPlay — dossier d’intégration

Cette page reprend le principe visuel de la bibliothèque de référence : bandeau, navigation alphabétique, cartes avec aperçu et actions. Elle ajoute une recherche transversale par thème, titre, description et documents associés.

## Fichiers

- `index.html` : page autonome à placer dans le dossier `mediatheque/` du dépôt `avantpost-cpu/rebondplay`.
- `ressources.json` : catalogue initial des 30 modules repris de `depot-quiz/bibliotheque.html`.

Les entrées du catalogue disposent de `themes`, `keywords` et `documents`. Les thèmes donnent des repères visibles; les mots-clés incluent formulations et synonymes qui servent à la recherche sans encombrer les cartes. Les documents associés peuvent être indexés séparément ou regroupés dans une même fiche. Les liens actuels pointent encore vers les modules hébergés sur GitHub Pages de `depot-quiz`; ils ne copient pas leur contenu. Les fichiers de chaque ressource pourront être ajoutés dans `mediatheque/fichiers/` et référencés dans `documents`.

## Intégration au dépôt

Le dossier est intégré à la racine du dépôt. Le lien « Médiathèque » figure dans la zone Ressources pédagogiques des deux accueils : `pagefull/index.html` et `RPessentielleplus/index.html`.

## Ajouter une ressource

Ajouter un objet dans `ressources.json` :

```json
{
  "title": "Nom de la ressource",
  "url": "https://…",
  "type": "Module interactif",
  "summary": "Description courte",
  "themes": ["Emprise", "Prévention"],
  "keywords": ["emprise", "abus de pouvoir", "violences dans le sport", "protection"],
  "documents": [
    { "label": "Support PDF", "url": "fichiers/support.pdf", "type": "PDF", "keywords": ["témoin", "signalement"] }
  ]
}
```

Un même document peut être retrouvé par plusieurs mots ou formulations en les ajoutant dans `keywords` ou dans les `keywords` du document. Plusieurs fichiers associés sont téléchargeables depuis une seule fiche. Les mots-clés publiés doivent rester fondés sur le contenu ou la fonction décrite de la ressource.
