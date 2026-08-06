# BRIEF — Rediseño visual IPHONEX10 (solo capa de presentación)

## Contexto

Este repo es el sitio de IPHONEX10 (Next.js 15 + Supabase, deploy en Vercel), ya funcionando
en producción. El backend, el schema, las rutas de API, el carrito y la lógica de precios
**funcionan y no se tocan**.

Lo único que cambia es la capa visual. En `design/iphonex10-rediseno.html` tenés una demo
estática con la dirección de diseño aprobada. Es la **referencia de verdad** para tokens,
tipografía, layout, motion y copy.

---

## FASE 0 — Reconocimiento (NO escribas código todavía)

Antes de tocar nada, leé el repo y devolveme un informe corto con:

1. Dónde vive la cotización del dólar: archivo, si es route handler, server action o fetch
   externo, cada cuánto revalida, y la forma exacta del objeto que devuelve.
2. Cómo se leen los productos de Supabase: query, tipos TypeScript, y qué campos existen
   (marca, nombre, slug, precio USD, precio ARS, precio transferencia, stock, categoría, imagen).
3. Qué componentes renderizan hoy el home: hero, grilla de categorías, destacados, footer.
4. Si hay design tokens, `tailwind.config`, CSS variables o un sistema de theming existente.
5. Qué se rompería si cambio esos componentes (imports, tests, otras páginas que los reusan).

Cuando termines, **parás y me mostrás el plan de archivos a crear/modificar/borrar.**
No avances a la Fase 1 sin mi OK.

---

## Restricciones duras

- NO modifiques nada dentro de `app/api/`, ni queries a Supabase, ni el schema.
- NO cambies la lógica de cálculo de precios. Si el ARS ya viene calculado del backend,
  usalo tal cual; no lo recalcules en el cliente.
- NO cambies rutas, slugs, ni la estructura de URLs. El SEO actual se mantiene.
- NO agregues dependencias pesadas sin preguntarme. Framer Motion sí; GSAP/Three.js no.
- Mantené los meta tags, OG tags y el JSON-LD que ya existan.
- El carrito y el flujo de WhatsApp siguen funcionando exactamente igual.

---

## FASE 1 — Design tokens

Creá un único origen de verdad para el sistema visual (CSS variables en `globals.css`
+ extensión del `tailwind.config`), con estos valores exactos del demo:

```
--ink      #070A0E    fondo base
--ink2     #0B1017
--panel    #111823
--panel2   #0E141D    superficie de cards
--line     #1C2634    bordes
--line2    #2A3644    bordes hover
--bone     #E6E2D7    texto principal (no blanco puro)
--dim      #828E9C    texto secundario
--amber    #F2B23C    ACENTO ÚNICO
--amber-hi #FFD98A
--ok       #5FD08A    solo para el punto de stock
```

Tipografía vía `next/font/google`, con `display: swap` y subset latin:

- **Display:** Bricolage Grotesque (variable, ejes opsz/wdth/wght). Titulares en 800 con
  `font-stretch: 80%`. El subtítulo del H1 va en 200 y width 100%. El contraste de peso
  extremo es parte del diseño: no lo suavices a 400/600.
- **Body:** IBM Plex Sans 300/400.
- **Mono:** IBM Plex Mono 400/500/600, con `font-variant-numeric: tabular-nums` en TODO
  lo que sea número. Es lo que le da la voz de "pizarra".

Nada de Inter, Roboto ni fuentes de sistema en ningún lado.

---

## FASE 2 — Componentes

Portá el demo a componentes React con Server Components por defecto y `"use client"`
solo donde hay interacción. Estructura sugerida (ajustala a las convenciones del repo):

- `components/board/PriceBoard.tsx` — la pizarra split-flap. **Es el elemento firma.**
- `components/board/FlipCells.tsx` — celdas de caracteres con animación de flip.
- `components/home/Hero.tsx`
- `components/home/BrandMarquee.tsx` — CSS puro, pausa en hover.
- `components/home/BentoGrid.tsx` — la celda de cotización ocupa 2×2 con sparkline.
- `components/home/ProductCard.tsx` — tilt 3D + gradiente specular que sigue el mouse.
- `components/home/Steps.tsx` — hairline que se dibuja al entrar en viewport.
- `components/home/Promises.tsx`
- `components/ui/Reveal.tsx` — wrapper de scroll reveal con `stagger` por índice.

