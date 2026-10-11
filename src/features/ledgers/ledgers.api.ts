import { get_supabase_client } from '../../lib/supabase'

/** 달력의 빠른 조회 범위. 가계부 ID나 접근 권한과는 별개인 표시 조건입니다. */
export type LedgerScope = 'ALL' | 'PERSONAL' | 'GROUP'

export type LedgerSummary = {
  ledger_id: string
  ledger_type: 'PERSONAL' | 'GROUP'
  ledger_name: string
}

type LedgerRow = {
  ledger_id: number | string
  ledger_type: 'PERSONAL' | 'GROUP'
  ledger_name: string
}

/** 첫 로그인 때 개인 가계부와 본인 멤버십을 함께 준비합니다. 재호출해도 중복 생성되지 않습니다. */
export async function ensure_personal_ledger(): Promise<string> {
  const { data, error } = await get_supabase_client()
    .schema('ymoney')
    .rpc('fn_mon_ensure_personal_ledger')

  if (error || data === null) {
    throw new Error('개인 가계부를 준비하지 못했습니다. 다시 시도해주세요.')
  }

  // React Query의 queryFn은 undefined 대신 실제 조회 결과를 반환해야 합니다.
  return String(data)
}

/** 로그인 계정에 속한 가계부를 개인·그룹 구분 없이 조회합니다. */
export async function list_my_ledgers(user_srno: string): Promise<LedgerSummary[]> {
  const { data, error } = await get_supabase_client()
    .schema('ymoney')
    .rpc('fn_mon_list_my_ledgers', { p_user_srno: user_srno })

  if (error) throw new Error('가계부 목록을 불러오지 못했습니다.')

  return ((data ?? []) as LedgerRow[]).map((ledger) => ({
    ledger_id: String(ledger.ledger_id),
    ledger_type: ledger.ledger_type,
    ledger_name: ledger.ledger_name,
  }))
}
