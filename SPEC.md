# SPEC.md — MOSTRADOR · instancia IPHONEX10

> Especificación funcional: user flows, wireframes a 390 px, reglas de negocio y catálogo demo.
> Complemento de `CLAUDE.md`. Si los dos se contradicen, **manda CLAUDE.md** y este archivo se corrige.
> Versión: `v1.0.0` · Última actualización: 2026-08-03 · Fase: F0

---

## 1. Alcance de este documento

Lo que está acá se implementa. Lo que no está, no existe hasta que se agregue acá primero.

Cubre: qué ve el comprador, en qué orden, qué pasa cuando toca cada cosa, qué ve el dueño de la tienda, y qué datos hacen falta para que eso funcione.

No cubre: decisiones de stack (§2 de CLAUDE.md), estructura de carpetas (§4) ni orden de trabajo (§6).

---

## 2. Actores

| Actor | Quién es | Qué necesita | Dónde entra |
|---|---|---|---|
| **Comprador** | Llega de un link de Instagram o de un QR. Está en el celular, parado, con datos móviles | Ver el precio rápido, saber si hay stock, preguntar sin bajarse una app | Público, sin cuenta |
| **Dueño de la tienda** | Un revendedor. No es técnico. Trabaja desde el celular | Cambiar la cotización, cargar un producto, ver quién pidió qué | `/admin`, con Supabase Auth |
| **Prospecto** (solo en demo) | A quien Nicolás le muestra el producto | Entender el valor en 5 minutos | Escanea el QR y navega en su propio teléfono |

---

## 3. Flujos del comprador

### FC-1 · Del link al precio *(el flujo que más importa)*

**Meta:** que alguien que llegó de una historia de Instagram vea un precio en menos de 3 segundos y entienda qué le cuesta.

```
Instagram/QR → Home → Categoría "iPhone" → iPhone 17 Pro → ve el precio
```

1. Abre la home. Ve el banner, la grilla de categorías y los destacados. **El primer precio tiene que estar visible sin scrollear más de una pantalla.**
2. Toca una categoría → listado filtrado.
3. Toca una card → detalle.
4. En el detalle ve: galería, selector de color, selector de capacidad, ficha de precio, stock, medios de pago.

**Salida exitosa:** conoce el precio.
**Salidas alternativas:** usa el buscador del header y salta directo al detalle · toca el botón flotante de WhatsApp y pregunta sin navegar.

---

### FC-2 · Elegir variante

**Meta:** que "¿lo tenés en negro de 256?" se responda solo.

1. Entra al detalle. Llega con una variante **preseleccionada**: el primer color activo y la capacidad más chica con stock.
2. Toca un color → la galería pasa a las imágenes de ese color. **El precio no cambia.**
3. Toca una capacidad → cambia el precio en la ficha, el estado de stock y el USD de referencia. **La galería no cambia.**
4. La URL se actualiza a `?color=negro&cap=256` sin recargar (`history.replaceState`).

**Reglas de la interacción:**

- El cambio es **instantáneo y local**. Nada de spinner, nada de ir al servidor. Todas las variantes vienen en el payload de la página.
- **Cero salto de layout.** El contenedor de la galería y el de la ficha de precio tienen altura reservada. Si al cambiar de color salta el contenido, está mal hecho.
- Capacidad sin stock: se muestra atenuada y tachada, **sigue siendo tocable**. Al tocarla, el botón principal cambia de "Agregar al carrito" a "Consultar disponibilidad" y va a WhatsApp con el modelo y la capacidad en el mensaje. Un "sin stock" que igual genera una consulta vale más que una opción oculta.
- Si el producto no tiene capacidades cargadas, el selector de capacidad **no se renderiza**. No se muestra vacío ni deshabilitado.
- Si el producto tiene un solo color, el selector de color no se renderiza.

---

### FC-3 · Del detalle al carrito

1. Toca "Agregar al carrito" (barra fija inferior, dentro de la zona del pulgar).
2. Se abre el drawer del carrito desde abajo, mostrando el ítem recién agregado con **color y capacidad en el nombre**.
3. Puede seguir comprando (cierra el drawer) o ir a `/carrito`.

