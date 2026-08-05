/**
 * Tipos generados desde el schema de Supabase.
 *
 * ⚠️ NO EDITAR A MANO. Se regeneran con:
 *   npx supabase gen types typescript --project-id kqrntbirpvuamkttcjuo > src/lib/supabase/database.types.ts
 *
 * Cada vez que cambie una migración, hay que regenerarlos.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string;
          id: number;
          kind: Database["public"]["Enums"]["analytics_event_kind"];
          meta: Json;
          path: string | null;
          product_id: string | null;
          session_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: never;
          kind: Database["public"]["Enums"]["analytics_event_kind"];
          meta?: Json;
          path?: string | null;
          product_id?: string | null;
          session_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: never;
          kind?: Database["public"]["Enums"]["analytics_event_kind"];
          meta?: Json;
          path?: string | null;
          product_id?: string | null;
          session_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products_public";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          icon: string;
          id: string;
          is_active: boolean;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          icon?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          icon?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          code: string;
          created_at: string;
          customer_name: string;
          customer_phone: string;
          id: string;
          items: Json;
          note: string;
          status: Database["public"]["Enums"]["order_status"];
          total_ars: number;
          usd_rate_snapshot: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          customer_name: string;
          customer_phone: string;
          id?: string;
          items: Json;
          note?: string;
          status?: Database["public"]["Enums"]["order_status"];
          total_ars: number;
          usd_rate_snapshot: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          customer_name?: string;
          customer_phone?: string;
          id?: string;
          items?: Json;
          note?: string;
          status?: Database["public"]["Enums"]["order_status"];
          total_ars?: number;
          usd_rate_snapshot?: number;
        };
        Relationships: [];
      };
      product_capacities: {
        Row: {
          capacity_gb: number;
          id: string;
          is_active: boolean;
          price_usd: number;
          product_id: string;
          sort_order: number;
          stock_status: Database["public"]["Enums"]["stock_status"];
        };
        Insert: {
          capacity_gb: number;
          id?: string;
          is_active?: boolean;
          price_usd: number;
          product_id: string;
          sort_order?: number;
          stock_status?: Database["public"]["Enums"]["stock_status"];
        };
        Update: {
          capacity_gb?: number;
          id?: string;
          is_active?: boolean;
          price_usd?: number;
          product_id?: string;
          sort_order?: number;
          stock_status?: Database["public"]["Enums"]["stock_status"];
        };
        Relationships: [];
      };
      product_colors: {
        Row: {
          hex: string;
          id: string;
          is_active: boolean;
          name: string;
          product_id: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          hex: string;
          id?: string;
          is_active?: boolean;
          name: string;
          product_id: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          hex?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          product_id?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          alt: string;
          color_id: string | null;
          id: string;
          product_id: string;
          sort_order: number;
          storage_path: string;
        };
        Insert: {
          alt?: string;
          color_id?: string | null;
          id?: string;
          product_id: string;
          sort_order?: number;
          storage_path: string;
        };
        Update: {
          alt?: string;
          color_id?: string | null;
          id?: string;
          product_id?: string;
          sort_order?: number;
          storage_path?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          brand: string;
          category_id: string;
          created_at: string;
          description: string;
          discount_transfer_pct: number;
          id: string;
          is_active: boolean;
          is_featured: boolean;
          name: string;
          price_usd: number;
          sku: string;
          slug: string;
          sort_order: number;
          specs: Json;
          stock_status: Database["public"]["Enums"]["stock_status"];
          updated_at: string;
        };
        Insert: {
          brand?: string;
          category_id: string;
          created_at?: string;
          description?: string;
          discount_transfer_pct?: number;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          name: string;
          price_usd: number;
          sku: string;
          slug: string;
          sort_order?: number;
          specs?: Json;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
        };
        Update: {
          brand?: string;
          category_id?: string;
          created_at?: string;
          description?: string;
          discount_transfer_pct?: number;
          id?: string;
          is_active?: boolean;
          is_featured?: boolean;
          name?: string;
          price_usd?: number;
          sku?: string;
          slug?: string;
          sort_order?: number;
          specs?: Json;
          stock_status?: Database["public"]["Enums"]["stock_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      store_config: {
        Row: {
          accent_color: string;
          rate_mode: Database["public"]["Enums"]["rate_mode"];
          rate_auto: number | null;
          rate_auto_at: string | null;
          rate_source: string;
          banner_path: string | null;
          banner_title: string;
          id: boolean;
          logo_path: string | null;
          payment_note: string;
          rate_updated_at: string;
          shipping_note: string;
          socials: Json;
          store_name: string;
          updated_at: string;
          usd_rate: number;
          warranty_note: string;
          whatsapp_number: string;
        };
        Insert: {
          accent_color?: string;
          rate_mode?: Database["public"]["Enums"]["rate_mode"];
          rate_auto?: number | null;
          rate_auto_at?: string | null;
          rate_source?: string;
          banner_path?: string | null;
          banner_title?: string;
          id?: boolean;
          logo_path?: string | null;
          payment_note?: string;
          rate_updated_at?: string;
          shipping_note?: string;
          socials?: Json;
          store_name?: string;
          updated_at?: string;
          usd_rate: number;
          warranty_note?: string;
          whatsapp_number?: string;
        };
        Update: {
          accent_color?: string;
          rate_mode?: Database["public"]["Enums"]["rate_mode"];
          rate_auto?: number | null;
          rate_auto_at?: string | null;
          rate_source?: string;
          banner_path?: string | null;
          banner_title?: string;
          id?: boolean;
          logo_path?: string | null;
          payment_note?: string;
          rate_updated_at?: string;
          shipping_note?: string;
          socials?: Json;
          store_name?: string;
          updated_at?: string;
          usd_rate?: number;
          warranty_note?: string;
          whatsapp_number?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      products_public: {
        Row: {
          brand: string | null;
          category_id: string | null;
          category_name: string | null;
          category_slug: string | null;
          colors: Json | null;
          cover_path: string | null;
          created_at: string | null;
          description: string | null;
          discount_transfer_pct: number | null;
          has_capacities: boolean | null;
          id: string | null;
          is_featured: boolean | null;
          max_price_usd: number | null;
          min_price_usd: number | null;
          name: string | null;
          sku: string | null;
          slug: string | null;
          sort_order: number | null;
          specs: Json | null;
          stock_status: Database["public"]["Enums"]["stock_status"] | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_order: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_items: Json;
          p_note?: string;
          p_prefix: string;
          p_total_ars: number;
          p_usd_rate: number;
        };
        Returns: string;
      };
      dashboard_metrics: {
        Args: { p_days?: number };
        Returns: Json;
      };
      track_event: {
        Args: {
          p_kind: string;
          p_meta?: Json;
          p_path?: string;
          p_product_id?: string;
          p_session?: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      analytics_event_kind:
        | "page_view"
        | "product_view"
        | "whatsapp_click"
        | "agent_query";
      order_status: "new" | "contacted" | "closed" | "lost";
      rate_mode: "auto" | "manual";
      stock_status: "in_stock" | "on_demand" | "out_of_stock";
    };
    CompositeTypes: Record<never, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never;

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never;

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Update: infer U } ? U : never;

export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
