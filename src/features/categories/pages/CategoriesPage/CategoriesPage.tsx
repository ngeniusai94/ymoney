import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { get_ledger_display_name } from '../../../ledgers/ledgers.utils'
import { useCategoriesPage } from './useCategoriesPage'
import './CategoriesPage.css'

/** 선택한 가계부의 카테고리 그룹·상위·하위를 승인 목업 구조로 보여줍니다. */
function CategoriesPage() {
  const page = useCategoriesPage()
  let content: ReactNode
  let disable_action: ReactNode = null
  if (page.editing_category && page.sheet_state !== 'closed') {
    let action_label = '비활성화'
    if (page.editing_category.is_active === false) action_label = '활성화'
    disable_action = <button type="button" className="categories-sheet-disable" disabled={page.sheet_state.endsWith('saving')} onClick={() => void page.disable_category()}>{action_label}</button>
  }
  if (page.editing_group && page.sheet_state !== 'closed') {
    let action_label = '비활성화'
    if (page.editing_group.is_active === false) action_label = '활성화'
    disable_action = <button type="button" className="categories-sheet-disable" disabled={page.sheet_state.endsWith('saving')} onClick={() => void page.disable_group()}>{action_label}</button>
  }

  if (page.ledger_query.isPending) {
    content = <p className="categories-state" role="status">가계부를 불러오고 있어요.</p>
  } else if (page.ledger_query.isError) {
    content = <p className="categories-state is-error" role="alert">가계부를 불러오지 못했습니다.</p>
  } else if (page.ledgers.length === 0) {
    content = <p className="categories-state">관리할 가계부가 없습니다.</p>
  } else if (page.category_query.isPending) {
    content = <p className="categories-state" role="status">카테고리를 불러오고 있어요.</p>
  } else if (page.category_query.isError) {
    content = <div className="categories-state is-error" role="alert">카테고리를 불러오지 못했습니다.<button type="button" onClick={() => void page.category_query.refetch()}>다시 시도</button></div>
  } else if (page.category_query.data.categories.length === 0) {
    content = <p className="categories-state">아직 카테고리가 없어요.</p>
  } else {
    content = page.sections.map((section) => (
      <section className="categories-section" key={section.group_id ?? 'ungrouped'}>
        <div className="categories-group-card">
          {section.group_name !== null ? (
            <header className="categories-group-head">
              <button type="button" className="categories-edit-name" aria-label={`${section.group_name} 그룹 수정`} onClick={() => { if (section.group_id) page.open_edit_group_sheet(section.group_id) }}><strong>{section.group_name}</strong></button>
              <small>{section.items.length}개</small>
              <small className="categories-inactive">{section.group_status}</small>
            </header>
          ) : null}
          {section.items.map((item) => (
            <div className="categories-parent-block" key={item.category_id}>
              <div className="categories-parent-row">
                <button type="button" className="categories-edit-name" aria-label={`${item.category_name} 수정`} onClick={() => page.open_edit_sheet(item)}><strong>{item.category_name}</strong></button>
                {item.is_active ? null : <small className="categories-inactive">비활성</small>}
                {item.is_active ? <button type="button" className="categories-child-add" aria-label={`${item.category_name} 하위 카테고리 추가`} onClick={() => page.open_add_child_sheet(item)}>＋</button> : null}
                <button type="button" className="categories-more" aria-label={`${item.category_name} 메뉴`} onClick={() => page.open_edit_sheet(item)}>⋮</button>
              </div>
              {item.children.map((child) => (
                <div className="categories-child-row" key={child.category_id}>
                  <span aria-hidden="true">└</span>
                  <button type="button" className="categories-edit-name" aria-label={`${child.category_name} 수정`} onClick={() => page.open_edit_sheet(child)}>{child.category_name}</button>
                  {child.is_active ? null : <small className="categories-inactive">비활성</small>}
                  <button type="button" className="categories-more" aria-label={`${child.category_name} 메뉴`} onClick={() => page.open_edit_sheet(child)}>⋮</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    ))
  }

  return (
    <section className="categories-screen" aria-label="카테고리 관리">
      <header className="categories-topbar">
        <Link to="/app/settings" aria-label="설정으로 이동">‹</Link>
        <h1>카테고리 관리</h1>
        <span aria-hidden="true" />
      </header>
      <div className="categories-body">
        <div className="categories-ledger-label">관리할 가계부</div>
        <div className="categories-ledger-picker">
          <strong>{page.selected_ledger
            ? get_ledger_display_name(page.selected_ledger, page.nickname)
            : '가계부를 불러오는 중'}</strong>
          <select
            className="categories-ledger-select"
            aria-label="관리할 가계부 선택"
            value={page.selected_ledger?.ledger_id ?? ''}
            onChange={(event) => page.choose_ledger(event.target.value)}
            disabled={page.ledgers.length === 0}
          >
            {page.ledgers.length === 0 ? <option value="">선택</option> : null}
            {page.ledgers.map((ledger) => (
              <option key={ledger.ledger_id} value={ledger.ledger_id}>
                {get_ledger_display_name(ledger, page.nickname)}
              </option>
            ))}
          </select>
        </div>
        <div className="categories-list-toolbar">
          <h2 className="categories-list-heading">카테고리 그룹</h2>
          <button type="button" onClick={page.open_add_group_sheet}>＋ 그룹 추가</button>
        </div>
        {content}
      </div>
      {page.selected_ledger ? (
        <button type="button" className="categories-add-button" aria-label="카테고리 추가" onClick={page.open_add_sheet}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      ) : null}
      {page.sheet_state !== 'closed' ? (
        <div className="categories-sheet-backdrop">
          <form className="categories-sheet" role="dialog" aria-modal="true" aria-labelledby="categories-sheet-title" onSubmit={(event) => { event.preventDefault(); void (page.sheet_state.startsWith('group-') ? page.save_group() : page.save_category()) }}>
            <div className="categories-sheet-handle" aria-hidden="true" />
            <div className="categories-sheet-heading">
              <h2 id="categories-sheet-title">{page.sheet_title}</h2>
              <button type="button" aria-label="닫기" onClick={page.close_add_sheet} disabled={page.sheet_state.endsWith('saving')}>×</button>
            </div>
            {page.sheet_state.startsWith('group-') ? (
              <>
                <label className="categories-sheet-label" htmlFor="new-category-group-name">이름</label>
                <input id="new-category-group-name" className="categories-sheet-input" value={page.new_group_name} onChange={(event) => page.set_new_group_name(event.target.value)} maxLength={30} placeholder="새 그룹 이름" autoFocus />
              </>
            ) : page.sheet_state.startsWith('child-') ? (
              <>
                <p className="categories-child-parent-name">{page.child_parent?.category_name}</p>
                <label className="categories-sheet-label" htmlFor="new-child-category-name">이름</label>
                <input id="new-child-category-name" className="categories-sheet-input" value={page.new_name} onChange={(event) => page.set_new_name(event.target.value)} maxLength={30} placeholder="새 하위 카테고리" autoFocus />
              </>
            ) : (
              <>
                <label className="categories-sheet-label" htmlFor="new-category-name">이름</label>
                <input id="new-category-name" className="categories-sheet-input" value={page.new_name} onChange={(event) => page.set_new_name(event.target.value)} maxLength={30} placeholder="새 카테고리" autoFocus />
                <div className="categories-sheet-label">카테고리 그룹 · 선택사항</div>
                <div className="categories-sheet-groups" role="group" aria-label="카테고리 그룹 선택">
                  {(page.category_query.data?.groups ?? []).filter((group) => group.is_active).map((group) => (
                    <button key={group.category_group_id} type="button" className={page.new_group_id === group.category_group_id ? 'is-selected' : ''} aria-pressed={page.new_group_id === group.category_group_id} onClick={() => page.toggle_group(group.category_group_id)}>{group.group_name}</button>
                  ))}
                </div>
              </>
            )}
            {page.form_error ? <p className="categories-sheet-error" role="alert">{page.form_error}</p> : null}
            <button type="submit" className="categories-sheet-save" disabled={page.sheet_state.endsWith('saving')}>
              {page.sheet_state.endsWith('saving') ? '저장 중...' : '저장'}
            </button>
            {disable_action}
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default CategoriesPage
