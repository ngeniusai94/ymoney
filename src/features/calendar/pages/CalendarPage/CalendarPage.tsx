import type { ReactNode } from 'react'
import { useCalendarPage } from './useCalendarPage'
import CalendarHeader from './CalendarHeader'
import CalendarMonth from './CalendarMonth'
import CalendarDaily from './CalendarDaily'
import CalendarFilterSheet from '../../components/CalendarFilterSheet/CalendarFilterSheet'
import ExpenseSheet from '../../../transactions/pages/ExpensePage/ExpenseSheet'
import './CalendarPage.css'

export type CalendarViewModel = Pick<ReturnType<typeof useCalendarPage>,
  'calendar_days' | 'is_filtered_empty' | 'ledger_scope' | 'change_ledger_scope' | 'change_month' |
  'choose_date' | 'daily_totals' | 'data_state' | 'month_label' | 'month_total' | 'refetch' |
  'selected_date_key' | 'selected_expenses' | 'selected_label' | 'selected_total' | 'visible_month' | 'open_filter'>

/** 상단·달력·일별 목록을 조립합니다. 실제 조회와 둘러보기는 같은 UI를 사용합니다. */
export function CalendarView({ page, on_add, on_edit, filter_sheet }: {
  page: CalendarViewModel; on_add: () => void; on_edit: (transaction_id: number) => void; filter_sheet?: ReactNode
}) {
  return <section className="calendar-screen" aria-label="월간 가계부 달력">
    <CalendarHeader page={page} />
    <CalendarMonth page={page} />
    <CalendarDaily page={page} on_edit={on_edit} />
    <button className="calendar-add-button" type="button" aria-label="지출 추가" onClick={on_add}>＋</button>
    {filter_sheet}
  </section>
}

/** 추가·수정 모두 달력을 유지한 채 같은 지출 시트를 사용합니다. */
export default function CalendarPage() {
  const page = useCalendarPage()
  let filter_sheet = null
  if (page.filter_state === 'open') filter_sheet = <CalendarFilterSheet scope={page.ledger_scope} filters={page.applied_filters}
    on_close={page.close_filter} on_apply={page.apply_filter} />
  let expense_sheet = null
  if (page.expense_sheet_state === 'open') expense_sheet = <ExpenseSheet
    transaction_id={page.editing_transaction_id} on_close={page.close_expense_sheet} on_saved={page.expense_saved} />
  return <>
    <CalendarView page={page} filter_sheet={filter_sheet} on_add={page.open_expense_sheet}
      on_edit={page.open_expense_edit} />
    {expense_sheet}
  </>
}
