import Script from "next/script";
import brand from "@/brand.config";
import Header from "@/components/shop/Header";
import CategoryNav from "@/components/shop/CategoryNav";
import Footer from "@/components/shop/Footer";
import WhatsAppFab from "@/components/shop/WhatsAppFab";
import { getCategories, getStoreConfig } from "@/lib/catalog";

export default async function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [categories, config] = await Promise.all([getCategories(), getStoreConfig()]);

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
        data-bot-name={`Asistente ${brand.name}`}
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
