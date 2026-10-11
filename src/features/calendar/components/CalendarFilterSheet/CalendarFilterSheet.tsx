import type { ReactNode } from 'react'
import type { LedgerScope } from '../../../ledgers/ledgers.api'
import { build_category_sections } from '../../../categories/categories.utils'
import { get_ledger_selection, get_selection_state } from '../../filter.utils'
import type { CalendarFilters, FilterLedger } from '../../filter.utils'
import { useCalendarFilterSheet } from './useCalendarFilterSheet'
import './CalendarFilterSheet.css'

type SheetProps = {
  scope: LedgerScope
  filters: CalendarFilters
  on_close: () => void
  on_apply: (scope: LedgerScope, filters: CalendarFilters) => void
}

/** 전체/부분/미선택을 네이티브 체크박스의 checked/indeterminate로 표현합니다. */
function FilterCheck({ state, label, on_toggle }: {
  state: 'all' | 'some' | 'none'; label: string; on_toggle: () => void
}) {
  return <label className="filter-check">
    <input type="checkbox" checked={state === 'all'} onChange={on_toggle}
      ref={(element) => { if (element) element.indeterminate = state === 'some' }} />
    <span>{label}</span>
  </label>
}

function FilterLedgerCard({ ledger, page }: { ledger: FilterLedger; page: ReturnType<typeof useCalendarFilterSheet> }) {
  const selection = get_ledger_selection(page.filters, ledger.ledger_id)
  let category_ids = selection.category_ids
  let payment_ids = selection.payment_ids
  if (!selection.enabled) { category_ids = []; payment_ids = [] }
  let ledger_state: 'all' | 'some' | 'none' = 'none'
  if (selection.enabled) {
    ledger_state = 'some'
    if (category_ids === null && payment_ids === null) ledger_state = 'all'
    else if (category_ids?.length === 0 || payment_ids?.length === 0) ledger_state = 'none'
  }
  const expanded = !page.collapsed_ids.includes(ledger.ledger_id)
  let arrow = '›'
  if (expanded) arrow = '⌃'
  let details: ReactNode = null
  if (expanded) {
    const category_sections = build_category_sections(ledger.groups, ledger.categories)
    const category_content = category_sections.map((section) => {
      const section_ids = section.items.flatMap((item) => [item.category_id, ...item.children.map((child) => child.category_id)])
      let heading: ReactNode = null
      if (section.group_name) heading = <FilterCheck label={section.group_name}
        state={get_selection_state(category_ids, section_ids)}
        on_toggle={() => page.toggle_items(ledger, 'category_ids', section_ids)} />
      const chips = section.items.map((item) => {
        const ids = [item.category_id, ...item.children.map((child) => child.category_id)]
        const state = get_selection_state(category_ids, ids)
        let class_name = 'filter-chip'
        if (state === 'all') class_name += ' is-selected'
        else if (state === 'some') class_name += ' is-partial'
        let label = item.category_name
        if (!item.is_active) label += ' · 비활성'
        const children = item.children.map((child) => {
          const selected = get_selection_state(category_ids, [child.category_id]) === 'all'
          let child_class = 'filter-chip filter-child'
          if (selected) child_class += ' is-selected'
          let child_label = child.category_name
          if (!child.is_active) child_label += ' · 비활성'
          return <button type="button" className={child_class} aria-pressed={selected} key={child.category_id}
            onClick={() => page.toggle_items(ledger, 'category_ids', [child.category_id])}>{child_label}</button>
        })
        return <div className="filter-category-item" key={item.category_id}>
          <button type="button" className={class_name} aria-pressed={state === 'all'}
            onClick={() => page.toggle_items(ledger, 'category_ids', ids)}>{label}</button>
          <div className="filter-chips">{children}</div>
        </div>
      })
      let class_name = 'filter-category-section'
      if (section.group_id === null) class_name = 'filter-ungrouped'
      return <div className={class_name} key={section.group_id ?? 'ungrouped'}>{heading}<div className="filter-chips">{chips}</div></div>
    })
    const method_content = ([{ type: 'CARD', label: '카드' }, { type: 'CASH', label: '현금' }] as const).map((type) => {
      const methods = ledger.methods.filter((method) => method.method_type === type.type)
      if (methods.length === 0) return null
      const ids = methods.map((method) => method.payment_method_id)
      return <div className="filter-category-section" key={type.type}>
        <FilterCheck label={type.label} state={get_selection_state(payment_ids, ids)}
          on_toggle={() => page.toggle_items(ledger, 'payment_ids', ids)} />
        <div className="filter-chips">{methods.map((method) => {
          const selected = get_selection_state(payment_ids, [method.payment_method_id]) === 'all'
          let class_name = 'filter-chip'
          if (selected) class_name += ' is-selected'
          let label = method.method_name
          if (!method.is_active) label += ' · 비활성'
          return <button type="button" key={method.payment_method_id} className={class_name} aria-pressed={selected}
            onClick={() => page.toggle_items(ledger, 'payment_ids', [method.payment_method_id])}>{label}</button>
        })}</div>
      </div>
    })
    details = <div className="filter-ledger-details">
      <h3>카테고리</h3>{category_content}
      <h3 className="filter-payment-title">결제수단</h3>{method_content}
    </div>
  }
  return <section className="filter-ledger">
    <header className="filter-ledger-head">
      <FilterCheck label={ledger.display_name} state={ledger_state} on_toggle={() => page.toggle_ledger(ledger)} />
      <button type="button" aria-label={`${ledger.display_name} 접기·펼치기`} aria-expanded={expanded}
        onClick={() => page.toggle_collapsed(ledger.ledger_id)}>{arrow}</button>
    </header>
    {details}
  </section>
}

