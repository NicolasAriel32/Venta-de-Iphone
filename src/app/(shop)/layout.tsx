import Script from "next/script";
import brand from "@/brand.config";
import Header from "@/components/shop/Header";
import CategoryNav from "@/components/shop/CategoryNav";
import Footer from "@/components/shop/Footer";
import WhatsAppFab from "@/components/shop/WhatsAppFab";
import CartDrawer from "@/components/shop/CartDrawer";
import Track from "@/components/shop/Track";
import { getCategories, getStoreContext } from "@/lib/catalog";

export default async function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // El drawer del carrito se abre desde cualquier pantalla, así que necesita
  // la cotización acá: el carrito guarda USD y el peso se calcula al pintar.
  const [categories, { config, rate }] = await Promise.all([
    getCategories(),
    getStoreContext(),
  ]);

  const notes = {
    warranty: config?.warranty_note || brand.notes.warranty,
    shipping: config?.shipping_note || brand.notes.shipping,
    payment: config?.payment_note || brand.notes.payment,
  };

  return (
    <>
      <a href="#contenido" className="skip-link">
        Ir al contenido
      </a>
      {/* Métricas del panel (F5). Cuenta la pantalla vista; la ficha de
          producto además registra cuál, desde su propio <Track productId>. */}
      <Track />
      <Header storeName={config?.store_name} />
      <CategoryNav categories={categories} />
      <main id="contenido" className="mx-auto max-w-5xl px-4 pb-24">
        {children}
      </main>
      <Footer
        categories={categories}
        storeName={config?.store_name}
        notes={notes}
      />
      <WhatsAppFab whatsapp={config?.whatsapp_number} />
      <CartDrawer usdRate={rate.value} paymentNote={notes.payment} />
      {/* Widget de Retell (chat + voz).
          Sin `data-recaptcha-key` a propósito: ver CLAUDE.md §9, decisión 37.
          Los colores salen de brand.config.ts, no escritos a mano (decisión 07). */}
      <Script
        id="retell-widget"
        src="https://dashboard.retellai.com/retell-widget-v2.js"
        strategy="afterInteractive"
        data-public-key="public_key_67b4d498f5cf58d6c9f34"
        data-agent-id="agent_ad32e23a17de975c86a4cdc06a"
        data-voice-public-key="public_key_67b4d498f5cf58d6c9f34"
        data-voice-agent-id="agent_4652aa787f86fefb91e7e8b1ec"
        data-title="¿En qué te podemos ayudar?"
        data-fab-text="¿Necesitás ayuda?"
        data-bot-name="Bart"
        data-popup-message="¿Buscás un modelo en particular? Preguntame."
        data-show-ai-popup="true"
        data-show-ai-popup-time="6"
        data-auto-open="false"
        data-color={brand.colors.accent}
        data-theme-color={brand.colors.accent}
        data-component-color={brand.colors.accent}
      />
    </>
  );
}
