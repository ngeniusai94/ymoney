import { format_calendar_day_amount, format_expense_total, get_local_date_key } from '../../calendar.utils'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useCalendarPage } from './useCalendarPage'
import './CalendarPage.css'
import CalendarFilterSheet from '../../components/CalendarFilterSheet/CalendarFilterSheet'

const week_days = ['일', '월', '화', '수', '목', '금', '토']

/** 승인된 월 달력 UI에 월별 조회 합계와 선택일 지출 상태를 표시합니다. */
export type CalendarViewModel = Pick<ReturnType<typeof useCalendarPage>,
  'calendar_days' | 'is_filtered_empty' | 'ledger_scope' | 'change_ledger_scope' | 'change_month' |
  'choose_date' | 'daily_totals' | 'data_state' | 'month_label' | 'month_total' | 'refetch' |
  'selected_date_key' | 'selected_expenses' | 'selected_label' | 'selected_total' | 'visible_month' | 'open_filter'>

/** 실제/예시 데이터가 같은 승인 UI를 사용합니다. 원격 조회와 이동은 호출자가 담당합니다. */
export function CalendarView({ page, on_add, on_edit, filter_sheet }: {
  page: CalendarViewModel; on_add: () => void; on_edit: (transaction_id: number) => void; filter_sheet?: ReactNode
}) {
  const {
    calendar_days,
    open_filter,
    is_filtered_empty,
    ledger_scope,
    change_ledger_scope,
    change_month,
    choose_date,
    daily_totals,
    data_state,
    month_label,
    month_total,
    refetch,
    selected_date_key,
    selected_expenses,
    selected_label,
    selected_total,
    visible_month,
  } = page
  const today_key = get_local_date_key(new Date())
  let daily_content
  let no_ledger_message = '아직 연결된 가계부가 없어요.'
  if (ledger_scope === 'PERSONAL') no_ledger_message = '아직 연결된 개인 가계부가 없어요.'
  else if (ledger_scope === 'GROUP') no_ledger_message = '아직 참여한 그룹 가계부가 없어요.'
  let empty_message = '🎉 무지출에 성공하셨어요!'
  if (is_filtered_empty) empty_message = '조건에 맞는 지출이 없어요.'

  switch (data_state) {
    case 'loading':
      daily_content = <p className="calendar-data-state">지출 내역을 불러오고 있어요.</p>
      break
    case 'error':
      daily_content = (
        <div className="calendar-data-state is-error">
          <p>지출 내역을 불러오지 못했어요.</p>
          <button type="button" onClick={() => void refetch()}>다시 시도</button>
        </div>
      )
      break
    case 'no-ledger':
      daily_content = <p className="calendar-data-state">{no_ledger_message}</p>
      break
    case 'empty':
      daily_content = <p className="calendar-data-state">{empty_message}</p>
      break
    case 'has-expenses':
      daily_content = (
        <ul className="calendar-expense-list">
          {selected_expenses.map((expense) => {
            let memo_content = null
            if (expense.memo) memo_content = <small>{expense.memo}</small>

            return (
              <li key={expense.transaction_id}>
                <button
                  type="button"
                  className="calendar-expense-item"
                  onClick={() => on_edit(expense.transaction_id)}
                  aria-label={`${expense.category_name} ${format_expense_total(expense.amount)} 지출 수정`}
                >
                  <span className="calendar-expense-icon" aria-hidden="true">{expense.category_icon ?? '•'}</span>
                  <span className="calendar-expense-description">
                    <strong>{expense.category_name}</strong>
                    {memo_content}
                  </span>
                  <strong className="calendar-expense-amount">{format_expense_total(expense.amount)}</strong>
                </button>
              </li>
            )
          })}
        </ul>
      )
      break
  }

  return (
    <section className="calendar-screen" aria-label="월간 가계부 달력">
      <header className="calendar-topbar">
        <select className="calendar-scope-select" aria-label="가계부 조회 범위" value={ledger_scope}
          onChange={(event) => change_ledger_scope(event.target.value)}>
          <option value="ALL">모두</option>
          <option value="PERSONAL">개인 가계부</option>
          <option value="GROUP">그룹 가계부</option>
        </select>
        <strong>가계부 톡톡</strong>
        <button className="calendar-filter-button" type="button" aria-label="필터" onClick={open_filter}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" /></svg>
        </button>
      </header>

      <div className="calendar-month-total">
        <span>{visible_month.getMonth() + 1}월 총 지출</span>
        <strong>{format_expense_total(month_total)}</strong>
      </div>

      <div className="calendar-month-switcher">
        <button type="button" onClick={() => change_month(-1)} aria-label="지난 달">‹</button>
        <strong>{month_label}</strong>
        <button type="button" onClick={() => change_month(1)} aria-label="다음 달">›</button>
      </div>

      <div className="calendar-grid" role="grid" aria-label={month_label}>
        <div className="calendar-weekdays" role="row">
          {week_days.map((day) => <span role="columnheader" key={day}>{day}</span>)}
        </div>
        <div className="calendar-date-grid">
          {calendar_days.map((date) => {
            const date_key = get_local_date_key(date)
            const is_selected = date_key === selected_date_key
            const is_current_month = date.getMonth() === visible_month.getMonth()
            const day_total = daily_totals.get(date_key) ?? 0
            const day_amount = format_calendar_day_amount(day_total)

            return (
              <button
                className={`calendar-date${is_selected ? ' is-selected' : ''}${is_current_month ? '' : ' is-muted'}`}
                type="button"
                role="gridcell"
                aria-pressed={is_selected}
                aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일, 지출 ${format_expense_total(day_total)}`}
                key={date_key}
                onClick={() => choose_date(date)}
              >
                <span>{date.getDate()}</span>
                {day_amount ? <span className="calendar-date-amount">{day_amount}</span> : null}
              </button>
            )
          })}
        </div>
      </div>

      <section className="calendar-day-list" aria-live="polite">
        <header>
          <strong>{selected_date_key === today_key ? '오늘 지출' : `${selected_label} 지출`}</strong>
          <span>{format_expense_total(selected_total)}</span>
        </header>

        {daily_content}
      </section>

      <button
        className="calendar-add-button"
        type="button"
        aria-label="지출 추가"
        onClick={on_add}
      >＋</button>
      {filter_sheet}
    </section>
  )
}

/** 로그인 달력만 원격 조회 훅을 사용합니다. 둘러보기는 CalendarView만 사용합니다. */
function CalendarPage() {
  const page = useCalendarPage()
  const navigate = useNavigate()
  let filter_sheet = null
  if (page.filter_state === 'open') filter_sheet = <CalendarFilterSheet scope={page.ledger_scope} filters={page.applied_filters}
    on_close={page.close_filter} on_apply={page.apply_filter} />
  return <CalendarView page={page} filter_sheet={filter_sheet}
    on_add={() => navigate(`/app/expenses/new?${page.expense_query}`)}
    on_edit={(transaction_id) => navigate(`/app/expenses/${transaction_id}/edit?${page.expense_query}`)} />
}
export default CalendarPage
