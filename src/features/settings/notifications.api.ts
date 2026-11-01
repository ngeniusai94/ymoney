import { get_supabase_client } from '../../lib/supabase'

// 표시 내용과 저장할 주기를 같은 곳에서 관리합니다. 시각은 모두 한국시간입니다.
export const notification_reminders = [
  { id: 'daily', title: '매일 기록 알림', message: '오늘의 지출내역을 기록하세요', period: '매일 22:00', time: '2200', days: '1111111' },
  { id: 'weekly', title: '매주 기록 알림', message: '이번주 지출내역을 확인하세요', period: '매주 일요일 22:30', time: '2230', days: '0000001' },
  { id: 'monthly', title: '매월 기록 알림', message: '이번달 지출내역을 정산하세요', period: '매월 마지막 날 23:00', time: '2300', days: null },
] as const
export type NotificationKind = typeof notification_reminders[number]['id']
export type NotificationSettings = Record<NotificationKind, boolean>

/** 계정의 설정만 읽습니다. 기기 권한/토큰 및 실제 발송 가능 여부와는 별개입니다. */
export async function load_notification_settings(user_srno: string): Promise<NotificationSettings> {
  const { data, error } = await get_supabase_client().from('tb_push_schedule')
    .select('use_yn,push_payload')
    .eq('user_srno', user_srno)
    .eq('app_cd', 'ymoney')
  if (error) throw new Error('알림 설정을 불러오지 못했어요. 다시 시도해주세요.')

  // 행이 없는 항목만 미사용으로 표시합니다. 요청 실패를 OFF로 바꾸지 않습니다.
  const settings: NotificationSettings = { daily: false, weekly: false, monthly: false }
  const seen = new Set<string>()
  for (const row of data ?? []) {
    // 공용 JSON에는 yWeather의 다른 형식도 있으므로 ymoney의 고정 식별자를 확인합니다.
    const kind: unknown = row.push_payload?.reminder_kind
    if ((kind !== 'daily' && kind !== 'weekly' && kind !== 'monthly') || (row.use_yn !== 'Y' && row.use_yn !== 'N')) {
      throw new Error('저장된 알림 설정의 형식을 확인해주세요.')
    }
    if (seen.has(kind)) throw new Error('중복된 알림 설정을 확인해주세요.')
    seen.add(kind)
    settings[kind] = row.use_yn === 'Y'
  }
  return settings
}

/** 사용 의사만 저장합니다. 이 함수는 기기 등록·권한 요청·FCM 발송을 수행하지 않습니다. */
export async function save_notification_setting(user_srno: string, kind: NotificationKind, enabled: boolean): Promise<void> {
  const reminder = notification_reminders.find(item => item.id === kind)
  if (!reminder) throw new Error('알림 항목을 확인해주세요.')
  const supabase = get_supabase_client()
  const { data: existing, error: find_error } = await supabase.from('tb_push_schedule')
    .select('push_srno')
    .eq('user_srno', user_srno).eq('app_cd', 'ymoney')
    .eq('push_payload->>reminder_kind', kind).maybeSingle()
  if (find_error) throw new Error('저장할 알림 설정을 확인하지 못했어요. 다시 시도해주세요.')

  // 월말은 고정 요일로 표현할 수 없어 kind와 month_end로 구분합니다.
  // ymoney의 push_days는 월요일부터 일요일 순서이며 yWeather 데이터는 변경하지 않습니다.
  const values = {
    use_yn: enabled ? 'Y' : 'N',
    push_send_tm: reminder.time,
    push_days: reminder.days,
    push_payload: {
      reminder_kind: kind, timezone: 'Asia/Seoul',
      title: reminder.title, body: reminder.message, month_end: kind === 'monthly',
    },
    updated_at: new Date().toISOString(),
  }
  if (existing) {
    const { data, error } = await supabase.from('tb_push_schedule').update(values)
      .eq('push_srno', existing.push_srno).eq('user_srno', user_srno).eq('app_cd', 'ymoney')
      .select('push_srno').maybeSingle()
    if (error || !data) throw new Error('알림 설정을 수정하지 못했어요. 다시 시도해주세요.')
    return
  }
  // 미등록 항목을 OFF로 바꾸기 위해 빈 행을 만들지는 않습니다.
  if (!enabled) return
  const { data: push_srno, error: number_error } = await supabase.rpc('fn_next_push_srno')
  if (number_error || typeof push_srno !== 'string') throw new Error('알림 번호를 발급하지 못했어요. 다시 시도해주세요.')
  const { error } = await supabase.from('tb_push_schedule').insert({
    ...values, push_srno, user_srno, app_cd: 'ymoney',
  })
  if (error) throw new Error('알림 설정을 저장하지 못했어요. 다시 시도해주세요.')
}
