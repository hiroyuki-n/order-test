<script setup lang="ts">
import {
  ORDER_STATUS_META,
  type OrderStatus,
  type OrderWithDetails,
} from '~/types/database.types'

const { orders, loading, updateStatus } = useOrders()

// 完了済みを表示に含めるかどうかのフィルタ
const showCompleted = ref(false)

const visibleOrders = computed<OrderWithDetails[]>(() =>
  orders.value.filter((o) => (showCompleted.value ? true : o.status !== 'completed')),
)

const counts = computed(() => {
  const c: Record<OrderStatus, number> = { ordered: 0, checked: 0, cooking: 0, completed: 0 }
  orders.value.forEach((o) => (c[o.status] += 1))
  return c
})

const updating = ref<number | null>(null)
const advance = async (order: OrderWithDetails) => {
  const next = ORDER_STATUS_META[order.status].next
  if (!next) return
  updating.value = order.id
  try {
    await updateStatus(order.id, next)
  } finally {
    updating.value = null
  }
}

const setStatus = async (order: OrderWithDetails, status: OrderStatus) => {
  if (order.status === status) return
  updating.value = order.id
  try {
    await updateStatus(order.id, status)
  } finally {
    updating.value = null
  }
}

// 経過時間（分）
const minutesAgo = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })

const statusButtons: { status: OrderStatus; label: string }[] = [
  { status: 'checked', label: '確認' },
  { status: 'cooking', label: '製造中' },
  { status: 'completed', label: '完了' },
]
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 class="text-2xl font-bold text-slate-800">製造画面</h1>
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-3 text-sm">
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-rose-500" />未確認 {{ counts.ordered }}</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500" />確認済 {{ counts.checked }}</span>
          <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-sky-500" />製造中 {{ counts.cooking }}</span>
        </div>
        <label class="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
          <input v-model="showCompleted" type="checkbox" class="rounded" />
          完了も表示
        </label>
      </div>
    </div>

    <p v-if="loading" class="text-slate-400 text-center py-20">読み込み中…</p>
    <p v-else-if="!visibleOrders.length" class="text-slate-400 text-center py-20">
      現在、対応中の注文はありません
    </p>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <article
        v-for="order in visibleOrders"
        :key="order.id"
        class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col"
      >
        <div class="flex items-center justify-between mb-2">
          <div>
            <p class="font-bold text-slate-800">{{ order.stores?.name ?? `店舗#${order.store_id}` }}</p>
            <p class="text-xs text-slate-400">#{{ order.id }} ・ {{ formatTime(order.created_at) }}</p>
          </div>
          <StatusBadge :status="order.status" />
        </div>

        <div class="text-xs text-slate-400 mb-2">{{ minutesAgo(order.created_at) }} 分前</div>

        <ul class="flex-1 space-y-1 mb-3 border-t border-slate-100 pt-2">
          <li
            v-for="item in order.order_items"
            :key="item.id"
            class="flex justify-between text-sm"
          >
            <span class="text-slate-700">{{ item.products?.name ?? `商品#${item.product_id}` }}</span>
            <span class="font-semibold text-slate-900">× {{ item.quantity }}</span>
          </li>
        </ul>

        <!-- ステータス変更ボタン -->
        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="btn in statusButtons"
            :key="btn.status"
            :disabled="updating === order.id"
            class="text-xs font-medium py-1.5 rounded-md transition-colors disabled:opacity-50"
            :class="
              order.status === btn.status
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            "
            @click="setStatus(order, btn.status)"
          >
            {{ btn.label }}
          </button>
        </div>

        <button
          v-if="ORDER_STATUS_META[order.status].next"
          :disabled="updating === order.id"
          class="mt-2 w-full text-sm font-medium py-2 rounded-md bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
          @click="advance(order)"
        >
          → 次へ進める（{{ ORDER_STATUS_META[ORDER_STATUS_META[order.status].next!].label }}）
        </button>
      </article>
    </div>
  </div>
</template>
