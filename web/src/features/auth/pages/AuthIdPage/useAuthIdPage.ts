import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthErrorMessage, signInWithId, signUpWithId } from '../../auth.api'
import type { AuthIdMode } from './AuthIdPage.type'

/** 아이디 로그인·가입 화면의 모드, 제출, 이동 동작을 관리합니다. */
export function useAuthIdPage() {
  const navigate = useNavigate()
  const [auth_mode, set_auth_mode] = useState<AuthIdMode>('login')
  const [is_submitting, set_is_submitting] = useState(false)
  const [notice, set_notice] = useState('')

  /** 모드를 바꾸면 이전 폼에서 발생한 안내 문구를 초기화합니다. */
  function change_mode(next_mode: AuthIdMode) {
    set_auth_mode(next_mode)
    set_notice('')
  }

  /** 현재 폼의 입력을 읽어 가입 또는 로그인을 수행합니다. */
  async function handle_submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form_data = new FormData(event.currentTarget)
    const user_id = String(form_data.get('user_id') ?? '')
    const password = String(form_data.get('password') ?? '')
    set_is_submitting(true)
    set_notice('')

    try {
      if (auth_mode === 'signup') {
        const nickname = String(form_data.get('nickname') ?? '').trim() || '톡톡'
        await signUpWithId({ user_id, password, nickname })
        window.alert('가입이 완료되었습니다.')
        change_mode('login')
        return
      }

      await signInWithId(user_id, password)
      navigate('/app/calendar', { replace: true })
    } catch (error) {
      set_notice(getAuthErrorMessage(error))
    } finally {
      set_is_submitting(false)
    }
  }

  return { auth_mode, is_submitting, notice, change_mode, handle_submit }
}
