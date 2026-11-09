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
export function summarize_categories(expenses: ReadonlyArray<{ parent_category_name: string; child_category_name?: string | null; amount: number }>) {
  const groups = new Map<string, { amount: number; children: Map<string | null, number> }>()
  for (const expense of expenses) {
    const group = groups.get(expense.parent_category_name) ?? { amount: 0, children: new Map<string | null, number>() }
    const child_name = expense.child_category_name ?? null
    group.amount += expense.amount
    group.children.set(child_name, (group.children.get(child_name) ?? 0) + expense.amount)
    groups.set(expense.parent_category_name, group)
  }
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  return [...groups].filter(([, group]) => group.amount > 0)
    .map(([name, group]) => {
      // 실제 하위 지출이 있을 때만 펼칩니다. 부모에 직접 저장한 금액도 상세 합계에 포함합니다.
      let children: Array<{ key: string; name: string; amount: number; percentage: number }> = []
      if ([...group.children].some(([child, amount]) => child !== null && amount > 0)) {
        children = [...group.children].filter(([, amount]) => amount > 0).map(([child, amount]) => ({
          key: child === null ? 'direct' : `child:${child}`,
          name: child ?? '하위 미지정',
          amount,
          percentage: amount / group.amount * 100,
        })).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'ko'))
      }
      return { name, amount: group.amount, percentage: group.amount / total * 100, children }
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'ko'))
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
