// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],

  css: ['~/assets/css/main.css'],

  // Cloudflare Workers 向けプリセット
  // （Workers Builds の `npx wrangler deploy` にゼロ設定で対応。
  //   Nitro が main エントリと assets を含む wrangler 設定を自動生成する）
  nitro: {
    preset: 'cloudflare_module',
  },

  supabase: {
    // @nuxtjs/supabase は既定で未ログイン時に /login へリダイレクトする。
    // 本アプリは独自の簡易パスワード認証を使うため、この自動リダイレクトは無効化する。
    redirect: false,
  },

  runtimeConfig: {
    public: {
      // 各画面のアクセス用パスワード（簡易認証）の既定値。
      // 実行時に環境変数 NUXT_PUBLIC_STORE_PASSWORD などがあれば自動で上書きされる。
      storePassword: 'store123',
      factoryPassword: 'factory123',
      adminPassword: 'admin123',
    },
  },
})
