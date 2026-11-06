/* Chargement du parcours privé depuis l'accès apprenant existant.
 * Branche test uniquement. La session Supabase reste gérée par le portail.
 */
(async function(){
 if(new URLSearchParams(location.search).get("private-test")!=="1")return;
 const project="https://tdsrqmpfdvntybdlvejy.supabase.co";
 const publicKey="sb_publishable_MIYryZDKmU4cGMIGdXojnA_GQ5qmpOO";
 const banner=document.createElement("div");
 banner.setAttribute("role","status");
 banner.style.cssText="position:sticky;top:0;z-index:9999;padding:12px 20px;background:#064e61;color:white;font:600 14px Poppins,Arial,sans-serif";
 banner.textContent="Vérification de l'accès aux vidéos privées…";
 document.body.prepend(banner);
 try{
  if(!window.supabase||!window.RebondPrivateMediaBridge)throw new Error("Modules non chargés");
  const client=window.supabase.createClient(project,publicKey);
  const {data:{session}}=await client.auth.getSession();
  if(!session?.access_token){location.replace("./acces/");return}
  await window.RebondPrivateMediaBridge.connectSupabase({client,publicKey});
  banner.textContent="Mode test : les vidéos du parcours utilisent des liens privés temporaires.";
 }catch(error){
  banner.textContent="Accès privé non vérifié : retour à la connexion.";
  location.replace("./acces/");
 }
})();
