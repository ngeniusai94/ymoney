import type { AuthIdFormProps } from './AuthIdPage.type'

/** 아이디 회원가입 화면의 정적 UI를 렌더링합니다. */
export default function AuthIdCreate({ is_submitting, notice, on_submit, on_login }: AuthIdFormProps & { on_login: () => void }) {
  return (
    <section className="auth-content" aria-labelledby="auth-title">
      <button className="auth-back" type="button" onClick={on_login}><span aria-hidden="true">‹</span>아이디 로그인</button>
      <header className="auth-heading">
        <p className="auth-brand">가계부 톡톡</p>
        <h1 id="auth-title">아이디로 시작하기</h1>
        <p>아이디와 비밀번호로 바로 가입할 수 있어요.</p>
      </header>
      <form className="auth-form" onSubmit={on_submit}>
        <label className="auth-field">
          <span>아이디</span>
          <input name="user_id" type="text" placeholder="영문·숫자·밑줄 4~20자" autoComplete="username" autoCapitalize="none" spellCheck={false} minLength={4} maxLength={20} required />
        </label>
        <label className="auth-field">
          <span>비밀번호</span>
          <input name="password" type="password" minLength={8} placeholder="8자 이상 입력" autoComplete="new-password" required />
        </label>
        <label className="auth-field">
          <span>닉네임</span>
          <input name="nickname" type="text" maxLength={20} placeholder="(선택)" autoComplete="nickname" />
        </label>
        <button className="auth-submit" type="submit" disabled={is_submitting}>{is_submitting ? '가입 중...' : '가입하기'}</button>
      </form>
      <p className="auth-help" role="status" aria-live="polite">{notice || '비밀번호 찾기를 제공하지 않으니 안전하게 보관해주세요.'}</p>
    </section>
  )
}
