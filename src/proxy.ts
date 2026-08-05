/**
 * proxy.ts — guardia de `/admin`.
 *
 * ⚠️ En Next 16 este archivo NO se llama `middleware.ts`: esa convención
 * quedó deprecada y se renombró a `proxy.ts`, con la función exportada como
 * `proxy`. Verificado en los docs de la versión instalada
 * (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`).
 *
 * Hace dos cosas, en este orden:
 *
 *   1. Refresca la sesión de Supabase. Los tokens duran una hora; sin este
 *      refresco, el dueño abre el panel al otro día y lo escupe al login
 *      aunque nunca haya cerrado sesión.
 *   2. Corta el paso a `/admin/*` si no hay sesión.
 *
 * Esto es la puerta, no la cerradura. La cerradura es RLS: aunque alguien
 * saltee esta ruta y le pegue directo a la API de Supabase, no puede escribir
 * un precio sin estar autenticado. Las dos cosas son necesarias.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Se arranca de una respuesta que deja pasar, y se la va mutando con las
  // cookies que Supabase quiera refrescar. Si se crea después, se pierden.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // `getUser()` y no `getSession()`: el segundo lee la cookie y le cree.
  // El primero valida el token contra Supabase, que es lo único que sirve
  // para decidir si dejamos entrar a alguien.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    // Para volver a donde quería ir después de loguearse.
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Ya logueado, el login no tiene nada que ofrecer.
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Solo el panel. Sin este matcher, el proxy correría en cada request de la
  // tienda —incluidos los estáticos— y le agregaría un viaje a Supabase al
  // camino crítico de la home. Contra el objetivo de 3 s con datos móviles.
  matcher: ["/admin/:path*"],
};
