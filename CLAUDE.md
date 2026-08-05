# CLAUDE.md — Proyecto MOSTRADOR

> Plantilla de tienda online liviana para comercios de tecnología.
> Producto de **Gestión Inteligente** (Nicolás). Instancia demo: **IPHONEX10**.
> Versión del documento: `v1.7.0` · Última actualización: 2026-08-04

---

## 0. Cómo usar este archivo

Este documento es la **fuente de verdad** del proyecto. Antes de escribir una sola línea de código, leerlo entero.

**Reglas para Claude en cada sesión:**

1. Leer §1 (contexto), §4 (arquitectura), §8 (estado de fases) antes de proponer nada.
2. Trabajar **una sola fase por vez**. No adelantar trabajo de fases posteriores "porque ya que estamos".
3. Al terminar una tarea, actualizar §8 (checkbox + fecha) y §9 (decisiones) si hubo una definición nueva.
4. No agregar dependencias sin justificarlo en §9. Regla: si se puede resolver con la stdlib de Next o 20 líneas propias, no se instala nada.
5. No crear archivos fuera de la estructura de §4. Si hace falta una carpeta nueva, primero se documenta acá.
6. Si algo del plan quedó obsoleto, **corregir este archivo** en la misma respuesta. Un CLAUDE.md desactualizado es peor que no tenerlo.
7. Ante ambigüedad de alcance: preguntar. Nunca inventar features.

**Convenciones:**

