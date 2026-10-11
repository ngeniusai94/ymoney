import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { get_supabase_client } from '../../lib/supabase'
import { query_client } from '../../lib/queryClient'

type AuthContextValue = {
  session: Session | null
  is_loading: boolean
  initialization_error: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * 앱이 새로고침되어도 브라우저에 저장된 Supabase 세션을 복원합니다.
 * 로그인·로그아웃 이벤트가 발생하면 하위 화면에 최신 세션을 전달합니다.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [session, set_session] = useState<Session | null>(null)
  const [is_loading, set_is_loading] = useState(true)
  const [initialization_error, set_initialization_error] = useState<string | null>(null)

  useEffect(() => {
    let is_disposed = false
    let last_user_uuid: string | null = null
    const supabase = get_supabase_client()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next_session) => {
      const next_user_uuid = next_session?.user.id ?? null

      // 다른 계정으로 전환되거나 로그아웃하면 이전 사용자의 원격 데이터 캐시를 지웁니다.
      if (last_user_uuid && last_user_uuid !== next_user_uuid) {
        query_client.clear()
      }

      last_user_uuid = next_user_uuid
      if (!is_disposed) {
        set_session(next_session)
        set_is_loading(false)
      }
    })

    supabase.auth.getSession().then(({ data, error }) => {
      if (is_disposed) {
        return
      }

      if (error) {
        set_initialization_error('로그인 상태를 확인하지 못했습니다.')
      } else {
        set_session(data.session)
      }

      set_is_loading(false)
    })

    return () => {
      is_disposed = true
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, is_loading, initialization_error }}>
      {children}
    </AuthContext.Provider>
  )
}

/** AuthProvider가 관리하는 현재 로그인 상태를 하위 컴포넌트에서 사용합니다. */
export function useAuth() {
  const auth_context = useContext(AuthContext)

  if (!auth_context) {
    throw new Error('useAuth는 AuthProvider 내부에서 사용해야 합니다.')
  }

  return auth_context
}
