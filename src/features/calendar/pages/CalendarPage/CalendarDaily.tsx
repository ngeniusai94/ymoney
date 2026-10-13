import { format_expense_total, get_local_date_key } from '../../calendar.utils'
import type { CalendarViewModel } from './CalendarPage'

/** 단일 조회 상태에 맞는 일별 목록만 렌더링합니다. */
export default function CalendarDaily({ page, on_edit }: {
  page: CalendarViewModel; on_edit: (transaction_id: number) => void
}) {
  let daily_content
  let no_ledger_message = '아직 연결된 가계부가 없어요.'
  if (page.ledger_scope === 'PERSONAL') no_ledger_message = '아직 연결된 개인 가계부가 없어요.'
  else if (page.ledger_scope === 'GROUP') no_ledger_message = '아직 참여한 그룹 가계부가 없어요.'
  let empty_message = '🎉 무지출에 성공하셨어요!'
  if (page.is_filtered_empty) empty_message = '조건에 맞는 지출이 없어요.'
  if (page.data_state === 'loading') daily_content = <p className="calendar-data-state">지출 내역을 불러오고 있어요.</p>
  else if (page.data_state === 'error') daily_content = <div className="calendar-data-state is-error">
    <p>지출 내역을 불러오지 못했어요.</p><button type="button" onClick={() => void page.refetch()}>다시 시도</button>
  </div>
  else if (page.data_state === 'no-ledger') daily_content = <p className="calendar-data-state">{no_ledger_message}</p>
  else if (page.data_state === 'empty') daily_content = <p className="calendar-data-state">{empty_message}</p>
  else daily_content = <ul className="calendar-expense-list">
    {page.selected_expenses.map((expense) => {
      let memo_content = null
      if (expense.memo) memo_content = <span className="calendar-expense-memo">{expense.memo}</span>
      let child_content = null
      if (expense.child_category_name) child_content = <small>{expense.child_category_name}</small>
      return <li key={expense.transaction_id}>
        <button type="button" className="calendar-expense-item" onClick={() => on_edit(expense.transaction_id)}
          aria-label={`${expense.category_name} ${format_expense_total(expense.amount)} 지출 수정`}>
          <span className="calendar-expense-description"><strong>{expense.parent_category_name}</strong>{child_content}</span>
          {memo_content}
          <span className="calendar-expense-payment">
            <strong className="calendar-expense-amount">{format_expense_total(expense.amount)}</strong>
            <small>{expense.payment_method_name}</small>
          </span>
        </button>
      </li>
    })}
  </ul>
  let title = `${page.selected_label} 지출`
  if (page.selected_date_key === get_local_date_key(new Date())) title = '오늘 지출'
  return <section className="calendar-day-list" aria-live="polite">
    <header><strong>{title}</strong><span>{format_expense_total(page.selected_total)}</span></header>{daily_content}
  </section>
}
