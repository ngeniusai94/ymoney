import { Link } from 'react-router-dom'
import { useAuthCallbackPage } from './useAuthCallbackPage'

/** 콜백은 상태별 안내만 렌더링하고 회원 연결은 전용 훅/API가 담당합니다. */
function AuthCallbackPage() {
  const page = useAuthCallbackPage()
  if (page.page_state === 'error') return <main className="auth-page"><section className="auth-result">
    <h1>로그인을 완료하지 못했어요</h1><p>{page.message}</p>
    <Link className="auth-result-link" to="/auth">로그인 수단 선택으로 이동</Link>
  </section></main>
  return <main className="auth-page"><section className="auth-result" aria-live="polite">
    <h1>로그인을 확인하고 있어요</h1><p>{page.message}</p>
  </section></main>
}
export default AuthCallbackPage
