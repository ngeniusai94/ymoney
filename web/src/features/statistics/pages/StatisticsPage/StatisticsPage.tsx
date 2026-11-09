import { format_expense_total } from '../../../calendar/calendar.utils'
import { useStatisticsPage } from './useStatisticsPage'
import StatisticsBreakdowns from './StatisticsBreakdowns'
import './StatisticsPage.css'

type StatisticsModel = ReturnType<typeof useStatisticsPage>

/** 단일 상태에 맞는 본문만 반환하여 로딩과 오류의 중복 표시를 막습니다. */
function StatisticsContent({ model }: { model: StatisticsModel }) {
  switch (model.state) {
    case 'loading':
      return <p className="statistics-state" role="status">통계를 불러오고 있어요.</p>
    case 'error':
      return <div className="statistics-state" role="alert"><p>통계를 불러오지 못했어요.</p><button type="button" onClick={model.retry}>다시 시도</button></div>
    case 'no-ledger':
      return <p className="statistics-state">선택한 범위에 연결된 가계부가 없어요.</p>
    case 'ready':
      return <StatisticsCharts model={model} />
  }
}

/** 실제 조회 결과로만 세 달 추이와 선택 월의 상위 카테고리 합계를 그립니다. */
function StatisticsCharts({ model }: { model: StatisticsModel }) {
  const maximum_month_total = Math.max(1, ...model.monthly_totals.map(month => month.amount))

  return (
    <>
      <section className="statistics-panel" aria-labelledby="statistics-trend-title">
        <div className="statistics-panel-heading"><h2 id="statistics-trend-title">최근 3개월 지출</h2><span>단위: 원</span></div>
        <ul className="statistics-month-bars" aria-label="월별 지출 금액">
          {model.monthly_totals.map((month, index) => (
            <li className={`statistics-month-column statistics-month-column-${index}`} key={month.key}>
              <div className="statistics-month-plot">
                <strong aria-label={`${month.full_label} ${format_expense_total(month.amount)}`}>{new Intl.NumberFormat('ko-KR').format(month.amount)}</strong>
                <span className="statistics-month-bar" aria-hidden="true" style={{ height: `${month.amount / maximum_month_total * 144}px` }} />
              </div>
              <span className="statistics-month-label">{month.label}</span>
            </li>
          ))}
        </ul>
      </section>
      <StatisticsBreakdowns key={`${model.scope}:${model.selected_group_id}:${model.month_label}`} categories={model.categories} payment_methods={model.payment_methods} />
    </>
  )
}

/** 화면은 표시만 담당하고 URL 변경·조회·집계는 전용 훅과 순수 함수가 담당합니다. */
export default function StatisticsPage() {
  const model = useStatisticsPage()
  return (
    <section className="statistics-screen">
      <header className="statistics-header"><h1>통계</h1></header>
      <div className="statistics-scope-tabs" role="group" aria-label="통계 가계부 범위">
        <button type="button" aria-pressed={model.scope === 'ALL'} onClick={() => model.change_scope('ALL')}>전체</button>
        <button type="button" aria-pressed={model.scope === 'PERSONAL'} onClick={() => model.change_scope('PERSONAL')}>개인 가계부</button>
        {model.group_ledgers.map(ledger => (
          <button type="button" key={ledger.ledger_id} title={ledger.ledger_name} aria-pressed={model.scope === 'GROUP' && model.selected_group_id === ledger.ledger_id} onClick={() => model.change_scope('GROUP', ledger.ledger_id)}>{ledger.ledger_name}</button>
        ))}
      </div>
      <nav className="statistics-month-picker" aria-label="통계 월 선택">
        <button type="button" aria-label="이전 달" onClick={() => model.change_month(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>
        <strong aria-live="polite">{model.month_label}</strong>
        <button type="button" aria-label="다음 달" onClick={() => model.change_month(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>
      </nav>
      <section className="statistics-summary" aria-label="선택 월 총 지출"><p>선택 월 총 지출</p><strong>{model.total_label}</strong></section>
      <StatisticsContent model={model} />
    </section>
  )
}