**Regla:** dos capacidades del mismo modelo son **dos líneas distintas**. Dos colores del mismo modelo y capacidad, también. La clave del ítem es `product_id + capacity_id + color_id`.

---

### FC-4 · Checkout por WhatsApp

```
/carrito → nombre + teléfono → POST /api/orders → wa.me con el mensaje armado
```

1. Revisa las líneas, ajusta cantidades, ve el total en ARS y el total de transferencia.
2. Completa **nombre y teléfono**. Nada más.
3. Toca "Enviar pedido por WhatsApp".
4. **Primero se persiste el pedido**, después se redirige. Si el POST falla, no se redirige: se muestra el error y el botón queda reintentable.
5. Se abre WhatsApp con el mensaje prellenado.

**Formato del mensaje** (`lib/whatsapp.ts`):

```
Hola IPHONEX10 👋 Quiero hacer este pedido:

Pedido IPX-0142

• iPhone 17 Pro — Negro Titanio · 256 GB
  1 × $ 1.842.000 = $ 1.842.000
• AirPods Pro 3
  2 × $ 289.000 = $ 578.000

Total: $ 2.420.000
Con transferencia: $ 2.298.000

Nombre: Nicolás
Teléfono: 11 5555-5555
```

**Regla dura:** el mensaje se arma con los **valores congelados** del pedido, no recalculando en el momento de armar el texto. Si la cotización cambia entre el POST y el redirect, el cliente tiene que ver el mismo número que aceptó.

---

### FC-5 · Consulta directa sin carrito

Muchos compradores de este rubro no usan carrito: preguntan. Hay tres puntos de salida a WhatsApp:

| Punto | Mensaje prellenado |
|---|---|
| Botón flotante (todas las pantallas) | `Hola IPHONEX10! Quería hacer una consulta.` |
| Botón "Consultar" en el detalle | `Hola! Me interesa el iPhone 17 Pro (Negro Titanio, 256 GB). ¿Está disponible?` |
| Variante sin stock | `Hola! ¿Tenés el iPhone 17 Pro de 512 GB? Me aparece sin stock.` |

---

### FC-6 · Buscar

1. Toca la lupa del header → se abre un campo a ancho completo con el teclado ya arriba (`autofocus`).
2. Escribe. Resultados con debounce de 250 ms, buscando por nombre, marca y SKU.
3. Sin resultados: estado vacío con las 4 categorías más buscadas como salida. **Nunca un callejón sin salida.**

---

## 4. Flujos del admin

### FA-1 · Cambiar la cotización *(el clímax de la demo)*

```
/admin/config → campo "Dólar" → Guardar → volver a la tienda → todos los precios cambiaron
```

- El campo de cotización es **lo primero de la pantalla**, con el tipográfico más grande del panel y `inputmode="decimal"` para que el celular abra el teclado numérico.
- Debajo, en gris: `Actualizado hace 2 horas`.
- Al guardar: confirmación visible + revalidación del catálogo.
- **Requisito de demo:** desde que toca "Guardar" hasta que la tienda muestra el precio nuevo no pueden pasar más de 5 segundos. Si el ISR de 60 s se interpone, se dispara una revalidación on-demand desde el handler.

### FA-2 · Cargar un producto con variantes

1. `/admin/productos` → "Nuevo".
2. Datos base: nombre, SKU, categoría, marca, descripción, precio USD, % de descuento por transferencia, destacado, activo.
3. **Colores:** agregar fila (nombre + selector de color). Se pueden reordenar.
4. **Capacidades:** agregar fila (GB + precio USD + estado de stock). Si no agrega ninguna, el producto usa el precio base.
5. **Imágenes:** hasta 3. Cada una con un desplegable "Color: [General / Negro / Azul...]". Por defecto, General.
6. Guardar.

**Reglas del editor:**

- Todo en **columna única**, cada variante es una fila apilada con su botón de borrar a la derecha. Nada de tablas.
- Si carga capacidades, el precio base queda visualmente atenuado con la leyenda `El precio sale de las capacidades`.
- Advertencia al guardar si hay un color sin ninguna imagen asignada: no bloquea, avisa.

