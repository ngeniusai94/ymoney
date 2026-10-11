import { get_supabase_client } from '../../lib/supabase'
import { loadCurrentProfile, type UserProfile } from '../auth/auth.api'

/** 공용 테이블의 기존 본인 정책을 사용하며 닉네임/수정시각만 변경합니다. */
export async function update_nickname(user_uuid: string, nickname: string): Promise<UserProfile> {
  const value = nickname.trim() || '톡톡'
  if (value.length > 20) throw new Error('닉네임은 20자 이내로 입력해주세요.')
  const { data, error } = await get_supabase_client().from('tb_user')
    .update({ nickname: value, updated_at: new Date().toISOString() })
    .eq('user_uuid', user_uuid).eq('use_yn', 'Y').like('user_srno', 'M%')
    .select('user_srno,user_uuid,nickname,use_yn').maybeSingle()
  if (error) throw new Error('닉네임을 저장하지 못했습니다. 다시 시도해주세요.')
  if (!data) throw new Error('수정할 회원정보가 없습니다. 다시 로그인해주세요.')
  return data as UserProfile
}

/** 현재 브라우저 세션만 종료하며 다른 기기/프로젝트의 세션을 일괄 종료하지 않습니다. */
export async function sign_out_current_device(): Promise<void> {
  const { error } = await get_supabase_client().auth.signOut({ scope: 'local' })
  if (error) throw new Error('로그아웃하지 못했습니다. 다시 시도해주세요.')
}

/** 저장된 입력 이메일 대신 인증 서버의 현재 계정을 사용해 계정 전환을 막습니다. */
async function get_password_account(expected_uuid: string) {
  const { data, error } = await get_supabase_client().auth.getUser()
  if (error || data.user?.id !== expected_uuid) throw new Error('로그인 계정이 변경되었거나 만료되었습니다. 다시 로그인해주세요.')
  const user = data.user
  if (!user.email || !user.identities?.length || user.identities.some((identity) => identity.provider !== 'email')) {
    throw new Error('소셜 계정 삭제는 재인증·연결 해제 기능 준비 후 제공됩니다.')
  }
  const profile = await loadCurrentProfile(expected_uuid)
  if (!profile || !/^M[0-9]+$/.test(profile.user_srno)) throw new Error('삭제할 가계부 M 계정이 없습니다.')
  return user
}

/** 토큰 갱신이 아닌 비밀번호 로그인을 수행해 삭제 함수의 최근 세션 검사를 충족합니다. */
export async function reauthenticate_account(expected_uuid: string, password: string): Promise<void> {
  const user = await get_password_account(expected_uuid)
  const { data, error } = await get_supabase_client().auth.signInWithPassword({ email: user.email!, password })
  if (error) throw new Error('비밀번호를 확인해주세요. 재인증하지 못했습니다.')
  if (data.user?.id !== expected_uuid) throw new Error('로그인 계정이 변경되었습니다. 다시 로그인해주세요.')
}

/** 승인된 M 전용 함수만 호출합니다. 실제 대상과 최근 로그인 여부는 DB가 최종 검사합니다. */
export async function withdraw_account(expected_uuid: string, confirmation: string): Promise<void> {
  if (confirmation !== '삭제') throw new Error('확인을 위해 삭제를 입력해주세요.')
  await get_password_account(expected_uuid)
  const { error } = await get_supabase_client().schema('ymoney').rpc('fn_mon_withdraw_account', { p_confirmation: confirmation })
  if (error) {
    const allowed_messages = [
      '계정 삭제 전에 다시 로그인해주세요.', '삭제할 가계부 M 계정이 없습니다.',
      '다른 서비스에 연결된 계정은 삭제할 수 없습니다. 관리자에게 문의해주세요.',
      'Apple 계정 연결 해제 기능 준비 후 삭제할 수 있습니다.', '개인 가계부의 멤버 정보를 확인해주세요.',
    ]
    if (allowed_messages.includes(error.message)) throw new Error(error.message)
    // 응답 유실은 삭제 실패라고 단정하지 않고 재로그인 확인을 안내합니다.
    throw new Error('삭제 결과를 확인하지 못했습니다. 다시 로그인하여 계정 상태를 확인해주세요.')
  }
}
