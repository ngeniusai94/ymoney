import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthProvider'
import { ensure_personal_ledger } from '../../../ledgers/ledgers.api'
import type { LedgerScope } from '../../../ledgers/ledgers.api'
import { get_monthly_transactions } from '../../../transactions/transactions.api'
import { get_calendar_start_date, get_local_date_key, get_month_days, move_month, resolve_calendar_data_state } from '../../calendar.utils'
import { matches_calendar_filters, parse_calendar_filters } from '../../filter.utils'
import type { CalendarFilters } from '../../filter.utils'

/** 달력 날짜 상태와 사용자·월별 원격 지출 조회를 조립합니다. */
export function useCalendarPage() {
  const { session } = useAuth()
  const [search_params, set_search_params] = useSearchParams()
  const applied_filters = parse_calendar_filters(search_params.get('filters'))
  const [filter_state, set_filter_state] = useState<'closed' | 'open'>('closed')
  // URL만을 선택 상태의 원본으로 두어 새로고침/뒤로가기 시 같은 범위를 복원합니다.
  const scope_param = search_params.get('scope')
  let ledger_scope: LedgerScope = 'ALL'
  if (scope_param === 'PERSONAL' || scope_param === 'GROUP') ledger_scope = scope_param
  const selected_date = get_calendar_start_date(search_params.get('date'))
  const visible_month = new Date(selected_date.getFullYear(), selected_date.getMonth(), 1)

  const calendar_days = get_month_days(visible_month)
  const month_label = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(visible_month)
  const selected_label = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(selected_date)
  const personal_ledger_query = useQuery({
    queryKey: ['personal-ledger-setup', session?.user.id ?? 'signed-out'],
    queryFn: () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      return ensure_personal_ledger()
    },
    enabled: Boolean(session),
    staleTime: Infinity,
  })
  const {
    data,
    isPending: is_monthly_loading,
    isError: is_monthly_error,
    refetch: refetch_monthly_transactions,
  } = useQuery({
    queryKey: [
      'calendar',
      'monthly-expenses',
      session?.user.id ?? 'signed-out',
      visible_month.getFullYear(),
      visible_month.getMonth(),
      ledger_scope,
      'with-payment-method',
    ],
    queryFn: () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      return get_monthly_transactions(session.user.id, visible_month.getFullYear(), visible_month.getMonth(), ledger_scope)
    },
    enabled: Boolean(session) && personal_ledger_query.isSuccess,
  })
  const has_ledger = data?.has_ledger ?? null
  const source_expenses = data?.expenses ?? []
  // 월 데이터를 캐시하고 상세 조건은 같은 배열에 적용합니다. 금액/목록 모두 이 결과만 사용합니다.
  const expenses = source_expenses.filter((expense) => matches_calendar_filters(expense, applied_filters))
  const selected_date_key = get_local_date_key(selected_date)
  const selected_expenses = expenses.filter((expense) => expense.trans_date === selected_date_key)
  const source_day_count = source_expenses.filter((expense) => expense.trans_date === selected_date_key).length
  const is_filtered_empty = ledger_scope !== 'ALL' || (source_day_count > 0 && selected_expenses.length === 0)
  const data_state = resolve_calendar_data_state({
    has_session: Boolean(session),
    is_ledger_loading: personal_ledger_query.isPending,
    is_ledger_error: personal_ledger_query.isError,
    is_monthly_loading,
    is_monthly_error,
    has_ledger,
    expense_count: selected_expenses.length,
  })

  async function refetch() {
    if (personal_ledger_query.isError) {
      await personal_ledger_query.refetch()
      return
    }

    await refetch_monthly_transactions()
  }

  const month_total = expenses.reduce((total, expense) => total + expense.amount, 0)
  const selected_total = selected_expenses.reduce((total, expense) => total + expense.amount, 0)
  const daily_totals = new Map<string, number>()

  for (const expense of expenses) {
    daily_totals.set(expense.trans_date, (daily_totals.get(expense.trans_date) ?? 0) + expense.amount)
  }

  function change_month(month_delta: number) {
    const next_date = move_month(selected_date, month_delta)
    choose_date(next_date)
  }

  function choose_date(date: Date) {
    set_search_params((previous) => {
      const next = new URLSearchParams(previous)
      next.set('date', get_local_date_key(date))
      return next
    }, { replace: true })
  }

  const close_filter = useCallback(() => set_filter_state('closed'), [set_filter_state])
  function open_filter() { set_filter_state('open') }
  function apply_filter(scope: LedgerScope, filters: CalendarFilters) {
    set_search_params((previous) => {
      const next = new URLSearchParams(previous)
      next.set('scope', scope)
      next.set('date', get_local_date_key(selected_date))
      if (Object.keys(filters).length === 0) next.delete('filters')
      else next.set('filters', JSON.stringify(filters))
      return next
    }, { replace: true })
    close_filter()
  }

  function change_ledger_scope(value: string) {
    let next_scope: LedgerScope = 'ALL'
    if (value === 'PERSONAL' || value === 'GROUP') next_scope = value
    set_search_params((previous) => {
      const next = new URLSearchParams(previous)
      next.set('scope', next_scope)
      // 조회 범위만 바꿀 때도 현재 선택 날짜/월은 유지합니다.
      next.set('date', get_local_date_key(selected_date))
      return next
    }, { replace: true })
  }

  // 지출 추가/수정 후에도 현재 필터로 돌아오도록 조회 조건을 전달합니다.
  const expense_params = new URLSearchParams()
  expense_params.set('date', selected_date_key)
  expense_params.set('scope', ledger_scope)
  if (Object.keys(applied_filters).length > 0) expense_params.set('filters', JSON.stringify(applied_filters))

  return {
    calendar_days,
    expense_query: expense_params.toString(),
    applied_filters,
    filter_state,
    open_filter,
    close_filter,
    apply_filter,
    is_filtered_empty,
    ledger_scope,
    change_ledger_scope,
    change_month,
    choose_date,
    daily_totals,
    data_state,
    has_ledger,
    month_label,
    month_total,
    refetch,
    selected_date,
    selected_date_key,
    selected_expenses,
    selected_label,
    selected_total,
    visible_month,
  }
}
