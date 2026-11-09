import { loadCurrentProfile } from '../auth/auth.api'
import { list_my_ledgers } from '../ledgers/ledgers.api'
import { get_ledger_display_name } from '../ledgers/ledgers.utils'
import { get_category_management_data } from '../categories/categories.api'
import { get_payment_methods } from '../payment-methods/payment-methods.api'
import type { FilterLedger } from './filter.utils'

/** 기존 읽기 API만 사용합니다. 조회 필터를 열었다고 기본 항목을 생성하지 않습니다. */
export async function get_calendar_filter_options(user_uuid: string): Promise<FilterLedger[]> {
  const profile = await loadCurrentProfile(user_uuid)
  if (!profile) throw new Error('회원정보를 확인하지 못했습니다.')
  const ledgers = await list_my_ledgers(profile.user_srno)
  return Promise.all(ledgers.map(async (ledger) => {
    const [data, methods] = await Promise.all([
      get_category_management_data(ledger.ledger_id), get_payment_methods(ledger.ledger_id),
    ])
    // 비활성 항목도 과거 기록의 검색 조건으로 남깁니다.
    return { ...ledger, display_name: get_ledger_display_name(ledger, profile.nickname), ...data, methods }
  }))
}
