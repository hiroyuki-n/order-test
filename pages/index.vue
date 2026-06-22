<script setup lang="ts">
const cards = [
  {
    to: '/store',
    title: '店舗画面',
    desc: '商品と数量を選んで発注し、自店舗の注文ステータスをリアルタイムで確認します。',
  },
  {
    to: '/factory',
    title: '製造画面',
    desc: '全店舗の注文を古い順に表示。確認・製造中・完了のステータスを切り替えます。',
  },
  {
    to: '/admin',
    title: '管理ダッシュボード',
    desc: '本日の総注文数や、商品別・店舗別の発注数サマリーを確認します。',
  },
]
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-12">
    <div class="text-center mb-10">
      <h1 class="text-3xl font-bold text-slate-800">受発注システム</h1>
      <p class="mt-2 text-slate-500">
        複数店舗からの発注を製造拠点で一元管理し、ステータスをリアルタイム同期します。
      </p>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="card in cards"
        :key="card.to"
        :to="card.to"
        class="rounded-2xl bg-white border border-slate-200 p-6"
      >
        <h2 class="font-semibold text-slate-800">{{ card.title }}</h2>
        <p class="mt-2 text-sm text-slate-500 leading-relaxed">{{ card.desc }}</p>
      </NuxtLink>
    </div>
  </div>
</template>
