import { get_supabase_client } from '../../lib/supabase'
import { clear_withdrawal_intent, read_withdrawal_intent, save_withdrawal_intent } from '../auth/withdrawal-intent'
import { get_withdrawal_account } from './profile.api'

type KakaoSdk = {
  init: (key: string) => void
  isInitialized: () => boolean
  Auth: { setAccessToken: (token: string, persist?: boolean) => void; cleanup: () => void }
  API: { request: (options: { url: string }) => Promise<{ id?: number }> }
}
let sdk_loading: Promise<KakaoSdk> | null = null

/** 전용 앱의 공개 JavaScript 키만 사용합니다. Admin/Client Secret 키는 사용하지 않습니다. */
async function load_kakao_sdk(): Promise<KakaoSdk> {
  const key = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY
  if (!key) throw new Error('카카오 JavaScript 키 설정이 필요합니다. 관리자에게 문의해주세요.')
  if (!sdk_loading) sdk_loading = new Promise<KakaoSdk>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.3/kakao.min.js'
    script.integrity = 'sha384-oroumrnFVE0xtgqyDZJARgERibXg2C28380uaUZz2kHDS5CR7tu20eGiOU6GkTpy'
    script.crossOrigin = 'anonymous'
    const timeout = window.setTimeout(() => fail(), 15000)
    function fail() {
      window.clearTimeout(timeout); script.remove(); sdk_loading = null
      reject(new Error('카카오 연결 모듈을 불러오지 못했습니다. 다시 시도해주세요.'))
    }
    script.onerror = fail
    script.onload = () => {
      window.clearTimeout(timeout)
      try {
        const sdk = (window as Window & { Kakao?: KakaoSdk }).Kakao
        if (!sdk) throw new Error('SDK 없음')
        if (!sdk.isInitialized()) sdk.init(key)
        resolve(sdk)
      } catch { fail() }
    }
    document.head.append(script)
  })
  return sdk_loading
}

/** 기존 로그인 쿠키가 있어도 다시 로그인하고 기존 callback URL로 복귀합니다. */
export async function start_kakao_withdrawal_reauth(expected_uuid: string) {
  const user = await get_withdrawal_account(expected_uuid)
  if (!user.identities?.some((identity) => identity.provider === 'kakao')) throw new Error('카카오 계정이 아닙니다.')
  await load_kakao_sdk() // 설정 누락/SDK 실패는 외부 로그인으로 이동하기 전에 알립니다.
  save_withdrawal_intent({ user_uuid: expected_uuid, started_at: Date.now() })
  const { error } = await get_supabase_client().auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { scope: 'account_email', prompt: 'login' } },
  })
  if (error) { clear_withdrawal_intent(); throw new Error('카카오 본인 확인을 시작하지 못했습니다.') }
}

/** 탈퇴 재인증에서는 신규 프로필을 생성하지 않고 원래 계정과 기존 M 프로필만 확인합니다. */
export async function complete_kakao_withdrawal_reauth() {
  const intent = read_withdrawal_intent()
  if (!intent || Date.now() - intent.started_at > 10 * 60 * 1000) throw new Error('본인 확인 시간이 지났습니다. 내 정보에서 다시 시도해주세요.')
  const user = await get_withdrawal_account(intent.user_uuid)
  const { data, error } = await get_supabase_client().auth.getSession()
  if (error || data.session?.user.id !== intent.user_uuid || !data.session.provider_token
    || !user.identities?.some((identity) => identity.provider === 'kakao')
    || Date.parse(user.last_sign_in_at ?? '') < intent.started_at - 1000
    || !Number.isFinite(Date.parse(user.last_sign_in_at ?? ''))) {
    throw new Error('같은 카카오 계정으로 본인 확인을 완료해주세요. 계정은 삭제하지 않았습니다.')
  }
  save_withdrawal_intent({ ...intent, verified_at: Date.now() })
  return true
}

/** 제공 토큰의 카카오 회원번호까지 대조한 후 전용 앱과의 연결만 해제합니다. */
export async function unlink_kakao_account(expected_uuid: string) {
  const user = await get_withdrawal_account(expected_uuid)
  const identity = user.identities?.find((entry) => entry.provider === 'kakao')
  const { data, error } = await get_supabase_client().auth.getSession()
  if (error || data.session?.user.id !== expected_uuid || !data.session.provider_token || !identity) {
    throw new Error('카카오 본인 확인을 다시 진행해주세요.')
  }
  const sdk = await load_kakao_sdk()
  sdk.Auth.setAccessToken(data.session.provider_token, false)
  try {
    const account = await sdk.API.request({ url: '/v2/user/me' })
    if (String(account.id) !== identity.id) {
      throw new Error('카카오 계정이 일치하지 않습니다.')
    }
    await sdk.API.request({ url: '/v1/user/unlink' })
  } catch {
    // 응답 유실도 성공으로 추정하지 않습니다. 다시 로그인하면 새로운 토큰으로 복구할 수 있습니다.
    throw new Error('카카오 연결 해제를 확인하지 못했습니다. 다시 본인 확인 후 시도해주세요. 서비스 계정은 삭제하지 않았습니다.')
  } finally { 
    sdk.Auth.cleanup() 
  }
}
