"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type ActionState } from "@/app/admin/actions";

const INITIAL: ActionState = { ok: true, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-12 w-full rounded-lg bg-accent text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

/**
 * Login del panel.
 *
 * Un solo usuario, creado a mano desde el dashboard de Supabase. No hay
 * registro abierto ni recuperación de contraseña: para una tienda con un
 * dueño, cada pantalla extra es superficie que mantener sin que nadie la use.
 */
export default function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState(signIn, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-muted"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          autoCapitalize="none"
          // `inputMode` para que el teclado del celular abra con la arroba
          // a mano y sin autocorrector.
          inputMode="email"
          className="h-12 w-full rounded-lg border border-line bg-ink px-3 text-paper outline-none focus:border-accent"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-muted"
        >
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-12 w-full rounded-lg border border-line bg-ink px-3 text-paper outline-none focus:border-accent"
        />
      </div>

      {!state.ok && state.message && (
        <p
          // `role="alert"` para que el lector de pantalla lo anuncie sin que
          // haya que ir a buscarlo.
          role="alert"
          className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn"
        >
          {state.message}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
