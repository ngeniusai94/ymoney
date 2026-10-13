import { format_calendar_day_amount, format_expense_total, get_local_date_key } from '../../calendar.utils'
import type { CalendarViewModel } from './CalendarPage'
import { useCalendarSwipe } from './useCalendarSwipe'

const week_days = ['일', '월', '화', '수', '목', '금', '토']

/** 월 이동·날짜 선택을 담당하며 제스처는 이 영역에만 연결합니다. */
export default function CalendarMonth({ page }: { page: CalendarViewModel }) {
  const swipe = useCalendarSwipe(page.change_month)
  return <section className="calendar-month-region" aria-label="월 달력">
    <div className="calendar-month-switcher">
      <button type="button" onClick={(event) => swipe.navigate_month(-1, event.currentTarget.parentElement?.clientWidth ?? 410)} aria-label="지난 달">‹</button>
      <strong>{page.month_label}</strong>
      <button type="button" onClick={(event) => swipe.navigate_month(1, event.currentTarget.parentElement?.clientWidth ?? 410)} aria-label="다음 달">›</button>
    </div>
    <div className="calendar-swipe-viewport" {...swipe.handlers}>
    <div className={`calendar-grid is-${swipe.phase}`} style={swipe.grid_style} role="grid" aria-label={page.month_label}>
      <div className="calendar-weekdays" role="row">
        {week_days.map((day) => <span role="columnheader" key={day}>{day}</span>)}
      </div>
      <div className="calendar-date-grid">
        {page.calendar_days.map((date) => {
          const date_key = get_local_date_key(date)
          const is_selected = date_key === page.selected_date_key
          const is_current_month = date.getMonth() === page.visible_month.getMonth()
          const day_total = page.daily_totals.get(date_key) ?? 0
          let amount_content = null
          if (day_total > 0) amount_content = <span className="calendar-date-amount">{format_calendar_day_amount(day_total)}</span>
          return <button key={date_key} type="button" role="gridcell" aria-pressed={is_selected}
            className={`calendar-date${is_selected ? ' is-selected' : ''}${is_current_month ? '' : ' is-muted'}`}
            aria-label={`${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일, 지출 ${format_expense_total(day_total)}`}
            onClick={() => page.choose_date(date)}>
            <span>{date.getDate()}</span>{amount_content}
          </button>
        })}
      </div>
    </div>
    </div>
  </section>
}
