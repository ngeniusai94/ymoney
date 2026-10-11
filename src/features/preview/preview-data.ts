import type { MonthlyExpense } from '../transactions/transactions.api'

/** 둘러보기 전용 고정 예시입니다. 실제 DB ID/개인정보와 연결하지 않습니다. */
/** 현재 월의 고정된 일자/금액을 배치합니다. 둘러보기에서 월 이동은 제공하지 않습니다. */
export function get_preview_expenses(year: number, month: number): MonthlyExpense[] {
  const month_key = `${year}-${String(month + 1).padStart(2, '0')}`
  return [
    { transaction_id: 1, ledger_id: 1, category_id: 1, payment_method_id: 1, category_name: '식비', category_icon: '🍚', amount: 9500, memo: '점심', trans_date: `${month_key}-11`, trans_time: '12:00:00' },
    { transaction_id: 2, ledger_id: 1, category_id: 2, payment_method_id: 1, category_name: '카페', category_icon: '☕', amount: 4500, memo: '커피', trans_date: `${month_key}-11`, trans_time: '13:00:00' },
    { transaction_id: 3, ledger_id: 2, category_id: 3, payment_method_id: 2, category_name: '장보기', category_icon: '🛒', amount: 32000, memo: '함께 먹을 식재료', trans_date: `${month_key}-11`, trans_time: '18:00:00' },
    { transaction_id: 4, ledger_id: 2, category_id: 3, payment_method_id: 2, category_name: '장보기', category_icon: '🛒', amount: 18000, memo: null, trans_date: `${month_key}-05`, trans_time: '17:00:00' },
  ]
}
