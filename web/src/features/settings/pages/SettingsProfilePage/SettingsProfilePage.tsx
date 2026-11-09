import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useSettingsProfilePage } from './useSettingsProfilePage'
import { SettingsAccountDelete } from './SettingsAccountDelete'
import './SettingsProfilePage.css'

/** 승인 프로필 화면. 중복 아바타 요약 없이 선택 닉네임/본인 로그인 정보만 제공합니다. */
function SettingsProfilePage() {
  const page = useSettingsProfilePage()
  let content: ReactNode = null
  let message: ReactNode = null
  if (page.message) message = <p className="profile-message" role="status">{page.message}</p>
  const is_busy = page.request_state !== 'idle'
  if (page.data_state === 'loading') content = <p className="profile-message" role="status">회원정보를 불러오고 있어요.</p>
  else if (page.data_state === 'error') content = <div className="profile-message" role="alert">
    회원정보를 불러오지 못했습니다.<button type="button" onClick={() => void page.query.refetch()}>다시 시도</button>
  </div>
  else if (page.data_state === 'ready') content = <>
    <h2>프로필</h2>
    <form className="profile-panel profile-form" onSubmit={(event) => { event.preventDefault(); void page.save_nickname() }}>
      <label htmlFor="profile-nickname">닉네임</label>
      <div className="profile-input"><input id="profile-nickname" value={page.nickname} maxLength={20} placeholder="(선택)"
        disabled={is_busy} onChange={(event) => page.set_nickname(event.target.value)} /><small>{page.nickname.length}/20</small></div>
      <p className="profile-help">비워두면 톡톡으로 저장합니다.</p>
      <button className="profile-save" type="submit" disabled={is_busy}>{page.save_label}</button>
    </form>
    {message}
    <h2>로그인 정보</h2>
    <div className="profile-panel profile-account"><strong>{page.account}</strong><span>{page.provider_label}</span></div>
    <p className="profile-help">연결된 로그인 수단의 변경·해제는 MVP에서 제공하지 않습니다.</p>
    <h2>계정</h2>
    <div className="profile-panel">
      <button type="button" className="profile-logout" onClick={() => void page.logout()} disabled={is_busy}>{page.logout_label}</button>
      <SettingsAccountDelete disabled={is_busy} />
    </div>
  </>
  return <section className="profile-screen" aria-label="내 정보 관리">
    <header className="profile-topbar"><Link to="/app/settings" aria-label="설정으로 이동">‹</Link><h1>내 정보 관리</h1><span /></header>
    <div className="profile-body">{content}</div>
  </section>
}
export default SettingsProfilePage
