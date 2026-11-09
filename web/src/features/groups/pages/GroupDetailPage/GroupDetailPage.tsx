import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useGroupDetailPage } from './useGroupDetailPage'
import '../GroupsPage/GroupsPage.css'
import './GroupDetailPage.css'

/** 승인 상세 레이아웃에 조회 가능한 실제 정보만 표시합니다. */
function GroupDetailPage() {
  const page = useGroupDetailPage()
  let content: ReactNode = null
  if (page.data_state === 'loading') content = <p className="groups-state" role="status">그룹을 불러오고 있어요.</p>
  else if (page.data_state === 'error') content = <div className="groups-state" role="alert">그룹을 불러오지 못했습니다.<button type="button" onClick={() => void page.query.refetch()}>다시 시도</button></div>
  else if (page.data_state === 'not-found') content = <p className="groups-state">접근할 수 있는 그룹이 없습니다.</p>
  else if (page.data_state === 'ready' && page.query.data) {
    const group = page.query.data
    let code: ReactNode = <p className="groups-note">등록된 초대 코드가 없습니다.</p>
    if (group.invite_code) code = <div className="group-code"><strong>{group.invite_code}</strong><button type="button" onClick={() => void page.copy_code()}>복사</button></div>
    let copy_message: ReactNode = null
    if (page.copy_message) copy_message = <p className="groups-note" role="status">{page.copy_message}</p>
    let leave_error: ReactNode = null
    if (page.leave_error) leave_error = <p className="group-form-error" role="alert">{page.leave_error}</p>
    let leave_label = '그룹 나가기'
    if (page.leave_state === 'leaving') leave_label = '처리 중...'
    const member_rows = group.members.map((member, index) => {
      let status = '참여 중'
      if (member.is_self) status = '나'
      let account = member.masked_account
      if (!account) account = '계정 정보 없음'
      return <div className="group-member" key={index}>
        <span className="groups-icon" aria-hidden="true">{member.nickname.slice(0, 1)}</span>
        <div className="group-member-info"><strong>{member.nickname}</strong><span>{account}</span></div>
        <span className="groups-note">{status}</span>
      </div>
    })
    content = <>
      <div className="groups-panel group-summary"><span className="groups-icon" aria-hidden="true">{group.ledger_name.slice(0, 1)}</span><strong>{group.ledger_name}</strong><button type="button" onClick={page.open_sheet}>이름 변경</button></div>
      <div className="groups-section-title"><span>멤버 · {group.members.length}명</span><button type="button" className="group-refresh" onClick={() => void page.query.refetch()}>새로고침</button></div>
      <div className="groups-panel">{member_rows}</div>
      <div className="groups-section-title"><span>초대</span><strong>최대 2명</strong></div>
      <div className="groups-panel group-invite"><strong>8자리 초대 코드</strong>{code}{copy_message}<p className="groups-note">받은 코드를 그룹 관리의 ‘코드로 참여’에 입력하세요.</p></div>
      <div className="groups-section-title">그룹에서 나가기</div>
      <div className="groups-panel group-danger-panel">
        <button type="button" className="group-leave" disabled={page.leave_state === 'leaving'} onClick={() => void page.leave()}>{leave_label}<span aria-hidden="true">›</span></button>
        <p className="groups-note">마지막 멤버가 나가면 그룹과 모든 가계부 데이터가 영구 삭제됩니다. 실행 전 다시 확인합니다.</p>
        {leave_error}
      </div>
    </>
  }
  let sheet: ReactNode = null
  if (page.sheet_state !== 'closed') {
    let error_message: ReactNode = null
    if (page.form_error) error_message = <p className="group-form-error" role="alert">{page.form_error}</p>
    sheet = <div className={`group-backdrop bottom-sheet-${page.sheet_phase}`} onClick={(event) => {
      if (event.target === event.currentTarget) page.close_sheet()
    }}><form className="group-sheet" role="dialog" aria-modal="true" aria-labelledby="group-name-title" onSubmit={(event) => { event.preventDefault(); void page.save_name() }}><header><h2 id="group-name-title">그룹 이름 변경</h2><button type="button" aria-label="닫기" disabled={page.sheet_state === 'saving'} onClick={page.close_sheet}>×</button></header><label htmlFor="group-name">이름</label><input id="group-name" value={page.group_name} onChange={(event) => page.set_group_name(event.target.value)} maxLength={30} disabled={page.sheet_state === 'saving'} autoFocus />{error_message}<button type="submit" className="group-save" disabled={page.sheet_state === 'saving'}>{page.save_label}</button></form></div>
  }
  return <section className="groups-screen" aria-label="그룹 상세"><header className="groups-topbar"><Link to="/app/settings/groups" aria-label="그룹 목록으로 이동">‹</Link><h1>그룹 상세</h1><span /></header><div className="groups-body">{content}</div>{sheet}</section>
}
export default GroupDetailPage
