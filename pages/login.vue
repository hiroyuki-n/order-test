<script setup lang="ts">
import type { AppRole } from '~/composables/useAppAuth'

const route = useRoute()
const router = useRouter()
const { login, ROLE_LABEL } = useAppAuth()

const role = computed<AppRole>(() => (route.query.role as AppRole) || 'store')
const redirect = computed(() => (route.query.redirect as string) || `/${role.value}`)

const password = ref('')
const errorMsg = ref('')
const submitting = ref(false)

const onSubmit = async () => {
  errorMsg.value = ''
  submitting.value = true
  const ok = login(role.value, password.value)
  submitting.value = false
  if (ok) {
    await router.push(redirect.value)
  } else {
    errorMsg.value = 'パスワードが正しくありません。'
    password.value = ''
  }
}
</script>

<template>
  <div class="max-w-md mx-auto px-4 py-16">
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">🔐</div>
        <h1 class="text-xl font-bold text-slate-800">
          「{{ ROLE_LABEL[role] }}」画面へのログイン
        </h1>
        <p class="text-sm text-slate-500 mt-1">アクセス用パスワードを入力してください。</p>
      </div>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-sm font-medium text-slate-600 mb-1">パスワード</label>
          <input
            v-model="password"
            type="password"
            autofocus
            class="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="••••••••"
          />
        </div>

        <p v-if="errorMsg" class="text-sm text-rose-600">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="submitting || !password"
          class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          ログイン
        </button>
      </form>

      <div class="mt-6 text-center">
        <NuxtLink to="/" class="text-sm text-slate-500 hover:underline">← トップへ戻る</NuxtLink>
      </div>
    </div>

    <p class="text-center text-xs text-slate-400 mt-4">
      初期パスワード（開発用）: store123 / factory123 / admin123
    </p>
  </div>
</template>
