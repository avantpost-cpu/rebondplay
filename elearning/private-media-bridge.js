/* RebondPlay : pont vidéos privées pour une session apprenant déjà authentifiée.
 * Usage après contrôle de la session par le portail :
 * RebondPrivateMediaBridge.activate({ participantId, accessToken, publicKey })
 */
(function(global){
"use strict";
function sourcePath(value){
 if(typeof value!=="string")return null;
 try{
  const url=new URL(value,global.location.href);
  if(url.origin!==global.location.origin)return null;
  const match=url.pathname.match(/(?:^|\/)pagevideo\/(.+)$/);
  if(!match)return null;
  const path="pagevideo/"+decodeURIComponent(match[1]);
  return global.RebondPrivateMedia.pathFor(path);
 }catch{return null}
}
let current=null;
function activate(options){
 if(!global.RebondPrivateMedia)throw new Error("Adaptateur privé absent");
 const {participantId,accessToken,publicKey}=options||{};
 if(typeof participantId!=="string"||typeof accessToken!=="string"||typeof publicKey!=="string"||!participantId||!accessToken||!publicKey)throw new Error("Session participant obligatoire");
 if(current)current.disconnect();
 const tracked=new WeakMap();
 const active=new Set();
 let disconnected=false;
 async function secure(video){
  if(disconnected||!video.isConnected)return;
  const source=video.querySelector("source")||video;
  const raw=source.getAttribute("src");
  const path=video.dataset.rebondOriginalPath||sourcePath(raw);
  if(!path||tracked.has(video))return;
  tracked.set(video,{source,path});
  video.dataset.rebondOriginalPath=path;
  active.add(video);
  video.pause();
  video.removeAttribute("autoplay");
  source.removeAttribute("src");
  video.load();
  video.dataset.privateMedia="loading";
  try{
   const url=await global.RebondPrivateMedia.authorizedMediaUrl({sourcePath:path,participantId,accessToken,publicKey});
   if(disconnected||!video.isConnected)return;
   source.setAttribute("src",url);
   video.dataset.privateMedia="ready";
   video.load();
  }catch(error){
   if(disconnected)return;
   video.dataset.privateMedia="denied";
   video.dispatchEvent(new CustomEvent("rebond:private-media-error",{detail:{path,message:error.message}}));
  }
 }
 function scan(node){
  if(node.nodeType!==1)return;
  if(node.matches?.("video"))void secure(node);
  node.querySelectorAll?.("video").forEach(v=>void secure(v));
 }
 const observer=new MutationObserver(changes=>{
  for(const change of changes){
   for(const node of change.addedNodes)scan(node);
   if(change.type==="attributes"&&change.target.matches?.("video,source"))scan(change.target.closest("video")||change.target);
  }
 });
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});
 scan(document.body);
 current={disconnect(){
  disconnected=true;
  observer.disconnect();
  for(const video of active){
   const entry=tracked.get(video);
   if(!entry)continue;
   video.pause();
   entry.source.removeAttribute("src");
   video.removeAttribute("data-private-media");
   video.load();
  }
  active.clear();
 }};
 return current;
}
async function connectSupabase({client,publicKey}){
 if(!client?.auth?.getSession||!client?.auth?.onAuthStateChange||!publicKey)throw new Error("Client Supabase et clé publique nécessaires");
 let closed=false;
 let activeParticipant=null;
 let activeToken=null;
 let generation=0;
 async function refresh(){
  const version=++generation;
  const {data:{session},error}=await client.auth.getSession();
  if(closed||version!==generation)return;
  if(error||!session?.access_token){
   activeParticipant=null;activeToken=null;
   global.RebondPrivateMediaBridge.disconnect();
   return;
  }
  if(activeToken===session.access_token&&activeParticipant)return;
  const response=await fetch("https://tdsrqmpfdvntybdlvejy.supabase.co/functions/v1/elearning-learner-access",{
   method:"POST",headers:{"Authorization":"Bearer "+session.access_token,"apikey":publicKey,"Content-Type":"application/json"},
   body:"{}",cache:"no-store"
  });
  if(closed||version!==generation)return;
  if(!response.ok){global.RebondPrivateMediaBridge.disconnect();throw new Error("Accès participant non vérifié");}
  const data=await response.json();
  const participant=data.campaigns?.find(c=>c.active);
  if(!participant?.participant_id){global.RebondPrivateMediaBridge.disconnect();activeParticipant=null;activeToken=null;throw new Error("Aucune campagne active");}
  activeParticipant=participant.participant_id;
  activeToken=session.access_token;
  activate({participantId:activeParticipant,accessToken:activeToken,publicKey});
 }
 const {data:{subscription}}=client.auth.onAuthStateChange(()=>{
  // Supabase recommande de ne pas appeler son API d'auth synchroniquement dans le callback.
  queueMicrotask(()=>{if(!closed)void refresh().catch(()=>global.RebondPrivateMediaBridge.disconnect())});
 });
 await refresh();
 return {disconnect(){closed=true;generation++;subscription.unsubscribe();global.RebondPrivateMediaBridge.disconnect();}};
}
global.RebondPrivateMediaBridge=Object.freeze({activate,connectSupabase,sourcePath,disconnect(){current?.disconnect();current=null}});
})(window);
