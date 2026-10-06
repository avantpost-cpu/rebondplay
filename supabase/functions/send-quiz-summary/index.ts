import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method === "OPTIONS") return new Response("ok");
    if (!ctx.userClaims) return Response.json({ error: "Utilisateur non authentifié." }, { status: 401 });
    try {
      const body = await req.json();
      const { to, quiz_date, stats } = body || {};
      if (!to || !String(to).includes("@") || !stats) return Response.json({ error: "Données d’envoi incomplètes." }, { status: 400 });
      const key = Deno.env.get("RESEND_SATISFACTION_API_KEY") || Deno.env.get("RESEND_API_KEY");
      const from = Deno.env.get("RESEND_FROM") || "Rebond - Sensibilisation <questionnaire@rebondplay.com>";
      if (!key) return Response.json({ error: "Clé Resend absente." }, { status: 500 });
      const duration = stats.average_duration_seconds ? Math.floor(stats.average_duration_seconds/60)+" min "+String(stats.average_duration_seconds%60).padStart(2,"0")+" s" : "—";
      const qrows=(stats.questions||[]).map((q:any)=>`<tr><td style="padding:7px;border-bottom:1px solid #ddd">Question ${q.question}</td><td style="padding:7px;border-bottom:1px solid #ddd">${q.correct}/${q.responses}</td><td style="padding:7px;border-bottom:1px solid #ddd"><b>${q.rate}%</b></td></tr>`).join("");
      const html=`<div style="font-family:Arial,sans-serif;color:#123;max-width:720px;margin:auto"><h1 style="color:#e65013">Bilan du quiz de fin de session</h1><h2 style="color:#065269">${quiz_date||""}</h2><div style="background:#eef5f4;padding:18px;border-radius:14px;line-height:1.8"><b>Participants uniques :</b> ${stats.participants}<br><b>Quiz terminés :</b> ${stats.completed} (${stats.completion_rate} %)<br><b>Score moyen :</b> ${stats.average_score}/${stats.total_questions}<br><b>Réussite moyenne :</b> ${stats.success_rate} %<br><b>Durée moyenne :</b> ${duration}<br><b>Meilleur score :</b> ${stats.best_score}/${stats.total_questions}<br><b>Score le plus faible :</b> ${stats.worst_score}/${stats.total_questions}</div><h3 style="color:#065269">Réussite par question</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:7px">Question</th><th style="text-align:left;padding:7px">Correctes</th><th style="text-align:left;padding:7px">Taux</th></tr></thead><tbody>${qrows}</tbody></table><p style="font-size:12px;color:#789;margin-top:24px">Récapitulatif généré depuis l'administration Rebond.</p></div>`;
      const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from,to:[to],subject:"Rebond — Bilan du quiz du "+(quiz_date||"fin de session"),html})});
      const data=await r.json();
      if(!r.ok) return Response.json({error:"Erreur Resend.",details:data},{status:r.status});
      return Response.json({ok:true,id:data.id});
    } catch(e) {
      return Response.json({error:e instanceof Error?e.message:String(e)},{status:500});
    }
  })
};