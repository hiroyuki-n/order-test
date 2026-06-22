<script setup lang="ts">
const { isUnlocked } = useAppAuth()

const cards = [
  {
    to: '/store',
    role: 'store' as const,
    title: '店舗画面',
    desc: '商品と数量を選んで発注し、自店舗の注文ステータスをリアルタイムで確認します。',
    accent: 'from-rose-500 to-pink-500',
    icon: '🏪',
  },
  {
    to: '/factory',
    role: 'factory' as const,
    title: '製造画面 (KDS)',
    desc: '全店舗の注文を古い順に表示。確認・製造中・完了のステータスを切り替えます。',
    accent: 'from-sky-500 to-indigo-500',
    icon: '👨\u200d🍳',
  },
  {
    to: '/admin',
    role: 'admin' as const,
    title: '管理ダッシュボード',
    desc: '本日の総注文数や、商品別・店舗別の発注数サマリーを確認します。',
    accent: 'from-emerald-500 to-teal-500',
    icon: '📊',
  },
]
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-12">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-800">受発注・KDS システム</h1>
      <p class="mt-2 text-slate-500">
        複数店舗からの発注を製造拠点で一元管理し、ステータスをリアルタイム同期します。
      </p>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="group rounded-2xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
      >
        <div
          class="w-12 h-12 rounded-xl bg-gradient-to-br text-white text-2xl grid place-items-center mb-4"
          :class="card.accent"
        >
          {{ card.icon }}
        </div>
        <div class="flex items-center gap-2">
          <h2 class="font-semibold text-slate-800">{{ card.title }}</h2>
          <span
            v-if="isUnlocked(card.role)"
            class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700"
          >
            ログイン済
          </span>
        </div>
        <p class="mt-2 text-sm text-slate-500 leading-relaxed">{{ card.desc }}</p>
        <span class="mt-4 inline-block text-sm font-medium text-brand-600 group-hover:underline">
          開く →
        </span>
      </NuxtLink>
    </div>
  </div>
</template>