### FA-3 · Ver pedidos

- Lista de tarjetas ordenada por fecha descendente: código, nombre, teléfono, total, estado.
- Tocar una tarjeta la expande y muestra los ítems **con color y capacidad**.
- Cambio de estado con un selector de 4 opciones: Nuevo · Contactado · Cerrado · Perdido.
- Botón "Abrir WhatsApp" que va directo al teléfono del cliente.

---

## 5. Wireframes a 390 px

### Home

```
┌──────────────────────────────┐ 390
│ ☰   IPHONEX10          🔍 🛒 │  header fijo, 56 px
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │                          │ │  banner único
│ │   iPhone 17 en cuotas    │ │  ratio 16:9
│ │   [ Ver catálogo ]       │ │  ≤ 120 KB WebP
│ └──────────────────────────┘ │
├──────────────────────────────┤
│  Categorías                  │
│  ┌────┐ ┌────┐ ┌────┐        │  grilla 3 col
│  │ 📱 │ │ 💻 │ │ ⌚ │        │  tocables 44 px+
│  └────┘ └────┘ └────┘        │
│  ┌────┐ ┌────┐ ┌────┐        │
│  │ 🎧 │ │ 🎮 │ │ 🔌 │        │
│  └────┘ └────┘ └────┘        │
├──────────────────────────────┤
│  Destacados        Ver todo →│
│  ┌─────────┐ ┌─────────┐     │  scroll horizontal
│  │  foto   │ │  foto   │     │  SOLO dentro de
│  │ iPhone  │ │ MacBook │     │  esta fila
│  │ Desde   │ │ Desde   │     │
│  │ $1.542k │ │ $2.180k │     │
│  │ ●●●     │ │ ●●      │     │  puntitos de color
│  └─────────┘ └─────────┘     │
├──────────────────────────────┤
│  ✓ Garantía 6 meses          │  franja de confianza
│  ✓ Envíos a todo el país     │
│  ✓ Crédito en cuotas         │
│    y hasta 2 tarjetas        │
├──────────────────────────────┤
│  footer + redes              │
└──────────────────────────────┘
                          ┌───┐
                          │ W │  botón flotante
                          └───┘  56 px, ab. derecha
```

### Detalle de producto

```
┌──────────────────────────────┐
│ ←   iPhone 17 Pro       🔍 🛒│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │                          │ │  galería, altura fija
│ │        [ foto ]          │ │  swipe horizontal
│ │                          │ │  filtrada por color
│ └──────────────────────────┘ │
│           ● ○ ○              │  indicadores
├──────────────────────────────┤
│  Apple · SKU IPX-1701        │
│  iPhone 17 Pro               │  display condensada
├──────────────────────────────┤
│  Color: Negro Titanio        │
│  ⬤  ⬤  ⬤                     │  círculos 44 px
│  ▔▔                          │  subrayado = activo
├──────────────────────────────┤
│  Capacidad                   │
│ ┌────────┐┌────────┐┌───────┐│  píldoras 44 px alto
│ │ 128 GB ││ 256 GB ││512 GB ││
│ └────────┘└━━━━━━━━┘└╌╌╌╌╌╌╌┘│  ━ activa · ╌ sin stock
├──────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  $ 1.606.000             ┃ │  ← ELEMENTO FIRMA
│ ┃  USD 1.029               ┃ │
│ ┃  ─────────────────────   ┃ │
│ ┃  $ 1.526.000             ┃ │
│ ┃  con transferencia -5%   ┃ │
│ ┃  ahorrás $ 80.000        ┃ │
│ ┃  ─────────────────────   ┃ │
│ ┃  💳 Crédito en cuotas    ┃ │
│ ┃     y hasta 2 tarjetas   ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
├──────────────────────────────┤
│  🟢 Disponible               │
├──────────────────────────────┤
│  Descripción                 │
│  Especificaciones            │  acordeones
│  Garantía y envíos           │
├──────────────────────────────┤
│                              │
│  (espacio para la barra)     │
└──────────────────────────────┘
┌──────────────────────────────┐
│ [ Agregar al carrito ]    [W]│  barra fija inferior
└──────────────────────────────┘  zona del pulgar
```

