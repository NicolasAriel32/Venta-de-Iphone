/**
 * whatsapp.ts — armado de los mensajes que salen a wa.me.
 *
 * Es el checkout del proyecto: no hay pasarela de pago, la venta se cierra
 * en el chat (CLAUDE.md §9, decisión 02). Por eso el mensaje no es un
 * detalle cosmético — es el comprobante que el comprador y el vendedor van
 * a leer, y tiene que poder pegarse en un chat sin que se rompa.
 *
 * REGLA DURA (SPEC.md FC-4): el mensaje se arma con los valores CONGELADOS
 * del pedido, los que devolvió `POST /api/orders`. No se recalcula nada acá.
 * Si la cotización se mueve entre que el cliente aceptó y que se abre
 * WhatsApp, el número que ve tiene que seguir siendo el que aceptó.
 *
 * No importa nada de servidor a propósito: lo usan el route handler y los
 * componentes de la tienda.
 */

import { formatArs } from "./pricing";
import type { OrderItem } from "./supabase/types";

/** Nombre legible de una línea: `iPhone 17 Pro — Negro Titanio · 256 GB` */
export function itemLabel(item: Pick<OrderItem, "name" | "color" | "capacity">): string {
  const variant = [item.color, item.capacity].filter(Boolean).join(" · ");
  return variant ? `${item.name} — ${variant}` : item.name;
}

export type OrderMessage = {
  storeName: string;
  code: string;
  items: OrderItem[];
  totalArs: number;
  /** Total con descuento por transferencia. Si es igual al total, no se muestra. */
  transferArs: number;
  customerName: string;
  customerPhone: string;
  note?: string;
};

/**
 * Mensaje del pedido (SPEC.md FC-4).
 *
 * Los saltos de línea van como `\n` literal: `encodeURIComponent` los
 * convierte en `%0A`, que es lo que WhatsApp entiende. Nada de `<br>` ni
 * de plantillas con sangría, porque la sangría viaja dentro del mensaje.
 */
export function buildOrderMessage(order: OrderMessage): string {
  const lines: string[] = [];

  lines.push(`Hola ${order.storeName} 👋 Quiero hacer este pedido:`);
  lines.push("");
  lines.push(`Pedido ${order.code}`);
  lines.push("");

  for (const item of order.items) {
    lines.push(`• ${itemLabel(item)}`);
    lines.push(
      `  ${item.quantity} × ${formatArs(item.unit_price_ars)} = ${formatArs(item.subtotal_ars)}`,
    );
  }

  lines.push("");
  lines.push(`Total: ${formatArs(order.totalArs)}`);

  // Igual que en la ficha de precio: sin ahorro real, el renglón no va.
  // "Con transferencia: <el mismo número>" se lee como un error.
  if (order.transferArs > 0 && order.transferArs < order.totalArs) {
    lines.push(`Con transferencia: ${formatArs(order.transferArs)}`);
  }

  lines.push("");
  lines.push(`Nombre: ${order.customerName}`);
  lines.push(`Teléfono: ${order.customerPhone}`);

  const note = order.note?.trim();
  if (note) {
    lines.push("");
    lines.push(`Nota: ${note}`);
  }

  return lines.join("\n");
}

/** Link a wa.me con el mensaje ya codificado. */
export function whatsappUrl(number: string, message: string): string {
  const digits = String(number).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// ------------------------------------------------------- consultas sueltas
// FC-5: muchos compradores de este rubro no usan carrito, preguntan.

/** Consulta desde la ficha de producto. */
export function inquiryMessage(productName: string, variant?: string): string {
  const suffix = variant ? ` (${variant})` : "";
  return `Hola! Me interesa el ${productName}${suffix}. ¿Está disponible?`;
}

/** Consulta cuando la variante elegida figura sin stock. */
export function outOfStockMessage(productName: string, variant?: string): string {
  const suffix = variant ? ` (${variant})` : "";
  return `Hola! ¿Tenés el ${productName}${suffix}? Me aparece sin stock.`;
}
