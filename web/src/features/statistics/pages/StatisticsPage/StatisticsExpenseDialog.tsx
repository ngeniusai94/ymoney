import { useEffect, useRef } from 'react'
import { format_expense_total, get_calendar_start_date } from '../../../calendar/calendar.utils'
import type { get_statistics_expense_details } from '../../statistics.utils'

function ExpenseDate({ date_key }: { date_key: string }) {
  const date = get_calendar_start_date(date_key)
  return (
    <time dateTime={date_key}>
      <span>{date.getMonth() + 1}월</span>{' '}<span>{date.getDate()}일</span>
    </time>
  )
}

/** 선택 월의 목록을 보여주고 거래 행에서 공통 지출 수정 시트로 연결합니다. */
export default function StatisticsExpenseDialog({ details, month_label, on_close, on_edit }: {
  details: ReturnType<typeof get_statistics_expense_details>
  month_label: string
  on_close: () => void
  on_edit: (transaction_id: number) => void
}) {
  const dialog_ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialog_ref.current
    if (!dialog) return

    dialog.showModal()
    const previous_overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = previous_overflow
    }
  }, [])

  function close_dialog() {
    // DOM에서 제거하기 전에 닫아 포커스를 목록을 열었던 행으로 돌려보냅니다.
    dialog_ref.current?.close()
    on_close()
  }

  let content = <p className="statistics-empty">이 분류에 등록한 지출이 없어요.</p>
  if (details.expenses.length > 0) {
    content = (
      <ul className="statistics-expense-dialog-list">
        {details.expenses.map(expense => (
          <li key={expense.transaction_id}>
            <button type="button" className="statistics-expense-trigger statistics-expense-dialog-row" aria-haspopup="dialog"
              onClick={event => {
                event.currentTarget.focus({ preventScroll: true })
                on_edit(expense.transaction_id)
              }}>
              <ExpenseDate date_key={expense.trans_date} />
              <span>{expense.memo?.trim() || '메모 없음'}</span>
              <strong>{format_expense_total(expense.amount)}</strong>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <dialog ref={dialog_ref} className="statistics-expense-dialog" aria-labelledby="statistics-expense-dialog-title"
      onCancel={event => { event.preventDefault(); close_dialog() }}
      onClick={event => { if (event.target === event.currentTarget) close_dialog() }}>
      <div className="statistics-expense-dialog-panel">
        <header className="statistics-expense-dialog-header">
          <div>
            <h2 id="statistics-expense-dialog-title">{details.name} 지출 내역</h2>
            <p>{month_label} · {details.title}</p>
          </div>
          <button type="button" aria-label="지출 내역 닫기" onClick={close_dialog}>×</button>
        </header>
        <div className="statistics-expense-dialog-summary">
          <span>총 {details.expenses.length.toLocaleString('ko-KR')}건</span>
          <strong>{format_expense_total(details.total)}</strong>
        </div>
        {content}
      </div>
    </dialog>
  )
}