| Ítem | Regla |
|---|---|
| Código, variables, tablas, commits | Inglés |
| UI, copy, contenido, docs | Español rioplatense (voseo) |
| Commits | Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`) |
| Ramas | `main` (deploy) + `feat/nombre-corto` |
| Formato | Prettier + ESLint config de Next, sin discusión |

---

## 1. Contexto y objetivo

### Qué es

Una tienda online **liviana, sin costo de infraestructura y sin pasarela de pago**, pensada para comercios chicos de tecnología que hoy venden por Instagram, WhatsApp y boca a boca.

### Para quién

Revendedores de celulares, notebooks, consolas y accesorios. Facturación chica, sin equipo de sistemas, sin presupuesto para desarrollo a medida ni para SaaS mensual en dólares.

### Dolores reales del rubro (esto define el producto)

| Dolor | Cómo lo resuelve MOSTRADOR |
|---|---|
| Contestar 40 veces por día "¿precio del 15 Pro?" | Catálogo público con precio visible y link directo |
| El precio cambia con el dólar todos los días | El producto se carga **una sola vez en USD**. El precio en pesos se calcula solo con la cotización del blue, que se trae automáticamente. El dueño no toca nada nunca más — y si quiere, puede fijarla a mano |
| "¿Tenés stock?" | Estado de stock visible: Disponible / A pedido / Sin stock |
| Precio contado vs. tarjeta | Se muestran ambos: precio de lista y precio con descuento por transferencia |
| "¿Aceptás tarjeta? ¿En cuántas cuotas?" | Franja de medios de pago siempre visible: crédito en cuotas y hasta 2 tarjetas |
| "¿Lo tenés en negro? ¿De 256?" | Selector de color y de capacidad en la ficha, con precio y stock por variante |
| El cliente se pierde entre 200 historias de Instagram | Catálogo permanente, buscable y filtrable |
| No queda registro de los pedidos | Cada pedido se guarda en base antes de abrir WhatsApp |
| No sabe usar un panel complicado | Panel admin de 4 pantallas, sin curva de aprendizaje |

### Objetivo de este MVP

Pieza de portfolio **funcional y demostrable**. No es un producto en producción con clientes reales todavía. Prioridad: que en una demo de 5 minutos se entienda el valor y se vea sólido.

### 🔴 Restricción dura: la demo se hace desde un celular

**Condición innegociable del proyecto.** La demostración se da mostrando la pantalla de un teléfono, en la mano, posiblemente parado y con datos móviles. Todo lo demás se subordina a esto.

Consecuencias concretas:

| Área | Qué implica |
|---|---|
| **Viewport de referencia** | 390 × 844 px. Se diseña ahí primero. El desktop es una adaptación posterior, no al revés |
| **Panel admin** | También tiene que funcionar en celular. El momento más fuerte de la demo es cambiar la cotización y ver el catálogo actualizarse — si eso requiere una notebook, se pierde |
| **Peso de página** | Objetivo: home usable en menos de 3 s con 4G real, no con wifi. Presupuesto: < 500 KB en la carga inicial |
| **Zona del pulgar** | Acciones primarias (agregar al carrito, ir a WhatsApp, buscar) en el tercio inferior o accesibles con una mano |
| **Áreas táctiles** | Mínimo 44 × 44 px. Nada de links de 12 px pegados entre sí |
| **Nada dependiente de hover** | Si una información solo aparece al pasar el mouse, en celular no existe |
| **Sin scroll horizontal** | Nunca, en ninguna pantalla, con ningún contenido |
| **Checkout** | En celular, `wa.me` abre la app de WhatsApp instalada. Esto juega a favor: el flujo se ve más real en el teléfono que en la compu |
| **PWA** | `manifest.json` + íconos, para poder agregarlo a la pantalla de inicio y abrirlo a pantalla completa sin barra del navegador. Impacto alto, costo bajo |
| **QR de acceso** | Generar un QR de la URL para que el prospecto lo escanee y lo tenga en su propio teléfono durante la reunión |

**Regla de verificación:** ninguna fase se marca terminada probándola solo en el simulador del navegador. Se abre en un teléfono real, con datos móviles, antes de tildar el checkbox.

### Marca de la demo

La instancia demo usa la marca **IPHONEX10**.

- No hay ningún cliente real involucrado. Sitios como xtech-arg.netlify.app o Frávega se usaron **solo como referencia de mercado** para entender qué espera un comprador de este rubro: qué categorías, qué información de producto, qué jerarquía, cómo se eligen color y capacidad. Nada de su identidad visual, copy ni catálogo se replica.
- El nombre es una **variable**, no una constante. Vive únicamente en `brand.config.ts` (`brand.name`, `brand.orderPrefix = "IPX"`). Cambiar la marca completa (nombre, logo, color, WhatsApp, redes) tiene que costar editar un archivo y nada más. Si en algún momento aparece "IPHONEX10" hardcodeado en un componente, es un bug.
- Tratamiento tipográfico: se escribe en versalitas / mayúsculas (`IPHONEX10`) y el logotipo a 32 px se resuelve con el lockup de texto, sin ícono ilustrado. A ese tamaño un logo con dibujo no se lee.
- ⚠️ **Nota de riesgo (no bloquea el MVP):** el nombre contiene una marca registrada de Apple. Para una pieza de portfolio es un riesgo bajo, pero si algún día la instancia se publica como tienda propia con dominio y venta real, conviene renombrarla. Por diseño eso cuesta 30 segundos y no condiciona ninguna decisión de arquitectura.

### Fuera de alcance (explícito)

Pasarela de pago, cuentas de usuario final, multi-idioma, multi-moneda real, facturación AFIP, gestión de envíos, reviews, wishlist, multi-tenant, app móvil.
Todo esto es **post-MVP** (§10). Si aparece en una respuesta antes de la fase 7, está mal.

---

## 2. Stack y por qué

| Capa | Elección | Costo | Motivo |
|---|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | $0 | Ya lo manejo. SSG/ISR = rápido y barato |
| Estilos | Tailwind CSS v4 | $0 | Velocidad, tokens en CSS vars |
| Base de datos | Supabase (Postgres, free tier) | $0 | Ya lo manejo. Auth + Storage + DB en uno |
| Imágenes | Supabase Storage | $0 | 1 GB alcanza para ~300 productos optimizados |
| Hosting | **Netlify** free | $0 | Ver nota ⚠️ |
| Estado carrito | Zustand + localStorage | $0 | Sin backend, sin sesión |
| Checkout | Link `wa.me` con mensaje prellenado | $0 | Cero fricción, cero PCI, es como ya venden |
| Cotización | dolarapi.com (blue, venta) | $0 | Pública, sin API key. Devuelve el último valor disponible, así que un lunes da el cierre del último día hábil |
| Automatización (F7) | n8n Cloud (ya contratado) | $0 marginal | Notificaciones y alertas de stock |

### ⚠️ Notas de infraestructura que hay que tener presentes

- **Vercel Hobby no permite uso comercial.** Para la demo del portfolio da igual, pero el día que se le entrega a un cliente que vende, o se pasa a Netlify (su free tier sí permite uso comercial) o se paga Vercel Pro. Se elige **Netlify desde el día uno** para no migrar después.
- **Supabase free pausa el proyecto tras ~7 días de inactividad.** Antes de cualquier demo hay que verificar que esté despierto. Mitigación de F6: un workflow de n8n que hace un `select` trivial cada 48 h.
- Límites del free tier a respetar: 500 MB de DB, 1 GB de Storage, 5 GB de egreso. Con imágenes en WebP a ≤150 KB no se llega ni cerca.

---

## 3. Dirección de diseño

El referente (XTECH) es funcional pero genérico: azul corporativo, carrusel, grilla de cards. La versión propia tiene que verse **más nítida y más rápida**, no más adornada.

**Tokens base** (se sobreescriben por marca en `brand.config.ts`):

```
--ink:        #0B0D10   fondo profundo
--surface:    #14181D   cards
--line:       #262D36   bordes hairline
--paper:      #F5F7FA   texto principal
--muted:      #8A94A3   secundario
--accent:     #3B82F6   acción (configurable por cliente)
--ok:         #22C55E   stock disponible
--warn:       #F59E0B   a pedido
```

- **Tipografía:** display condensada de peso alto para precios y títulos de producto; body neutral y legible. El precio es el elemento tipográfico protagonista — en este rubro la gente entra a ver el número.
- **Elemento firma:** la **ficha de precio**. Precio grande **en pesos**, debajo el USD de referencia en tipografía chica, y luego el precio de transferencia con su descuento. Debajo, una línea sobria de medios de pago (crédito en cuotas · hasta 2 tarjetas). Es el bloque que resuelve el dolor principal del rubro y tiene que ser lo más lindo de la página.
- **Selectores de variante:** en el detalle, debajo de la galería. Color como fila de círculos de 44 px con el color real y el nombre debajo del seleccionado; capacidad como fila de píldoras (`128 GB` · `256 GB` · `512 GB`). Ambos cambian la ficha de precio y la galería **sin recargar la página**. Las opciones sin stock se muestran atenuadas y tachadas, no se ocultan — que el cliente vea que existe es parte de la venta.
- **Mobile-first sin excusas.** El 85% del tráfico va a venir de un link de Instagram abierto en un celular.
- Piso de calidad no negociable: responsive real, foco de teclado visible, `prefers-reduced-motion` respetado, imágenes con `alt`.

---

## 4. Arquitectura

```
mostrador/
├─ CLAUDE.md                    ← este archivo
├─ brand.config.ts              ← nombre, logo, colores, WhatsApp, redes
├─ src/
│  ├─ app/
│  │  ├─ (shop)/
│  │  │  ├─ page.tsx                    home
│  │  │  ├─ productos/page.tsx          listado + filtros
│  │  │  ├─ productos/[slug]/page.tsx   detalle
│  │  │  └─ carrito/page.tsx            carrito + checkout
│  │  ├─ admin/
│  │  │  ├─ login/page.tsx
│  │  │  ├─ productos/                  CRUD
│  │  │  ├─ pedidos/page.tsx
│  │  │  └─ config/page.tsx             cotización, banners, datos
│  │  └─ api/
│  │     ├─ orders/route.ts             POST pedido
│  │     └─ agent/catalog/route.ts      POST consulta del asistente (Retell)
│  ├─ components/
│  │  ├─ ui/                            primitivas
│  │  ├─ shop/                          ProductCard, PriceTag, CartDrawer…
│  │  └─ admin/
│  ├─ lib/
│  │  ├─ supabase/                      client.ts, server.ts, types.ts
│  │  ├─ catalog.ts                     lecturas del catálogo (solo servidor)
│  │  ├─ images.ts                      URLs del bucket (cliente y servidor)
│  │  ├─ pricing.ts                     USD→ARS, descuentos, formato
│  │  └─ whatsapp.ts                    armado del mensaje de pedido
│  └─ store/cart.ts                     Zustand
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
└─ public/
```

### Modelo de datos (referencia)

```sql
categories        id, name, slug, sort_order, is_active
products          id, sku, name, slug, category_id, brand,
                  description, price_usd, discount_transfer_pct,
                  stock_status ('in_stock'|'on_demand'|'out_of_stock'),
                  is_featured, is_active, created_at, updated_at
