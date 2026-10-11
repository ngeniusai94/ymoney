import { Link } from 'react-router-dom'
import './SettingsPage.css'

type MenuIconName = 'profile' | 'theme' | 'category' | 'payment' | 'group'

/** 설정 목업의 작은 선 아이콘을 메뉴 항목에서 재사용합니다. */
function MenuIcon({ name }: { name: MenuIconName }) {
  if (name === 'profile') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
  if (name === 'theme') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1-2.1" /></svg>
  if (name === 'category') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM8 5v14M8 10h12M8 15h12" /></svg>
  if (name === 'payment') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h3" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20a6 6 0 0 1 12 0M14 15a5 5 0 0 1 7 4.5" /></svg>
}

/** 승인된 MVP 설정 메뉴입니다. 연결 전 기능은 준비 중으로 명시합니다. */
function SettingsPage() {
  return (
    <section className="settings-screen" aria-label="설정">
      <header className="settings-topbar"><h1>설정</h1></header>
      <div className="settings-sections">
        <section className="settings-section" aria-labelledby="settings-service-title">
          <h2 id="settings-service-title">서비스</h2>
          <div className="settings-menu">
            <Link className="settings-menu-row" to="/app/settings/profile"><span className="settings-row-icon"><MenuIcon name="profile" /></span><strong>내 정보 관리</strong><span className="settings-row-arrow" aria-hidden="true">›</span></Link>
            <Link className="settings-menu-row" to="/app/settings/theme"><span className="settings-row-icon"><MenuIcon name="theme" /></span><strong>테마 변경</strong><span className="settings-row-arrow" aria-hidden="true">›</span></Link>
          </div>
        </section>
        <section className="settings-section" aria-labelledby="settings-ledger-title">
          <h2 id="settings-ledger-title">가계부</h2>
          <div className="settings-menu">
            <Link className="settings-menu-row" to="/app/settings/categories"><span className="settings-row-icon"><MenuIcon name="category" /></span><strong>카테고리 관리</strong><span className="settings-row-arrow" aria-hidden="true">›</span></Link>
            <Link className="settings-menu-row" to="/app/settings/payment-methods"><span className="settings-row-icon"><MenuIcon name="payment" /></span><strong>결제수단 관리</strong><span className="settings-row-arrow" aria-hidden="true">›</span></Link>
          </div>
        </section>
        <section className="settings-section" aria-labelledby="settings-group-title">
          <h2 id="settings-group-title">그룹</h2>
          <div className="settings-menu">
            <Link className="settings-menu-row" to="/app/settings/groups"><span className="settings-row-icon"><MenuIcon name="group" /></span><strong>그룹 관리</strong><span className="settings-row-arrow" aria-hidden="true">›</span></Link>
          </div>
        </section>
      </div>
    </section>
  )
}

export default SettingsPage
