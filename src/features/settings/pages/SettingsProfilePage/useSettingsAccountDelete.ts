import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../auth/AuthProvider'
import { reauthenticate_account, sign_out_current_device, withdraw_account } from '../../profile.api'
import { start_kakao_withdrawal_reauth, unlink_kakao_account } from '../../kakao-withdrawal.api'
import { clear_withdrawal_intent, read_withdrawal_intent } from '../../../auth/withdrawal-intent'

/** 비밀번호/삭제 확인은 메모리에만 보관하며 각 단계를 통째로 전환합니다. */
export function useSettingsAccountDelete() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const query_client = useQueryClient()
  const is_kakao = Boolean(session?.user.identities?.some((identity) => identity.provider === 'kakao'))
  const initial_stage = is_kakao ? 'kakao' : 'password'
  const [stage, set_stage] = useState<'password' | 'kakao' | 'confirmation' | 'complete'>(initial_stage)
  const [password, set_password] = useState('')
  const [confirmation, set_confirmation] = useState('')
  const [message, set_message] = useState('')
  const [is_busy, set_is_busy] = useState(false)
  // ref는 같은 프레임의 연속 제출도 차단합니다. React 상태는 화면 표시용입니다.
  const request_lock = useRef(false)
  const expected_uuid = useRef('')
  const verified_at = useRef(0)
  // 연결 해제 성공 후 DB 응답 실패 시 동일 모달에서는 연결 해제를 반복하지 않습니다.
  const kakao_unlinked = useRef(false)
  const intent = read_withdrawal_intent()
  const resume_ready = new URLSearchParams(location.search).get('withdrawal') === 'ready'
    && intent?.user_uuid === session?.user.id && Boolean(intent?.verified_at)

  function reset() {
    if (request_lock.current) return
    expected_uuid.current = session?.user.id ?? ''
    verified_at.current = 0
    kakao_unlinked.current = false
    const pending = read_withdrawal_intent()
    let next_stage: typeof stage = initial_stage
    if (resume_ready && pending?.verified_at && Date.now() - pending.verified_at < 5 * 60 * 1000) {
      verified_at.current = pending.verified_at
      next_stage = 'confirmation'
    }
    clear_withdrawal_intent()
    set_stage(next_stage); set_password(''); set_confirmation(''); set_message('')
  }

  function close() {
    if (request_lock.current) return
    clear_withdrawal_intent()
    reset()
    if (new URLSearchParams(location.search).has('withdrawal')) navigate('/app/settings/profile', { replace: true })
  }

  async function submit() {
    if (request_lock.current || stage === 'complete') return
    if (!expected_uuid.current || session?.user.id !== expected_uuid.current) {
      set_message('로그인 계정이 변경되었습니다. 창을 닫고 다시 로그인해주세요.'); return
    }
    request_lock.current = true
    set_is_busy(true); set_message('')
    try {
      if (stage === 'kakao') {
        await start_kakao_withdrawal_reauth(expected_uuid.current)
      } else if (stage === 'password') {
        await reauthenticate_account(expected_uuid.current, password)
        verified_at.current = Date.now()
        set_password(''); set_stage('confirmation')
      } else {
        if (Date.now() - verified_at.current >= 5 * 60 * 1000) {
          set_stage(initial_stage); set_confirmation('')
          throw new Error('확인 시간이 지났습니다. 본인 확인을 다시 진행해주세요.')
        }
        if (is_kakao && !kakao_unlinked.current) {
          try { await unlink_kakao_account(expected_uuid.current) }
          catch (error) { set_stage('kakao'); set_confirmation(''); throw error }
          kakao_unlinked.current = true
        }
        await withdraw_account(expected_uuid.current, confirmation)
        // 성공 이후에는 삭제를 다시 요청하지 않습니다. 로그아웃 실패도 삭제 실패로 바꾸지 않습니다.
        set_stage('complete'); set_confirmation('')
        await finish()
      }
    } catch (error) {
      let error_message = error instanceof Error ? error.message : '요청을 처리하지 못했습니다.'
      if (kakao_unlinked.current) error_message = `카카오 연결은 해제되었습니다. ${error_message} 삭제 확인을 다시 시도하거나 창을 닫고 다시 로그인해주세요.`
      set_message(error_message)
    } finally {
      request_lock.current = false; set_is_busy(false)
    }
  }

  async function finish() {
    try {
      await sign_out_current_device()
      await query_client.cancelQueries()
      query_client.clear()
      window.alert('계정이 삭제되었습니다.')
      navigate('/auth', { replace: true })
    } catch {
      set_message('계정은 삭제되었습니다. 현재 기기 로그아웃을 다시 시도해주세요.')
    }
  }
  return { stage, is_kakao, resume_ready, password, set_password, confirmation, set_confirmation, message, is_busy, reset, close, submit, finish }
}
