# Kapüy — Sitio web

Repositorio con dos sitios, cada uno desplegado en su propio proyecto de Vercel
(ambos desde la rama `master`):

## 1. Web real — Kapüy (página "próximamente")

- **Carpeta:** raíz del repositorio
- **Archivos:** `index.html`, `proximamente.html`, `vercel.json`
- **Proyecto Vercel:** `kapuy-deploy`
- **Dominio:** https://kapuymarketing.com
- **Contacto:** hey@kapuymarketing.com

## 2. Tarea del reto (Claude Code para marketeros)

- **Carpeta:** `sitio-completo/`
- **Proyecto Vercel:** `kapuy-tarea`
- **Dominio:** https://kapuy-tarea.vercel.app

> En Vercel, cada proyecto usa un **Root Directory** distinto: `kapuy-deploy`
> sirve la raíz y `kapuy-tarea` sirve la carpeta `sitio-completo/`. Por eso los
> dos deploys conviven en el mismo repositorio sin pisarse.

## Dashboard de embudo (`/dashboard`)

Vive dentro de `sitio-completo/`, protegido con password compartida.

- `dashboard/` — la UI (renderizador tonto: no calcula nada, solo pinta el contrato)
- `api/dashboard.js` — capa de proyección: un adaptador por fuente
- `api/dashboard-login.js` + `lib/auth.js` + `middleware.js` — el gate

**Regla del contrato:** cada adaptador atrapa sus errores y siempre devuelve.
Una fuente caída degrada su propia tile a `null` y la UI pinta "—". Nunca un 0
falso, y nunca un 500 en el endpoint completo. Un 0 solo aparece cuando la
fuente respondió y el valor es realmente cero.

### Variables de entorno (Vercel → proyecto `kapuy-tarea` → Settings → Environment Variables)

| Variable | Requerida | Qué pasa si falta |
|---|---|---|
| `DASHBOARD_PASSWORD` | **Sí** | El gate falla cerrado: `/dashboard` responde 503. Nunca abre "por conveniencia". |
| `KIT_API_KEY` | No | Las 3 métricas de email quedan `pending` → "—" |
| `VERCEL_ANALYTICS_TOKEN` | No | Visitantes queda `pending` → "—" |
| `VERCEL_ANALYTICS_PROJECT_ID` | No | Idem (usar el `prj_…` de `kapuy-tarea`) |
| `VERCEL_ANALYTICS_TEAM_ID` | No | Idem |
| `VERCEL_ANALYTICS_CUSTOM_EVENTS` | No | Poner en `1` **solo** con plan Pro. En Hobby los custom events no se recolectan y la API devolvería 0—un cero falso. Por eso el clic al CTA queda `pending` a propósito. |

No hay service-role key en ninguna parte: los agregados salen de la función
`kapuy_dashboard_leads` (SECURITY DEFINER) usando la publishable key.

### Verificar antes de pushear

```bash
vercel build --prod   # compila middleware + functions; no confiar en el dev server
```
