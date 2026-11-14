import type { ReactNode } from 'react'
import { useState } from 'react'
import StatusToast from '../../../../components/StatusToast/StatusToast'
import { Link } from 'react-router-dom'
import ReorderHandle from '../../../../components/ReorderHandle/ReorderHandle'
import type { ReorderTarget } from '../../../../components/ReorderHandle/ReorderHandle'
import LedgerTabs from '../../../ledgers/components/LedgerTabs'
import { get_ledger_display_name } from '../../../ledgers/ledgers.utils'
import PaymentIcon from '../../PaymentIcon'
import { card_icons } from '../../payment-method-icons'
import type { PaymentMethodType } from '../../payment-methods.api'
import { usePaymentMethodsPage } from './usePaymentMethodsPage'
import './PaymentMethodsPage.css'

const method_types: { value: PaymentMethodType; label: string }[] = [
  { value: 'CARD', label: '카드' },
  { value: 'CASH', label: '현금' },
]

/** 화면 상태별 전체 영역을 선택하며 JSX 중첩 삼항식은 사용하지 않습니다. */
function PaymentMethodsPage() {
  const page = usePaymentMethodsPage()
  const [drop_target, set_drop_target] = useState<{ id: string; side: 'before' | 'after' } | null>(null)
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
        rows = methods.map((method, from) => {
          const id = method.payment_method_id
          const target_index = (target: ReorderTarget | null) => {
            if (target?.scope !== type.value) return -1
            return methods.findIndex(item => item.payment_method_id === target.id)
          }
          return (
            <div className="payments-method" key={id} data-reorder-payment="" data-reorder-id={id}
              data-reorder-scope={type.value} data-drop-side={drop_target?.id === id ? drop_target.side : undefined}>
              <button type="button" className="payments-method-edit" aria-label={`${method.method_name} 수정`}
                disabled={page.is_reordering} onClick={() => page.open_edit_sheet(method)}>
                <span className="payments-method-icon"><PaymentIcon type={type.value} icon_key={method.icon_key} /></span>
                <strong>{method.method_name}</strong>
                {!method.is_active && <small className="payments-inactive">비활성</small>}
              </button>
              <ReorderHandle target_selector="[data-reorder-payment]" name={method.method_name} disabled={page.is_reordering}
                on_preview={(target) => {
                  const to = target_index(target)
                  const side = from < to ? 'after' : 'before'
                  const next = target && to >= 0 && to !== from ? { id: target.id, side } as const : null
                  set_drop_target(current => current?.id === next?.id && current?.side === next?.side ? current : next)
                }}
                on_drop={(target) => {
                  const to = target_index(target)
                  if (to < 0) {
                    page.reorder_toast.show('같은 결제수단 종류 내에서만 이동할 수 있습니다.')
                    return
                  }
                  void page.reorder_methods(type.value, methods, from, to)
                }}
                on_step={(direction) => void page.reorder_methods(type.value, methods, from, from + direction)} />
            </div>
          )
        })
      }
      return <section className="payments-type-card" key={type.value} aria-label={type.label}><header><span className="payments-type-icon"><PaymentIcon type={type.value} /></span><strong>{type.label}</strong><small>{active_count}개</small></header>{rows}</section>
    })
  }

  let add_button: ReactNode = null
  if (page.data_state === 'ready') {
    add_button = <button type="button" className="payments-add" aria-label="결제수단 추가" disabled={page.is_reordering} onClick={page.open_add_sheet}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
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
        {page.method_type === 'CARD' && (
          <div className="payments-icon-field">
            <div id="payment-icon-label" className="payments-field-label">결제수단 아이콘(선택)</div>
            <div className="payments-icon-options" role="group" aria-labelledby="payment-icon-label">
              <button type="button" aria-label="기본 카드 아이콘" title="기본 카드 아이콘"
                aria-pressed={!card_icons.some((icon) => icon.key === page.icon_key)}
                onClick={() => page.set_icon_key(null)}>
                <PaymentIcon type="CARD" />
              </button>
              {page.ordered_card_icons.map((icon) => (
                <button key={icon.key} type="button" aria-label={icon.label} title={icon.label}
                  aria-pressed={page.icon_key === icon.key} onClick={() => page.set_icon_key(icon.key)}>
                  <img className="payments-card-icon" src={icon.src} alt="" />
                </button>
              ))}
            </div>
          </div>
        )}
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
      <LedgerTabs
        label="관리할 가계부 선택"
        options={page.ledgers.map(ledger => ({ id: ledger.ledger_id, name: get_ledger_display_name(ledger, page.nickname) }))}
        selected_id={page.ledger_id}
        on_select={page.choose_ledger}
      />
      <h2 className="payments-list-title">결제수단</h2>
      {content}
    </div>
    <StatusToast message={page.reorder_toast.message} />
    {add_button}
    {sheet}
  </section>
}

export default PaymentMethodsPage
