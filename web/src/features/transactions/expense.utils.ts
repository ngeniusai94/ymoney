/** 달력의 선택 날짜를 가져오되 존재하지 않는 날짜는 오늘로 되돌립니다. */
export function get_initial_expense_datetime(date_key: string | null, now: Date): string {
  const date_text = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const current_date_key = date_text(now)
  let selected_date_key = current_date_key

  if (date_key && /^\d{4}-\d{2}-\d{2}$/.test(date_key)) {
    const [year, month, day] = date_key.split('-').map(Number)
    const parsed_date = new Date(year, month - 1, day)
    if (date_text(parsed_date) === date_key) selected_date_key = date_key
  }

  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${selected_date_key}T${hour}:${minute}`
}

const expense_audit_formatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: '2-digit', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

/** DB 시각을 기기의 시간대와 관계없이 한국시간으로 표시합니다. */
export function format_expense_audit_time(timestamp: string): string {
  const parts = expense_audit_formatter.formatToParts(new Date(timestamp))
  const { year, month, day, hour, minute } = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${year}.${month}.${day} ${hour}:${minute}`
}

/** 선택한 상위 카테고리 바로 아래의 항목을 반환합니다. */
export function select_child_categories<T extends { parent_category_id: string | null }>(
  categories: T[],
  parent_id: string | null,
): T[] {
  if (parent_id === null) return []
  return categories.filter((category) => category.parent_category_id === parent_id)
}

/** DB 거래 한 건을 기기 입력 컴포넌트가 사용하는 문자열 값으로 바꿉니다. */
export function get_existing_expense_values(expense: {
  amount: number | string
  memo: string | null
  trans_date: string
  trans_time: string
  category_id: string
  payment_method_id: string
}) {
  return {
    amount: String(expense.amount),
    memo: expense.memo ?? '',
    date_time: `${expense.trans_date}T${expense.trans_time.slice(0, 5)}`,
    category_id: expense.category_id,
    payment_method_id: expense.payment_method_id,
  }
}

/** 삭제 시 원본 행은 보존하고 삭제/수정 감사 정보만 갱신합니다. */
export function get_soft_delete_values(user_srno: string, now: Date) {
  const timestamp = now.toISOString()
  return {
    deleted_at: timestamp,
    updated_at: timestamp,
    updated_by_user_srno: user_srno,
  }
}
