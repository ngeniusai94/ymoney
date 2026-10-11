import { get_supabase_client } from '../../lib/supabase'
import { loadCurrentProfile } from '../auth/auth.api'
import { get_month_range } from '../calendar/calendar.utils'
import { list_my_ledgers } from '../ledgers/ledgers.api'
import type { LedgerScope } from '../ledgers/ledgers.api'
import { get_soft_delete_values } from './expense.utils'

type TransactionRow = {
  transaction_id: number
  ledger_id: number
  category_id: number
  payment_method_id: number
  amount: number | string
  memo: string | null
  trans_date: string
  trans_time: string
}

type CategoryRow = {
  category_id: number
  parent_category_id: number | null
  category_name: string
  icon_key: string | null
}

export type MonthlyExpense = {
  transaction_id: number
  ledger_id: number
  category_id: number
  payment_method_id: number
  category_name: string
  category_icon: string | null
  amount: number
  memo: string | null
  trans_date: string
  trans_time: string
}

export type MonthlyExpensesResult = {
  has_ledger: boolean
  expenses: MonthlyExpense[]
}

const page_size = 1000

export type NewExpense = {
  ledger_id: string
  category_id: string
  payment_method_id: string
  amount: number
  memo: string | null
  trans_date: string
  trans_time: string
  created_by_user_srno: string
}

export type ExistingExpense = Omit<NewExpense, 'created_by_user_srno'> & {
  transaction_id: string
}

export type ExpenseChanges = Omit<NewExpense, 'created_by_user_srno'> & {
  updated_by_user_srno: string
}

/** 현재 사용자의 선택 가계부에 지출 한 건을 저장합니다. 접근 권한은 DB 정책이 재검증합니다. */
export async function create_expense(expense: NewExpense): Promise<void> {
  const { error } = await get_supabase_client().schema('ymoney').from('tb_mon_transaction').insert({
    ...expense,
    trans_type: 'EXPENSE',
  })

  if (error) throw new Error('지출을 저장하지 못했습니다. 입력값을 확인하고 다시 시도해주세요.')
}

/** 달력에서 선택한 지출 한 건을 읽습니다. DB의 SELECT 정책이 가계부 멤버만 허용합니다. */
export async function get_expense(transaction_id: string): Promise<ExistingExpense | null> {
  const { data, error } = await get_supabase_client()
    .schema('ymoney')
    .from('tb_mon_transaction')
    .select('transaction_id, ledger_id, category_id, payment_method_id, amount, memo, trans_date, trans_time')
    .eq('transaction_id', transaction_id)
    .eq('trans_type', 'EXPENSE')
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new Error('지출 내역을 불러오지 못했습니다.')
  if (!data) return null

  return {
    transaction_id: String(data.transaction_id),
    ledger_id: String(data.ledger_id),
    category_id: String(data.category_id),
    payment_method_id: String(data.payment_method_id),
    amount: Number(data.amount),
    memo: data.memo,
    trans_date: data.trans_date,
    trans_time: data.trans_time,
  }
}

/** 거래 ID와 원래 가계부를 함께 제한한 뒤 수정합니다. 소속 가계부는 바꾸지 않습니다. */
export async function update_expense(transaction_id: string, changes: ExpenseChanges): Promise<void> {
  const { ledger_id, ...editable_values } = changes
  const { data, error } = await get_supabase_client()
    .schema('ymoney')
    .from('tb_mon_transaction')
    .update({ ...editable_values, updated_at: new Date().toISOString() })
    .eq('transaction_id', transaction_id)
    .eq('ledger_id', ledger_id)
    .eq('trans_type', 'EXPENSE')
    .is('deleted_at', null)
    .select('transaction_id')
    .maybeSingle()

  if (error) throw new Error('지출을 수정하지 못했습니다. 입력값을 확인하고 다시 시도해주세요.')
  if (!data) throw new Error('수정할 지출을 찾지 못했거나 권한이 없습니다.')
}

/** 현재 가계부의 활성 지출만 소프트 삭제합니다. 행 자체는 제거하지 않습니다. */
export async function delete_expense(
  transaction_id: string,
  ledger_id: string,
  updated_by_user_srno: string,
): Promise<void> {
  const { data, error } = await get_supabase_client()
    .schema('ymoney')
    .from('tb_mon_transaction')
    .update(get_soft_delete_values(updated_by_user_srno, new Date()))
    .eq('transaction_id', transaction_id)
    .eq('ledger_id', ledger_id)
    .eq('trans_type', 'EXPENSE')
    .is('deleted_at', null)
    .select('transaction_id')
    .maybeSingle()

  if (error) throw new Error('지출을 삭제하지 못했습니다. 다시 시도해주세요.')
  if (!data) throw new Error('삭제할 지출을 찾지 못했거나 권한이 없습니다.')
}

