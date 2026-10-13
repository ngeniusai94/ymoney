import { format_expense_total } from '../../calendar.utils'
import type { CalendarViewModel } from './CalendarPage'

/** 상단은 제목·월 합계·필터 진입만 담당합니다. */
export default function CalendarHeader({ page }: { page: CalendarViewModel }) {
  return <section className="calendar-header-region" aria-label="가계부 제목과 필터">
    <header className="calendar-topbar">
      <strong>가계부 톡톡</strong>
      <button className="calendar-filter-button" type="button" aria-label="필터" onClick={page.open_filter}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" /></svg>
      </button>
    </header>
    <div className="calendar-month-total">
      <span>{page.visible_month.getMonth() + 1}월 총 지출</span>
      <strong>{format_expense_total(page.month_total)}</strong>
    </div>
  </section>
}
