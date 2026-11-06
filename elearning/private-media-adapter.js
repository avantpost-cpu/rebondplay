/* RebondPlay : adaptateur de médias privés (branche de test).
 * Nécessite un JWT Supabase utilisateur et l'ID participant attribué au même utilisateur.
 * Ne jamais placer de clé service_role dans le navigateur.
 */
(function(global){
"use strict";
const ENDPOINT="https://tdsrqmpfdvntybdlvejy.supabase.co/functions/v1/elearning-private-media-test";
const RENAMES=Object.freeze({
 "pagevideo/animations/Signaler n'est pas dénoncer.mp4":"pagevideo/animations/signaler_nest_pas_denoncer.mp4",
 "pagevideo/animations/Stratégie de l'agresseur.mp4":"pagevideo/animations/strategie_de_l_agresseur.mp4"
});
function pathFor(source){
 if(typeof source!=="string")throw new TypeError("Chemin manquant");
 let path=source.replace(/^\.\//,"").replace(/^\/+/, "");
 if(!path.startsWith("pagevideo/")||path.includes("..")||path.includes("//")||path.includes("\\")||/[?#%]/.test(path))throw new Error("Chemin interdit");
 return RENAMES[path]||path;
}
async function authorizedMediaUrl({sourcePath,participantId,accessToken,publicKey}){
 const path=pathFor(sourcePath);
 if(!participantId||!accessToken||!publicKey)throw new Error("Session ou participant manquant");
 const response=await fetch(ENDPOINT,{method:"POST",headers:{"Authorization":"Bearer "+accessToken,"apikey":publicKey,"Content-Type":"application/json"},body:JSON.stringify({participant_id:participantId,path:sourcePath}),cache:"no-store"});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.ok||!data.url)throw new Error("Média inaccessible ("+response.status+")");
 const url=new URL(data.url);
 if(url.protocol!=="https:"||url.hostname!=="tdsrqmpfdvntybdlvejy.supabase.co"||!url.pathname.startsWith("/storage/v1/object/sign/rebond-elearning-prive/"))throw new Error("Réponse serveur inattendue");
 return url.href;
}
global.RebondPrivateMedia=Object.freeze({pathFor,authorizedMediaUrl,ENDPOINT});
})(typeof window!=="undefined"?window:globalThis);
