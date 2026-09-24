-- Home v2: el bloque "¿Todavía no quieres agendar?" guarda mensaje y/o
-- suscripción en la misma tabla que /hello (source = 'home').
-- Correr una vez en Supabase → SQL Editor (proyecto kapuy).
alter table public.hello_leads add column if not exists message text;
alter table public.hello_leads add column if not exists wants_updates boolean not null default false;
