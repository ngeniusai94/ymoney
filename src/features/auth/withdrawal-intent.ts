const storage_key = 'ymoney.withdrawal-reauth'

export type WithdrawalIntent = { user_uuid: string; started_at: number; verified_at?: number }

/** OAuth 화면을 왕복할 때 목적과 원래 계정만 보존합니다. 비밀번호·토큰은 저장하지 않습니다. */
export function read_withdrawal_intent(): WithdrawalIntent | null {
  try {
    const raw = sessionStorage.getItem(storage_key)
    if (!raw) return null
    const value = JSON.parse(raw) as WithdrawalIntent
    if (typeof value.user_uuid !== 'string' || !Number.isFinite(value.started_at)) return null
    if (value.verified_at !== undefined && !Number.isFinite(value.verified_at)) return null
    return value
  } catch { return null }
}

export function save_withdrawal_intent(intent: WithdrawalIntent) {
  sessionStorage.setItem(storage_key, JSON.stringify(intent))
}

export function clear_withdrawal_intent() { sessionStorage.removeItem(storage_key) }