product_colors    id, product_id, name, hex, sort_order, is_active
product_capacities id, product_id, capacity_gb, price_usd,
                  stock_status, sort_order, is_active
product_images    id, product_id, color_id (nullable), storage_path,
                  alt, sort_order
store_config      id (singleton), usd_rate, rate_updated_at, whatsapp_number,
                  store_name, logo_path, accent_color, socials jsonb,
                  shipping_note, warranty_note, payment_note
orders            id, code, customer_name, customer_phone, note,
                  items jsonb, total_ars, usd_rate_snapshot,
                  status ('new'|'contacted'|'closed'|'lost'), created_at
```

**Reglas duras del modelo:**

- El precio **nunca** se guarda en ARS. Se guarda en USD y se calcula en render con `store_config.usd_rate`.
- `orders.usd_rate_snapshot` congela la cotización del momento del pedido. Sin esto, un pedido de ayer se "reprecia" solo y el cliente pierde la trazabilidad.
- RLS activo en todas las tablas. Lectura pública solo de filas `is_active = true`. Escritura solo autenticado.

**Reglas de variantes** (color y capacidad son dos ejes **independientes**, no una matriz):

- **La capacidad define el precio. El color no.** Es como funciona el mercado real y evita una tabla de 9 filas por producto que después hay que cargar a mano desde un celular.
- Si un producto **no tiene** filas en `product_capacities` (un cable, un cargador, una funda), el precio y el stock salen de `products.price_usd` y `products.stock_status`. La ficha no muestra selector de capacidad.
- Si un producto **sí tiene** capacidades, `products.price_usd` se ignora para mostrar precio: el listado muestra `Desde $X` con el mínimo, y el detalle muestra el precio de la capacidad seleccionada. El mínimo se resuelve en la vista `products_public`, no denormalizado en la fila — un precio denormalizado se desincroniza el día que menos conviene.
- **El color filtra la galería.** `product_images.color_id = NULL` significa "imagen general, se muestra siempre". Al elegir un color, la galería pasa a mostrar las imágenes de ese color; si ese color no tiene imágenes propias, se cae a las generales sin romper nada.
- El stock vive en `product_capacities.stock_status` cuando hay capacidades, y en `products.stock_status` cuando no. Los colores no llevan stock propio en el MVP — es un nivel de detalle que un revendedor chico no mantiene actualizado, y un dato desactualizado es peor que no tenerlo.
- **El carrito guarda la variante, no solo el producto.** Cada ítem lleva `product_id + capacity_id + color_id`. Dos capacidades del mismo modelo son dos líneas distintas del carrito. `orders.items` guarda color y capacidad **en texto plano** (`"Negro"`, `"256 GB"`), no por ID: el pedido tiene que seguir siendo legible aunque el producto se borre.

---

## 5. Definition of Done (aplica a toda tarea)

Una tarea está terminada cuando:

- [ ] Compila sin errores ni warnings de TypeScript
- [ ] **Probado en un teléfono real, con datos móviles** — no alcanza el simulador
- [ ] Sin scroll horizontal ni desbordes en 390 px
- [ ] Toda acción principal alcanzable con una mano
- [ ] Tiene estado de carga, estado vacío y estado de error
- [ ] No rompe ninguna fase anterior
- [ ] Está commiteada con mensaje convencional
- [ ] §8 de este archivo quedó actualizado

---

## 6. Fases

### F0 — Definición · *~2 h*
Cerrar alcance y dejar la documentación base.

- Benchmark de 3 a 5 tiendas tech argentinas: qué patrones sirven, qué descartar (referencia funcional, no visual)
- Definir identidad de IPHONEX10: logotipo, color de acento, tono del copy
- Definir las 12 categorías y ~40 productos del catálogo demo
- Definir el modelo de variantes (color y capacidad) y dónde vive el selector
- Redactar este CLAUDE.md y un `SPEC.md` con los user flows

**Entregable:** CLAUDE.md + SPEC.md
**Criterio de salida:** el alcance del MVP está escrito y no se discute más hasta F7.

---

### F1 — Fundaciones · *~4 h*
Que exista un esqueleto desplegado.

- `create-next-app` con TS + Tailwind v4 + ESLint
- Estructura de carpetas de §4
- Tokens de diseño en CSS vars + `brand.config.ts`
- Layout base: header con buscador, nav de categorías, footer, botón flotante de WhatsApp
- `manifest.json` + íconos para instalación en pantalla de inicio
- Repo en GitHub + deploy automático a Netlify

**Criterio de salida:** la URL se abre en un teléfono real, se agrega a la pantalla de inicio y arranca a pantalla completa.
**Trampa a evitar:** no maquetar productos todavía. Solo el chasis.

---

### F2 — Datos · *~7 h*
Que haya catálogo real detrás.

- Migraciones de las 7 tablas de §4 + vista `products_public` con `min_price_usd`
- Políticas RLS
- Bucket `product-images` en Storage con acceso público de lectura
- `seed.sql` con 12 categorías y ~40 productos verosímiles (modelos, marcas y precios USD reales del mercado argentino), con colores y capacidades reales en los celulares y notebooks
- Tipos TS generados desde el schema
- `lib/pricing.ts` con tests manuales: USD→ARS, redondeo a mil, descuento por transferencia, precio por capacidad, `Desde $X`, formateo `$ 1.234.567`

**Criterio de salida:** un script de consola imprime el catálogo con precios en ARS calculados, y para un iPhone imprime las tres capacidades con su precio y los colores disponibles.
**Trampa a evitar:** productos de relleno tipo "Producto 1". En una demo se nota y mata la credibilidad. Tampoco inventar capacidades que Apple no vende — un `iPhone 15 de 64 GB` lo detecta cualquiera del rubro en dos segundos.

---

### F3 — Catálogo público · *~13 h*
El corazón del MVP.

- **Home:** hero con 1 banner (no carrusel de 4 — carga más rápido y convierte igual), grilla de categorías, fila de destacados, franja de confianza (garantía, envíos, medios de pago)
- **Listado:** filtro por categoría y marca, orden por precio, búsqueda por nombre/SKU, paginado. Las cards muestran `Desde $X` y los puntitos de color **como información, no como control**
- **Detalle:** galería, **selector de color y de capacidad**, ficha de precio (elemento firma), franja de medios de pago, estado de stock, specs, botón "Agregar al carrito" y "Consultar por WhatsApp"
- La variante seleccionada se refleja en la URL (`?color=negro&cap=256`) para que un link compartido por WhatsApp abra la variante correcta
- SEO: metadata dinámica, OG images, sitemap, JSON-LD de `Product` con `offers` por capacidad
- ISR con revalidación cada 60 s

**Criterio de salida:** navegación completa de home a detalle en un teléfono real, sin salto de layout y sin esperar más de 3 s con datos móviles. Cambiar de color cambia la galería y cambiar de capacidad cambia el precio, sin recarga y sin que salte el layout.
**Trampa a evitar:** filtros en una barra lateral. En celular no entra. Van en una hoja inferior desplegable.
**Segunda trampa:** poner los selectores de variante en la card del listado. Son 6 controles de 44 px en una card de 180 px de ancho — no entran, y multiplican el peso de la home. La elección de variante pasa **solo en el detalle**.

---

### F4 — Carrito y checkout por WhatsApp · *~7 h*
Donde se cierra la venta.

- Store Zustand persistido en localStorage, con la variante como parte de la clave del ítem
- Drawer de carrito + página `/carrito`. Cada línea muestra modelo, color y capacidad
- Formulario mínimo: nombre y teléfono. Nada más. Cada campo extra es una venta menos
- `POST /api/orders` → guarda el pedido con `usd_rate_snapshot` y devuelve un código legible (prefijo tomado de `brand.config.ts`, ej. `IPX-0142`)
- `lib/whatsapp.ts` arma el mensaje: código de pedido, ítems **con color y capacidad**, cantidades, subtotales, total, nombre del cliente
- Redirección a `wa.me/<numero>?text=<mensaje>`

**Criterio de salida:** un pedido de prueba queda en la tabla `orders` **y** abre WhatsApp con el mensaje completo.
**Trampa a evitar:** guardar el pedido *después* de redirigir. Se pierde. Primero se persiste, después se redirige.

---

### F5 — Panel admin · *~10 h*
Para que el cliente no dependa de mí.

- Login con Supabase Auth (email + password, un solo usuario)
- Middleware que protege `/admin`
- CRUD de productos con subida de imágenes y toggle de destacado/activo
- **Editor de variantes:** agregar/quitar colores (nombre + color picker) y capacidades (GB + precio USD + stock), y asignar cada imagen a un color desde un desplegable
- Listado de pedidos con cambio de estado
- **Config:** cotización del dólar (el campo más importante de todo el sistema), número de WhatsApp, nombre, logo, color de acento, banner, textos de garantía, envío y medios de pago
- Layout del panel en columna única, pensado para pulgar. Nada de tablas anchas: cada producto es una tarjeta apilada, y las variantes son filas apiladas dentro de la ficha del producto

**Criterio de salida:** desde el celular cambio la cotización, vuelvo a la tienda y todos los precios cambiaron. Todo el recorrido sin tocar una computadora.
**Trampa a evitar:** sobrediseñar el panel. Es una herramienta interna, tiene que ser clara y fea antes que linda y confusa. Y una tabla de 8 columnas en un celular no es ninguna de las dos.

---

### F6 — Pulido y demo · *~5 h*
Que se vea como un producto, no como un ejercicio.

- Lighthouse **móvil** ≥ 90 en Performance y ≥ 95 en Accesibilidad — la corrida de escritorio no cuenta
- Imágenes a WebP ≤ 150 KB
- Revisión de todos los estados vacíos y mensajes de error (que digan qué pasó y qué hacer, sin pedir disculpas)
- Workflow n8n de keep-alive para que Supabase no se pause
- Datos de demo finales y coherentes + script de reseteo para que la demo sea repetible
- **Guion de demo de 5 minutos**, ensayado desde el teléfono: catálogo → detalle → carrito → WhatsApp → panel → cambio de cotización → catálogo actualizado
- QR de la URL impreso o en pantalla, para que el prospecto la abra en su propio celular
- **Assets de portfolio:** ficha de caso (problema → solución → resultado), capturas en marco de teléfono y un video vertical de 60 s del flujo completo
- `README.md` de instalación + guía de uso de 1 página para el cliente

**Criterio de salida:** puedo hacer la demo entera de memoria, desde mi teléfono, con datos móviles y sin que nada falle.

---

### F7 — Post-MVP *(no arrancar hasta cerrar F6)*
Mercado Pago Checkout Pro · notificación de pedido a WhatsApp/Slack vía n8n · alerta de stock bajo · multi-tenant por subdominio · dominio propio · analytics.

---

## 7. Estimación total

**~54 h de trabajo efectivo.** Con dedicación de fin de semana y tardes: 4 a 5 semanas.
Las variantes de color y capacidad sumaron ~10 h sobre la estimación original de 44 h: +2 en F2 (dos tablas, vista y seed más denso), +3 en F3 (selectores, galería filtrada, estado en URL), +1 en F4 (variante en carrito y mensaje) y +2 en F5 (editor de variantes en celular). Vale la pena: sin capacidad ni color, un catálogo de celulares no es creíble en este rubro.

Ruta crítica: F2 → F3 → F4. Si el tiempo aprieta, F5 se reduce a **una sola pantalla**: editar la cotización desde el celular. El resto del CRUD se carga por SQL. Esa pantalla no se negocia porque es el clímax de la demo.

---

## 8. Estado de fases

| Fase | Estado | Fecha | Notas |
|---|---|---|---|
| F0 Definición | 🟢 Terminada | 2026-08-03 | CLAUDE.md v1.3.0 + SPEC.md v1.0.0. Falta: crear cuenta de Netlify (bloquea F1) |
| F1 Fundaciones | 🟡 En curso | 2026-08-03 | Código escrito: chasis, tokens, PWA, `netlify.toml`. **Falta verificar:** `npm install` + build + prueba en teléfono real. Sigue faltando la cuenta de Netlify |
| F2 Datos | 🟢 Terminada | 2026-08-04 | Proyecto `iphonex10` en sa-east-1. 7 tablas + vista + RLS + bucket. Seed: 12 categorías, 42 productos, 88 colores, 46 capacidades. Tipos y `pricing.ts` con casos verificados |
| F3 Catálogo | 🟡 En curso | 2026-08-04 | Home, listado con filtros, detalle con variantes, SEO e ISR. Precio en pesos con cotización automática del blue (`lib/exchange.ts`). Fotos reales cargadas: 9 imágenes en `public/productos/` repartidas entre los 6 iPhones, más el banner propio del hero. **Falta:** prueba en teléfono real, revisar que cada foto esté en el modelo correcto, y fotos para las otras 11 categorías |
| F4 Carrito | ⚪ Pendiente | — | |
| F5 Admin | ⚪ Pendiente | — | |
| F6 Pulido | ⚪ Pendiente | — | |
| F7 Post-MVP | ⚪ Congelado | — | |

Leyenda: ⚪ pendiente · 🟡 en curso · 🟢 terminada · 🔴 bloqueada

---

## 9. Decisiones tomadas

| # | Decisión | Motivo | Fecha |
|---|---|---|---|
| 01 | Netlify en lugar de Vercel | El free tier de Vercel no habilita uso comercial | 2026-08-03 |
| 02 | Sin pasarela de pago en el MVP | Comisiones y fricción; el cliente ya cierra por WhatsApp | 2026-08-03 |
| 03 | Precios en USD + cotización única | Es el dolor #1 del rubro en Argentina | 2026-08-03 |
| 03b | **El ARS es el precio publicado; el USD es referencia** | Es lo que el comprador paga y lo que la normativa argentina espera ver exhibido. La estabilidad se resuelve por otro lado: automatizando la cotización, no escondiendo el peso | 2026-08-04 |
| 04 | Banner único en vez de carrusel | Menos peso, mejor LCP, misma conversión | 2026-08-03 |
| 05 | Sin cuentas de usuario final | Nadie se registra para comprar un cargador | 2026-08-03 |
| 06 | Marca de la demo: IPHONEX10 | Decisión del dueño del proyecto. Los sitios vistos fueron referencia de mercado, no clientes. Riesgo de marca registrada anotado en §1, no bloquea el portfolio | 2026-08-03 |
| 07 | Toda la identidad vive en `brand.config.ts` | Es lo que convierte la demo en plantilla revendible | 2026-08-03 |
| 08 | La demo se muestra desde celular — condición dura | Define el orden de diseño y el presupuesto de peso de toda la app | 2026-08-03 |
| 09 | Panel admin también mobile-first | El momento fuerte de la demo (cambiar cotización) tiene que darse en el teléfono | 2026-08-03 |
| 10 | PWA instalable | Abrir a pantalla completa sin barra del navegador cambia por completo la percepción de "es una app" | 2026-08-03 |
| 11 | Demo como link externo en Netlify, no embebida | Un iframe rompe la PWA, el QR y la pantalla completa. La restricción dura de §1 manda | 2026-08-03 |
| 12 | Cuotas como **texto de confianza**, no como precio calculado | Se comunica "crédito en cuotas y hasta 2 tarjetas" sin calcular coeficientes. Cero mantenimiento, cero riesgo de publicar un número mal | 2026-08-03 |
| 13 | Hasta 3 imágenes por producto | ~40 × 3 × 150 KB ≈ 18 MB. Cómodo dentro del free tier y suficiente para que la galería no se vea vacía | 2026-08-03 |
| 14 | Variantes de color y capacidad, ejes independientes | La capacidad define el precio, el color define las imágenes. Evita una matriz de 9 filas por producto imposible de mantener desde un celular | 2026-08-03 |
| 15 | Los selectores viven **solo en el detalle** | 6 controles de 44 px no entran en una card de listado a 390 px, y multiplicarían el peso de la home. En el listado va `Desde $X` + puntitos de color informativos | 2026-08-03 |
| 16 | La variante seleccionada va en la URL | Un link pegado en WhatsApp tiene que abrir el color y la capacidad correctos. Es el canal principal del rubro | 2026-08-03 |
| 17 | Next.js **16**, no 15 | Es la estable que instala `create-next-app` hoy. Arrancar un proyecto nuevo en la versión anterior es deuda desde el día uno | 2026-08-03 |
| 18 | Cero librería de íconos | Son SVG inline en `components/ui/icons.tsx`. Un paquete de íconos se paga en el presupuesto de 500 KB (regla 4 de §0) | 2026-08-03 |
| 19 | Buscador desplegable, no campo fijo en el header | A 390 px un input permanente deja al logo sin lugar. Se abre a ancho completo con foco automático | 2026-08-03 |
| 20 | Las fuentes se cargan con `next/font` | Self-hosted, sin request a Google en runtime y sin salto de layout. Ambas variable fonts, sin declarar `weight` | 2026-08-03 |
| 21 | El producto pasa a llamarse **MOSTRADOR** | Decisión del dueño. Concreto, rioplatense y del rubro. `IPHONEX10` sigue siendo la instancia demo | 2026-08-04 |
| 22 | Base en **sa-east-1** (São Paulo) | Es la región más cercana a Argentina. La latencia cuenta contra el objetivo de 3 s con datos móviles | 2026-08-04 |
| 23 | Las migraciones viven en el remoto, se bajan con `supabase db pull` | Copiarlas a mano al repo genera dos fuentes de verdad que se desincronizan | 2026-08-04 |
| 24 | `min_price_usd` se resuelve en la vista, no denormalizado | Un precio denormalizado se desincroniza el día que menos conviene | 2026-08-04 |
| 25 | El stock del listado es el **mejor** estado entre las capacidades | Si una capacidad está disponible, el producto figura disponible; el detalle aclara por capacidad. Lo contrario esconde ventas | 2026-08-04 |
| 26 | El detalle **no lee `searchParams` en el servidor** | Leerlos volvería la página dinámica y mataría el ISR. La variante de la URL la lee el componente cliente al montar | 2026-08-04 |
| 27 | `imageUrl` vive en `lib/images.ts`, no en `catalog.ts` | `catalog.ts` importa `next/headers`; si un componente cliente importara de ahí, ese grafo entero se iría al bundle del navegador | 2026-08-04 |
| 28 | Fallback de imagen en vez de fotos placeholder | Un bloque con marca y nombre se lee como decisión de diseño, no como imagen rota. Cuando se suban fotos reales aparecen solas | 2026-08-04 |
| 29 | El JSON-LD publica en **USD**, no en ARS | Tiene que coincidir con el precio que se ve en pantalla. Structured data en otra moneda es de las inconsistencias que Google marca como error | 2026-08-04 |
| 30 | Sin ahorro real, el bloque de transferencia **no se muestra** | El redondeo se come el descuento en productos baratos. "Ahorrás $ 0" se lee como un bug, no como una oferta | 2026-08-04 |
| 31 | Cotización **automática** desde dolarapi (blue, venta) | Adelanta a F1 lo que estaba planeado para F7. Es la función que más trabajo manual le saca al dueño y la que mejor se cuenta en una demo | 2026-08-04 |
| 32 | Se usa la de **venta**, no la de compra | La de venta es a la que el revendedor repone mercadería. Convertir con la de compra es vender por debajo del costo de reposición | 2026-08-04 |
| 33 | `rate_mode` con override manual | Sin esto se pierde el clímax de la demo y el dueño queda sin control si el dólar se dispara. El automático es el default, no la única opción | 2026-08-04 |
| 34 | Cadena de fallback de 4 pasos, sin inventar números | API → último valor conocido → manual → sin precio. Un precio calculado con una cotización inventada es peor que no mostrar precio | 2026-08-04 |
| 35 | El catálogo público lee con `createStaticClient()`, sin cookies | Leer cookies vuelve dinámica la ruta y en `generateStaticParams` directamente rompe el build. El catálogo no necesita sesión: RLS ya permite lectura anónima. El cliente con cookies queda reservado para el panel de F5 | 2026-08-04 |
| 36 | `@supabase/ssr` se mantiene en la última versión, no en `^0.5.x` | La 0.5.2 importa de `@supabase/supabase-js/dist/module/lib/types`, una ruta que la 2.112 ya no publica. Con `skipLibCheck` el import roto no da error: degrada todo a `any`/`never` y los errores aparecen recién en el código propio | 2026-08-04 |
| 37 | Widget de Retell **sin reCAPTCHA** | `retell-widget-v2.js` solo adjunta el token en el flujo de callback telefónico. En chat (`/create-chat`) lee `recaptchaToken` de un objeto que nunca lo tiene, y en voz (`/v2/create-web-call`) directamente no lo manda. Con la protección activa la API responde `401 Missing reCAPTCHA token` siempre. Verificado contra la API en producción | 2026-08-04 |
| 38 | El botón de WhatsApp pasa a la **izquierda** y sube a `z-index: 1000000` | Retell se ancla abajo a la derecha con `z-index: 999999` y su burbuja usa `bottom: 90px` en móvil, así que apilarlo arriba tampoco servía. Y moverlo a la izquierda no alcanzó: el `_fabWrapBase` de Retell ocupa el ancho completo (359 px de 390) y reactiva `pointer-events: auto`, con lo que la franja inferior entera se traga los toques. El botón se veía pero no respondía | 2026-08-04 |
| 39 | La base de conocimiento del asistente es **el endpoint, no el prompt** | Con el catálogo escrito en el prompt, el agente contestó lo contrario que la base: dijo que el iPhone 17 Pro de 256 GB no tenía stock (tiene) y ofreció el de 512 en un color inexistente. Un prompt es texto congelado y el catálogo se mueve todos los días con la cotización. `/api/agent/catalog` reusa `catalog.ts` y `pricing.ts`, así que el chat lee la misma fuente que la web | 2026-08-04 |
| 40 | `brand.url` pasa a `https://www.gestionint.site` | Seguía apuntando al dominio de Netlify que nunca existió. Alimenta `metadataBase`, el OG, el sitemap y las URLs que el asistente le pasa al cliente: cada link compartido por WhatsApp iba a la nada. El canónico es con `www` — sin él responde 308 | 2026-08-04 |
| 41 | Las fotos reales viven en `public/productos/`, no en el bucket | `storage_path` que arranca con `/` se sirve desde `public/`; el resto sigue armando la URL del bucket. La base sigue siendo la fuente de verdad de qué foto es de qué producto: migrar una al bucket es editar su `storage_path` y nada más. De paso ahorra egreso del free tier y una request cross-origin en el LCP | 2026-08-04 |
| 42 | Las fotos se normalizan sobre un fondo generado, no se recortan | Son fotos de local, con encuadres y fondos distintos. Cuadrarlas a 1200×1200 sobre el degradado de los tokens deja la grilla pareja sin cortarle el sujeto a ninguna. Todas quedan ≤150 KB en WebP, dentro del presupuesto de §6 | 2026-08-04 |
| 43 | El hero usa un banner propio generado, no una foto de producto | Una foto de local arriba de todo compite con la grilla de destacados y pesa. El banner es un degradado con el acento y una silueta insinuada: 11 KB y el copy se lee sobre el sector oscuro. `store_config.banner_path` lo pisa cuando el cliente sube el suyo | 2026-08-04 |
| 44 | El OG de la ficha publica la primera foto, en URL absoluta | El canal del rubro es WhatsApp: un link pegado en un chat sin imagen se ve como spam. Las rutas relativas no las resuelve ni WhatsApp ni Google, por eso `absoluteImageUrl()` antepone `brand.url` | 2026-08-04 |

---

## 10. Preguntas abiertas

*(Las cuatro preguntas de la v1.2.0 quedaron cerradas en las decisiones 11 a 16.)*

- [ ] ¿Los colores llevan stock propio, o alcanza con stock por capacidad? (definido para el MVP: **solo por capacidad**; revisar si en la demo se nota la falta)
- [ ] ¿El listado ordena por precio usando el mínimo de capacidades o el de la capacidad más vendida? (arranca con el mínimo)
- [ ] ¿Cuántas cuotas se mencionan en el copy — "hasta 12" o solo "en cuotas" sin número? (afecta si hay que mantener el texto)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
