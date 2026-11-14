import type { ReactNode } from 'react'
import { format_expense_total } from '../../../calendar/calendar.utils'
import PaymentIcon from '../../../payment-methods/PaymentIcon'
import type { MonthlyExpense } from '../../../transactions/transactions.api'
import ExpenseSheet from '../../../transactions/pages/ExpensePage/ExpenseSheet'
import type { StatisticsExpenseSelection, summarize_categories, summarize_payment_methods } from '../../statistics.utils'
import StatisticsExpenseDialog from './StatisticsExpenseDialog'
import { useStatisticsExpenseDetails } from './useStatisticsPage'
import type { CategoryGroupBreakdown } from './useStatisticsPage'

type Category = ReturnType<typeof summarize_categories>[number]
type PaymentMethod = ReturnType<typeof summarize_payment_methods>[number]
type OpenExpenses = (selection: StatisticsExpenseSelection, trigger: HTMLButtonElement) => void
type CategorySource = 'category' | 'group'

/** 펼침 상태는 네이티브 details가 관리하므로 별도의 boolean·클릭 상태가 필요하지 않습니다. */
function Chevron() {
  return <svg className="statistics-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
}

function AmountHeading({ item, icon }: { item: Pick<PaymentMethod, 'name' | 'amount' | 'percentage'>; icon?: ReactNode }) {
  return (
    <span className="statistics-category-heading">
      <span className="statistics-category-name">
        {icon}
        {item.name}<small>{new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(item.percentage)}%</small>
      </span>
      <strong>{format_expense_total(item.amount)}</strong>
    </span>
  )
}

/** 막대는 해당 영역의 최대 금액, 숫자 비중은 영역 전체 합계에 각각 비례합니다. */
function AmountTrack({ amount, maximum }: { amount: number; maximum: number }) {
  return <span className="statistics-category-track" aria-hidden="true"><span style={{ width: `${amount / maximum * 100}%` }} /></span>
}

function ExpenseListButton({ class_name, label, selection, on_open_expenses, children }: {
  class_name: string
  label: string
  selection: StatisticsExpenseSelection
  on_open_expenses: OpenExpenses
  children: ReactNode
}) {
  return (
    <button type="button" className={`statistics-expense-trigger ${class_name}`}
      aria-label={`${label} 지출 내역`} aria-haspopup="dialog"
      onClick={event => on_open_expenses(selection, event.currentTarget)}>
      {children}
    </button>
  )
}

function CategoryChild({ category, child, source, on_open_expenses }: {
  category: Category
  child: Category['children'][number]
  source: CategorySource
  on_open_expenses: OpenExpenses
}) {
  const content = <>
    <span>{child.name}</span>
    <span className="statistics-child-amount">{format_expense_total(child.amount)}<small>{new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(child.percentage)}%</small></span>
  </>
  const name = child.key === 'direct' ? '하위 미지정' : child.name
  const selection: StatisticsExpenseSelection = source === 'group'
    ? { kind: 'group_category', group_key: category.key, group_name: category.name, category_name: child.name }
    : { kind: 'category', parent_name: category.name, child_key: child.key }
  return (
    <ExpenseListButton class_name="statistics-child-row" label={`${category.name} · ${name}`}
      selection={selection} on_open_expenses={on_open_expenses}>
      {content}
    </ExpenseListButton>
  )
}

function CategoryItem({ category, maximum, source, on_open_expenses }: {
  category: Category
  maximum: number
  source: CategorySource
  on_open_expenses: OpenExpenses
}) {
  if (category.children.length === 0) {
    const content = <><AmountHeading item={category} /><AmountTrack amount={category.amount} maximum={maximum} /></>
    if (source === 'group') return content

    return (
      <ExpenseListButton class_name="statistics-category-trigger" label={category.name}
        selection={{ kind: 'category', parent_name: category.name }} on_open_expenses={on_open_expenses}>
        {content}
      </ExpenseListButton>
    )
  }
  return (
    <details className="statistics-category-detail">
      <summary aria-label={`${category.name} 상세`}>
        <div className="statistics-category-toggle"><AmountHeading item={category} /><Chevron /></div>
        <AmountTrack amount={category.amount} maximum={maximum} />
      </summary>
      <div className="statistics-children">
        <div className="statistics-children-heading"><span>상세</span></div>
        <ul>
          {category.children.map(child => (
            <li key={child.key}><CategoryChild category={category} child={child} source={source} on_open_expenses={on_open_expenses} /></li>
          ))}
        </ul>
      </div>
    </details>
  )
}

