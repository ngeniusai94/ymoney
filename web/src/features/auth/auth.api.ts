import type { AuthError, User } from '@supabase/supabase-js'
import { get_supabase_client } from '../../lib/supabase'
import { to_auth_email } from './id-credentials'
import { clear_withdrawal_intent } from './withdrawal-intent'

type SignUpInput = {
  user_id: string
  password: string
  nickname: string
}

export type UserProfile = {
  user_srno: string
  user_uuid: string
  nickname: string | null
  use_yn: string
}

/** 인증 UUID에 대응하는 활성 서비스 회원을 확인합니다. */
export async function loadCurrentProfile(user_uuid: string): Promise<UserProfile | null> {
  const supabase = get_supabase_client()
  const { data, error } = await supabase
    .from('tb_user')
    .select('user_srno, user_uuid, nickname, use_yn')
    .eq('user_uuid', user_uuid)
    .maybeSingle()

  if (error) throw new Error('회원 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.')
  const profile = data as UserProfile | null
  return profile?.use_yn === 'Y' ? profile : null
}

/** Auth에는 있지만 tb_user에는 없는 본인 계정을 최초 로그인/가입 시 연결합니다. */
async function ensureCurrentProfile(user: User, nickname: string): Promise<UserProfile> {
  const existing_profile = await loadCurrentProfile(user.id)
  if (existing_profile) return existing_profile

  const supabase = get_supabase_client()
  // 기존 W 채번은 건드리지 않습니다. 이 RPC는 검토용 SQL 적용 후에만 호출 가능합니다.
  const { data: user_srno, error: number_error } = await supabase.rpc('fn_mon_next_user_srno')
  if (number_error || typeof user_srno !== 'string') {
    throw new Error('회원번호를 발급하지 못했습니다. DB 설정을 확인해주세요.')
  }

  const { data, error } = await supabase
    .from('tb_user')
    .insert({
      user_srno,
      user_uuid: user.id,
      user_id: user.email,
      nickname: nickname.trim() || '톡톡',
      use_yn: 'Y',
    })
    .select('user_srno, user_uuid, nickname, use_yn')
    .single()

  if (error) {
    // 두 탭에서 동시에 연결한 경우 UUID 고유 제약이 막고, 저장된 행을 재조회합니다.
    if (error.code === '23505') {
      const concurrent_profile = await loadCurrentProfile(user.id)
      if (concurrent_profile) return concurrent_profile
    }
    throw new Error('회원정보를 저장하지 못했습니다. 잠시 후 다시 로그인해주세요.')
  }

  return data as UserProfile
}

/** 카카오 OAuth의 비밀 키는 Supabase 대시보드가 보관하며 브라우저에는 넣지 않습니다. */
export async function sign_in_with_kakao() {
  clear_withdrawal_intent()
  const { error } = await get_supabase_client().auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      // Kakao 공급자의 기본 scopes는 사진/닉네임을 포함합니다.
      // scopes는 기본값에 추가되므로 최종 인증 요청의 scope를 직접 지정합니다.
      queryParams: { scope: 'account_email' },
    },
  })
  if (error) throw new Error('카카오 로그인을 시작하지 못했습니다. 공급자 설정을 확인해주세요.')
}

/** 복귀 세션을 인증 서버에서 확인하고 기존 가입의 회원정보 생성 로직을 재사용합니다. */
export async function complete_social_login(): Promise<UserProfile> {
  const { data, error } = await get_supabase_client().auth.getUser()
  if (error || !data.user) throw new Error('로그인 정보를 확인하지 못했습니다. 다시 로그인해주세요.')
  if (!data.user.identities?.some((identity) => identity.provider === 'kakao')) throw new Error('지원하는 소셜 로그인 정보가 아닙니다.')
  const existing_profile = await loadCurrentProfile(data.user.id)
  if (existing_profile) return existing_profile
  // 공용 tb_user.user_id는 필수값입니다. 이메일 없는 계정에 임의 이메일을 만들지 않습니다.
  if (!data.user.email) throw new Error('카카오 이메일 제공 동의가 필요합니다. 카카오 앱의 이메일 권한을 확인해주세요.')
  return ensureCurrentProfile(data.user, '톡톡')
}

/** 아이디를 내부 이메일로 변환한 뒤 Auth와 tb_user를 모두 확인합니다. */
export async function signInWithId(user_id: string, password: string) {
  const supabase = get_supabase_client()
  const email = to_auth_email(user_id)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  try {
    const nickname = String(data.user.user_metadata?.nickname ?? '톡톡')
    const profile = await ensureCurrentProfile(data.user, nickname)
    return { ...data, profile }
  } catch (profile_error) {
    // Auth만 성공한 상태를 서비스 로그인으로 취급하지 않습니다.
    await supabase.auth.signOut()
    throw profile_error
  }
}

/** Confirm Email이 꺼진 프로젝트에서 아이디 회원을 만들고 프로필까지 저장합니다. */
export async function signUpWithId({ user_id, password, nickname }: SignUpInput) {
  const supabase = get_supabase_client()
  const email = to_auth_email(user_id)
  const normalized_nickname = nickname.trim() || '톡톡'
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname: normalized_nickname } },
  })
  if (error) throw error

  // Confirm Email이 켜져 있거나 기존 계정을 가린 응답은 가입 완료가 아닙니다.
  if (!data.session || !data.user || data.user.identities?.length === 0) {
    throw new Error('가입을 완료하지 못했습니다. 이미 사용 중인 아이디이거나 이메일 확인 설정을 확인해주세요.')
  }

  try {
    await ensureCurrentProfile(data.user, normalized_nickname)
  } finally {
    // 회원가입 뒤에는 자동 로그인 상태로 남지 않고 로그인 폼으로 돌아갑니다.
    await supabase.auth.signOut()
  }
}

/** 현재 브라우저의 인증 세션을 종료합니다. */
export async function signOut() {
  const { error } = await get_supabase_client().auth.signOut()
  if (error) throw error
}

/** Supabase 오류를 사용자용 한국어 안내로 변환합니다. */
export function getAuthErrorMessage(error: unknown) {
  const auth_error = error as AuthError
  const message = auth_error?.message ?? ''

  if (message.includes('Invalid login credentials')) return '아이디 또는 비밀번호를 확인해주세요.'
  if (message.includes('User already registered')) return '이미 사용 중인 아이디입니다.'
  if (message.toLowerCase().includes('rate limit')) return '요청이 많습니다. 잠시 후 다시 시도해주세요.'
  if (error instanceof Error && error.message) return error.message
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
}
