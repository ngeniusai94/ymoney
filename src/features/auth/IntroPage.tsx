import { useIntroPage } from './useIntroPage'

/**
 * 로그인 전에 사용할 인증 수단을 선택하는 인트로 화면입니다.
 * 아이디 인증은 연결됐으며 소셜 인증은 다음 단계에서 연결합니다.
 */
function IntroPage() {
  const page = useIntroPage()

  return (
    <main className="intro-page">
      <section className="intro-content" aria-labelledby="service-title">
        <header className="intro-heading">
          <h1 id="service-title">가계부 톡톡</h1>
          <p>함께 쓰기가 가능한 공유 가계부</p>
        </header>

        <img
          className="intro-art"
          src="/intro-illustration.svg"
          alt="비스듬한 지폐 뒤에 놓인 월간 가계부 달력"
        />

        <div className="intro-actions">
          <button className="social-button kakao-button" type="button" disabled={page.login_state === 'redirecting'} onClick={() => void page.login_kakao()}>
            <svg className="kakao-logo" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3C6.5 3 2 6.4 2 10.6c0 2.6 1.7 4.9 4.3 6.3L5.2 21l4.7-2.9c.7.1 1.4.2 2.1.2 5.5 0 10-3.4 10-7.7S17.5 3 12 3Z" /></svg>
            <span>카카오로 계속하기</span>
          </button>

          <button className="social-button" type="button" onClick={page.show_login_notice}>
            <svg className="apple-logo" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M16.7 12.5c0-2.1 1.7-3.1 1.8-3.2-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3.1-.7 1.4 0 1.9.7 3.1.7 1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.5-.1 0-2.8-1.1-2.8-3.8zM14.4 6.2c.6-.8 1.1-1.9 1-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.7-1.3z" />
            </svg>
            <span>Apple로 계속하기</span>
          </button>

          <div className="secondary-actions">
            <button type="button" onClick={page.move_to_id_login}>아이디 로그인</button>
            <span className="secondary-divider" aria-hidden="true" />
            <button type="button" onClick={page.show_preview_notice}>둘러보기</button>
          </div>

          <nav className="policy-actions" aria-label="서비스 정책">
            <button type="button" onClick={page.show_policy_notice}>이용약관</button>
            <button type="button" onClick={page.show_policy_notice}>개인정보처리방침</button>
          </nav>
        </div>

        <p className="intro-notice" role="status" aria-live="polite">{page.notice}</p>
      </section>
    </main>
  )
}

export default IntroPage