### La pizarra: cómo se conecta a los datos reales

Esto es lo importante y es donde quiero que pongas cuidado:

1. El precio en pesos y el estado de stock salen de **la API y la DB que ya existen**.
   Nada de datos hardcodeados ni del simulador del demo. Borrá el array `items` del HTML.
2. La cotización se consume del endpoint de dólar que ya tengo, con la revalidación que ya
   esté configurada (si es 60 s, se mantiene 60 s). Del lado cliente, poll o SWR sobre ese
   mismo endpoint: **no llames a una API externa de dólar directamente desde el navegador.**
3. El flip de los dígitos se dispara **solo cuando el valor realmente cambió** respecto del
   render anterior. Compará carácter por carácter y animá únicamente los que difieren.
   Si el blue no se movió, la pizarra queda quieta. Un flip decorativo cada X segundos
   mata todo el concepto.
4. Fila por producto, columnas: modelo · USD · contado $ · estado. En < 720 px se muestran
   solo modelo y contado $.
5. Estados que faltan en el demo y sí necesito: **loading** (celdas con guiones bajos
   parpadeando, sin layout shift) y **error de cotización** (la pizarra muestra el último
   valor conocido con la leyenda "última cotización disponible", nunca un precio en blanco
   ni un cero).

---

## FASE 3 — Motion

- Framer Motion para reveals y stagger. Un `useInView` con `once: true` por sección.
- Page load del hero: stagger de ~90 ms entre eyebrow, H1, lede, CTAs y microstats.
- El flip de las celdas: CSS keyframes con `rotateX`, 300 ms, delay de 22 ms por índice.
  No lo hagas con Framer Motion, es más liviano en CSS.
- Marquee de marcas y scanlines de la pizarra: CSS puro.
- Todo respeta `prefers-reduced-motion: reduce` → sin flip (cambio directo de texto),
  sin marquee, sin tilt, reveals en opacidad final.
- El tilt 3D solo si `(hover: hover)` y puntero fino. En touch no se activa.

---

## FASE 4 — Copy

Usá el copy del demo, no el actual del sitio. En particular:

- H1: "El precio que leés / es el que pagás."
- Los tres pasos numerados (elegís → congelás el precio 24 h → pagás y coordinás).
  Si la promesa de congelar el precio 24 h no es real operativamente, avisame antes de
  publicarla y la reemplazamos.
- Registro rioplatense, voz activa, sentence case. Nada de "Descubrí nuestra amplia gama".

---

## Criterios de aceptación

Antes de decirme que terminaste, verificá y reportá:

- [ ] `npm run build` pasa sin errores ni warnings nuevos de TypeScript.
- [ ] `git diff --stat` no muestra cambios en `app/api/`, ni en queries de Supabase.
- [ ] La pizarra muestra los precios reales de la DB, no mocks.
- [ ] Con el dólar quieto, la pizarra no anima. Al cambiar el valor, flipean solo los
      dígitos afectados.
- [ ] Responsive verificado a 375, 768, 1024 y 1440 px sin overflow horizontal.
- [ ] Navegación completa por teclado con foco visible en ámbar sobre todos los links,
      botones y chips de categoría.
- [ ] Contraste AA: texto `--dim` sobre `--panel2` medido; si no llega a 4.5:1 en texto
      chico, aclaralo y decime el valor nuevo.
- [ ] Lighthouse mobile ≥ 90 en Performance y ≥ 95 en Accesibilidad.
- [ ] El carrito y el link de WhatsApp siguen funcionando.

## Flujo de trabajo

Trabajá en la rama `feat/rediseno-pizarra`. Un commit por fase, mensajes en español,
sin mezclar fases. Al final del trabajo mostrame el diff resumido y un deploy preview
antes de mergear a main.
