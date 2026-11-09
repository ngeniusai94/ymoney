import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthErrorMessage, sign_in_with_kakao } from './auth.api'

/** 인트로의 이동/요청 상태를 UI와 분리합니다. */
export function useIntroPage() {
  const navigate = useNavigate()
  const [notice, set_notice] = useState('')
  const [login_state, set_login_state] = useState<'idle' | 'redirecting'>('idle')
  async function login_kakao() {
    if (login_state !== 'idle') return
    set_login_state('redirecting')
    set_notice('')
    try { await sign_in_with_kakao() }
    catch (error) { set_notice(getAuthErrorMessage(error)); set_login_state('idle') }
  }
  return { notice, login_state, login_kakao,
    show_login_notice: () => set_notice('Apple 로그인은 이후 단계에서 연결합니다.'),
    show_preview_notice: () => navigate('/preview/calendar'),
    move_to_id_login: () => navigate('/auth/id'),
    show_policy_notice: () => set_notice('약관 문서는 공개 배포 전에 연결합니다.'),
  }
}
