import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthProvider'
import { loadCurrentProfile } from '../../../auth/auth.api'
import { sign_out_current_device, update_nickname } from '../../profile.api'

export function useSettingsProfilePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const query_client = useQueryClient()
  const [draft_nickname, set_draft_nickname] = useState<string | null>(null)
  const [request_state, set_request_state] = useState<'idle' | 'saving' | 'signing-out'>('idle')
  const [message, set_message] = useState('')
  // 보호 레이아웃과 같은 캐시를 공유하여 별도의 프로필 상태를 중복 관리하지 않습니다.
  const query = useQuery({
    queryKey: ['app-profile', session?.user.id ?? 'signed-out'],
    queryFn: () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      return loadCurrentProfile(session.user.id)
    },
    enabled: Boolean(session),
  })
  let data_state: 'loading' | 'error' | 'ready' = 'ready'
  if (query.isPending) data_state = 'loading'
  else if (query.isError || !query.data) data_state = 'error'
  const nickname = draft_nickname ?? query.data?.nickname ?? ''
  let account = session?.user.email ?? '계정 정보 없음'
  let provider_label = '소셜 로그인'
  const provider = session?.user.app_metadata.provider
  if (provider === 'email') {
    provider_label = '아이디 로그인'
    if (account.endsWith('@ymoney.com')) account = account.slice(0, -'@ymoney.com'.length)
  } else if (provider === 'apple') provider_label = 'Apple 로그인'
  else if (provider === 'kakao') provider_label = '카카오 로그인'
  let save_label = '저장'
  let logout_label = '로그아웃'
  if (request_state === 'saving') save_label = '저장 중...'
  else if (request_state === 'signing-out') logout_label = '로그아웃 중...'

  async function save_nickname() {
    if (!session || request_state !== 'idle') return
    set_request_state('saving')
    set_message('')
    try {
      const profile = await update_nickname(session.user.id, nickname)
      query_client.setQueryData(['app-profile', session.user.id], profile)
      set_draft_nickname(null)
      // 개인 가계부 이름과 그룹 멤버 닉네임을 재조회합니다.
      await Promise.all([
        query_client.invalidateQueries({ queryKey: ['category-management', 'ledgers'] }),
        query_client.invalidateQueries({ queryKey: ['payment-management', 'ledgers'] }),
        query_client.invalidateQueries({ queryKey: ['expense-entry', 'ledgers'] }),
        query_client.invalidateQueries({ queryKey: ['groups'] }),
        query_client.invalidateQueries({ queryKey: ['calendar', 'filter-options'] }),
      ])
      set_message('닉네임을 저장했습니다.')
    } catch (error) {
      set_message(error instanceof Error ? error.message : '닉네임을 저장하지 못했습니다.')
    } finally { set_request_state('idle') }
  }
  async function logout() {
    if (request_state !== 'idle') return
    if (!window.confirm('로그아웃할까요?')) return
    set_request_state('signing-out')
    set_message('')
    try {
      await sign_out_current_device()
      await query_client.cancelQueries()
      query_client.clear()
      navigate('/auth', { replace: true })
    } catch (error) {
      set_message(error instanceof Error ? error.message : '로그아웃하지 못했습니다.')
      set_request_state('idle')
    }
  }
  return { query, data_state, nickname, set_nickname: set_draft_nickname, request_state, message,
    account, provider_label, save_label, logout_label, save_nickname, logout }
}
