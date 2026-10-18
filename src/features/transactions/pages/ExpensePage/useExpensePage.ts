import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loadCurrentProfile } from '../../../auth/auth.api'
import { useAuth } from '../../../auth/AuthProvider'
import { list_my_ledgers } from '../../../ledgers/ledgers.api'
import { get_expense_options } from '../../expense-options.api'
import { get_existing_expense_values, get_initial_expense_datetime, normalize_expense_amount, select_child_categories } from '../../expense.utils'
import { create_expense, delete_expense, get_expense, update_expense } from '../../transactions.api'
import type { ExistingExpense } from '../../transactions.api'

/** 수정 URL에서는 거래 한 건만 조회하며, 신규 입력에서는 요청을 실행하지 않습니다. */
export function useExpenseRecord(transaction_id: string | undefined) {
  const { session } = useAuth()
  return useQuery({
    queryKey: ['expense-entry', 'record', session?.user.id ?? 'signed-out', transaction_id],
    queryFn: () => {
      if (!transaction_id) throw new Error('지출 번호가 없습니다.')
      return get_expense(transaction_id)
    },
    enabled: Boolean(session && transaction_id),
  })
}

/** 입력 상태와 가계부별 선택 목록, 저장 후 달력 복귀를 관리합니다. */
export type ExpenseFormCallbacks = {
  on_close?: () => void
  on_saved?: (date: string) => void
  on_busy_change?: (busy: boolean) => void
}

