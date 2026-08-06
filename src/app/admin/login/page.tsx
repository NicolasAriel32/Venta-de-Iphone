import brand from "@/brand.config";
import LoginForm from "@/components/admin/LoginForm";

export const metadata = {
  title: "Entrar al panel",
  // El panel no tiene por qué aparecer en Google.
  robots: { index: false, follow: false },
};

/** Lee cookies vía el proxy de auth: nunca se prerenderiza. */
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  // Solo se acepta volver a una ruta del propio panel. Sin este filtro, un
  // link con `?next=https://otra-cosa` convierte al login en un redirector
  // abierto, que es un clásico de phishing.
  const target = next?.startsWith("/admin") ? next : "/admin";

  return (
    <div className="flex min-h-[70dvh] flex-col justify-center">
      <div className="mb-8 text-center">
        <p className="brand-lockup" style={{ fontSize: 24 }}>
          {brand.name}
        </p>
        <p className="mt-1 text-sm text-muted">Panel de administración</p>
      </div>

      <LoginForm next={target} />
    </div>
  );
}
