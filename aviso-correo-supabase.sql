-- Aviso por correo del formulario + latido anti-pausa.
-- Correr UNA vez en Supabase → SQL Editor (proyecto kapuy).
-- No borra ni modifica datos. Se puede correr de nuevo sin romper nada.

create extension if not exists pg_net;

-- Latido: lo llama GitHub Actions (.github/workflows/supabase-latido.yml)
-- cada 3 días para que el plan free no pause el proyecto.
create or replace function public.ping() returns timestamptz
language sql security definer set search_path = '' as $$ select now() $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon;

create or replace function public.esc_html(t text) returns text
language sql immutable set search_path = '' as $$
  select replace(replace(replace(coalesce(t,''),'&','&amp;'),'<','&lt;'),'>','&gt;')
$$;

-- Aviso: cada fila nueva en hello_leads manda un correo vía Resend.
-- La API key vive en Vault como 'resend_api_key'; el destino en 'aviso_destino'.
-- Si falta la key, no hace nada: el formulario nunca se rompe por el aviso.
create or replace function public.notify_hello_lead() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  k text; dest text; remitente text; subj text; html text;
begin
  select decrypted_secret into k from vault.decrypted_secrets where name = 'resend_api_key';
  if k is null then return new; end if;
  select coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'aviso_destino'), 'vero@kapuymarketing.com') into dest;
  select coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'aviso_remitente'), 'Web Kapüy <onboarding@resend.dev>') into remitente;

  subj := case
    when coalesce(new.message,'') <> '' then 'Mensaje nuevo en la web'
    when coalesce(new.wants_call,false) then 'Alguien quiere una llamada'
    else 'Registro nuevo en la web' end
    || ' · ' || coalesce(new.email,'sin correo');

  html := '<div style="font-family:Arial,sans-serif;font-size:15px;color:#20211F">'
    || '<p><b>' || public.esc_html(subj) || '</b></p>'
    || '<p><b>Correo:</b> ' || public.esc_html(new.email) || '</p>'
    || case when coalesce(new.message,'') <> '' then '<p><b>Mensaje:</b><br>' || replace(public.esc_html(new.message), E'\n', '<br>') || '</p>' else '' end
    || '<p><b>Quiere llamada:</b> ' || case when coalesce(new.wants_call,false) then 'Sí' else 'No' end
    || ' · <b>Quiere novedades:</b> ' || case when coalesce(new.wants_updates,false) then 'Sí' else 'No' end || '</p>'
    || case when coalesce(new.business_type,'') <> '' then '<p><b>Tipo de negocio:</b> ' || public.esc_html(new.business_type) || '</p>' else '' end
    || '<p style="color:#666;font-size:13px">Desde: ' || public.esc_html(coalesce(new.source,'?'))
    || ' · Idioma: ' || public.esc_html(coalesce(new.lang,'?'))
    || ' · ' || to_char(new.created_at at time zone 'America/Caracas', 'DD/MM/YYYY HH24:MI') || ' (Caracas)</p>'
    || '<p style="color:#666;font-size:13px">Responde a este correo y le contestas directo a la persona.</p></div>';

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || k, 'Content-Type', 'application/json'),
    body := jsonb_strip_nulls(jsonb_build_object(
      'from', remitente,
      'to', jsonb_build_array(dest),
      'reply_to', nullif(new.email,''),
      'subject', subj,
      'html', html))
  );
  return new;
exception when others then
  return new;
end $$;
revoke all on function public.notify_hello_lead() from public, anon, authenticated;

drop trigger if exists hello_leads_aviso on public.hello_leads;
create trigger hello_leads_aviso after insert on public.hello_leads
for each row execute function public.notify_hello_lead();

-- PASO 2, aparte, cuando tengas la API key de Resend (no la pegues en ningún chat):
-- select vault.create_secret('re_TU_CLAVE_AQUI', 'resend_api_key');
--
-- Opcional, cuando el dominio esté verificado en Resend:
-- select vault.create_secret('hey@kapuymarketing.com', 'aviso_destino');
-- select vault.create_secret('Web Kapüy <web@kapuymarketing.com>', 'aviso_remitente');
