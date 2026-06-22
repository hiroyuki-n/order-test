<script setup lang="ts">
import type { Database, Product, Store } from '~/types/database.types'

const supabase = useSupabaseClient<Database>()

// ----------------------------------------------------------
// マスタ取得（店舗・商品）
// ----------------------------------------------------------
const stores = ref<Store[]>([])
const products = ref<Product[]>([])

// 選択中の店舗（Cookie に保持して再訪問時も維持）
const selectedStoreId = useCookie<number | null>('store-selected-id', { default: () => null })

// 数量の入力状態（product_id -> quantity）
const quantities = reactive<Record<number, number>>({})

const { orders, loading, createOrder } = useOrders({ storeId: selectedStoreId })

const submitting = ref(false)
const toast = ref('')

onMounted(async () => {
  const [{ data: storeData }, { data: productData }] = await Promise.all([
    supabase.from('stores').select('*').order('id'),
    supabase.from('products').select('*').order('id'),
  ])
  stores.value = storeData ?? []
  products.value = productData ?? []
  productData?.forEach((p) => (quantities[p.id] = 0))
})

const selectedStore = computed(() =>
  stores.value.find((s) => s.id === selectedStoreId.value) ?? null,
)

const totalSelected = computed(() =>
  Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0),
)

const inc = (id: number) => (quantities[id] = (quantities[id] || 0) + 1)
const dec = (id: number) => (quantities[id] = Math.max(0, (quantities[id] || 0) - 1))

const submitOrder = async () => {
  if (!selectedStoreId.value || totalSelected.value === 0) return
  const items = Object.entries(quantities)
    .filter(([, q]) => q > 0)
    .map(([product_id, quantity]) => ({ product_id: Number(product_id), quantity }))

  submitting.value = true
  try {
    await createOrder(selectedStoreId.value, items)
    products.value.forEach((p) => (quantities[p.id] = 0))
    showToast('発注しました')
  } catch (e) {
    showToast((e as Error).message)
  } finally {
    submitting.value = false
  }
}

const showToast = (msg: string) => {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 2500)
}

const productName = (id: number) => products.value.find((p) => p.id === id)?.name ?? `商品#${id}`
const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold text-slate-800 mb-6">🏪 店舗画面</h1>

    <!-- 店舗選択 -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex flex-wrap items-center gap-3">
      <label class="text-sm font-medium text-slate-600">利用する店舗:</label>
      <select
        v-model="selectedStoreId"
        class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option :value="null" disabled>店舗を選択してください</option>
        <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <span v-if="selectedStore" class="text-sm text-emerald-600 font-medium">
        {{ selectedStore.name }} として利用中
      </span>
    </div>

    <div v-if="!selectedStoreId" class="text-center text-slate-400 py-16">
      まず店舗を選択してください。
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <!-- 発注フォーム -->
      <section class="bg-white rounded-xl border border-slate-200 p-5">
        <h2 class="font-semibold text-slate-800 mb-4">発注する商品</h2>
        <ul class="divide-y divide-slate-100">
          <li v-for="p in products" :key="p.id" class="flex items-center justify-between py-3">
            <div>
              <p class="font-medium text-slate-800">{{ p.name }}</p>
              <p class="text-xs text-slate-400">¥{{ p.price.toLocaleString() }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button class="w-8 h-8 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" @click="dec(p.id)">−</button>
              <span class="w-8 text-center font-medium">{{ quantities[p.id] || 0 }}</span>
              <button class="w-8 h-8 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50" @click="inc(p.id)">＋</button>
            </div>
          </li>
        </ul>
        <button
          :disabled="totalSelected === 0 || submitting"
          class="mt-5 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-medium py-2.5 rounded-lg transition-colors"
          @click="submitOrder"
        >
          {{ submitting ? '送信中…' : `発注する（${totalSelected} 点）` }}
        </button>
      </section>

      <!-- 注文履歴（リアルタイム） -->
      <section class="bg-white rounded-xl border border-slate-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-slate-800">注文履歴・ステータス</h2>
          <span class="flex items-center gap-1.5 text-xs text-slate-400">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> リアルタイム同期中
          </span>
        </div>

        <p v-if="loading" class="text-slate-400 text-sm py-8 text-center">読み込み中…</p>
        <p v-else-if="!orders.length" class="text-slate-400 text-sm py-8 text-center">まだ注文がありません。</p>

        <ul v-else class="space-y-3 max-h-[60vh] overflow-y-auto">
          <li
            v-for="order in [...orders].reverse()"
            :key="order.id"
            class="border border-slate-150 rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs text-slate-400">#{{ order.id }} ・ {{ formatTime(order.created_at) }}</span>
              <StatusBadge :status="order.status" />
            </div>
            <ul class="text-sm text-slate-700 space-y-0.5">
              <li v-for="item in order.order_items" :key="item.id" class="flex justify-between">
                <span>{{ item.products?.name ?? productName(item.product_id) }}</span>
                <span class="text-slate-500">× {{ item.quantity }}</span>
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </div>

    <!-- トースト -->
    <Transition name="fade">
      <div v-if="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm px-4 py-2 rounded-full shadow-lg">
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.border-slate-150 {
  border-color: #eef1f5;
}
</style>
