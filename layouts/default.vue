<script setup lang="ts">
const route = useRoute()
const { unlocked, logout } = useAppAuth()

const navItems = [
  { to: '/store', label: '店舗', icon: '🏪' },
  { to: '/factory', label: '製造 (KDS)', icon: '👨\u200d🍳' },
  { to: '/admin', label: '管理', icon: '📊' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <NuxtLink to="/" class="font-bold text-slate-800 flex items-center gap-2">
          <span class="text-xl">🍮</span>
          <span>受発注 / KDS</span>
        </NuxtLink>

        <nav class="flex items-center gap-1">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="
              route.path === item.to
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            "
          >
            <span class="mr-1">{{ item.icon }}</span>{{ item.label }}
          </NuxtLink>
          <button
            v-if="unlocked.length"
            class="ml-2 px-3 py-1.5 rounded-md text-sm text-slate-500 hover:bg-slate-100"
            @click="logout()"
          >
            ログアウト
          </button>
        </nav>
      </div>
    </header>

    <main class="flex-1 w-full">
      <slot />
    </main>
  </div>
</template>