export function useExpensePage(existing_expense: ExistingExpense | null, callbacks: ExpenseFormCallbacks = {}) {
  const { session } = useAuth()
  const navigate = useNavigate()
  const query_client = useQueryClient()
  const [search_params] = useSearchParams()
  // 고정된 내부 달력 경로로 복귀하며 전달받은 임의 URL로 이동하지 않습니다.
  function calendar_return_url(date: string) {
    const params = new URLSearchParams()
    params.set('date', date)
    const scope = search_params.get('scope')
    if (scope === 'ALL' || scope === 'PERSONAL' || scope === 'GROUP') params.set('scope', scope)
    const filters = search_params.get('filters')
    if (filters) params.set('filters', filters)
    return `/app/calendar?${params.toString()}`
  }
  const [amount, set_amount] = useState(() => existing_expense ? get_existing_expense_values(existing_expense).amount : '')
  const [memo, set_memo] = useState(() => existing_expense ? get_existing_expense_values(existing_expense).memo : '')
  const [date_time, set_date_time] = useState(() =>
    existing_expense
      ? get_existing_expense_values(existing_expense).date_time
      : get_initial_expense_datetime(search_params.get('date'), new Date()),
  )
  const [chosen_ledger_id, set_chosen_ledger_id] = useState<string | null>(null)
  const [category_id, set_category_id] = useState<string | null>(() => existing_expense?.category_id ?? null)
  const [payment_method_id, set_payment_method_id] = useState<string | null>(() => existing_expense?.payment_method_id ?? null)
  const [is_saving, set_is_saving] = useState(false)
  const [is_deleting, set_is_deleting] = useState(false)
  const [is_delete_confirm_open, set_is_delete_confirm_open] = useState(false)
  const [form_error, set_form_error] = useState('')
  const on_busy_change = callbacks.on_busy_change
  useEffect(() => { on_busy_change?.(is_saving || is_deleting) }, [is_saving, is_deleting, on_busy_change])

  const ledger_query = useQuery({
    queryKey: ['expense-entry', 'ledgers', session?.user.id ?? 'signed-out'],
    queryFn: async () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      const profile = await loadCurrentProfile(session.user.id)
      if (!profile) throw new Error('회원정보를 확인하지 못했습니다.')
      const ledgers = await list_my_ledgers(profile.user_srno)
      return { profile, ledgers }
    },
    enabled: Boolean(session),
  })
  const ledgers = ledger_query.data?.ledgers ?? []
  const default_ledger = ledgers.find((ledger) => ledger.ledger_type === 'PERSONAL') ?? ledgers[0]
  const ledger_id = existing_expense?.ledger_id ?? chosen_ledger_id ?? default_ledger?.ledger_id ?? null
  const visible_ledgers = existing_expense
    ? ledgers.filter((ledger) => ledger.ledger_id === existing_expense.ledger_id)
    : ledgers

  const options_query = useQuery({
    queryKey: ['expense-entry', 'options', session?.user.id ?? 'signed-out', ledger_id],
    queryFn: () => {
      if (!ledger_id) throw new Error('가계부를 선택해주세요.')
      return get_expense_options(ledger_id)
    },
    enabled: Boolean(session && ledger_id),
  })
  const categories = options_query.data?.categories ?? []
  const payment_methods = options_query.data?.payment_methods ?? []
  const selected_category = categories.find((category) => category.category_id === category_id)
  const active_parent_id = selected_category?.parent_category_id ?? selected_category?.category_id ?? null
  const parent_categories = categories.filter((category) => category.parent_category_id === null)
  const child_categories = select_child_categories(categories, active_parent_id)
  const display_amount = amount ? new Intl.NumberFormat('ko-KR').format(Number(amount)) : ''

  function choose_ledger(next_ledger_id: string) {
    if (existing_expense) return
    if (next_ledger_id === ledger_id) return
    set_chosen_ledger_id(next_ledger_id)
    set_category_id(null)
    set_payment_method_id(null)
    set_form_error('')
  }

  function reset_form() {
    const original = existing_expense ? get_existing_expense_values(existing_expense) : null
    set_amount(original?.amount ?? '')
    set_memo(original?.memo ?? '')
    set_category_id(original?.category_id ?? null)
    set_payment_method_id(original?.payment_method_id ?? null)
    set_date_time(original?.date_time ?? get_initial_expense_datetime(search_params.get('date'), new Date()))
    set_form_error('')
  }

  function close_form() {
    if (is_saving || is_deleting) return
    if (callbacks.on_close) { callbacks.on_close(); return }
    navigate(calendar_return_url(existing_expense?.trans_date ?? date_time.slice(0, 10)))
  }

  async function save_expense() {
    if (is_saving || is_deleting || is_delete_confirm_open) return
    const numeric_amount = Number(amount)
    if (!ledger_id || !category_id || !payment_method_id || !date_time || !Number.isInteger(numeric_amount) || numeric_amount <= 0) {
      set_form_error('금액·카테고리·결제수단·날짜와 시간을 확인해주세요.')
      return
    }
    if (!ledger_query.data?.profile) {
      set_form_error('회원정보를 불러오지 못했습니다.')
      return
    }

    set_is_saving(true)
    set_form_error('')
    try {
      const values = {
        ledger_id,
        category_id,
        payment_method_id,
        amount: numeric_amount,
        memo: memo.trim() || null,
        trans_date: date_time.slice(0, 10),
        trans_time: `${date_time.slice(11, 16)}:00`,
      }
      if (existing_expense) {
        await update_expense(existing_expense.transaction_id, {
          ...values,
          updated_by_user_srno: ledger_query.data.profile.user_srno,
        })
      } else {
        await create_expense({
          ...values,
          created_by_user_srno: ledger_query.data.profile.user_srno,
        })
      }
      // 달력의 원격 캐시를 무효화하면 복귀 후 최신 합계와 목록을 다시 요청합니다.
      await query_client.invalidateQueries({ queryKey: ['calendar', 'monthly-expenses', session?.user.id] })
      if (callbacks.on_saved) {
        callbacks.on_saved(date_time.slice(0, 10))
        callbacks.on_close?.()
      } else {
        navigate(calendar_return_url(date_time.slice(0, 10)), { replace: true })
      }
    } catch (error) {
      set_form_error(error instanceof Error ? error.message : '지출을 저장하지 못했습니다.')
    } finally {
      set_is_saving(false)
    }
  }

  function request_delete() {
    if (!existing_expense || is_saving || is_deleting) return
    set_form_error('')
    set_is_delete_confirm_open(true)
  }

  function cancel_delete() {
    if (is_deleting) return
    set_is_delete_confirm_open(false)
  }

  async function confirm_delete() {
    if (!existing_expense || !is_delete_confirm_open || is_saving || is_deleting) return
    const user_srno = ledger_query.data?.profile.user_srno
    if (!user_srno) {
      set_form_error('회원정보를 불러오지 못했습니다.')
      return
    }

    set_is_deleting(true)
    set_form_error('')
    try {
      await delete_expense(existing_expense.transaction_id, existing_expense.ledger_id, user_srno)
      // 삭제된 행이 월·일 합계와 목록에서 빠지도록 캐시를 다시 읽게 합니다.
      await query_client.invalidateQueries({ queryKey: ['calendar', 'monthly-expenses', session?.user.id] })
      if (callbacks.on_saved) {
        callbacks.on_saved(existing_expense.trans_date)
        callbacks.on_close?.()
      } else {
        navigate(calendar_return_url(existing_expense.trans_date), { replace: true })
      }
    } catch (error) {
      set_form_error(error instanceof Error ? error.message : '지출을 삭제하지 못했습니다.')
    } finally {
      set_is_deleting(false)
    }
  }

  // 사용자 클릭 안에서 바로 포커스하여 모바일에서도 메모 입력을 이어갈 수 있게 합니다.
  function choose_payment_method(payment_method_id: string, memo_input: HTMLInputElement | null) {
    set_payment_method_id(payment_method_id)
    memo_input?.focus()
  }

  return {
    active_parent_id,
    amount,
    categories,
    category_id,
    child_categories,
    cancel_delete,
    choose_ledger,
    choose_payment_method,
    close_form,
    confirm_delete,
    date_time,
    display_amount,
    form_error,
    is_edit_mode: Boolean(existing_expense),
    is_delete_confirm_open,
    is_deleting,
    is_saving,
    ledger_id,
    ledger_query,
    ledgers,
    visible_ledgers,
    memo,
    normalize_expense_amount,
    options_query,
    parent_categories,
    payment_method_id,
    payment_methods,
    reset_form,
    request_delete,
    save_expense,
    set_amount,
    set_category_id,
    set_date_time,
    set_memo,
    set_payment_method_id,
  }
}
