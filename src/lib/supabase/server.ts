import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./database.types";

/**
 * Cliente anónimo, sin cookies. Es el que usa todo el catálogo público.
 *
 * Por qué no alcanza con `createClient()`: leer cookies obliga a Next a
 * renderizar la ruta de forma dinámica, y en `generateStaticParams` — que
 * corre en el build, sin request HTTP — directamente rompe. El catálogo no
 * necesita sesión: RLS permite lectura anónima de las filas activas (F2).
 * Sin cookies de por medio, el ISR de 60 s de F3 funciona de verdad.
 */
export function createStaticClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Cliente de Supabase para Server Components, Route Handlers y Server Actions.
 *
 * Lee la sesión de las cookies, así que en F5 el panel de admin queda
 * protegido con esto más el middleware.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: el middleware refresca la
            // sesión, así que se puede ignorar sin consecuencias.
          }
        },
      },
    },
  );
}
