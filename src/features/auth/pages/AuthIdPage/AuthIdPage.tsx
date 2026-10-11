import AuthIdCreate from './AuthIdCreate'
import AuthIdLogin from './AuthIdLogin'
import { useAuthIdPage } from './useAuthIdPage'
import './AuthIdPage.css'

/** 모드에 따라 로그인 폼 또는 회원가입 폼 전체를 보여줍니다. */
export default function AuthIdPage() {
  const { auth_mode, is_submitting, notice, change_mode, handle_submit } = useAuthIdPage()

  return (
    <main className="auth-page">
      {auth_mode === 'signup'
        ? <AuthIdCreate is_submitting={is_submitting} notice={notice} on_submit={handle_submit} on_login={() => change_mode('login')} />
        : <AuthIdLogin is_submitting={is_submitting} notice={notice} on_submit={handle_submit} on_signup={() => change_mode('signup')} />}
    </main>
  )
}
