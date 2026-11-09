/** 한 달 달력에 표시할 시작 요일과 날짜를 계산합니다. */
export function get_month_days(month_date: Date): Date[] {
  const year = month_date.getFullYear()
  const month = month_date.getMonth()
  const first_day = new Date(year, month, 1)
  const last_day = new Date(year, month + 1, 0)
  const cell_count = Math.ceil((first_day.getDay() + last_day.getDate()) / 7) * 7
  const calendar_start = new Date(year, month, 1 - first_day.getDay())

  return Array.from({ length: cell_count }, (_, index) =>
    new Date(calendar_start.getFullYear(), calendar_start.getMonth(), calendar_start.getDate() + index),
  )
}

/** 월 이동 시 선택한 날짜를 유지하되 대상 월의 마지막 날을 넘지 않게 합니다. */
export function move_month(selected_date: Date, month_delta: number): Date {
  const target_month = new Date(selected_date.getFullYear(), selected_date.getMonth() + month_delta, 1)
  const last_day = new Date(target_month.getFullYear(), target_month.getMonth() + 1, 0).getDate()

  return new Date(target_month.getFullYear(), target_month.getMonth(), Math.min(selected_date.getDate(), last_day))
}

/** 달력 화면의 일자 비교에 쓰는 로컬 날짜 키를 만듭니다. */
export function get_local_date_key(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 저장 후 달력으로 돌아올 때 URL 날짜를 복원하고 잘못된 값은 오늘로 돌립니다. */
export function get_calendar_start_date(date_key: string | null): Date {
  if (date_key && /^\d{4}-\d{2}-\d{2}$/.test(date_key)) {
    const [year, month, day] = date_key.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    if (get_local_date_key(date) === date_key) return date
  }
  return new Date()
}

/** 조회할 월의 시작일과 다음 달 시작일(미포함)을 계산해 날짜 경계 오류를 막습니다. */
export function get_month_range(month_date: Date) {
  const month_start = new Date(month_date.getFullYear(), month_date.getMonth(), 1)
  const next_month_start = new Date(month_date.getFullYear(), month_date.getMonth() + 1, 1)

  return {
    start_date: get_local_date_key(month_start),
    end_date_exclusive: get_local_date_key(next_month_start),
  }
}

/** 월/일 지출 합계를 한국 원화 단위로 표시하며 미조회·빈 값은 0원으로 처리합니다. */
export function format_expense_total(amount: number | null | undefined): string {
  return `${new Intl.NumberFormat('ko-KR').format(amount ?? 0)}원`
}

/** 달력 날짜 아래에는 지출이 있는 날만 좁은 셀에 맞는 숫자를 표시합니다. */
export function format_calendar_day_amount(amount: number): string {
  if (amount <= 0) return ''
  return new Intl.NumberFormat('ko-KR').format(amount)
}

/** 조회 조건을 화면 표시용 단일 상태로 변환합니다. */
export function resolve_calendar_data_state(input: {
  has_session: boolean
  is_ledger_loading: boolean
  is_ledger_error: boolean
  is_monthly_loading: boolean
  is_monthly_error: boolean
  has_ledger: boolean | null
  expense_count: number
}): 'loading' | 'error' | 'no-ledger' | 'empty' | 'has-expenses' {
  if (input.is_ledger_error || input.is_monthly_error) return 'error'
  if (!input.is_ledger_loading && input.has_ledger === false) return 'no-ledger'
  if (!input.has_session || input.is_ledger_loading || input.is_monthly_loading) {
    return 'loading'
  }
  if (input.expense_count === 0) return 'empty'
  return 'has-expenses'
}