### Carrito

```
┌──────────────────────────────┐
│ ←   Tu pedido            🗑  │
├──────────────────────────────┤
│ ┌──┐ iPhone 17 Pro           │
│ │📷│ Negro Titanio · 256 GB  │  variante siempre
│ └──┘ $ 1.842.000             │  visible
│      [ − ] 1 [ + ]        ✕  │
├──────────────────────────────┤
│ ┌──┐ AirPods Pro 3           │
│ │📷│ $ 289.000               │
│ └──┘ [ − ] 2 [ + ]        ✕  │
├──────────────────────────────┤
│  Total          $ 2.420.000  │
│  Transferencia  $ 2.298.000  │
│  💳 Crédito en cuotas y      │
│     hasta 2 tarjetas         │
├──────────────────────────────┤
│  Nombre                      │
│  [__________________________]│
│  Teléfono                    │
│  [__________________________]│  inputmode=tel
└──────────────────────────────┘
┌──────────────────────────────┐
│ [ Enviar pedido por WhatsApp]│
└──────────────────────────────┘
```

### Admin · Config

```
┌──────────────────────────────┐
│ ←   Configuración            │
├──────────────────────────────┤
│  COTIZACIÓN DEL DÓLAR        │
│ ┌──────────────────────────┐ │
│ │  $ 1.535                 │ │  56 px de alto
│ └──────────────────────────┘ │  inputmode=decimal
│  Actualizado hace 2 horas    │
│                              │
│ [    Guardar cotización    ] │  botón ancho completo
├──────────────────────────────┤
│  Tienda                    ⌄ │
│  WhatsApp                  ⌄ │  acordeones cerrados
│  Textos                    ⌄ │
│  Apariencia                ⌄ │
└──────────────────────────────┘
```

---

## 6. Reglas de negocio

### Precio

**El peso es el precio publicado. El dólar es la referencia de carga.**

`usd_rate` no se carga a mano: sale del dólar blue (venta) de dolarapi.com, con override manual desde el panel. Ver `lib/exchange.ts`.

```
precio_ars               = redondearAMil(precio_usd × usd_rate)
precio_ars_transferencia = redondearAMil(precio_ars × (1 − pct / 100))
```

- Los dos redondeos son **hacia arriba**: al millar en pesos, al dólar entero en USD. Nadie publica precios con unidades en este rubro y redondear para abajo es regalar plata.
- Formato ARS: `$ 1.402.000` — separador de miles con punto, sin decimales, espacio después del signo. Formato USD: `USD 899`.
- El dólar va en `--muted` y chico. Nunca es el número grande.
- Si no se pudo resolver ninguna cotización, **no se muestra precio**: la ficha dice "No pudimos cargar el precio" y ofrece WhatsApp. Nunca se inventa un número.
- **Si el ahorro por transferencia redondea a 0, el bloque no se muestra.** "Ahorrás $ 0" se lee como un bug.

Jerarquía en la ficha:

```
$ 1.403.000          ← 4xl, display, --paper
USD 899              ← sm, --muted
─────────────────
$ 1.333.000          ← 2xl, display, --ok
con transferencia · 5% off · ahorrás $ 70.000
```

### Cadena de la cotización

| Orden | Fuente | Cuándo |
|---|---|---|
| 1 | dolarapi (blue, venta) | `rate_mode = auto` y la API responde |
| 2 | `store_config.rate_auto` | La API no respondió: último valor conocido |
| 3 | `store_config.usd_rate` | `rate_mode = manual`, o no hay valor en cache |
| 4 | Sin precio | No hay nada. La UI muestra "Consultar precio" |

### Qué precio se usa

| Caso | Listado | Detalle |
|---|---|---|
| Producto sin capacidades | `$ X` (de `products.price_usd`) | `$ X` |
| Producto con capacidades | `Desde $ X` (mínimo) | `$ X` de la capacidad seleccionada |

