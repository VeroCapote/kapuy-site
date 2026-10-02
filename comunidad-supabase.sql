-- ════════════════════════════════════════════════════════════
-- Kapüy por la comunidad · postulaciones desde /comunidad
-- Correr UNA vez en Supabase → SQL Editor (proyecto kapuy).
-- Depende de aviso-correo-supabase.sql (pg_net, esc_html y los
-- secrets de Vault resend_api_key / aviso_destino / aviso_remitente).
-- La web solo puede INSERTAR; nadie puede leer desde afuera.
-- ════════════════════════════════════════════════════════════

create table if not exists public.comunidad_postulaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  organizacion text not null check (char_length(organizacion) between 1 and 200),
  link text check (char_length(link) <= 300),
  ubicacion text not null check (char_length(ubicacion) between 1 and 120),
  causa text not null check (char_length(causa) between 1 and 1500),
  objetivo text not null check (objetivo in ('adopciones','donaciones','voluntarios','otro')),
  equipo text not null check (char_length(equipo) between 1 and 1000),
  contacto_nombre text not null check (char_length(contacto_nombre) between 1 and 150),
  email text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' and char_length(email) <= 254),
  whatsapp text check (char_length(whatsapp) <= 40),
  lang text check (lang in ('es','en'))
);
alter table public.comunidad_postulaciones enable row level security;
revoke all on public.comunidad_postulaciones from anon, authenticated;
grant insert on public.comunidad_postulaciones to anon;
drop policy if exists "web inserta postulaciones" on public.comunidad_postulaciones;
create policy "web inserta postulaciones" on public.comunidad_postulaciones
  for insert to anon with check (true);

-- Aviso por correo de cada postulación (mismo circuito que hello_leads)
create or replace function public.notify_comunidad_postulacion() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  k text; dest text; remitente text; subj text; html text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'resend_api_key';
  if k is null then return new; end if;
  select coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'aviso_destino'), 'vero@kapuymarketing.com') into dest;
  select coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'aviso_remitente'), 'Web Kapüy <onboarding@resend.dev>') into remitente;
  subj := 'Postulación nueva · Kapüy por la comunidad · ' || coalesce(new.organizacion,'');
  html := '<div style="font-family:Arial,sans-serif;font-size:15px;color:#20211F">'
    || '<p><b>' || public.esc_html(subj) || '</b></p>'
    || '<p><b>Asociación:</b> ' || public.esc_html(new.organizacion) || '</p>'
    || case when coalesce(new.link,'') <> '' then '<p><b>Instagram o web:</b> ' || public.esc_html(new.link) || '</p>' else '' end
    || '<p><b>Dónde están:</b> ' || public.esc_html(new.ubicacion) || '</p>'
    || '<p><b>Qué hacen:</b><br>' || replace(public.esc_html(new.causa), E'\n', '<br>') || '</p>'
    || '<p><b>Qué quieren lograr:</b> ' || public.esc_html(new.objetivo) || '</p>'
    || '<p><b>Quién va a ejecutar:</b><br>' || replace(public.esc_html(new.equipo), E'\n', '<br>') || '</p>'
    || '<p><b>Contacto:</b> ' || public.esc_html(new.contacto_nombre) || ' · ' || public.esc_html(new.email)
    || case when coalesce(new.whatsapp,'') <> '' then ' · WhatsApp ' || public.esc_html(new.whatsapp) else '' end || '</p>'
    || '<p style="color:#666;font-size:13px">Idioma: ' || public.esc_html(coalesce(new.lang,'?'))
    || ' · ' || to_char(new.created_at at time zone 'America/Caracas', 'DD/MM/YYYY HH24:MI') || ' (Caracas)</p>'
    || '<p style="color:#666;font-size:13px">Responde a este correo y le contestas directo a la asociación.</p></div>';
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || k, 'Content-Type', 'application/json'),
    body := jsonb_strip_nulls(jsonb_build_object(
      'from', remitente, 'to', jsonb_build_array(dest),
      'reply_to', nullif(new.email,''), 'subject', subj, 'html', html))
  );
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.notify_comunidad_postulacion() from public, anon, authenticated;
drop trigger if exists comunidad_postulaciones_aviso on public.comunidad_postulaciones;
create trigger comunidad_postulaciones_aviso after insert on public.comunidad_postulaciones
for each row execute function public.notify_comunidad_postulacion();
