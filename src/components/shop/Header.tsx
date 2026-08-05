"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import brand from "@/brand.config";
import CartButton from "./CartButton";
import { CloseIcon, SearchIcon } from "@/components/ui/icons";

/**
 * Header fijo de 56 px (SPEC.md §5).
 *
 * El buscador no es un campo siempre visible: a 390 px, un input en el header
 * deja al logo sin lugar. Es un botón que despliega el campo a ancho completo
 * con foco automático, y se cierra con Escape o con la X.
 */
export default function Header({ storeName }: { storeName?: string }) {
  const name = storeName || brand.name;
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/productos?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        {searchOpen ? (
          <form onSubmit={onSubmit} className="flex w-full items-center gap-2" role="search">
            <SearchIcon className="shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por modelo o SKU"
              aria-label="Buscar productos"
              enterKeyHint="search"
              className="h-11 min-w-0 flex-1 bg-transparent text-base text-paper outline-none placeholder:text-muted"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar búsqueda"
              className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted"
            >
              <CloseIcon />
            </button>
          </form>
        ) : (
          <>
            <Link
              href="/"
              className="tap flex h-11 items-center pr-2 font-display text-xl font-bold tracking-tight text-paper"
            >
              {name}
            </Link>

            <div className="flex-1" />

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar productos"
              className="tap flex h-11 w-11 items-center justify-center rounded-lg text-paper"
            >
              <SearchIcon />
            </button>

            <CartButton />
          </>
        )}
      </div>
    </header>
  );
}
