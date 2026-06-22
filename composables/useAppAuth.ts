// =============================================================
// 簡易パスワード認証
// 各画面（store / factory / admin）ごとにパスワードを設定し、
// 解錠したロールを Cookie に保持する。
// ※ あくまで簡易的なアクセス制限。厳密な認証が必要なら Supabase Auth へ。
// =============================================================

export type AppRole = 'store' | 'factory' | 'admin'

export const ROLE_LABEL: Record<AppRole, string> = {
  store: '店舗',
  factory: '製造',
  admin: '管理',
}

export const useAppAuth = () => {
  const config = useRuntimeConfig()

  const passwords: Record<AppRole, string> = {
    store: config.public.storePassword as string,
    factory: config.public.factoryPassword as string,
    admin: config.public.adminPassword as string,
  }

  // 解錠済みロールを Cookie に保持（7日間）
  const unlocked = useCookie<AppRole[]>('app-unlocked-roles', {
    default: () => [],
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  })

  const isUnlocked = (role: AppRole) => unlocked.value.includes(role)

  /** パスワードを検証して合致すれば解錠する */
  const login = (role: AppRole, password: string): boolean => {
    if (password === passwords[role]) {
      if (!unlocked.value.includes(role)) {
        unlocked.value = [...unlocked.value, role]
      }
      return true
    }
    return false
  }

  const logout = (role?: AppRole) => {
    unlocked.value = role ? unlocked.value.filter((r) => r !== role) : []
  }

  return { unlocked, isUnlocked, login, logout, ROLE_LABEL }
}
