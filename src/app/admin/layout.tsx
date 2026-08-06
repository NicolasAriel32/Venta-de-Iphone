/**
 * Layout del panel.
 *
 * Aísla el panel del layout de la tienda: no lleva header de catálogo, ni
 * categorías, ni botón flotante de WhatsApp, ni el widget de Retell. El
 * dueño no es un comprador.
 *
 * La sesión la resuelve `src/proxy.ts`, que corre antes de llegar acá.
 *
 * `.admin-shell` pone la atmósfera —dos resplandores de acento fijos al
 * viewport— sin costar una imagen ni un request. El contenedor sigue en
 * columna única y angosto a propósito: en un celular es lo único que entra,
 * y en escritorio una medida corta se lee mejor que una tabla de 8 columnas
 * (§6 F5).
 */
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-shell content-wrap min-h-dvh py-6">{children}</div>
  );
}
