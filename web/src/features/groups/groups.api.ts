import { get_supabase_client } from '../../lib/supabase'
import { list_my_ledgers } from '../ledgers/ledgers.api'

export type GroupMember = { nickname: string; masked_account: string; is_self: boolean }
export type GroupDetail = { ledger_id: string; ledger_name: string; invite_code: string | null; members: GroupMember[] }

/** 기존 가계부 목록 함수를 재사용하고 GROUP만 표시합니다. */
export async function list_groups(user_srno: string) {
  return (await list_my_ledgers(user_srno)).filter((ledger) => ledger.ledger_type === 'GROUP')
}

/** 기존 ledger SELECT 정책이 로그인 계정의 소속 그룹만 반환합니다. */
export async function get_group(ledger_id: string): Promise<GroupDetail | null> {
  const { data, error } = await get_supabase_client().schema('ymoney').from('tb_mon_ledger')
    .select('ledger_id,ledger_name,invite_code').eq('ledger_id', ledger_id).eq('ledger_type', 'GROUP').maybeSingle()
  if (error) throw new Error('그룹 정보를 불러오지 못했습니다.')
  if (!data) return null
  // 그룹 소속 확인은 함수 내부에서도 수행합니다. 다른 회원의 원문 이메일은 내려받지 않습니다.
  const members = await get_supabase_client().schema('ymoney').rpc('fn_mon_group_members', { p_ledger_id: ledger_id })
  if (members.error) throw new Error('멤버 정보를 불러오지 못했습니다.')
  // 두 조회 사이에 탈퇴한 경우 상세를 노출하지 않고 접근 불가 상태로 전환합니다.
  if (!members.data?.length) return null
  return { ...data, ledger_id: String(data.ledger_id), members: (members.data ?? []) as GroupMember[] }
}

/** 가계부와 첫 멤버를 하나의 DB 트랜잭션으로 생성합니다. */
export async function create_group(group_name: string): Promise<string> {
  const { data, error } = await get_supabase_client().schema('ymoney')
    .rpc('fn_mon_create_group', { p_group_name: group_name })
  if (error) {
    if (error.code === 'P0001') throw new Error(error.message)
    throw new Error('그룹을 만들지 못했습니다. 다시 시도해주세요.')
  }
  if (data === null) throw new Error('생성한 그룹을 확인하지 못했습니다.')
  return String(data)
}

/** 본인 번호는 서버에서 세션으로 결정하며 코드/정원/중복 검사를 함께 수행합니다. */
export async function join_group(invite_code: string): Promise<string> {
  const { data, error } = await get_supabase_client().schema('ymoney')
    .rpc('fn_mon_join_group', { p_invite_code: invite_code })
  if (error) {
    if (error.code === 'P0001') throw new Error(error.message)
    throw new Error('그룹에 참여하지 못했습니다. 다시 시도해주세요.')
  }
  if (data === null) throw new Error('참여한 그룹을 확인하지 못했습니다.')
  return String(data)
}

/** 본인만 나갑니다. 마지막 멤버이면 해당 그룹의 데이터가 영구 삭제됩니다. */
export async function leave_group(ledger_id: string): Promise<void> {
  const { error } = await get_supabase_client().schema('ymoney')
    .rpc('fn_mon_leave_group', { p_ledger_id: ledger_id })
  if (error) {
    if (error.code === 'P0001') throw new Error(error.message)
    throw new Error('그룹에서 나가지 못했습니다. 다시 시도해주세요.')
  }
}

/** 그룹 ID와 멤버 연결은 유지하고 이름만 변경합니다. */
export async function rename_group(ledger_id: string, ledger_name: string): Promise<void> {
  const { data, error } = await get_supabase_client().schema('ymoney').from('tb_mon_ledger')
    .update({ ledger_name, updated_at: new Date().toISOString() })
    .eq('ledger_id', ledger_id).eq('ledger_type', 'GROUP').select('ledger_id').maybeSingle()
  if (error) throw new Error('그룹 이름을 변경하지 못했습니다.')
  if (!data) throw new Error('접근할 수 있는 그룹이 없습니다. 목록을 새로고침해주세요.')
}
