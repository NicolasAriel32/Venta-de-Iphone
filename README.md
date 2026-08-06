# MOSTRADOR · instancia IPHONEX10

Tienda online liviana para comercios de tecnología. Catálogo en USD con cotización única, checkout por WhatsApp, sin pasarela de pago.

Documentación del proyecto: [`CLAUDE.md`](./CLAUDE.md) (fuente de verdad) y [`SPEC.md`](./SPEC.md) (flujos y wireframes).

---

## Arrancar en local

Requiere **Node 22 o superior**.

```bash
npm install
npm run dev
```

Abre en `http://localhost:3000`.

### Probarlo en el teléfono

La regla del proyecto es que nada se da por terminado sin verlo en un celular real (CLAUDE.md §5). Para abrirlo desde el teléfono estando en la misma red wifi:

```bash
npm run dev -- -H 0.0.0.0
```

Después, en el teléfono, entrá a `http://<IP-de-tu-PC>:3000`. La IP la sacás con `ipconfig` en Windows (buscá "Dirección IPv4").

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit`, sin generar archivos |

---

## Cambiar la marca

Todo vive en [`brand.config.ts`](./brand.config.ts): nombre, prefijo de pedidos, WhatsApp, color de acento, redes y textos de confianza. No hay que tocar ningún componente.

Los íconos de la PWA están en `public/icons/`. Se regeneran con cualquier editor manteniendo los tamaños: 192, 512, 512 maskable y 180 (apple-touch).

---

## Deploy en Vercel

1. Subir el repo a GitHub.
2. En Vercel: *Add New… → Project* y elegir el repo. Detecta Next.js solo; no hace falta `vercel.json`.
3. Cargar las tres variables de entorno en *Settings → Environment Variables*. Sin las dos primeras el build sale sin catálogo y sin precios:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   AGENT_API_SECRET
   ```
4. En *Settings → Functions*, fijar la región en **`gru1` (São Paulo)**. La base está en `sa-east-1`: con la región por defecto de EE. UU., cada render con ISR y cada `/api/*` se va a Virginia y vuelve.
5. Una vez asignada la URL, actualizar `brand.url` en `brand.config.ts` — de ahí salen las OG images y el `metadataBase`.

> ⚠️ El plan Hobby **no habilita uso comercial**, y su definición incluye cobrar por hacer o por hostear el sitio. Como pieza de portfolio está bien; el día que esta plantilla se instancie para un comercio que vende, ese deploy tiene que pasar a Vercel Pro o a un host cuyo free tier sí lo permita (Netlify, Cloudflare Workers). Es un cambio de plan, no de código: nada del repo depende del proveedor. Ver CLAUDE.md §2 y decisión 69.

---

## Estructura

```
brand.config.ts        identidad de la instancia — el único archivo a editar por marca
netlify.toml           config del deploy anterior — Vercel la ignora (decisión 69)
src/
  app/
    (shop)/            tienda pública: home, productos, detalle, carrito
    admin/             panel (F5)
    api/orders/        POST de pedidos (F4)
    globals.css        tokens de diseño y utilidades propias
    layout.tsx         fuentes, metadata, PWA
  components/
    ui/                primitivas e íconos SVG inline
    shop/              header, nav, footer, botón de WhatsApp
    admin/             (F5)
  lib/
    categories.ts      ⚠️ temporal — F2 lo reemplaza por la consulta a Supabase
    supabase/          (F2)
  store/               carrito Zustand (F4)
supabase/migrations/   (F2)
public/icons/          íconos de la PWA
```

---

## Estado

**F1 — Fundaciones.** El chasis está: layout, tokens, navegación, PWA y configuración de deploy. Todavía no hay catálogo: las rutas de productos, carrito y admin muestran un estado de "se construye en la fase N" a propósito.

Lo que sigue es F2 (base de datos y catálogo real). Ver CLAUDE.md §8.
