import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

const escapeHtml = (value: unknown): string =>
  String(value ?? "").replace(
    /[&<>"']/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character] ?? character)
  );

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method === "OPTIONS") {
      return new Response("ok");
    }

    if (req.method !== "POST") {
      return Response.json(
        { error: "Méthode non autorisée." },
        {
          status: 405,
          headers: { Allow: "POST, OPTIONS" },
        }
      );
    }

    if (!ctx.userClaims) {
      return Response.json(
        { error: "Utilisateur non authentifié." },
        { status: 401 }
      );
    }

    // Vérification avec l’identité de l’appelant.
    // Ne pas utiliser ctx.supabaseAdmin pour ce contrôle.
    try {
      const { data: isAdmin, error } =
        await ctx.supabase.rpc("rebond_is_admin");

      if (error) {
        return Response.json(
          { error: "Vérification des droits indisponible." },
          { status: 503 }
        );
      }

      if (isAdmin !== true) {
        return Response.json(
          { error: "Accès réservé aux administrateurs." },
          { status: 403 }
        );
      }
    } catch {
      return Response.json(
        { error: "Vérification des droits indisponible." },
        { status: 503 }
      );
    }

    let body;

    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "Corps JSON invalide." },
        { status: 400 }
      );
    }

    const { to, quiz_date, stats } = body || {};

    if (
      typeof to !== "string" ||
      to.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim()) ||
      !stats ||
      typeof stats !== "object" ||
      Array.isArray(stats) ||
      (
        stats.questions !== undefined &&
        !Array.isArray(stats.questions)
      ) ||
      (
        quiz_date !== undefined &&
        typeof quiz_date !== "string"
      )
    ) {
      return Response.json(
        { error: "Données d’envoi incomplètes ou invalides." },
        { status: 400 }
      );
    }

    try {
      const key =
        Deno.env.get("RESEND_SATISFACTION_API_KEY") ||
        Deno.env.get("RESEND_API_KEY");

      const from =
        Deno.env.get("RESEND_FROM") ||
        "Rebond - Sensibilisation <questionnaire@rebondplay.com>";

      if (!key) {
        return Response.json(
          { error: "Service d’envoi non configuré." },
          { status: 500 }
        );
      }

      const seconds = Number(stats.average_duration_seconds);

      const duration =
        Number.isFinite(seconds) && seconds > 0
          ? Math.floor(seconds / 60) +
            " min " +
            String(Math.floor(seconds % 60)).padStart(2, "0") +
            " s"
          : "—";

      const qrows = (stats.questions || [])
        .map(
          (q: any) => `
            <tr>
              <td style="padding:7px;border-bottom:1px solid #ddd">
                Question ${escapeHtml(q?.question)}
              </td>
              <td style="padding:7px;border-bottom:1px solid #ddd">
                ${escapeHtml(q?.correct)}/${escapeHtml(q?.responses)}
              </td>
              <td style="padding:7px;border-bottom:1px solid #ddd">
                <b>${escapeHtml(q?.rate)}%</b>
              </td>
            </tr>
          `
        )
        .join("");

      const html = `
        <div style="font-family:Arial,sans-serif;color:#123;max-width:720px;margin:auto">
          <h1 style="color:#e65013">
            Bilan du quiz de fin de session
          </h1>

          <h2 style="color:#065269">
            ${escapeHtml(quiz_date)}
          </h2>

          <div style="background:#eef5f4;padding:18px;border-radius:14px;line-height:1.8">
            <b>Participants uniques :</b>
            ${escapeHtml(stats.participants)}<br>

            <b>Quiz terminés :</b>
            ${escapeHtml(stats.completed)}
            (${escapeHtml(stats.completion_rate)} %)<br>

            <b>Score moyen :</b>
            ${escapeHtml(stats.average_score)}/${escapeHtml(stats.total_questions)}<br>

            <b>Réussite moyenne :</b>
            ${escapeHtml(stats.success_rate)} %<br>

            <b>Durée moyenne :</b>
            ${escapeHtml(duration)}<br>

            <b>Meilleur score :</b>
            ${escapeHtml(stats.best_score)}/${escapeHtml(stats.total_questions)}<br>

            <b>Score le plus faible :</b>
            ${escapeHtml(stats.worst_score)}/${escapeHtml(stats.total_questions)}
          </div>

          <h3 style="color:#065269">Réussite par question</h3>

          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th style="text-align:left;padding:7px">Question</th>
                <th style="text-align:left;padding:7px">Correctes</th>
                <th style="text-align:left;padding:7px">Taux</th>
              </tr>
            </thead>
            <tbody>${qrows}</tbody>
          </table>

          <p style="font-size:12px;color:#789;margin-top:24px">
            Récapitulatif généré depuis l’administration Rebond.
          </p>
        </div>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to.trim()],
          subject:
            "Rebond — Bilan du quiz du " +
            (quiz_date || "fin de session"),
          html,
        }),
      });

      if (!response.ok) {
        return Response.json(
          { error: "Envoi non confirmé par le service de messagerie." },
          { status: 502 }
        );
      }

      const result = await response.json();

      return Response.json({
        ok: true,
        id: result.id,
      });
    } catch {
      return Response.json(
        {
          error:
            "Résultat de l’envoi non confirmé. Vérifiez avant de réessayer.",
        },
        { status: 502 }
      );
    }
  }),
};