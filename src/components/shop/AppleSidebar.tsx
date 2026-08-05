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
    <div className="sidebar-card rounded-lg border border-line bg-surface p-4 bg-ai-apple">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-paper">Últimas de Apple</h3>
        <div className="apple-logo" aria-hidden>
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="6" width="88" height="88" rx="16" fill="#fff" opacity="0.06" />
            <polygon points="50,18 72,40 62,74 38,74 28,40" fill="#3B82F6" />
          </svg>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((it, idx) => (
          <li key={it.id} className={`sidebar-item animation-delay-${idx}`}>
            <a href={it.href} target="_blank" rel="noreferrer" className="block">
              <div className="news-title text-paper font-medium leading-snug">{it.title}</div>
              <div className="news-date text-muted mt-1">{it.date}</div>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center">
        <a href="https://www.apple.com/newsroom/" target="_blank" rel="noreferrer" className="text-sm text-accent sidebar-cta">
          Ver más noticias
        </a>
      </div>
    </div>
  );
}
