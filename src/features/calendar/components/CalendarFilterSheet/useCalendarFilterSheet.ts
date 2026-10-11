import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../auth/AuthProvider'
import type { LedgerScope } from '../../../ledgers/ledgers.api'
import { get_calendar_filter_options } from '../../filter.api'
import { get_ledger_selection, toggle_filter_ids } from '../../filter.utils'
import type { CalendarFilters, FilterLedger } from '../../filter.utils'

export function useCalendarFilterSheet(initial_scope: LedgerScope, initial_filters: CalendarFilters, on_close: () => void) {
  const { session } = useAuth()
  const [scope, set_scope] = useState(initial_scope)
  const [filters, set_filters] = useState(initial_filters)
  const [collapsed_ids, set_collapsed_ids] = useState<string[]>([])
  const query = useQuery({
    queryKey: ['calendar', 'filter-options', session?.user.id ?? 'signed-out'],
    queryFn: () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      return get_calendar_filter_options(session.user.id)
    },
    enabled: Boolean(session),
    // 관리 화면의 수정/탈퇴 이후 다시 열 때 최신 항목을 읽습니다.
    staleTime: 0,
  })
  // 배경 달력은 고정하고 시트 내용만 스크롤합니다. 닫힐 때 원래 값을 복원합니다.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handle_key = (event: KeyboardEvent) => { if (event.key === 'Escape') on_close() }
    document.addEventListener('keydown', handle_key)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', handle_key)
    }
  }, [on_close])
  let data_state: 'loading' | 'error' | 'ready' = 'ready'
  if (query.isPending) data_state = 'loading'
  else if (query.isError) data_state = 'error'
  const ledgers = query.data ?? []
  const visible_ledgers = ledgers.filter((ledger) => scope === 'ALL' || ledger.ledger_type === scope)

  function toggle_ledger(ledger: FilterLedger) {
    set_filters((previous) => {
      const selected = get_ledger_selection(previous, ledger.ledger_id)
      const all_selected = selected.enabled && selected.category_ids === null && selected.payment_ids === null
      return { ...previous, [ledger.ledger_id]: { enabled: !all_selected, category_ids: null, payment_ids: null } }
    })
  }
  function toggle_items(ledger: FilterLedger, kind: 'category_ids' | 'payment_ids', ids: string[]) {
    const all_ids = kind === 'category_ids'
      ? ledger.categories.map((item) => item.category_id) : ledger.methods.map((item) => item.payment_method_id)
    set_filters((previous) => {
      const selected = get_ledger_selection(previous, ledger.ledger_id)
      let current_ids = selected[kind]
      if (!selected.enabled) current_ids = []
      return { ...previous, [ledger.ledger_id]: {
        ...selected, enabled: true, [kind]: toggle_filter_ids(current_ids, ids, all_ids),
      } }
    })
  }
  function toggle_collapsed(ledger_id: string) {
    set_collapsed_ids((previous) => {
      if (previous.includes(ledger_id)) return previous.filter((id) => id !== ledger_id)
      return [...previous, ledger_id]
    })
  }
  function reset() { set_scope('ALL'); set_filters({}) }
  return { query, data_state, scope, set_scope, filters, visible_ledgers, collapsed_ids,
    toggle_ledger, toggle_items, toggle_collapsed, reset }
}
