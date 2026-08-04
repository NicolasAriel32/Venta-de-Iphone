# Base de datos

Proyecto Supabase: **iphonex10** · `kqrntbirpvuamkttcjuo` · región `sa-east-1` (São Paulo).

## Migraciones aplicadas

| Versión | Nombre | Qué hace |
|---|---|---|
| 20260804031527 | `create_catalog_schema` | Los 2 enums y las 7 tablas |
| 20260804031549 | `create_products_public_view` | Vista `products_public` con `min_price_usd` |
| 20260804031610 | `enable_rls_policies` | RLS en todas las tablas |
| 20260804031623 | `create_product_images_bucket` | Bucket `product-images` |
| 20260804031641 | `seed_categories_and_config` | 12 categorías + `store_config` |
| 20260804031729 | `seed_products` | 42 productos |
| 20260804031802 | `seed_product_colors` | 88 colores |
| 20260804031822 | `seed_product_capacities` | 46 capacidades |
| 20260804032147 | `harden_security_advisors` | Cierra los warnings del linter |

## Traerlas al repo

Las migraciones viven en el proyecto remoto. Para bajarlas a `supabase/migrations/`:

```bash
npx supabase link --project-ref kqrntbirpvuamkttcjuo
npx supabase db pull
```

No se copian a mano. Un archivo copiado a mano se desincroniza de la base el día que menos conviene, y ahí ya no se sabe cuál de los dos es la verdad.

## Regenerar los tipos TS

Después de cualquier cambio de schema:

```bash
npx supabase gen types typescript --project-id kqrntbirpvuamkttcjuo > src/lib/supabase/database.types.ts
```

## Resetear los datos de demo

Borra pedidos y catálogo, y vuelve a correr los seeds:

```bash
npx supabase db reset --linked
```

⚠️ Esto borra todo lo cargado desde el panel. Es para dejar la demo repetible (F6), no para uso normal.

## Cosas a tener en cuenta

- **El proyecto se pausa solo tras ~7 días sin uso.** Antes de cualquier demo hay que verificar que esté despierto. En F6 entra un workflow de n8n que hace un `select` trivial cada 48 h para evitarlo.
- **Los warnings de "RLS always true" para el rol `authenticated` son intencionales.** Hay un solo usuario autenticado en todo el sistema: el dueño de la tienda. No hay multi-tenant en el MVP.
- **La cotización del dólar arranca en 1535.** Es un valor de demo, se edita desde el panel.
