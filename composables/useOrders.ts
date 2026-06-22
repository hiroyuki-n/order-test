import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database, OrderStatus, OrderWithDetails } from '~/types/database.types'

// 注文＋店舗名＋明細＋商品名 をまとめて取得する select 文
const ORDER_SELECT = `
  id, store_id, status, created_at, updated_at,
  stores ( id, name ),
  order_items ( id, order_id, product_id, quantity, products ( id, name, price ) )
`

interface UseOrdersOptions {
  /** 指定した店舗の注文のみを購読・取得する（店舗画面用） */
  storeId?: MaybeRefOrGetter<number | null>
}

/**
 * 注文の取得 + Supabase Realtime 購読をまとめた composable。
 * orders / order_items テーブルの変更を購読し、変更があった注文だけを
 * 取得し直して一覧を最新の状態に保つ。
 */
export const useOrders = (options: UseOrdersOptions = {}) => {
  const supabase = useSupabaseClient<Database>()

  const orders = ref<OrderWithDetails[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  let channel: RealtimeChannel | null = null

  const currentStoreId = () => {
    const v = options.storeId ? toValue(options.storeId) : null
    return v ?? null
  }

  // 注文を作成日時の昇順（古い順）に並べる
  const sortOrders = () => {
    orders.value.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
  }

  /** 全件（または店舗で絞り込み）取得 */
  const fetchAll = async () => {
    loading.value = true
    error.value = null
    let query = supabase
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: true })

    const storeId = currentStoreId()
    if (storeId) query = query.eq('store_id', storeId)

    const { data, error: err } = await query
    if (err) {
      error.value = err.message
    } else {
      orders.value = (data ?? []) as unknown as OrderWithDetails[]
    }
    loading.value = false
  }

  /** 1件だけ取得し直して一覧へ反映（Realtime 受信時に利用） */
  const refetchOne = async (orderId: number) => {
    const { data } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .eq('id', orderId)
      .maybeSingle()

    if (!data) return
    const order = data as unknown as OrderWithDetails

    // 店舗画面では対象店舗以外は無視
    const storeId = currentStoreId()
    if (storeId && order.store_id !== storeId) return

    const idx = orders.value.findIndex((o) => o.id === order.id)
    if (idx === -1) orders.value.push(order)
    else orders.value[idx] = order
    sortOrders()
  }

  const removeOne = (orderId: number) => {
    orders.value = orders.value.filter((o) => o.id !== orderId)
  }

  // ----------------------------------------------------------
  // Realtime 購読
  // ----------------------------------------------------------
  const subscribe = () => {
    channel = supabase
      .channel('orders-realtime')
      // orders テーブルの変更（INSERT / UPDATE / DELETE）
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            removeOne((payload.old as { id: number }).id)
          } else {
            refetchOne((payload.new as { id: number }).id)
          }
        },
      )
      // order_items の変更があれば、親注文を取得し直す
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        (payload) => {
          const row = (payload.new ?? payload.old) as { order_id: number }
          if (row?.order_id) refetchOne(row.order_id)
        },
      )
      .subscribe()
  }

  // ----------------------------------------------------------
  // 書き込み系
  // ----------------------------------------------------------

  /** 新規発注を作成（注文 + 明細をまとめて登録） */
  const createOrder = async (
    storeId: number,
    items: { product_id: number; quantity: number }[],
  ) => {
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({ store_id: storeId, status: 'ordered' })
      .select('id')
      .single()
    if (orderErr || !order) throw new Error(orderErr?.message ?? '注文の作成に失敗しました')

    const rows = items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
    }))
    const { error: itemErr } = await supabase.from('order_items').insert(rows)
    if (itemErr) throw new Error(itemErr.message)

    return order.id
  }

  /** 注文ステータスを更新 */
  const updateStatus = async (orderId: number, status: OrderStatus) => {
    const { error: err } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    if (err) throw new Error(err.message)
  }

  // ----------------------------------------------------------
  // ライフサイクル
  // ----------------------------------------------------------
  onMounted(async () => {
    await fetchAll()
    subscribe()
  })

  onBeforeUnmount(() => {
    if (channel) supabase.removeChannel(channel)
  })

  // 店舗 ID が動的に変わる場合は取得し直す
  if (options.storeId) {
    watch(
      () => toValue(options.storeId!),
      () => fetchAll(),
    )
  }

  return { orders, loading, error, fetchAll, createOrder, updateStatus }
}
