import { Link } from 'react-router-dom'
import type { AuthIdFormProps } from './AuthIdPage.type'

/** 아이디 로그인 화면의 정적 UI를 렌더링합니다. */
export default function AuthIdLogin({ is_submitting, notice, on_submit, on_signup }: AuthIdFormProps & { on_signup: () => void }) {
  return (
    <section className="auth-content" aria-labelledby="auth-title">
      <Link className="auth-back" to="/auth"><span aria-hidden="true">‹</span>로그인 수단 선택</Link>
      <header className="auth-heading">
        <p className="auth-brand">가계부 톡톡</p>
        <h1 id="auth-title">아이디 로그인</h1>
        <p>가입한 아이디와 비밀번호를 입력해주세요.</p>
      </header>
      <form className="auth-form" onSubmit={on_submit}>
        <label className="auth-field">
          <span>아이디</span>
          <input name="user_id" type="text" placeholder="영문·숫자·밑줄 4~20자" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={4} maxLength={20} required />
        </label>
        <label className="auth-field">
          <span>비밀번호</span>
          <input name="password" type="password" placeholder="비밀번호" autoComplete="current-password" required />
        </label>
        <button className="auth-submit" type="submit" disabled={is_submitting}>{is_submitting ? '로그인 중...' : '로그인'}</button>
      </form>
      <div className="auth-links auth-links-center">
        <button className="auth-link-emphasis" type="button" onClick={on_signup}>회원가입</button>
      </div>
      <p className="auth-help" role="status" aria-live="polite">{notice}</p>
    </section>
  )
}
