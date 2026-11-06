/* RebondPlay — raccordement des vidéos e-learning au stockage privé.
 * À activer seulement après authentification d'un participant.
 * Aucun mot de passe ni clé secrète dans ce module.
 */
(function(global){
"use strict";
function sourcePath(value){
 if(typeof value!=="string")return null;
 let path;
 try{
  const url=new URL(value,global.location.href);
  if(url.origin!==global.location.origin)return null;
  path=url.pathname;
 }catch{return null}
 const match=path.match(/(?:^|\/)pagevideo\/(.+)$/);
 return match?"pagevideo/"+decodeURIComponent(match[1]):null;
}
function activate(options){
 if(!global.RebondPrivateMedia)throw new Error("Adaptateur de médias privés absent");
 const {participantId,accessToken,publicKey}=options||{};
 if(!participantId||!accessToken||!publicKey)throw new Error("Session participant obligatoire");
 const completed=new WeakSet();
 const pending=new WeakSet();
 async function secure(video){
  if(completed.has(video)||pending.has(video))return;
  const element=video.querySelector("source[src]")||video;
  const raw=element.getAttribute("src");
  const path=sourcePath(raw);
  if(!path)return;
  pending.add(video);
  video.pause();
  video.removeAttribute("autoplay");
  const original=raw;
  element.removeAttribute("src");
  video.load();
  try{
   const url=await global.RebondPrivateMedia.authorizedMediaUrl({sourcePath:path,participantId,accessToken,publicKey});
   if(!video.isConnected)return;
   element.setAttribute("src",url);
   video.load();
   completed.add(video);
   video.dataset.privateMedia="ready";
  }catch(error){
   video.dataset.privateMedia="denied";
   video.dispatchEvent(new CustomEvent("rebond:private-media-error",{detail:{path,message:error.message}}));
   console.warn("RebondPlay : média privé indisponible",path);
  }finally{pending.delete(video)}
 }
 function scan(root){
  if(root.matches?.("video"))secure(root);
  root.querySelectorAll?.("video").forEach(secure);
 }
 scan(document);
 const observer=new MutationObserver(mutations=>{
  for(const mutation of mutations){
   for(const node of mutation.addedNodes)if(node.nodeType===1)scan(node);
  }
 });
 observer.observe(document.body,{subtree:true,childList:true});
 return {disconnect(){observer.disconnect()}};
}
global.RebondPrivateMediaBridge=Object.freeze({activate,sourcePath});
})(window);
