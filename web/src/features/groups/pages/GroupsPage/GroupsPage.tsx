import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useGroupsPage } from './useGroupsPage'
import './GroupsPage.css'
import '../GroupDetailPage/GroupDetailPage.css'

/** 승인된 B안 목록. 정원/멤버 정보는 실제 조회 연결 전에는 만들어 표시하지 않습니다. */
function GroupsPage() {
  const page = useGroupsPage()
  const is_saving = page.request_state === 'saving'
  let content: ReactNode = null
  if (page.data_state === 'loading') content = <p className="groups-state" role="status">그룹을 불러오고 있어요.</p>
  else if (page.data_state === 'error') content = <div className="groups-state" role="alert">그룹을 불러오지 못했습니다.<button type="button" onClick={() => void page.query.refetch()}>다시 시도</button></div>
  else if (page.data_state === 'empty') content = <p className="groups-state">아직 참여한 그룹이 없습니다.</p>
  else if (page.data_state === 'ready') content = <div className="groups-panel">{page.groups.map((group) => <Link className="groups-list-row" to={`/app/settings/groups/${group.ledger_id}`} key={group.ledger_id}><span className="groups-icon" aria-hidden="true">{group.ledger_name.slice(0, 1)}</span><strong>{group.ledger_name}</strong><span aria-hidden="true">›</span></Link>)}</div>
  // 모드별 입력 영역을 통째로 선택합니다. 상태/요청 흐름은 화면 훅에 둡니다.
  let sheet_fields: ReactNode = null
  let title = ''
  let save_label = ''
  if (page.sheet_mode === 'create') {
    title = '그룹 만들기'
    save_label = '만들기'
    sheet_fields = <>
      <label htmlFor="create-group-name">그룹명</label>
      <input id="create-group-name" value={page.group_name} onChange={(event) => page.set_group_name(event.target.value)}
        maxLength={30} placeholder="예: 여행통장" disabled={is_saving} autoFocus />
      <p className="groups-note">최대 30자 · 만든 사람이 첫 번째 멤버로 참여합니다.</p>
      <p className="group-sheet-summary">그룹을 만들면 8자리 초대 코드가 자동으로 생성됩니다. 그룹 상세에서 복사할 수 있어요.</p>
    </>
  } else if (page.sheet_mode === 'join') {
    title = '코드로 참여'
    save_label = '그룹 참여'
    sheet_fields = <>
      <label htmlFor="join-group-code">8자리 초대 코드</label>
      <input id="join-group-code" className="group-code-input" value={page.invite_code}
        onChange={(event) => page.set_invite_code(event.target.value)} maxLength={8} autoCapitalize="characters"
        autoComplete="off" spellCheck={false} disabled={is_saving} autoFocus />
      <p className="groups-note">대소문자 구분 없이 입력하거나 받은 코드를 붙여넣으세요.</p>
    </>
  }
  if (is_saving) save_label = '처리 중...'
  let form_error: ReactNode = null
  if (page.form_error) form_error = <p className="group-form-error" role="alert">{page.form_error}</p>
  let sheet: ReactNode = null
  if (page.sheet_mode !== 'closed') {
    sheet = <div className={`group-backdrop bottom-sheet-${page.sheet_phase}`} onClick={(event) => {
      if (event.target === event.currentTarget) page.close_sheet()
    }}>
      <form className="group-sheet" role="dialog" aria-modal="true" aria-labelledby="group-sheet-title"
        onSubmit={(event) => { event.preventDefault(); void page.submit_sheet() }}>
        <header><h2 id="group-sheet-title">{title}</h2>
          <button type="button" aria-label="닫기" disabled={is_saving} onClick={page.close_sheet}>×</button>
        </header>
        {sheet_fields}{form_error}
        <button type="submit" className="group-save" disabled={is_saving}>{save_label}</button>
      </form>
    </div>
  }
  return <section className="groups-screen" aria-label="그룹 관리">
    <header className="groups-topbar"><Link to="/app/settings" aria-label="설정으로 이동">‹</Link><h1>그룹 관리</h1><span /></header>
    <div className="groups-body">
      <div className="groups-quick">
        <button type="button" onClick={() => page.open_sheet('create')}>＋ 그룹 만들기</button>
        <button type="button" onClick={() => page.open_sheet('join')}>코드로 참여</button>
      </div>
      <div className="groups-section-title"><span>내 그룹</span><strong>{page.groups.length}개</strong></div>
      {content}
    </div>
    {sheet}
  </section>
}
export default GroupsPage