function CategoryList({ categories, source = 'category', on_open_expenses }: {
  categories: Category[]
  source?: CategorySource
  on_open_expenses: OpenExpenses
}) {
  if (categories.length === 0) return <p className="statistics-empty">이 달에 등록한 지출이 없어요.</p>
  const maximum = Math.max(1, ...categories.map(category => category.amount))
  return <ul className="statistics-category-list">{categories.map(category => <li key={category.key}><CategoryItem category={category} maximum={maximum} source={source} on_open_expenses={on_open_expenses} /></li>)}</ul>
}

function PaymentList({ methods, on_open_expenses }: { methods: PaymentMethod[]; on_open_expenses: OpenExpenses }) {
  if (methods.length === 0) return <p className="statistics-empty">이 달에 등록한 지출이 없어요.</p>
  const maximum = Math.max(1, ...methods.map(method => method.amount))
  return (
    <ul className="statistics-category-list">
      {methods.map(method => (
        <li key={method.name}>
          <ExpenseListButton class_name="statistics-category-trigger" label={method.name}
            selection={{ kind: 'payment', name: method.name }} on_open_expenses={on_open_expenses}>
            <AmountHeading item={method} icon={method.type && (
              <span className="statistics-payment-icon"><PaymentIcon type={method.type} icon_key={method.icon_key} /></span>
            )} />
            <AmountTrack amount={method.amount} maximum={maximum} />
          </ExpenseListButton>
        </li>
      ))}
    </ul>
  )
}

function CategoryGroupSection({ breakdown, on_open_expenses }: { breakdown: CategoryGroupBreakdown; on_open_expenses: OpenExpenses }) {
  if (breakdown.state === 'hidden') return null

  let content
  if (breakdown.state === 'error') {
    content = <div className="statistics-state" role="alert"><p>그룹별 지출을 불러오지 못했어요.</p><button type="button" onClick={breakdown.retry}>다시 시도</button></div>
  } else {
    content = <CategoryList categories={breakdown.groups} source="group" on_open_expenses={on_open_expenses} />
  }
  return (
    <details className="statistics-panel statistics-section">
      <summary className="statistics-section-toggle"><h2>그룹별 지출</h2><span>선택 월 기준<Chevron /></span></summary>
      {content}
    </details>
  )
}

/** 카테고리만 기본 펼침이며 각 영역은 독립적으로 접고 펼칩니다. */
export default function StatisticsBreakdowns({ categories, category_group_breakdown, payment_methods, selected_expenses, month_label }: {
  categories: Category[]
  category_group_breakdown: CategoryGroupBreakdown
  payment_methods: PaymentMethod[]
  selected_expenses: readonly MonthlyExpense[]
  month_label: string
}) {
  const assignments = category_group_breakdown.state === 'ready' ? category_group_breakdown.assignments : undefined
  const { details, open_expenses, close_expenses, editing_transaction_id, edit_expense, close_editor } =
    useStatisticsExpenseDetails(selected_expenses, assignments)
  let expense_dialog = null
  if (details) {
    expense_dialog = <StatisticsExpenseDialog details={details} month_label={month_label} on_close={close_expenses} on_edit={edit_expense} />
  }
  let expense_editor = null
  if (editing_transaction_id !== null) {
    // 목록 팝업이 계속 열린 상태이므로 배경 스크롤 잠금도 목록이 담당합니다.
    expense_editor = <ExpenseSheet transaction_id={editing_transaction_id} on_close={close_editor} lock_body_scroll={false} />
  }
  return (
    <>
      <details className="statistics-panel statistics-section" open>
        <summary className="statistics-section-toggle"><h2>카테고리별 지출</h2><span>선택 월 기준<Chevron /></span></summary>
        <CategoryList categories={categories} on_open_expenses={open_expenses} />
      </details>
      <CategoryGroupSection breakdown={category_group_breakdown} on_open_expenses={open_expenses} />
      <details className="statistics-panel statistics-section">
        <summary className="statistics-section-toggle"><h2>결제수단별 지출</h2><span>선택 월 기준<Chevron /></span></summary>
        <PaymentList methods={payment_methods} on_open_expenses={open_expenses} />
      </details>
      {expense_dialog}
      {expense_editor}
    </>
  )
}
