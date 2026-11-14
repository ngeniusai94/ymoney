import type { ReactNode } from 'react'
import { useState } from 'react'
import StatusToast from '../../../../components/StatusToast/StatusToast'
import { Link } from 'react-router-dom'
import LedgerTabs from '../../../ledgers/components/LedgerTabs'
import { get_ledger_display_name } from '../../../ledgers/ledgers.utils'
import { useCategoriesPage } from './useCategoriesPage'
import ReorderHandle from '../../../../components/ReorderHandle/ReorderHandle'
import type { ReorderTarget } from '../../../../components/ReorderHandle/ReorderHandle'
import type { ManagedCategory } from '../../categories.utils'
import './CategoriesPage.css'

/** 선택한 가계부의 카테고리 그룹·상위·하위를 승인 목업 구조로 보여줍니다. */
function CategoriesPage() {
  const page = useCategoriesPage()
  const [drop_target, set_drop_target] = useState<{ id: string; side: 'before' | 'after' } | null>(null)

  function reorder_handle(category: ManagedCategory, siblings: ManagedCategory[], scope: string, level: 'parent' | 'child') {
    const id = category.category_id
    const from = siblings.findIndex(item => item.category_id === id)
    const target_index = (target: ReorderTarget | null) => {
      if (target?.scope !== scope) return -1
      return siblings.findIndex(item => item.category_id === target.id)
    }

    return <ReorderHandle className="categories-more" target_selector={`[data-reorder-${level}]`}
      name={category.category_name} disabled={page.is_reordering}
      on_preview={(target) => {
        const to = target_index(target)
        const side = from < to ? 'after' : 'before'
        const next = target && to >= 0 && to !== from ? { id: target.id, side } as const : null
        set_drop_target(current => current?.id === next?.id && current?.side === next?.side ? current : next)
      }}
      on_drop={(target) => {
        const to = target_index(target)
        if (to < 0) {
          page.reorder_toast.show('그룹 내에서만 이동할 수 있습니다.')
          return
        }
        void page.reorder_categories(siblings, from, to)
      }}
      on_step={(direction) => void page.reorder_categories(siblings, from, from + direction)} />
  }

  function drop_side(id: string) {
    if (drop_target?.id === id) return drop_target.side
  }
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
            <div className="categories-parent-block" key={item.category_id} data-reorder-parent=""
              data-reorder-id={item.category_id} data-reorder-scope={`group:${section.group_id ?? 'none'}`}
              data-drop-side={drop_side(item.category_id)}>
              <div className="categories-parent-row">
                <button type="button" className="categories-edit-name" aria-label={`${item.category_name} 수정`} onClick={() => page.open_edit_sheet(item)}><strong>{item.category_name}</strong></button>
                {item.is_active ? null : <small className="categories-inactive">비활성</small>}
                {item.is_active ? <button type="button" className="categories-child-add" aria-label={`${item.category_name} 하위 카테고리 추가`} onClick={() => page.open_add_child_sheet(item)}>＋</button> : null}
                {reorder_handle(item, section.items, `group:${section.group_id ?? 'none'}`, 'parent')}
              </div>
              {item.children.map((child) => (
                <div className="categories-child-row" key={child.category_id} data-reorder-child=""
                  data-reorder-id={child.category_id} data-reorder-scope={`parent:${item.category_id}`}
                  data-drop-side={drop_side(child.category_id)}>
                  <span aria-hidden="true">└</span>
                  <button type="button" className="categories-edit-name" aria-label={`${child.category_name} 수정`} onClick={() => page.open_edit_sheet(child)}>{child.category_name}</button>
                  {child.is_active ? null : <small className="categories-inactive">비활성</small>}
                  {reorder_handle(child, item.children, `parent:${item.category_id}`, 'child')}
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
        <LedgerTabs
          label="관리할 가계부 선택"
          options={page.ledgers.map(ledger => ({ id: ledger.ledger_id, name: get_ledger_display_name(ledger, page.nickname) }))}
          selected_id={page.selected_ledger?.ledger_id ?? null}
          on_select={page.choose_ledger}
        />
        <div className="categories-list-toolbar">
          <h2 className="categories-list-heading">카테고리 그룹</h2>
          <button type="button" onClick={page.open_add_group_sheet}>＋ 그룹 추가</button>
        </div>
        {content}
      </div>
      <StatusToast message={page.reorder_toast.message} />
      {page.selected_ledger ? (
        <button type="button" className="categories-add-button" aria-label="카테고리 추가" onClick={page.open_add_sheet}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      ) : null}
      {page.sheet_state !== 'closed' ? (
        <div className={`categories-sheet-backdrop bottom-sheet-${page.sheet_phase}`} onClick={(event) => {
          if (event.target === event.currentTarget) page.close_add_sheet()
        }}>
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
