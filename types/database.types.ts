// =============================================================
// Supabase スキーマに対応する TypeScript 型定義
// （supabase gen types typescript で自動生成も可能だが、ここでは手書き）
// =============================================================

export type OrderStatus = 'ordered' | 'checked' | 'cooking' | 'completed'

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: { id: number; name: string; created_at: string }
        Insert: { id?: number; name: string; created_at?: string }
        Update: { id?: number; name?: string; created_at?: string }
        Relationships: []
      }
      products: {
        Row: { id: number; name: string; price: number; created_at: string }
        Insert: { id?: number; name: string; price?: number; created_at?: string }
        Update: { id?: number; name?: string; price?: number; created_at?: string }
        Relationships: []
      }
      orders: {
        Row: {
          id: number
          store_id: number
          status: OrderStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          store_id: number
          status?: OrderStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          store_id?: number
          status?: OrderStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: { id: number; order_id: number; product_id: number; quantity: number }
        Insert: { id?: number; order_id: number; product_id: number; quantity?: number }
        Update: { id?: number; order_id?: number; product_id?: number; quantity?: number }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      order_status: OrderStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ------------------------------------------------------------
// アプリ内で扱いやすい派生型
// ------------------------------------------------------------
export type Store = Database['public']['Tables']['stores']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']

// 明細＋商品名をまとめた表示用の型
export interface OrderItemWithProduct extends OrderItem {
  products: Pick<Product, 'id' | 'name' | 'price'> | null
}

// 注文＋店舗名＋明細をまとめた表示用の型
export interface OrderWithDetails extends Order {
  stores: Pick<Store, 'id' | 'name'> | null
  order_items: OrderItemWithProduct[]
}

// ステータスの表示ラベルと色（UI 共通利用）
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; badge: string; dot: string; next: OrderStatus | null }
> = {
  ordered: { label: '未確認', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', next: 'checked' },
  checked: { label: '確認済', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', next: 'cooking' },
  cooking: { label: '製造中', badge: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500', next: 'completed' },
  completed: { label: '完了', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', next: null },
}

export const ORDER_STATUS_ORDER: OrderStatus[] = ['ordered', 'checked', 'cooking', 'completed']
