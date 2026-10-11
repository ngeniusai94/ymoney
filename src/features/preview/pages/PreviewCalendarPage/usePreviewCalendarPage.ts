import type { CalendarViewModel } from '../../../calendar/pages/CalendarPage/CalendarPage'
import { get_local_date_key, get_month_days } from '../../../calendar/calendar.utils'
import { get_preview_expenses } from '../../preview-data'

/** 달력 예시만 표시합니다. URL/선택 상태를 저장하거나 원격 API를 호출하지 않습니다. */
export function usePreviewCalendarPage() {
  const now = new Date()
  const selected_date = new Date(now.getFullYear(), now.getMonth(), 11)
  const visible_month = new Date(now.getFullYear(), now.getMonth(), 1)
  const selected_date_key = get_local_date_key(selected_date)
  const expenses = get_preview_expenses(now.getFullYear(), now.getMonth())
  const selected_expenses = expenses.filter((expense) => expense.trans_date === selected_date_key)
  const daily_totals = new Map<string, number>()
  for (const expense of expenses) daily_totals.set(expense.trans_date, (daily_totals.get(expense.trans_date) ?? 0) + expense.amount)

  // 마우스/터치와 키보드로 발생하는 동작 모두 같은 안내를 사용합니다.
  function request_login() { window.alert('로그인 후 이용 가능합니다.') }
  const view: CalendarViewModel = {
    calendar_days: get_month_days(visible_month), ledger_scope: 'ALL', visible_month, selected_date_key, selected_expenses, daily_totals,
    month_label: new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(visible_month),
    selected_label: new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(selected_date),
    month_total: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    selected_total: selected_expenses.reduce((sum, expense) => sum + expense.amount, 0),
    data_state: 'has-expenses', is_filtered_empty: false,
    choose_date: request_login, change_month: request_login, change_ledger_scope: request_login,
    open_filter: request_login, refetch: async () => request_login(),
  }
  return { view, request_login }
}
