import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-5xl font-bold text-accent">404</p>
      <h1 className="mt-3 font-display text-xl font-bold text-paper">
        Esta página no existe
      </h1>
      <p className="mt-2 text-sm text-muted">
        Puede que el producto se haya dado de baja o que el link esté mal copiado.
      </p>
      <Link
        href="/"
        className="tap mt-6 inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-amber"
      >
        Ver catálogo
      </Link>
    </div>
  );
}
