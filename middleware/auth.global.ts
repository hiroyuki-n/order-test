import type { AppRole } from '~/composables/useAppAuth'

// 各ルートに必要なロールのマッピング
const ROUTE_ROLE: Record<string, AppRole> = {
  '/store': 'store',
  '/factory': 'factory',
  '/admin': 'admin',
}

export default defineNuxtRouteMiddleware((to) => {
  const requiredRole = ROUTE_ROLE[to.path]
  if (!requiredRole) return // 保護対象外（/ や /login）

  const { isUnlocked } = useAppAuth()
  if (!isUnlocked(requiredRole)) {
    return navigateTo({
      path: '/login',
      query: { role: requiredRole, redirect: to.path },
    })
  }
})
