import type { LedgerSummary } from '../ledgers/ledgers.api'
import type { CategoryGroup, ManagedCategory } from '../categories/categories.utils'
import type { ManagedPaymentMethod } from '../payment-methods/payment-methods.api'

export type FilterLedger = LedgerSummary & {
  display_name: string
  groups: CategoryGroup[]
  categories: ManagedCategory[]
  methods: ManagedPaymentMethod[]
}
export type LedgerSelection = {
  enabled: boolean
  category_ids: string[] | null
  payment_ids: string[] | null
}
// null은 전체(새로 추가된 항목 포함), []는 전체 해제입니다. 두 상태를 혼동하지 않습니다.
export type CalendarFilters = Record<string, LedgerSelection>
export function get_ledger_selection(filters: CalendarFilters, ledger_id: string): LedgerSelection {
  return filters[ledger_id] ?? { enabled: true, category_ids: null, payment_ids: null }
}

/** URL 값은 숫자 ID와 선택 상태만 허용합니다. 개인정보/이름은 직렬화하지 않습니다. */
export function parse_calendar_filters(value: string | null): CalendarFilters {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const filters: CalendarFilters = {}
    for (const [ledger_id, raw] of Object.entries(parsed)) {
      if (!/^\d+$/.test(ledger_id) || !raw || typeof raw !== 'object') return {}
      const item = raw as LedgerSelection
      if (typeof item.enabled !== 'boolean') return {}
      for (const ids of [item.category_ids, item.payment_ids]) {
        if (ids === null) continue
        if (!Array.isArray(ids) || !ids.every((id) => typeof id === 'string' && /^\d+$/.test(id))) return {}
      }
      filters[ledger_id] = { enabled: item.enabled, category_ids: item.category_ids, payment_ids: item.payment_ids }
    }
    return filters
  } catch { return {} }
}

export function matches_calendar_filters(
  expense: { ledger_id: number | string; category_id: number | string; payment_method_id: number | string },
  filters: CalendarFilters,
): boolean {
  const selection = get_ledger_selection(filters, String(expense.ledger_id))
  if (!selection.enabled) return false
  if (selection.category_ids !== null && !selection.category_ids.includes(String(expense.category_id))) return false
  if (selection.payment_ids !== null && !selection.payment_ids.includes(String(expense.payment_method_id))) return false
  return true
}

export function get_selection_state(selected: string[] | null, ids: string[]): 'all' | 'some' | 'none' {
  if (ids.length === 0) return 'none'
  if (selected === null) return 'all'
  const count = ids.filter((id) => selected.includes(id)).length
  if (count === 0) return 'none'
  if (count === ids.length) return 'all'
  return 'some'
}

/** 부분 선택이면 대상 전체를 선택하고, 전체 선택이면 해당 대상만 해제합니다. */
export function toggle_filter_ids(selected: string[] | null, ids: string[], all_ids: string[]): string[] | null {
  const current = new Set(selected ?? all_ids)
  if (get_selection_state(selected, ids) === 'all') {
    for (const id of ids) current.delete(id)
  } else {
    for (const id of ids) current.add(id)
  }
  if (all_ids.length > 0 && all_ids.every((id) => current.has(id))) return null
  return [...current]
}
