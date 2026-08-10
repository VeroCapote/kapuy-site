-- /hello — captura de leads del newsletter de Navacare (insert-only)
-- Pegar y ejecutar TODO esto en Supabase → SQL Editor → New query → Run.
-- Mismo patrón que herramientas/diagnostico-embudo/supabase-setup.sql:
-- sin políticas de lectura, la publishable key solo puede INSERTAR. Nadie
-- puede leer estos correos con la key que va en el HTML público.

create table if not exists hello_leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  email         text not null,
  business_type text,                                  -- texto libre: home care, law, etc.
  wants_call    boolean not null default false,        -- marcó la casilla de los 20 min
  source        text not null default 'navacare-newsletter',
  lang          text,                                  -- en | es, con qué idioma convirtió
  referrer      text,
  user_agent    text
);

-- RLS: activar y permitir SOLO inserción a anon.
alter table hello_leads enable row level security;

drop policy if exists hello_leads_anon_insert on hello_leads;

create policy hello_leads_anon_insert on hello_leads
  for insert to anon with check (true);

grant insert on hello_leads to anon;

-- Los dos cortes que vas a querer mirar: quién pidió llamada y de qué rubro.
create index if not exists idx_hello_leads_call on hello_leads (wants_call, created_at desc);
create index if not exists idx_hello_leads_src  on hello_leads (source, created_at desc);
