import type { LedgerSummary } from './ledgers.api'

/** 개인 가계부는 현재 회원 닉네임을 표시하고, 공유 가계부는 저장된 이름을 유지합니다. */
export function get_ledger_display_name(
  ledger: Pick<LedgerSummary, 'ledger_type' | 'ledger_name'>,
  nickname: string | null | undefined,
): string {
  if (ledger.ledger_type === 'PERSONAL') return nickname?.trim() || '개인 가계부'
  return ledger.ledger_name
}
