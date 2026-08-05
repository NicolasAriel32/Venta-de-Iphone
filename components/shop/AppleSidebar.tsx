import Link from "next/link";

export default function AppleSidebar() {
  const items = [
    {
      id: "1",
      title: "Apple anuncia iPhone 17 Pro Max",
      date: "2026-08-01",
      href: "https://www.apple.com/newsroom/",
    },
    {
      id: "2",
      title: "Nuevas actualizaciones de iOS disponibles",
      date: "2026-07-28",
      href: "https://www.apple.com/newsroom/",
    },
    {
      id: "3",
      title: "Accesorios oficiales: colores y disponibilidad",
      date: "2026-07-15",
      href: "https://www.apple.com/newsroom/",
    },
  ];

  return (
    <div className="sidebar-card rounded-lg border border-line bg-surface p-4">
      <h3 className="text-sm font-semibold text-paper mb-3">Últimas de Apple</h3>
      <ul className="space-y-3">
        {items.map((it, idx) => (
          <li key={it.id} className={`sidebar-item animation-delay-${idx}`}>
            <a href={it.href} target="_blank" rel="noreferrer" className="block">
              <div className="text-[13px] text-paper font-medium leading-snug">{it.title}</div>
              <div className="text-[11px] text-muted mt-1">{it.date}</div>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center">
        <Link href="/productos" className="text-sm text-accent">
          Ver más noticias
        </Link>
      </div>
    </div>
  );
}