/** 승인 목업의 가계부별 접기/그룹 체크/칩/고정 적용 버튼을 사용합니다. */
function CalendarFilterSheet(props: SheetProps) {
  const page = useCalendarFilterSheet(props.scope, props.filters, props.on_close)
  let content: ReactNode
  if (page.data_state === 'loading') content = <p className="filter-state" role="status">필터 항목을 불러오고 있어요.</p>
  else if (page.data_state === 'error') content = <div className="filter-state" role="alert">
    필터 항목을 불러오지 못했습니다.<button type="button" onClick={() => void page.query.refetch()}>다시 시도</button>
  </div>
  else if (page.visible_ledgers.length === 0) content = <p className="filter-state">선택한 범위에 가계부가 없습니다.</p>
  else content = ([{ type: 'GROUP', label: '그룹' }, { type: 'PERSONAL', label: '개인' }] as const).map((section) => {
    const ledgers = page.visible_ledgers.filter((ledger) => ledger.ledger_type === section.type)
    if (ledgers.length === 0) return null
    return <div key={section.type}><div className="filter-scope-title"><strong>{section.label}</strong><span>{ledgers.length}개</span></div>
      {ledgers.map((ledger) => <FilterLedgerCard key={ledger.ledger_id} ledger={ledger} page={page} />)}
    </div>
  })
  return <div className="filter-backdrop">
    <section className="calendar-filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title">
      <header className="filter-sheet-head"><div className="filter-handle" /><div>
        <h2 id="filter-title">필터</h2><button type="button" onClick={page.reset}>초기화</button>
        <button type="button" aria-label="필터 닫기" onClick={props.on_close}>×</button>
      </div></header>
      <div className="filter-segments">{([{ value: 'ALL', label: '전체' }, { value: 'GROUP', label: '그룹' }, { value: 'PERSONAL', label: '개인' }] as const).map((scope) => {
        let class_name = ''
        if (scope.value === page.scope) class_name = 'is-selected'
        return <button type="button" className={class_name} key={scope.value} aria-pressed={scope.value === page.scope}
          onClick={() => page.set_scope(scope.value)}>{scope.label}</button>
      })}</div>
      <div className="filter-sheet-scroll">{content}</div>
      <footer><button type="button" disabled={page.data_state !== 'ready'}
        onClick={() => props.on_apply(page.scope, page.filters)}>선택한 조건으로 보기</button></footer>
    </section>
  </div>
}
export default CalendarFilterSheet
