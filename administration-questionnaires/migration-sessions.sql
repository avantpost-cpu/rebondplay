-- Rebond : sessions des deux catégories de quiz
-- À exécuter dans Supabase SQL Editor avant activation des nouvelles interfaces.
create table if not exists public.rebond_quiz_sessions (
 id uuid primary key default gen_random_uuid(),
 code text not null unique,
 category text not null check (category in ('sensibilisation','formation')),
 event_name text not null,
 event_date date not null,
 event_place text not null default '',
 created_at timestamptz not null default now()
);
create index if not exists rebond_quiz_sessions_category_date_idx on public.rebond_quiz_sessions(category,event_date desc);
alter table public.rebond_quiz_sessions enable row level security;
-- Les visiteurs peuvent seulement vérifier une session via son code.
-- Attention : cette politique permet la lecture des métadonnées des sessions ;
-- ne jamais placer de données privées dans cette table.
create policy "read quiz sessions" on public.rebond_quiz_sessions
 for select to anon,authenticated using (true);
create policy "admin insert quiz sessions" on public.rebond_quiz_sessions
 for insert to authenticated with check (true);
create policy "admin update quiz sessions" on public.rebond_quiz_sessions
 for update to authenticated using (true) with check (true);
create policy "admin delete quiz sessions" on public.rebond_quiz_sessions
 for delete to authenticated using (true);
-- Préserver les anciens résultats (session_code NULL = historique).
alter table public.questionnaire_participants add column if not exists session_code text;
alter table public.questionnaire_answers add column if not exists session_code text;
alter table public.questionnaire2_participants add column if not exists session_code text;
alter table public.questionnaire2_answers add column if not exists session_code text;
create index if not exists questionnaire_participants_session_idx on public.questionnaire_participants(session_code);
create index if not exists questionnaire_answers_session_idx on public.questionnaire_answers(session_code);
create index if not exists questionnaire2_participants_session_idx on public.questionnaire2_participants(session_code);
create index if not exists questionnaire2_answers_session_idx on public.questionnaire2_answers(session_code);
