import { useRef, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthProvider'
import { loadCurrentProfile } from '../../../auth/auth.api'
import { format_expense_total, get_calendar_start_date, get_local_date_key, move_month } from '../../../calendar/calendar.utils'
import { get_category_management_data } from '../../../categories/categories.api'
import type { LedgerScope } from '../../../ledgers/ledgers.api'
import { list_my_ledgers } from '../../../ledgers/ledgers.api'
import { get_monthly_transactions } from '../../../transactions/transactions.api'
import type { MonthlyExpense } from '../../../transactions/transactions.api'
import { filter_statistics_ledger, get_statistics_expense_details, get_statistics_months, summarize_categories, summarize_category_groups, summarize_payment_methods } from '../../statistics.utils'
import type { CategoryGroupAssignments, StatisticsExpenseSelection } from '../../statistics.utils'

export type CategoryGroupBreakdown =
  | { state: 'hidden' }
  | { state: 'error'; retry: () => void }
  | { state: 'ready'; groups: ReturnType<typeof summarize_categories>; assignments: CategoryGroupAssignments }

/** 월·범위별로 다시 마운트되는 통계 카드 안에서 목록 선택을 관리합니다. */
export function useStatisticsExpenseDetails(expenses: readonly MonthlyExpense[], assignments?: CategoryGroupAssignments) {
  const [selection, set_selection] = useState<StatisticsExpenseSelection | null>(null)
  const [editing_transaction_id, set_editing_transaction_id] = useState<string | null>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const details = selection === null ? null : get_statistics_expense_details(expenses, selection, assignments)

  function open_expenses(next_selection: StatisticsExpenseSelection, trigger: HTMLButtonElement) {
    opener.current = trigger
    trigger.focus({ preventScroll: true })
    set_selection(next_selection)
  }

  function close_expenses() {
    set_selection(null)
    opener.current?.focus({ preventScroll: true })
  }

  return {
    details, open_expenses, close_expenses, editing_transaction_id,
    edit_expense: (transaction_id: number) => set_editing_transaction_id(String(transaction_id)),
    close_editor: () => set_editing_transaction_id(null),
  }
}

/** URL의 월/범위를 원본으로 삼고, 달력과 동일한 월별 캐시 세 개를 구독합니다. */
export function useStatisticsPage() {
  const { session } = useAuth()
  const [params, set_params] = useSearchParams()
  const date = get_calendar_start_date(params.get('date'))
  const selected_month = new Date(date.getFullYear(), date.getMonth(), 1)
  const scope_param = params.get('scope')
  let scope: LedgerScope = 'ALL'
  if (scope_param === 'PERSONAL' || scope_param === 'GROUP') scope = scope_param
  const ledger_query = useQuery({
    // 관리 화면과 같은 결과/캐시를 사용해 그룹 생성·이름 변경·나가기 시 함께 갱신됩니다.
    queryKey: ['category-management', 'ledgers', session?.user.id ?? 'signed-out'],
    queryFn: async () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      const profile = await loadCurrentProfile(session.user.id)
      if (!profile) throw new Error('회원정보를 확인하지 못했습니다.')
      const ledgers = await list_my_ledgers(profile.user_srno)
      return { profile, ledgers }
    },
    enabled: Boolean(session),
  })
  const group_ledgers = (ledger_query.data?.ledgers ?? []).filter(ledger => ledger.ledger_type === 'GROUP')
  // 과거 scope=GROUP URL은 첫 그룹으로 복원하되, 명시한 ID가 사라졌으면 다른 그룹을 대신 표시하지 않습니다.
  const requested_group_id = params.get('ledger') ?? group_ledgers[0]?.ledger_id
  const selected_group = group_ledgers.find(ledger => ledger.ledger_id === requested_group_id)
  let selected_group_id: string | null = null
  if (scope === 'GROUP') selected_group_id = requested_group_id ?? null
  const scoped_ledgers = (ledger_query.data?.ledgers ?? []).filter(ledger => {
    if (scope === 'GROUP') return ledger.ledger_id === selected_group?.ledger_id
    return scope === 'ALL' || ledger.ledger_type === scope
  })
  const category_queries = useQueries({
    // 카테고리 관리의 캐시를 공유하여 그룹 이름·소속 변경을 통계에도 반영합니다.
    queries: scoped_ledgers.map(ledger => ({
      queryKey: ['category-management', 'categories', session?.user.id ?? 'signed-out', ledger.ledger_id],
      queryFn: () => get_category_management_data(ledger.ledger_id),
      enabled: Boolean(session),
    })),
  })
  const months = get_statistics_months(selected_month)
  const queries = useQueries({
    queries: months.map(month => ({
      // 지출 저장/수정/삭제의 기존 무효화 대상과 같아 별도 갱신 로직이 필요하지 않습니다.
      queryKey: ['calendar', 'monthly-expenses', session?.user.id ?? 'signed-out', month.getFullYear(), month.getMonth(), scope, 'with-payment-method'],
      queryFn: () => {
        if (!session) throw new Error('로그인이 필요합니다.')
        return get_monthly_transactions(session.user.id, month.getFullYear(), month.getMonth(), scope)
      },
      enabled: Boolean(session),
    })),
  })

  // 실패와 로딩을 별도 boolean JSX로 그리지 않고 한 상태만 선택해 화면에 전달합니다.
  let state: 'loading' | 'error' | 'no-ledger' | 'ready' = 'ready'
  if (ledger_query.isError || queries.some(query => query.isError)) state = 'error'
  else if (!session || ledger_query.isPending || queries.some(query => query.isPending)) state = 'loading'
  else if (scope === 'GROUP' && !selected_group) state = 'no-ledger'
  else if (queries[2].data?.has_ledger === false) state = 'no-ledger'

  const monthly_totals = months.map((month, index) => ({
    key: get_local_date_key(month),
    label: `${month.getMonth() + 1}월`,
    full_label: `${month.getFullYear()}년 ${month.getMonth() + 1}월`,
    amount: filter_statistics_ledger(queries[index].data?.expenses ?? [], selected_group_id).reduce((sum, expense) => sum + expense.amount, 0),
  }))
  const selected_expenses = filter_statistics_ledger(queries[2].data?.expenses ?? [], selected_group_id)
  const categories = summarize_categories(selected_expenses)
  // 이미 읽은 같은 월 배열을 집계하므로 결제 통계를 위한 추가 네트워크 요청은 없습니다.
  const payment_methods = summarize_payment_methods(selected_expenses)
  const month_label = `${selected_month.getFullYear()}년 ${selected_month.getMonth() + 1}월`
  let total_label = '—'
  if (state === 'ready') total_label = format_expense_total(monthly_totals[2].amount)

  function change_month(delta: number) {
    set_params(previous => {
      const next = new URLSearchParams(previous)
      next.set('date', get_local_date_key(move_month(selected_month, delta)))
      return next
    }, { replace: true })
  }

  function change_scope(value: string, ledger_id?: string) {
    if (value !== 'ALL' && value !== 'PERSONAL' && value !== 'GROUP') return
    if (value === 'GROUP' && !group_ledgers.some(ledger => ledger.ledger_id === ledger_id)) return
    set_params(previous => {
      const next = new URLSearchParams(previous)
      next.set('scope', value)
      if (value === 'GROUP' && ledger_id) next.set('ledger', ledger_id)
      else next.delete('ledger')
      next.set('date', get_local_date_key(selected_month))
      return next
    }, { replace: true })
  }

  function retry() { void Promise.all([ledger_query.refetch(), ...queries.map(query => query.refetch())]) }

  function get_category_group_breakdown(): CategoryGroupBreakdown {
    if (category_queries.some(query => query.isError)) {
      return { state: 'error', retry: () => { void Promise.all(category_queries.map(query => query.refetch())) } }
    }
    if (category_queries.some(query => query.isPending)) return { state: 'hidden' }

    const category_data = new Map<string, Awaited<ReturnType<typeof get_category_management_data>>>()
    category_queries.forEach((query, index) => {
      if (query.data) category_data.set(scoped_ledgers[index].ledger_id, query.data)
    })
    const breakdown = summarize_category_groups(selected_expenses, category_data)
    if (breakdown === null) return { state: 'hidden' }
    return { state: 'ready', ...breakdown }
  }

  const category_group_breakdown = get_category_group_breakdown()
  return { state, scope, group_ledgers, selected_group_id, month_label, total_label, monthly_totals, categories, category_group_breakdown, payment_methods, selected_expenses, change_month, change_scope, retry }
}
