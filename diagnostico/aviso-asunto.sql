-- Asunto propio para los pedidos que llegan desde /diagnostico.
-- Correr UNA vez en Supabase → SQL Editor. Solo reemplaza la función del aviso;
-- no toca datos ni el trigger.

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
    when new.source = 'diagnostico' then 'Pidió diagnóstico con Vero'
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
