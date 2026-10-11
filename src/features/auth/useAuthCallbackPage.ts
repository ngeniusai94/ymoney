import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { complete_social_login } from './auth.api'

/** SDK 세션 복원 후 Auth/tb_user가 모두 준비됐을 때만 달력으로 이동합니다. */
export function useAuthCallbackPage() {
  const { session, is_loading, initialization_error } = useAuth()
  const navigate = useNavigate()
  const url = new URL(window.location.href)
  const fragment = new URLSearchParams(url.hash.slice(1))
  const oauth_error = url.searchParams.has('error') || fragment.has('error')
  const query = useQuery({
    queryKey: ['auth', 'social-profile', session?.user.id ?? 'signed-out'],
    queryFn: complete_social_login,
    enabled: Boolean(session && !is_loading && !oauth_error && !initialization_error),
    staleTime: Infinity,
    retry: false,
  })
  let page_state: 'loading' | 'error' | 'ready' = 'loading'
  let message = '잠시만 기다려주세요.'
  if (oauth_error || initialization_error || (!is_loading && !session)) {
    page_state = 'error'
    message = '로그인이 취소되었거나 인증을 완료하지 못했습니다. 다시 시도해주세요.'
  } else if (query.isError) {
    page_state = 'error'
    message = query.error.message
  } else if (query.isSuccess) page_state = 'ready'
  useEffect(() => {
    if (page_state === 'ready') navigate('/app/calendar', { replace: true })
  }, [page_state, navigate])
  return { page_state, message }
}
