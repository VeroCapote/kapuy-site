-- Diagnóstico de Fugas del Embudo — almacenamiento (insert-only)
-- Pegar y ejecutar TODO esto en Supabase → SQL Editor → New query → Run.
-- Seguro para repos públicos: sin políticas de lectura, la anon key solo puede
-- INSERTAR; nadie puede leer los datos con esa key.

-- 1) Una fila por diagnóstico completado (dato de research, anónimo).
create table if not exists diagnostico_submissions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  session_id  uuid,
  responses   jsonb not null,          -- respuestas crudas
  computed    jsonb not null,          -- grade, healthPct, primaryLeak, etc.
  referrer    text,
  user_agent  text
);

-- 2) Una fila por opt-in de correo (el lead).
--    submission_id es referencia suave (sin FK dura) para no perder un lead
--    si la fila de submission fallara al insertarse.
create table if not exists diagnostico_contacts (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  submission_id       uuid,
  email               text not null,
  primary_leak        text,
  grade               text,
  health_pct          int,
  opt_agenda          boolean default false,   -- quiere agendar diagnóstico
  opt_notify          boolean default false,   -- avisar cuando lance la herramienta
  opt_list            boolean default false,   -- sumarse a la lista
  consent_to_outreach boolean not null default true
);

-- 3) RLS: activar y permitir SOLO inserción a anon.
alter table diagnostico_submissions enable row level security;
alter table diagnostico_contacts    enable row level security;

drop policy if exists diag_submissions_anon_insert on diagnostico_submissions;
drop policy if exists diag_contacts_anon_insert    on diagnostico_contacts;

create policy diag_submissions_anon_insert on diagnostico_submissions
  for insert to anon with check (true);
create policy diag_contacts_anon_insert on diagnostico_contacts
  for insert to anon with check (true);

grant insert on diagnostico_submissions to anon;
grant insert on diagnostico_contacts    to anon;

-- 4) Índices para tus cross-tabs editoriales (fuga principal × grade).
create index if not exists idx_diag_sub_leak
  on diagnostico_submissions ((computed->>'primaryLeak'), (computed->>'grade'));
create index if not exists idx_diag_contacts_leak
  on diagnostico_contacts (primary_leak, grade);
