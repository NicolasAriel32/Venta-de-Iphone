/**
 * Layout del panel. En F5 acá va el middleware de Supabase Auth y la
 * navegación interna. Por ahora solo aísla el panel del layout de la tienda:
 * el admin no lleva header de catálogo, ni categorías, ni botón de WhatsApp.
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-6">{children}</div>
  );
}