### Stock

| Estado | Etiqueta | Color | Botón principal |
|---|---|---|---|
| `in_stock` | Disponible | `--ok` | Agregar al carrito |
| `on_demand` | A pedido · 7 a 10 días | `--warn` | Agregar al carrito |
| `out_of_stock` | Sin stock | `--muted` | Consultar disponibilidad |

Con capacidades, el estado sale de la capacidad seleccionada. Sin capacidades, de `products.stock_status`.

### Medios de pago

Texto único guardado en `store_config.payment_note`, editable desde el panel. Valor inicial:

> Crédito en cuotas y hasta 2 tarjetas

Aparece en tres lugares: franja de confianza de la home, ficha de precio del detalle y resumen del carrito.

**No se calculan cuotas.** No hay coeficientes, ni "12 × $153.500", ni CFT. Publicar un número de cuota mal calculado es un problema real y el dueño de la tienda no lo va a mantener actualizado. Se comunica que existe la modalidad y se cierra por WhatsApp. Si más adelante hace falta el número, entra por F7 junto con Mercado Pago.

---

## 7. Estados

Cada pantalla tiene tres. Sin excepción.

| Pantalla | Cargando | Vacío | Error |
|---|---|---|---|
| Listado | Skeleton de 6 cards | "No encontramos productos con esos filtros" + botón "Limpiar filtros" | "No pudimos cargar el catálogo" + "Reintentar" |
| Búsqueda | Skeleton de 3 filas | "Sin resultados para «xxx»" + 4 categorías sugeridas | idem listado |
| Detalle | Skeleton de galería + ficha | — (404 si no existe) | "Este producto no está disponible" + "Ver catálogo" |
| Carrito | — | "Tu pedido está vacío" + "Ver catálogo" | "No pudimos enviar el pedido" + "Reintentar" |
| Admin pedidos | Skeleton de 4 tarjetas | "Todavía no hay pedidos" | "No pudimos cargar los pedidos" + "Reintentar" |

**Tono de los errores:** decir qué pasó y qué hacer. Sin "Ups", sin "Lo sentimos", sin emojis tristes, sin códigos de error a la vista.

---

## 8. Criterios de aceptación de F0

- [x] Marca definida y aislada en `brand.config.ts`
- [x] Modelo de variantes decidido y documentado
- [x] Los 6 flujos del comprador y los 3 del admin están escritos
- [x] Wireframes de las 4 pantallas críticas a 390 px
- [x] Reglas de precio, stock y medios de pago cerradas
- [x] Catálogo demo definido (§9)
- [ ] Cuenta de Netlify creada y conectada a GitHub — **bloquea F1**

---

## 9. Catálogo demo

### 9.1 Categorías (12)

| # | Nombre | Slug | Ícono | Nota |
|---|---|---|---|---|
| 1 | iPhone | `iphone` | 📱 | La categoría ancla de la demo |
| 2 | Celulares Android | `android` | 📱 | |
| 3 | iPad y tablets | `tablets` | 📋 | |
| 4 | Notebooks | `notebooks` | 💻 | |
| 5 | Smartwatches | `smartwatches` | ⌚ | |
| 6 | Auriculares | `auriculares` | 🎧 | |
| 7 | Consolas y juegos | `gaming` | 🎮 | |
| 8 | Monitores | `monitores` | 🖥 | |
| 9 | Almacenamiento | `almacenamiento` | 💾 | |
| 10 | Cargadores y cables | `cargadores` | 🔌 | Ticket bajo, sube el promedio del pedido |
| 11 | Fundas y templados | `fundas` | 🛡 | |
| 12 | Parlantes | `parlantes` | 🔊 | |

### 9.2 Productos (42)

> ⚠️ **Los precios USD de esta tabla son valores de referencia, no datos verificados.** Antes de escribir el `seed.sql` en F2 hay que contrastarlos con listas reales de mayoristas o con lo que publican 2 o 3 tiendas del rubro. Un precio disparatado en la demo lo detecta cualquier revendedor en dos segundos y es exactamente el tipo de detalle que arruina la credibilidad.

