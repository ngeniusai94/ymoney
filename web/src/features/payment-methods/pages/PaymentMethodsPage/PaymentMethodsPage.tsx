import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { get_ledger_display_name } from '../../../ledgers/ledgers.utils'
import type { PaymentMethodType } from '../../payment-methods.api'
import { usePaymentMethodsPage } from './usePaymentMethodsPage'
import './PaymentMethodsPage.css'

const method_types: { value: PaymentMethodType; label: string }[] = [
  { value: 'CARD', label: '카드' },
  { value: 'CASH', label: '현금' },
]

/** 목업의 카드 선 아이콘과 원화 기호를 재사용합니다. */
function PaymentIcon({ type }: { type: PaymentMethodType }) {
  if (type === 'CARD') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></svg>
  return <span aria-hidden="true">₩</span>
}

/** 화면 상태별 전체 영역을 선택하며 JSX 중첩 삼항식은 사용하지 않습니다. */
function PaymentMethodsPage() {
  const page = usePaymentMethodsPage()
  let content: ReactNode = null
  if (page.data_state === 'loading') {
    content = <p className="payments-state" role="status">결제수단을 불러오고 있어요.</p>
  } else if (page.data_state === 'error') {
    content = <div className="payments-state is-error" role="alert">결제수단을 불러오지 못했습니다.<button type="button" onClick={() => void page.retry()}>다시 시도</button></div>
  } else if (page.data_state === 'no-ledger') {
    content = <p className="payments-state">관리할 가계부가 없습니다.</p>
  } else if (page.data_state === 'ready') {
    content = method_types.map((type) => {
      const methods = page.methods.filter((method) => method.method_type === type.value)
      const active_count = methods.filter((method) => method.is_active).length
      let rows: ReactNode = <p className="payments-empty">등록된 결제수단이 없습니다.</p>
      if (methods.length > 0) {
        rows = methods.map((method) => {
          let badge: ReactNode = <span aria-hidden="true">⋮</span>
          if (method.is_active === false) badge = <span className="payments-method-actions"><small className="payments-inactive">비활성</small><span aria-hidden="true">⋮</span></span>
          return <button key={method.payment_method_id} type="button" className="payments-method" aria-label={`${method.method_name} 수정`} onClick={() => page.open_edit_sheet(method)}><span className="payments-method-icon"><PaymentIcon type={type.value} /></span><strong>{method.method_name}</strong>{badge}</button>
        })
      }
      return <section className="payments-type-card" key={type.value} aria-label={type.label}><header><span className="payments-type-icon"><PaymentIcon type={type.value} /></span><strong>{type.label}</strong><small>{active_count}개</small></header>{rows}</section>
    })
  }

  let add_button: ReactNode = null
  if (page.data_state === 'ready') {
    add_button = <button type="button" className="payments-add" aria-label="결제수단 추가" onClick={page.open_add_sheet}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
  }

  let sheet: ReactNode = null
  if (page.sheet_state !== 'closed') {
    let error_message: ReactNode = null
    if (page.form_error) error_message = <p className="payments-form-error" role="alert">{page.form_error}</p>
    let disable_button: ReactNode = null
    if (page.editing_method) {
      let action_label = '비활성화'
      if (page.editing_method.is_active === false) action_label = '활성화'
      disable_button = <button type="button" className="payments-disable" disabled={page.sheet_state === 'saving'} onClick={() => void page.disable_method()}>{action_label}</button>
    }
    // 배경 자체를 눌렀을 때만 닫습니다. 폼 안의 클릭은 유지하고 저장 중 닫기는 훅에서 막습니다.
    sheet = <div className={`payments-backdrop bottom-sheet-${page.sheet_phase}`} onClick={(event) => {
      if (event.target === event.currentTarget) page.close_sheet()
    }}><form className="payments-sheet" role="dialog" aria-modal="true" aria-labelledby="payments-sheet-title" onSubmit={(event) => { event.preventDefault(); void page.save_method() }}>
      <div className="payments-handle" aria-hidden="true" />
      <header><h2 id="payments-sheet-title">{page.sheet_title}</h2><button type="button" aria-label="닫기" disabled={page.sheet_state === 'saving'} onClick={page.close_sheet}>×</button></header>
      <fieldset disabled={page.sheet_state === 'saving'}>
        <label htmlFor="payment-method-name">이름</label>
        <input id="payment-method-name" value={page.method_name} onChange={(event) => page.set_method_name(event.target.value)} maxLength={30} placeholder="새 결제수단" autoFocus />
        <div id="payment-type-label" className="payments-field-label">결제수단 종류 · 필수</div>
        <div className="payments-type-options" role="group" aria-labelledby="payment-type-label">
          {method_types.map((type) => {
            let class_name = 'payments-type-option'
            if (page.method_type === type.value) class_name += ' is-selected'
            return <button key={type.value} type="button" className={class_name} aria-pressed={page.method_type === type.value} onClick={() => page.choose_method_type(type.value)}><PaymentIcon type={type.value} />{type.label}</button>
          })}
        </div>
      </fieldset>
      {error_message}
      <button type="submit" className="payments-save" disabled={page.sheet_state === 'saving'}>{page.save_label}</button>
      {disable_button}
    </form></div>
  }

  return <section className="payments-screen" aria-label="결제수단 관리">
    <header className="payments-topbar"><Link to="/app/settings" aria-label="설정으로 이동">‹</Link><h1>결제수단 관리</h1><span aria-hidden="true" /></header>
    <div className="payments-body">
      <div className="payments-ledger-label">관리할 가계부</div>
      <div className="payments-ledger-picker"><strong>{page.ledger_name}</strong><select className="payments-ledger-select" aria-label="관리할 가계부 선택" value={page.ledger_id ?? ''} onChange={(event) => page.choose_ledger(event.target.value)} disabled={page.ledgers.length === 0}><option value="" disabled hidden>선택</option>{page.ledgers.map((ledger) => <option key={ledger.ledger_id} value={ledger.ledger_id}>{get_ledger_display_name(ledger, page.nickname)}</option>)}</select></div>
      <h2 className="payments-list-title">결제수단</h2>
      {content}
    </div>
    {add_button}
    {sheet}
  </section>
}

export default PaymentMethodsPage