/** 본인 가계부 목록의 ledger_id만 사용해 해당 월 지출을 조회합니다. */
export async function get_monthly_transactions(
  user_uuid: string,
  year: number,
  month_index: number,
  ledger_scope: LedgerScope = 'ALL',
): Promise<MonthlyExpensesResult> {
  const supabase = get_supabase_client()
  const profile = await loadCurrentProfile(user_uuid)
  if (!profile) throw new Error('회원 정보를 확인하지 못했습니다.')

  const accessible_ledgers = await list_my_ledgers(profile.user_srno)
  // 본인 가계부 중 선택한 종류만 조회합니다. 월/일 합계와 목록이 같은 데이터를 사용합니다.
  let ledgers = accessible_ledgers
  if (ledger_scope !== 'ALL') {
    ledgers = accessible_ledgers.filter((ledger) => ledger.ledger_type === ledger_scope)
  }
  if (ledgers.length === 0) {
    return { has_ledger: false, expenses: [] }
  }

  const ledger_ids = ledgers.map((ledger) => ledger.ledger_id)

  const { start_date, end_date_exclusive } = get_month_range(new Date(year, month_index, 1))
  const transaction_rows: TransactionRow[] = []
  let offset = 0

  // PostgREST 기본 행 제한에 걸려 월 합계가 누락되지 않도록 필요한 페이지를 끝까지 읽습니다.
  while (true) {
    const { data, error } = await supabase
      .schema('ymoney')
      .from('tb_mon_transaction')
      .select('transaction_id, ledger_id, category_id, payment_method_id, amount, memo, trans_date, trans_time')
      .eq('trans_type', 'EXPENSE')
      .is('deleted_at', null)
      .in('ledger_id', ledger_ids)
      .gte('trans_date', start_date)
      .lt('trans_date', end_date_exclusive)
      .order('trans_date', { ascending: false })
      .order('trans_time', { ascending: false })
      .range(offset, offset + page_size - 1)

    if (error) {
      throw new Error('지출 내역을 불러오지 못했습니다.')
    }

    const current_page = (data ?? []) as unknown as TransactionRow[]
    transaction_rows.push(...current_page)

    if (current_page.length < page_size) {
      break
    }

    offset += page_size
  }

  if (!transaction_rows.length) {
    return { has_ledger: true, expenses: [] }
  }

  const category_ids = [...new Set(transaction_rows.map((row) => row.category_id))]
  const { data: categories, error: category_error } = await supabase
    .schema('ymoney')
    .from('tb_mon_category')
    .select('category_id, parent_category_id, category_name, icon_key')
    .in('category_id', category_ids)

  if (category_error) {
    throw new Error('지출 분류를 불러오지 못했습니다.')
  }

  const category_by_id = new Map(
    ((categories ?? []) as unknown as CategoryRow[]).map((category) => [String(category.category_id), category]),
  )

  // 하위에 저장된 지출은 부모 이름·아이콘도 필요합니다. 부모 자체의 지출이 없어도 조회합니다.
  const missing_parent_ids = [...new Set(
    [...category_by_id.values()]
      .map((category) => category.parent_category_id)
      .filter((id): id is number => id !== null && !category_by_id.has(String(id))),
  )]
  if (missing_parent_ids.length > 0) {
    const { data: parents, error: parent_error } = await supabase.schema('ymoney')
      .from('tb_mon_category')
      .select('category_id, parent_category_id, category_name, icon_key')
      .in('category_id', missing_parent_ids)
      .in('ledger_id', ledger_ids)
    if (parent_error) throw new Error('상위 지출 분류를 불러오지 못했습니다.')
    for (const parent of (parents ?? []) as unknown as CategoryRow[]) {
      category_by_id.set(String(parent.category_id), parent)
    }
  }

  return {
    has_ledger: true,
    expenses: transaction_rows.map((row) => {
      const category = category_by_id.get(String(row.category_id))
      const parent = category?.parent_category_id !== null && category?.parent_category_id !== undefined
        ? category_by_id.get(String(category.parent_category_id))
        : undefined

      return {
        ...row,
        amount: Number(row.amount),
        category_name: parent ? `${parent.category_name} · ${category?.category_name}` : category?.category_name ?? '카테고리 없음',
        category_icon: parent ? parent.icon_key : category?.icon_key ?? null,
      }
    }),
  }
}
