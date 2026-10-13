import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { complete_social_login } from './auth.api'
import { read_withdrawal_intent } from './withdrawal-intent'
import { complete_kakao_withdrawal_reauth } from '../settings/kakao-withdrawal.api'

/** SDK 세션 복원 후 Auth/tb_user가 모두 준비됐을 때만 달력으로 이동합니다. */
export function useAuthCallbackPage() {
  const { session, is_loading, initialization_error } = useAuth()
  const navigate = useNavigate()
  const [withdrawal_intent] = useState(read_withdrawal_intent)
  const url = new URL(window.location.href)
  const fragment = new URLSearchParams(url.hash.slice(1))
  const oauth_error = url.searchParams.has('error') || fragment.has('error')
  const query = useQuery({
    queryKey: ['auth', withdrawal_intent ? 'withdrawal-reauth' : 'social-profile', session?.user.id ?? 'signed-out', withdrawal_intent?.started_at ?? 0],
    queryFn: async () => {
      if (withdrawal_intent) return complete_kakao_withdrawal_reauth()
      return complete_social_login()
    },
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
    if (page_state === 'ready') {
      let target = '/app/calendar'
      if (withdrawal_intent) target = '/app/settings/profile?withdrawal=ready'
      navigate(target, { replace: true })
    }
  }, [page_state, navigate, withdrawal_intent])
  return { page_state, message }
}
