import { Link, useParams } from 'react-router-dom'
import { useRef } from 'react'
import type { ExistingExpense } from '../../transactions.api'
import { get_ledger_display_name } from '../../../ledgers/ledgers.utils'
import { useExpensePage, useExpenseRecord } from './useExpensePage'
import type { ExpenseFormCallbacks } from './useExpensePage'
import './ExpensePage.css'

/** 신규 입력과 수정을 같은 한 화면 폼으로 렌더링합니다. */
export function ExpenseForm({ existing_expense, ...callbacks }: { existing_expense: ExistingExpense | null } & ExpenseFormCallbacks) {
  // 화면이 DOM 참조를 소유하고, 클릭 시에만 훅의 포커스 이동 함수에 전달합니다.
  const memo_ref = useRef<HTMLInputElement>(null)
  const form = useExpensePage(existing_expense, callbacks)
  let ledger_content
  let category_content
  let payment_content

  if (form.ledger_query.isPending) {
    ledger_content = <p className="expense-form-state">가계부를 불러오고 있어요.</p>
  } else if (form.ledger_query.isError) {
    ledger_content = <p className="expense-form-state is-error">가계부를 불러오지 못했습니다.</p>
  } else if (form.visible_ledgers.length === 0) {
    ledger_content = <p className="expense-form-state">사용할 수 있는 가계부가 없습니다.</p>
  } else {
    ledger_content = (
      <div className="expense-chip-row" role="group" aria-label="가계부 선택">
        {form.visible_ledgers.map((ledger) => (
          <button
            key={ledger.ledger_id}
            type="button"
            className={`expense-chip expense-ledger-chip${form.ledger_id === ledger.ledger_id ? ' is-selected' : ''}`}
            aria-pressed={form.ledger_id === ledger.ledger_id}
            disabled={form.is_edit_mode}
            onClick={() => form.choose_ledger(ledger.ledger_id)}
          >
            {ledger.ledger_type === 'PERSONAL' ? '👤' : '🏠'} {get_ledger_display_name(ledger, form.ledger_query.data?.profile.nickname)}
          </button>
        ))}
      </div>
    )
  }

  if (form.options_query.isPending) {
    category_content = <p className="expense-form-state">카테고리를 불러오고 있어요.</p>
    payment_content = <p className="expense-form-state">결제수단을 불러오고 있어요.</p>
  } else if (form.options_query.isError) {
    category_content = <p className="expense-form-state is-error">카테고리를 불러오지 못했습니다.</p>
    payment_content = <p className="expense-form-state is-error">결제수단을 불러오지 못했습니다.</p>
  } else {
    category_content = (
      <>
        <div className="expense-chip-row" role="group" aria-label="카테고리 선택">
          {form.parent_categories.map((category) => (
            <button
              key={category.category_id}
              type="button"
              className={`expense-chip${form.active_parent_id === category.category_id ? ' is-selected' : ''}`}
              aria-pressed={form.active_parent_id === category.category_id}
              onClick={() => form.set_category_id(category.category_id)}
            >
              {category.category_name}
            </button>
          ))}
        </div>
        {form.child_categories.length > 0 ? (
          <div className="expense-subcategory">
            <span className="expense-field-label">하위 카테고리 · 선택</span>
            <div className="expense-chip-row" role="group" aria-label="하위 카테고리 선택">
              {form.child_categories.map((category) => (
                <button
                  key={category.category_id}
                  type="button"
                  className={`expense-chip${form.category_id === category.category_id ? ' is-selected' : ''}`}
                  aria-pressed={form.category_id === category.category_id}
                  onClick={() => form.set_category_id(category.category_id)}
                >
                  {category.category_name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </>
    )
    payment_content = (
      <div className="expense-chip-row" role="group" aria-label="결제수단 선택">
        {form.payment_methods.map((method) => (
          <button
            key={method.payment_method_id}
            type="button"
            className={`expense-chip${form.payment_method_id === method.payment_method_id ? ' is-selected' : ''}`}
            aria-pressed={form.payment_method_id === method.payment_method_id}
            onClick={() => form.choose_payment_method(method.payment_method_id, memo_ref.current)}
          >
            <span aria-hidden="true">{method.method_type === 'CARD' ? '💳' : '💵'}</span> {method.method_name}
          </button>
        ))}
      </div>
    )
  }

  return (
    <section className="expense-screen" aria-label={form.is_edit_mode ? '지출 수정' : '새 지출 입력'}>
      <header className="expense-topbar">
        <button type="button" onClick={form.close_form} disabled={form.is_saving || form.is_deleting}>취소</button>
        <strong>{form.is_edit_mode ? '지출 수정' : '새 지출'}</strong>
        {/* <button type="button" onClick={form.reset_form}>{form.is_edit_mode ? '원래대로' : '초기화'}</button> */}
        {form.is_edit_mode ? (
          <button
            type="button"
            className="expense-delete-trigger"
            onClick={form.request_delete}
            disabled={form.is_saving || form.is_deleting}
          >삭제</button>
        ) : null}        
      </header>

      <div className="expense-fields">
        
        <div className="expense-field">
          <span className="expense-field-label">가계부</span>
          {ledger_content}
        </div>

        <div className="expense-field">
          <label className="expense-field-label" htmlFor="expense-datetime">날짜와 시간</label>
          <div className="expense-datetime-line">
            <span aria-hidden="true">▦</span>
            <input
              id="expense-datetime"
              type="datetime-local"
              value={form.date_time}
              onChange={(event) => form.set_date_time(event.target.value)}
            />
          </div>
        </div>
        
        <div className="expense-field">
          <label className="expense-field-label" htmlFor="expense-amount">금액</label>
          <div className="expense-amount-line">
            <input
              id="expense-amount"
              autoFocus={!form.is_edit_mode}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              maxLength={14}
              value={form.amount}
              onChange={(event) => form.set_amount(form.normalize_expense_amount(event.target.value))}
              placeholder="0"
              aria-label="지출 금액"
            />
            <span>원</span>
          </div>
        </div>

        <div className="expense-field">
          <span className="expense-field-label">카테고리</span>
          {category_content}
        </div>



        <div className="expense-field">
          <span className="expense-field-label">결제수단</span>
          {payment_content}
        </div>

        <div className="expense-field">
          <label className="expense-field-label" htmlFor="expense-memo">메모(선택)</label>
          <input
            id="expense-memo"
            ref={memo_ref}
            className="expense-memo"
            type="text"
            maxLength={200}
            value={form.memo}
            onChange={(event) => form.set_memo(event.target.value)}
            placeholder="어디에 썼는지 적어주세요"
          />
        </div>



        {form.form_error ? <p className="expense-form-error" role="alert">{form.form_error}</p> : null}
      </div>

      <div className="expense-save-area">
        <button type="button" onClick={() => void form.save_expense()} disabled={form.is_saving || form.is_deleting || form.is_delete_confirm_open || form.options_query.isPending}>
          {form.is_saving ? '저장 중...' : form.is_edit_mode ? '변경사항 저장' : `${form.display_amount || '0'}원 지출 저장`}
        </button>
      </div>

      {form.is_delete_confirm_open ? (
        <div className="expense-delete-overlay">
          <div className="expense-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="expense-delete-title" aria-describedby="expense-delete-description">
            <h2 id="expense-delete-title">이 지출을 삭제할까요?</h2>
            <p id="expense-delete-description">삭제하면 달력과 지출 목록에서 보이지 않습니다.</p>
            {form.form_error ? <p className="expense-form-error" role="alert">{form.form_error}</p> : null}
            <div className="expense-delete-actions">
              <button type="button" onClick={form.cancel_delete} disabled={form.is_deleting} autoFocus>취소</button>
              <button type="button" className="is-danger" onClick={() => void form.confirm_delete()} disabled={form.is_deleting}>
                {form.is_deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

/** 수정 URL에서는 기록을 먼저 읽고 폼을 열어 초기값이 빈 화면으로 깜박이지 않게 합니다. */
function ExpensePage() {
  const { transaction_id } = useParams()
  const record_query = useExpenseRecord(transaction_id)

  if (!transaction_id) return <ExpenseForm existing_expense={null} />
  if (record_query.isPending) return <main className="expense-form-state">지출을 불러오고 있어요.</main>
  if (record_query.isError || !record_query.data) {
    return (
      <main className="expense-form-state is-error">
        <p>수정할 지출을 찾지 못했어요.</p>
        <Link to="/app/calendar">달력으로 이동</Link>
      </main>
    )
  }

  return <ExpenseForm key={record_query.data.transaction_id} existing_expense={record_query.data} />
}

export default ExpensePage
