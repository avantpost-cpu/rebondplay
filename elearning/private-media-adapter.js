/* RebondPlay — préparation de la migration des médias e-learning.
 * Branche de test uniquement. Aucun secret ni accès direct au bucket.
 * Le serveur doit vérifier l'identité, l'abonnement, le contrat et
 * l'autorisation du fichier AVANT de délivrer une URL temporaire.
 */
(function (global) {
  "use strict";
  const BUCKET = "rebond-elearning-prive";
  const RENAMES = Object.freeze({
    "pagevideo/animations/Signaler n'est pas dénoncer.mp4": "pagevideo/animations/signaler_nest_pas_denoncer.mp4",
    "pagevideo/animations/Stratégie de l'agresseur.mp4": "pagevideo/animations/strategie_de_l_agresseur.mp4"
  });
  function privateObjectPath(sourcePath) {
    if (typeof sourcePath !== "string") throw new TypeError("Chemin invalide");
    let p = sourcePath.replace(/^\/+/, "").replace(/^\.\//, "");
    if (p.startsWith("https:") || p.startsWith("http:") || p.includes("..") || p.includes("\\") || !p.startsWith("pagevideo/")) {
      throw new Error("Chemin média non autorisé");
    }
    return RENAMES[p] || p;
  }
  async function authorizedMediaUrl(sourcePath, requestSignedUrl) {
    if (typeof requestSignedUrl !== "function") throw new Error("Service d'autorisation absent");
    const path = privateObjectPath(sourcePath);
    // Le callback doit appeler un serveur authentifié, jamais utiliser service_role dans le navigateur.
    const result = await requestSignedUrl({ bucket: BUCKET, path });
    if (!result || typeof result.url !== "string") throw new Error("Accès média refusé");
    const url = new URL(result.url);
    if (url.protocol !== "https:" || url.hostname !== "tdsrqmpfdvntybdlvejy.supabase.co" ||
        !url.pathname.startsWith("/storage/v1/object/sign/" + BUCKET + "/")) {
      throw new Error("URL signée inattendue");
    }
    return url.href;
  }
  global.RebondPrivateMedia = Object.freeze({ BUCKET, privateObjectPath, authorizedMediaUrl });
})(typeof window !== "undefined" ? window : globalThis);
