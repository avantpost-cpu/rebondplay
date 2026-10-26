/* RebondPlay private media pilot — no automatic activation on existing pages.
 * Requires a Supabase Auth session (not the legacy shared access code).
 * The server-side Storage RLS policy remains the source of authorization.
 */
(function (global) {
  'use strict';
  const BUCKET = 'rebondplay-prive';
  const ALLOWED = new Map([
    ['angie-liberation-1', 'full/Angie_liberation1.mp4']
  ]);
  async function playPrivateVideo({client, video, mediaId, onStatus = () => {}}) {
    if (!client || !video || !ALLOWED.has(mediaId)) throw new Error('Vidéo privée non configurée');
    const {data: userData, error: userError} = await client.auth.getUser();
    if (userError || !userData?.user) throw new Error('Connexion individuelle Supabase requise');
    const {data, error} = await client.storage.from(BUCKET).createSignedUrl(ALLOWED.get(mediaId), 900);
    if (error || !data?.signedUrl) throw new Error('Accès refusé ou vidéo indisponible');
    video.pause();
    video.src = data.signedUrl;
    video.load();
    onStatus('Accès autorisé, lien temporaire valable 15 minutes');
    return video.play();
  }
  global.RebondPrivateMedia = Object.freeze({playPrivateVideo});
})(window);
