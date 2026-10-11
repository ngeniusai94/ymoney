import { get_supabase_client } from '../../lib/supabase'

export type PaymentMethodType = 'CARD' | 'CASH'
export type ManagedPaymentMethod = {
  payment_method_id: string
  method_type: PaymentMethodType
  method_name: string
  sort_order: number
  is_active: boolean
}

/** 관리에서는 비활성 항목도 읽어 과거 사용 항목을 확인할 수 있게 합니다. */
export async function get_payment_methods(ledger_id: string): Promise<ManagedPaymentMethod[]> {
  const { data, error } = await get_supabase_client().schema('ymoney').from('tb_mon_payment_method')
    .select('payment_method_id, method_type, method_name, sort_order, is_active')
    .eq('ledger_id', ledger_id).order('sort_order').order('payment_method_id')
  if (error) throw new Error('결제수단을 불러오지 못했습니다.')
  return (data ?? []).map((row) => ({ ...row, payment_method_id: String(row.payment_method_id) }))
}

export async function create_payment_method(input: {
  ledger_id: string
  method_type: PaymentMethodType
  method_name: string
  sort_order: number
}): Promise<void> {
  const { error } = await get_supabase_client().schema('ymoney').from('tb_mon_payment_method').insert(input)
  if (error) throw new Error('결제수단을 저장하지 못했습니다. 다시 시도해주세요.')
}

/** 분류 이동/이름 수정 시 기존 거래의 ID 연결은 유지합니다. */
export async function update_payment_method(input: {
  ledger_id: string
  payment_method_id: string
  method_type: PaymentMethodType
  method_name: string
  expected_is_active: boolean
  is_active?: true
}): Promise<void> {
  const changes: { method_type: PaymentMethodType; method_name: string; updated_at: string; is_active?: true } = { method_type: input.method_type, method_name: input.method_name, updated_at: new Date().toISOString() }
  if (input.is_active === true) changes.is_active = true
  const { data, error } = await get_supabase_client().schema('ymoney').from('tb_mon_payment_method')
    .update(changes)
    .eq('ledger_id', input.ledger_id).eq('payment_method_id', input.payment_method_id)
    .eq('is_active', input.expected_is_active).select('payment_method_id').maybeSingle()
  if (error) throw new Error('결제수단을 수정하지 못했습니다. 다시 시도해주세요.')
  if (!data) throw new Error('수정할 결제수단이 없습니다. 목록을 새로고침해주세요.')
}

/** 행 삭제 대신 비활성화하여 과거 거래의 참조를 보존합니다. */
export async function deactivate_payment_method(ledger_id: string, payment_method_id: string): Promise<void> {
  const { data, error } = await get_supabase_client().schema('ymoney').from('tb_mon_payment_method')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('ledger_id', ledger_id).eq('payment_method_id', payment_method_id)
    .eq('is_active', true).select('payment_method_id').maybeSingle()
  if (error) throw new Error('결제수단을 비활성화하지 못했습니다. 다시 시도해주세요.')
  if (!data) throw new Error('비활성화할 결제수단이 없습니다. 목록을 새로고침해주세요.')
}