**Columna "Cap."**: capacidades cargadas en `product_capacities` con su precio USD. Vacío = el producto usa `products.price_usd`.
**Columna "Colores"**: filas de `product_colors`.

#### iPhone

| SKU | Producto | Cap. (GB → USD) | Colores | Stock |
|---|---|---|---|---|
| IPX-1701 | iPhone 17 Pro Max | 256→1449 · 512→1699 · 1024→1949 | Negro Titanio · Titanio Natural · Titanio Desierto | in_stock |
| IPX-1702 | iPhone 17 Pro | 256→1199 · 512→1449 | Negro Titanio · Titanio Natural · Blanco Titanio | in_stock |
| IPX-1703 | iPhone 17 | 128→899 · 256→1029 · 512→1279 | Negro · Blanco · Azul · Verde | in_stock |
| IPX-1604 | iPhone 16 Pro | 128→1049 · 256→1179 | Titanio Natural · Titanio Negro | on_demand |
| IPX-1605 | iPhone 16 | 128→799 · 256→909 | Negro · Ultramarino · Verde Azulado · Rosa | in_stock |
| IPX-1506 | iPhone 15 | 128→649 · 256→759 | Negro · Azul · Amarillo | in_stock |

#### Celulares Android

| SKU | Producto | Cap. (GB → USD) | Colores | Stock |
|---|---|---|---|---|
| IPX-2101 | Samsung Galaxy S25 Ultra | 256→1149 · 512→1299 | Negro Titanio · Gris Titanio · Plata Titanio | in_stock |
| IPX-2102 | Samsung Galaxy S25 | 128→799 · 256→879 | Negro · Azul Marino · Menta | in_stock |
| IPX-2103 | Samsung Galaxy A56 | 128→349 · 256→399 | Grafito · Verde Oliva · Rosa | in_stock |
| IPX-2104 | Xiaomi 15 | 256→699 | Negro · Verde · Blanco | on_demand |
| IPX-2105 | Redmi Note 14 Pro | 128→259 · 256→299 | Negro Medianoche · Púrpura · Azul | in_stock |

#### iPad y tablets

| SKU | Producto | Cap. (GB → USD) | Colores | Stock |
|---|---|---|---|---|
| IPX-3101 | iPad Pro 11" M4 | 256→1049 · 512→1249 | Negro Espacial · Plata | on_demand |
| IPX-3102 | iPad Air 11" M3 | 128→649 · 256→749 | Gris Espacial · Azul · Púrpura · Blanco Estrella | in_stock |
| IPX-3103 | iPad 11" | 128→379 · 256→449 | Azul · Rosa · Amarillo · Plata | in_stock |

#### Notebooks

| SKU | Producto | Cap. (GB → USD) | Colores | Stock |
|---|---|---|---|---|
| IPX-4101 | MacBook Air 13" M4 | 256→1099 · 512→1329 | Medianoche · Blanco Estrella · Plata | in_stock |
| IPX-4102 | MacBook Pro 14" M4 | 512→1899 · 1024→2149 | Negro Espacial · Plata | on_demand |
| IPX-4103 | Lenovo IdeaPad Slim 3 · i5 | 512→549 | Gris | in_stock |
| IPX-4104 | Asus TUF Gaming A15 · RTX 4060 | 512→1149 | Negro | on_demand |

#### Smartwatches

| SKU | Producto | Cap. | Colores | Precio USD | Stock |
|---|---|---|---|---|---|
| IPX-5101 | Apple Watch Series 10 · 42 mm | — | Negro Azabache · Plata · Oro Rosa | 429 | in_stock |
| IPX-5102 | Apple Watch SE 2 · 40 mm | — | Medianoche · Blanco Estrella | 249 | in_stock |
| IPX-5103 | Galaxy Watch 7 · 40 mm | — | Verde · Crema | 279 | on_demand |

#### Auriculares

