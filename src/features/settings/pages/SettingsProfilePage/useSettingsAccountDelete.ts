import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../auth/AuthProvider'
import { reauthenticate_account, sign_out_current_device, withdraw_account } from '../../profile.api'

/** 비밀번호/삭제 확인은 메모리에만 보관하며 각 단계를 통째로 전환합니다. */
export function useSettingsAccountDelete() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const query_client = useQueryClient()
  const [stage, set_stage] = useState<'password' | 'confirmation' | 'complete'>('password')
  const [password, set_password] = useState('')
  const [confirmation, set_confirmation] = useState('')
  const [message, set_message] = useState('')
  const [is_busy, set_is_busy] = useState(false)
  // ref는 같은 프레임의 연속 제출도 차단합니다. React 상태는 화면 표시용입니다.
  const request_lock = useRef(false)
  const expected_uuid = useRef('')
  const verified_at = useRef(0)

  function reset() {
    if (request_lock.current) return
    expected_uuid.current = session?.user.id ?? ''
    verified_at.current = 0
    set_stage('password'); set_password(''); set_confirmation(''); set_message('')
  }

  async function submit() {
    if (request_lock.current || stage === 'complete') return
    if (!expected_uuid.current || session?.user.id !== expected_uuid.current) {
      set_message('로그인 계정이 변경되었습니다. 창을 닫고 다시 로그인해주세요.'); return
    }
    request_lock.current = true
    set_is_busy(true); set_message('')
    try {
      if (stage === 'password') {
        await reauthenticate_account(expected_uuid.current, password)
        verified_at.current = Date.now()
        set_password(''); set_stage('confirmation')
      } else {
        if (Date.now() - verified_at.current >= 5 * 60 * 1000) {
          set_stage('password'); set_confirmation('')
          throw new Error('확인 시간이 지났습니다. 비밀번호를 다시 입력해주세요.')
        }
        await withdraw_account(expected_uuid.current, confirmation)
        // 성공 이후에는 삭제를 다시 요청하지 않습니다. 로그아웃 실패도 삭제 실패로 바꾸지 않습니다.
        set_stage('complete'); set_confirmation('')
        await finish()
      }
    } catch (error) {
      set_message(error instanceof Error ? error.message : '요청을 처리하지 못했습니다.')
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
  return { stage, password, set_password, confirmation, set_confirmation, message, is_busy, reset, submit, finish }
}
