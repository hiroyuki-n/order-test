<script setup lang="ts">
import { ORDER_STATUS_ORDER, type OrderStatus } from '~/types/database.types'

const { orders, loading } = useOrders()

const isToday = (iso: string) => {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

const todayOrders = computed(() => orders.value.filter((o) => isToday(o.created_at)))

// 本日の総注文数
const totalToday = computed(() => todayOrders.value.length)

// 本日の総アイテム数（数量合計）
const totalItemsToday = computed(() =>
  todayOrders.value.reduce(
    (sum, o) => sum + o.order_items.reduce((s, i) => s + i.quantity, 0),
    0,
  ),
)

// ステータス別の件数（本日）
const statusCounts = computed(() => {
  const c: Record<OrderStatus, number> = { ordered: 0, checked: 0, cooking: 0, completed: 0 }
  todayOrders.value.forEach((o) => (c[o.status] += 1))
  return c
})

// 商品別サマリー（本日・数量合計の多い順）
const productSummary = computed(() => {
  const map = new Map<string, number>()
  todayOrders.value.forEach((o) =>
    o.order_items.forEach((i) => {
      const name = i.products?.name ?? `商品#${i.product_id}`
      map.set(name, (map.get(name) ?? 0) + i.quantity)
    }),
  )
  return [...map.entries()].map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty)
})

const maxProductQty = computed(() => Math.max(1, ...productSummary.value.map((p) => p.qty)))

// 店舗別サマリー（本日・注文数とアイテム数）
const storeSummary = computed(() => {
  const map = new Map<string, { orders: number; items: number }>()
  todayOrders.value.forEach((o) => {
    const name = o.stores?.name ?? `店舗#${o.store_id}`
    const cur = map.get(name) ?? { orders: 0, items: 0 }
    cur.orders += 1
    cur.items += o.order_items.reduce((s, i) => s + i.quantity, 0)
    map.set(name, cur)
  })
  return [...map.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.orders - a.orders)
})

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-800">📊 管理ダッシュボード</h1>
      <span class="flex items-center gap-1.5 text-xs text-slate-400">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> リアルタイム集計
      </span>
    </div>

    <p v-if="loading" class="text-slate-400 text-center py-20">読み込み中…</p>

    <template v-else>
      <!-- KPI カード -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <p class="text-sm text-slate-500">本日の総注文数</p>
          <p class="text-3xl font-bold text-slate-800 mt-1">{{ totalToday }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <p class="text-sm text-slate-500">本日の総アイテム数</p>
          <p class="text-3xl font-bold text-slate-800 mt-1">{{ totalItemsToday }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <p class="text-sm text-slate-500">未対応（未確認＋確認済）</p>
          <p class="text-3xl font-bold text-rose-600 mt-1">
            {{ statusCounts.ordered + statusCounts.checked }}
          </p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 p-5">
          <p class="text-sm text-slate-500">完了</p>
          <p class="text-3xl font-bold text-emerald-600 mt-1">{{ statusCounts.completed }}</p>
        </div>
      </div>

      <!-- ステータス内訳 -->
      <div class="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-3">本日のステータス内訳</h2>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="s in ORDER_STATUS_ORDER"
            :key="s"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50"
          >
            <StatusBadge :status="s" />
            <span class="font-bold text-slate-800">{{ statusCounts[s] }}</span>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-2 mb-6">
        <!-- 商品別サマリー -->
        <section class="bg-white rounded-xl border border-slate-200 p-5">
          <h2 class="font-semibold text-slate-800 mb-4">商品別の発注数（本日）</h2>
          <p v-if="!productSummary.length" class="text-slate-400 text-sm">データがありません。</p>
          <ul v-else class="space-y-3">
            <li v-for="p in productSummary" :key="p.name">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-700">{{ p.name }}</span>
                <span class="font-semibold text-slate-900">{{ p.qty }}</span>
              </div>
              <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  class="h-full bg-brand-500 rounded-full transition-all"
                  :style="{ width: `${(p.qty / maxProductQty) * 100}%` }"
                />
              </div>
            </li>
          </ul>
        </section>

        <!-- 店舗別サマリー -->
        <section class="bg-white rounded-xl border border-slate-200 p-5">
          <h2 class="font-semibold text-slate-800 mb-4">店舗別の発注数（本日）</h2>
          <p v-if="!storeSummary.length" class="text-slate-400 text-sm">データがありません。</p>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="text-left text-slate-400 border-b border-slate-100">
                <th class="pb-2 font-medium">店舗</th>
                <th class="pb-2 font-medium text-right">注文数</th>
                <th class="pb-2 font-medium text-right">アイテム数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in storeSummary" :key="s.name" class="border-b border-slate-50">
                <td class="py-2 text-slate-700">{{ s.name }}</td>
                <td class="py-2 text-right font-semibold">{{ s.orders }}</td>
                <td class="py-2 text-right text-slate-500">{{ s.items }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <!-- 全注文ログ -->
      <section class="bg-white rounded-xl border border-slate-200 p-5">
        <h2 class="font-semibold text-slate-800 mb-4">全注文ログ（新しい順）</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-slate-400 border-b border-slate-100">
                <th class="pb-2 font-medium">#</th>
                <th class="pb-2 font-medium">店舗</th>
                <th class="pb-2 font-medium">内容</th>
                <th class="pb-2 font-medium">ステータス</th>
                <th class="pb-2 font-medium">発注日時</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in [...orders].reverse()" :key="o.id" class="border-b border-slate-50 align-top">
                <td class="py-2 text-slate-400">{{ o.id }}</td>
                <td class="py-2 text-slate-700">{{ o.stores?.name ?? `店舗#${o.store_id}` }}</td>
                <td class="py-2 text-slate-600">
                  <span v-for="(item, idx) in o.order_items" :key="item.id">
                    {{ item.products?.name ?? `商品#${item.product_id}` }}×{{ item.quantity }}<span v-if="idx < o.order_items.length - 1">, </span>
                  </span>
                </td>
                <td class="py-2"><StatusBadge :status="o.status" /></td>
                <td class="py-2 text-slate-400 whitespace-nowrap">{{ formatTime(o.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