| SKU | Producto | Colores | Precio USD | Stock |
|---|---|---|---|---|
| IPX-6101 | AirPods Pro 3 | Blanco | 249 | in_stock |
| IPX-6102 | AirPods 4 | Blanco | 149 | in_stock |
| IPX-6103 | Galaxy Buds 3 Pro | Plata · Blanco | 179 | in_stock |
| IPX-6104 | JBL Tune 770NC | Negro · Azul · Blanco | 99 | in_stock |

#### Consolas y juegos

| SKU | Producto | Cap. (GB → USD) | Colores | Stock |
|---|---|---|---|---|
| IPX-7101 | PlayStation 5 Slim | 1024→549 | Blanco | in_stock |
| IPX-7102 | PlayStation 5 Pro | 2048→849 | Blanco | on_demand |
| IPX-7103 | Nintendo Switch 2 | — (precio base USD 469) | Negro | in_stock |
| IPX-7104 | Xbox Series S | 512→329 · 1024→399 | Blanco · Negro | in_stock |

#### Monitores

| SKU | Producto | Colores | Precio USD | Stock |
|---|---|---|---|---|
| IPX-8101 | Samsung Odyssey G5 27" 165 Hz | Negro | 259 | in_stock |
| IPX-8102 | LG UltraGear 27" 180 Hz | Negro | 289 | on_demand |

#### Almacenamiento

| SKU | Producto | Cap. (GB → USD) | Precio USD | Stock |
|---|---|---|---|---|
| IPX-9101 | SSD externo Samsung T7 | 1024→109 · 2048→179 | — | in_stock |
| IPX-9102 | MicroSD SanDisk Extreme | 128→24 · 256→39 · 512→69 | — | in_stock |
| IPX-9103 | Pendrive Kingston DataTraveler | 128→19 · 256→32 | — | in_stock |

#### Cargadores y cables

| SKU | Producto | Colores | Precio USD | Stock |
|---|---|---|---|---|
| IPX-A101 | Cargador Apple 20W USB-C | Blanco | 25 | in_stock |
| IPX-A102 | Cable USB-C a USB-C 1 m | Blanco · Negro | 15 | in_stock |
| IPX-A103 | Power bank Anker 20.000 mAh | Negro · Blanco | 59 | in_stock |
| IPX-A104 | Cargador Baseus GaN 65W | Negro | 39 | in_stock |

#### Fundas y templados

| SKU | Producto | Colores | Precio USD | Stock |
|---|---|---|---|---|
| IPX-B101 | Funda de silicona con MagSafe · iPhone 17 | Negro · Azul · Rosa · Transparente | 29 | in_stock |
| IPX-B102 | Vidrio templado 9H · iPhone 17 | Transparente | 12 | in_stock |

#### Parlantes

| SKU | Producto | Colores | Precio USD | Stock |
|---|---|---|---|---|
| IPX-C101 | JBL Flip 7 | Negro · Azul · Rojo | 129 | in_stock |
| IPX-C102 | JBL Charge 6 | Negro · Azul | 179 | in_stock |

### 9.3 Destacados de la home (6)

`IPX-1702` iPhone 17 Pro · `IPX-1703` iPhone 17 · `IPX-2101` Galaxy S25 Ultra · `IPX-4101` MacBook Air M4 · `IPX-6101` AirPods Pro 3 · `IPX-7101` PlayStation 5 Slim

Elegidos para que la fila de destacados muestre: dos productos con 3 capacidades y 3–4 colores, uno con capacidades y sin muchos colores, y uno sin variantes. Así, sin explicar nada, la demo muestra que el sistema banca los tres casos.

### 9.4 Presupuesto de imágenes

42 productos × 3 imágenes × ≤150 KB ≈ **19 MB**. Sobre 1 GB de Storage libre, sobra. Formato WebP, lado mayor 1200 px.

Para los productos con colores, la imagen 1 de cada color es la que se muestra al seleccionarlo. Cubrir con foto propia por color al menos los 6 destacados; el resto puede usar imágenes generales (`color_id = NULL`) sin que se rompa nada.

---

## 10. Historial

| Versión | Fecha | Cambio |
|---|---|---|
| v1.0.0 | 2026-08-03 | Primera versión. Cierra F0 junto con CLAUDE.md v1.3.0 |
