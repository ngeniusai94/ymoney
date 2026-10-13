import { ExpenseForm } from './ExpensePage'
import { useExpenseRecord } from './useExpensePage'
import { useExpenseSheet } from './useExpenseSheet'
import './ExpenseSheet.css'

/** 추가·수정 폼을 같은 시트에 표시하며, 조회 중에도 동일한 열기/닫기 전환을 유지합니다. */
export default function ExpenseSheet({ transaction_id, on_close, on_saved }: {
  transaction_id?: string
  on_close: () => void
  on_saved: (date: string) => void
}) {
  const { dialog_ref, phase, request_close, set_busy } = useExpenseSheet(on_close)
  const record_query = useExpenseRecord(transaction_id)
  let sheet_label = '새 지출 입력'
  if (transaction_id) sheet_label = '지출 수정'
  let content
  if (transaction_id && record_query.isPending) {
    content = <div className="expense-sheet-state"><button type="button" onClick={request_close}>닫기</button><p>지출을 불러오고 있어요.</p></div>
  } else if (transaction_id && (record_query.isError || !record_query.data)) {
    content = <div className="expense-sheet-state" role="alert"><button type="button" onClick={request_close}>닫기</button>
      <p>수정할 지출을 불러오지 못했어요.</p><button type="button" onClick={() => void record_query.refetch()}>다시 시도</button></div>
  } else {
    content = <ExpenseForm key={transaction_id ?? 'new'} existing_expense={record_query.data ?? null}
      on_close={request_close} on_saved={(date) => {
        // 저장·삭제 완료 후 먼저 보호를 해제해야 같은 닫기 애니메이션을 시작할 수 있습니다.
        set_busy(false)
        on_saved(date)
      }} on_busy_change={set_busy} />
  }
  return <dialog ref={dialog_ref} className={`expense-sheet is-${phase}`} aria-label={sheet_label}
    onCancel={(event) => { event.preventDefault(); request_close() }}
    onClick={(event) => { if (event.target === event.currentTarget) request_close() }}>
    <div className="expense-sheet-panel">
      <div className="expense-sheet-handle" aria-hidden="true" />
      {content}
    </div>
  </dialog>
}
