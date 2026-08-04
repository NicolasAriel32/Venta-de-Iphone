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
    </>
  );
}
