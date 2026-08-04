import { NextResponse } from "next/server";

/**
 * POST /api/orders — persiste el pedido antes de redirigir a WhatsApp.
 *
 * Se implementa en F4. La regla dura: primero se guarda, después se redirige.
 * Si esto falla, el cliente NO debe salir a WhatsApp (SPEC.md FC-4).
 */
export async function POST() {
  return NextResponse.json(
    { error: "No implementado todavía. Se construye en F4." },
    { status: 501 },
  );
}
