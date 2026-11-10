import type { CategoryGroup, ManagedCategory } from '../categories/categories.utils'
import type { MonthlyExpense } from '../transactions/transactions.api'

export type StatisticsExpenseSelection =
  | { kind: 'category'; parent_name: string; child_key?: string }
  | { kind: 'group_category'; group_key: string; group_name: string; category_name: string }
  | { kind: 'payment'; name: string }

export type CategoryGroupAssignments = ReadonlyMap<number, { group_key: string; category_name: string }>

function get_child_key(name: string | null) {
  return name === null ? 'direct' : `child:${name}`
}

/** 선택한 통계 행과 같은 집계 기준으로 거래 목록을 만듭니다. */
export function get_statistics_expense_details(
  expenses: readonly MonthlyExpense[],
  selection: StatisticsExpenseSelection,
  assignments?: CategoryGroupAssignments,
) {
  let name: string
  let title: string
  let matches: (expense: MonthlyExpense) => boolean
  switch (selection.kind) {
    case 'category': {
      const { parent_name, child_key } = selection
      name = parent_name
      title = parent_name
      if (child_key !== undefined) {
        name = child_key === 'direct' ? '하위 미지정' : child_key.slice('child:'.length)
        title = `${parent_name} · ${name}`
      }
      matches = expense => expense.parent_category_name === parent_name &&
        (child_key === undefined || get_child_key(expense.child_category_name) === child_key)
      break
    }
    case 'group_category':
      name = selection.category_name
      title = `${selection.group_name} · ${name}`
      matches = expense => {
        const assignment = assignments?.get(expense.transaction_id)
        return assignment?.group_key === selection.group_key && assignment.category_name === selection.category_name
      }
      break
    case 'payment':
      name = selection.name
      title = selection.name
      matches = expense => expense.payment_method_name === selection.name
      break
  }
  const selected_expenses = expenses.filter(matches)
    .sort((a, b) => b.trans_date.localeCompare(a.trans_date) || b.trans_time.localeCompare(a.trans_time))
  const total = selected_expenses.reduce((sum, expense) => sum + expense.amount, 0)
  return { title, name, total, expenses: selected_expenses }
}

/** 선택 월을 마지막으로 하는 세 달을 오래된 순서대로 만듭니다. 연도 경계도 Date가 처리합니다. */
export function get_statistics_months(selected_month: Date): Date[] {
  return [-2, -1, 0].map(offset => new Date(selected_month.getFullYear(), selected_month.getMonth() + offset, 1))
}

/** 이미 권한 범위로 조회한 거래 중 선택한 그룹만 집계합니다. null은 기존 전체/개인 범위입니다. */
export function filter_statistics_ledger<T extends { ledger_id: number | string }>(expenses: readonly T[], ledger_id: string | null): readonly T[] {
  if (ledger_id === null) return expenses
  return expenses.filter(expense => String(expense.ledger_id) === ledger_id)
}

/** 하위 지출은 상위 이름으로 합산합니다. 전체 가계부에서는 같은 이름의 카테고리를 묶습니다. */
export function summarize_categories(expenses: ReadonlyArray<{ parent_category_name: string; parent_category_key?: string; child_category_name?: string | null; amount: number }>) {
  const groups = new Map<string, { name: string; amount: number; children: Map<string | null, number> }>()
  for (const expense of expenses) {
    const name = expense.parent_category_name
    const key = expense.parent_category_key ?? name
    const group = groups.get(key) ?? { name, amount: 0, children: new Map<string | null, number>() }
    const child_name = expense.child_category_name ?? null
    group.amount += expense.amount
    group.children.set(child_name, (group.children.get(child_name) ?? 0) + expense.amount)
    groups.set(key, group)
  }
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  return [...groups].filter(([, group]) => group.amount > 0)
    .map(([key, group]) => {
      // 실제 하위 지출이 있을 때만 펼칩니다. 부모에 직접 저장한 금액도 상세 합계에 포함합니다.
      let children: Array<{ key: string; name: string; amount: number; percentage: number }> = []
      if ([...group.children].some(([child, amount]) => child !== null && amount > 0)) {
        children = [...group.children].filter(([, amount]) => amount > 0).map(([child, amount]) => ({
          key: get_child_key(child),
          name: child ?? ' ',
          amount,
          percentage: amount / group.amount * 100,
        })).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'ko'))
      }
      return { key, name: group.name, amount: group.amount, percentage: group.amount / total * 100, children }
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'ko'))
}

/** 하위 지출은 상위 카테고리의 현재 그룹에 포함합니다. 활성 그룹이 없으면 카드도 숨깁니다. */
export function summarize_category_groups(
  expenses: ReadonlyArray<Pick<MonthlyExpense, 'transaction_id' | 'ledger_id' | 'category_id' | 'parent_category_name' | 'amount'>>,
  category_data: ReadonlyMap<string, { groups: CategoryGroup[]; categories: ManagedCategory[] }>,
) {
  if (![...category_data.values()].some(({ groups }) => groups.some(group => group.is_active))) return null

  const by_ledger = new Map([...category_data].map(([ledger_id, { groups, categories }]) => [
    ledger_id,
    {
      group_names: new Map(groups.filter(group => group.is_active).map(group => [group.category_group_id, group.group_name])),
      categories: new Map(categories.map(category => [category.category_id, category])),
    },
  ]))

  const assignments = new Map<number, { group_key: string; category_name: string }>()
  const groups = summarize_categories(expenses.map(expense => {
    const ledger = by_ledger.get(String(expense.ledger_id))
    const category = ledger?.categories.get(String(expense.category_id))
    const parent = category?.parent_category_id
      ? ledger?.categories.get(category.parent_category_id)
      : category
    const group_name = parent?.category_group_id
      ? ledger?.group_names.get(parent.category_group_id)
      : undefined

    // 합계와 상세 목록에 같은 그룹 키와 상위 카테고리 이름을 사용합니다.
    const group_key = group_name === undefined ? 'ungrouped' : `group:${group_name}`
    const category_name = parent?.category_name ?? expense.parent_category_name
    assignments.set(expense.transaction_id, { group_key, category_name })
    return {
      parent_category_key: group_key,
      parent_category_name: group_name ?? '그룹 미지정',
      child_category_name: category_name,
      amount: expense.amount,
    }
  }))
  return { groups, assignments }
}

/** 등록된 결제수단 이름별로 합산합니다. 다른 가계부의 같은 이름도 기존 카테고리처럼 묶습니다. */
export function summarize_payment_methods(expenses: ReadonlyArray<{ payment_method_name: string; amount: number }>) {
  const amounts = new Map<string, number>()
  for (const expense of expenses) {
    amounts.set(expense.payment_method_name, (amounts.get(expense.payment_method_name) ?? 0) + expense.amount)
  }
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  return [...amounts].filter(([, amount]) => amount > 0)
    .map(([name, amount]) => ({ name, amount, percentage: amount / total * 100 }))
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'ko'))
}
