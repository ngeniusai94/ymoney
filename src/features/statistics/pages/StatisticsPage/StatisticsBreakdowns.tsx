import { format_expense_total } from '../../../calendar/calendar.utils'
import type { summarize_categories, summarize_payment_methods } from '../../statistics.utils'

type Category = ReturnType<typeof summarize_categories>[number]
type PaymentMethod = ReturnType<typeof summarize_payment_methods>[number]

/** 펼침 상태는 네이티브 details가 관리하므로 별도의 boolean·클릭 상태가 필요하지 않습니다. */
function Chevron() {
  return <svg className="statistics-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
}

function AmountHeading({ item }: { item: PaymentMethod }) {
  return (
    <div className="statistics-category-heading">
      <span className="statistics-category-name">{item.name}<small>{new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(item.percentage)}%</small></span>
      <strong>{format_expense_total(item.amount)}</strong>
    </div>
  )
}

/** 막대는 해당 영역의 최대 금액, 숫자 비중은 영역 전체 합계에 각각 비례합니다. */
function AmountTrack({ amount, maximum }: { amount: number; maximum: number }) {
  return <div className="statistics-category-track" aria-hidden="true"><span style={{ width: `${amount / maximum * 100}%` }} /></div>
}

function CategoryItem({ category, maximum }: { category: Category; maximum: number }) {
  if (category.children.length === 0) {
    return <><AmountHeading item={category} /><AmountTrack amount={category.amount} maximum={maximum} /></>
  }
  return (
    <details className="statistics-category-detail">
      <summary aria-label={`${category.name} 상세`}>
        <div className="statistics-category-toggle"><AmountHeading item={category} /><Chevron /></div>
        <AmountTrack amount={category.amount} maximum={maximum} />
      </summary>
      <div className="statistics-children">
        <div className="statistics-children-heading"><span>{category.name} 상세</span><span>{category.name} 내 비중</span></div>
        <ul>
          {category.children.map(child => (
            <li key={child.key}><span>{child.name}</span><span className="statistics-child-amount">{format_expense_total(child.amount)}<small>{new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(child.percentage)}%</small></span></li>
          ))}
        </ul>
      </div>
    </details>
  )
}

function CategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) return <p className="statistics-empty">이 달에 등록한 지출이 없어요.</p>
  const maximum = Math.max(1, ...categories.map(category => category.amount))
  return <ul className="statistics-category-list">{categories.map(category => <li key={category.name}><CategoryItem category={category} maximum={maximum} /></li>)}</ul>
}

function PaymentList({ methods }: { methods: PaymentMethod[] }) {
  if (methods.length === 0) return <p className="statistics-empty">이 달에 등록한 지출이 없어요.</p>
  const maximum = Math.max(1, ...methods.map(method => method.amount))
  return <ul className="statistics-category-list">{methods.map(method => <li key={method.name}><AmountHeading item={method} /><AmountTrack amount={method.amount} maximum={maximum} /></li>)}</ul>
}

/** 카테고리는 기본 펼침, 결제수단은 기본 접힘이며 두 영역은 독립적으로 동작합니다. */
export default function StatisticsBreakdowns({ categories, payment_methods }: { categories: Category[]; payment_methods: PaymentMethod[] }) {
  return (
    <>
      <details className="statistics-panel statistics-section" open>
        <summary className="statistics-section-toggle"><h2>카테고리별 지출</h2><span>선택 월 기준<Chevron /></span></summary>
        <CategoryList categories={categories} />
      </details>
      <details className="statistics-panel statistics-section">
        <summary className="statistics-section-toggle"><h2>결제수단별 지출</h2><span>선택 월 기준<Chevron /></span></summary>
        <PaymentList methods={payment_methods} />
      </details>
    </>
  )
}
