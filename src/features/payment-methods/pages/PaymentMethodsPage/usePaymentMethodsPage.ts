import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../auth/AuthProvider'
import { loadCurrentProfile } from '../../../auth/auth.api'
import { list_my_ledgers } from '../../../ledgers/ledgers.api'
import { get_ledger_display_name } from '../../../ledgers/ledgers.utils'
import { create_payment_method, deactivate_payment_method, get_payment_methods, update_payment_method } from '../../payment-methods.api'
import type { ManagedPaymentMethod, PaymentMethodType } from '../../payment-methods.api'

/** 조회/입력 상태와 저장 이벤트는 훅이 담당하고 화면은 렌더링만 합니다. */
export function usePaymentMethodsPage() {
  const { session } = useAuth()
  const query_client = useQueryClient()
  const [chosen_ledger_id, set_chosen_ledger_id] = useState<string | null>(null)
  const [sheet_state, set_sheet_state] = useState<'closed' | 'create' | 'edit' | 'saving'>('closed')
  const [editing_method, set_editing_method] = useState<ManagedPaymentMethod | null>(null)
  const [method_name, set_method_name] = useState('')
  const [method_type, set_method_type] = useState<PaymentMethodType | ''>('')
  const [form_error, set_form_error] = useState('')

  const ledger_query = useQuery({
    queryKey: ['payment-management', 'ledgers', session?.user.id ?? 'signed-out'],
    queryFn: async () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      const profile = await loadCurrentProfile(session.user.id)
      if (!profile) throw new Error('회원정보를 확인하지 못했습니다.')
      return { profile, ledgers: await list_my_ledgers(profile.user_srno) }
    },
    enabled: Boolean(session),
  })
  const ledgers = ledger_query.data?.ledgers ?? []
  const default_ledger = ledgers.find((ledger) => ledger.ledger_type === 'PERSONAL') ?? ledgers[0]
  const ledger_id = chosen_ledger_id ?? default_ledger?.ledger_id ?? null
  const selected_ledger = ledgers.find((ledger) => ledger.ledger_id === ledger_id)
  const methods_query = useQuery({
    queryKey: ['payment-management', 'methods', session?.user.id ?? 'signed-out', ledger_id],
    queryFn: () => {
      if (!ledger_id) throw new Error('가계부를 선택해주세요.')
      return get_payment_methods(ledger_id)
    },
    enabled: Boolean(session && ledger_id),
  })
  const methods = methods_query.data ?? []

  let data_state: 'loading' | 'error' | 'no-ledger' | 'ready' = 'ready'
  if (ledger_query.isPending) data_state = 'loading'
  else if (ledger_query.isError) data_state = 'error'
  else if (ledgers.length === 0) data_state = 'no-ledger'
  else if (methods_query.isPending) data_state = 'loading'
  else if (methods_query.isError) data_state = 'error'

  let ledger_name = '가계부를 불러오는 중'
  if (selected_ledger) ledger_name = get_ledger_display_name(selected_ledger, ledger_query.data?.profile.nickname ?? null)
  let sheet_title = '결제수단 추가'
  if (editing_method) sheet_title = '결제수단 수정'
  let save_label = '저장'
  if (sheet_state === 'saving') save_label = '저장 중...'

  function choose_ledger(next_ledger_id: string) {
    if (sheet_state === 'saving') return
    set_sheet_state('closed')
    set_editing_method(null)
    set_chosen_ledger_id(next_ledger_id)
  }

  function open_add_sheet() {
    set_editing_method(null)
    set_method_name('')
    set_method_type('')
    set_form_error('')
    set_sheet_state('create')
  }

  function open_edit_sheet(method: ManagedPaymentMethod) {
    set_editing_method(method)
    set_method_name(method.method_name)
    set_method_type(method.method_type)
    set_form_error('')
    set_sheet_state('edit')
  }

  function close_sheet() {
    if (sheet_state === 'saving') return
    set_sheet_state('closed')
  }

  /** 입력/달력에서 오래된 결제수단 이름·활성 상태를 다시 조회하게 합니다. */
  async function refresh_methods() {
    await Promise.all([
      query_client.invalidateQueries({ queryKey: ['payment-management', 'methods', session?.user.id, ledger_id] }),
      query_client.invalidateQueries({ queryKey: ['expense-entry', 'options', session?.user.id, ledger_id] }),
      query_client.invalidateQueries({ queryKey: ['calendar', 'monthly-expenses', session?.user.id] }),
    ])
  }

  async function save_method(activate = false) {
    if (!ledger_id || (sheet_state !== 'create' && sheet_state !== 'edit')) return
    const name = method_name.trim()
    if (!name || name.length > 30) {
      set_form_error('결제수단 이름을 1~30자로 입력해주세요.')
      return
    }
    if (!method_type) {
      set_form_error('카드 또는 현금을 선택해주세요.')
      return
    }
    const duplicate = methods.some((method) => method.is_active && method.payment_method_id !== editing_method?.payment_method_id && method.method_type === method_type && method.method_name.trim() === name)
    if (duplicate) {
      set_form_error('같은 유형에 이미 사용 중인 이름입니다.')
      return
    }
    // 유형은 과거 거래가 참조하는 같은 행에 저장되어 있으므로 이동 영향을 확인합니다.
    if (editing_method && editing_method.method_type !== method_type) {
      if (!window.confirm('유형을 변경하면 기존 지출의 결제수단 분류와 필터도 변경됩니다. 계속할까요?')) return
    }
    const previous_state = sheet_state
    set_sheet_state('saving')
    set_form_error('')
    try {
      if (editing_method) {
        const input: Parameters<typeof update_payment_method>[0] = { ledger_id, payment_method_id: editing_method.payment_method_id, method_name: name, method_type, expected_is_active: editing_method.is_active }
        if (activate) input.is_active = true
        await update_payment_method(input)
      } else {
        const sort_order = Math.max(-1, ...methods.filter((method) => method.method_type === method_type).map((method) => method.sort_order)) + 1
        await create_payment_method({ ledger_id, method_name: name, method_type, sort_order })
      }
      await refresh_methods()
      set_sheet_state('closed')
    } catch (error) {
      set_form_error(error instanceof Error ? error.message : '결제수단을 저장하지 못했습니다.')
      set_sheet_state(previous_state)
    }
  }

  async function disable_method() {
    if (!ledger_id || !editing_method || sheet_state !== 'edit') return
    if (editing_method.is_active === false) {
      await save_method(true)
      return
    }
    if (!window.confirm(`${editing_method.method_name}을(를) 비활성화할까요?\n새 지출 선택에서 제외되며 기존 지출은 유지됩니다.`)) return
    set_sheet_state('saving')
    set_form_error('')
    try {
      await deactivate_payment_method(ledger_id, editing_method.payment_method_id)
      await refresh_methods()
      set_sheet_state('closed')
    } catch (error) {
      set_form_error(error instanceof Error ? error.message : '결제수단을 비활성화하지 못했습니다.')
      set_sheet_state('edit')
    }
  }

  async function retry() {
    if (ledger_query.isError) await ledger_query.refetch()
    else await methods_query.refetch()
  }

  return { data_state, ledgers, ledger_id, ledger_name, nickname: ledger_query.data?.profile.nickname ?? null, methods, sheet_state, sheet_title, save_label, editing_method, method_name, method_type, form_error, set_method_name, set_method_type, choose_ledger, open_add_sheet, open_edit_sheet, close_sheet, save_method, disable_method, retry }
}
