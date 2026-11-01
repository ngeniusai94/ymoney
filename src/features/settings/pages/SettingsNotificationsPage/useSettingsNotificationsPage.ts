import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../auth/AuthProvider'
import { loadCurrentProfile } from '../../../auth/auth.api'
import { load_notification_settings, save_notification_setting, type NotificationKind, type NotificationSettings } from '../../notifications.api'

/** 레이아웃의 회원 캐시를 재사용하고, 계정별로 알림 조회 결과를 분리합니다. */
export function useSettingsNotificationsPage() {
  const { session } = useAuth()
  const query_client = useQueryClient()
  const saving = useRef(false)
  const [save_state, set_save_state] = useState<'idle' | 'saving'>('idle')
  const [save_message, set_save_message] = useState('')
  const profile_query = useQuery({
    queryKey: ['app-profile', session?.user.id ?? 'signed-out'],
    queryFn: () => {
      if (!session || session.user.is_anonymous) throw new Error('로그인이 필요합니다.')
      return loadCurrentProfile(session.user.id)
    },
    enabled: Boolean(session) && !session?.user.is_anonymous,
  })
  const profile = profile_query.data
  const settings_query = useQuery({
    queryKey: ['notification-settings', session?.user.id ?? 'signed-out'],
    queryFn: () => {
      if (!profile) throw new Error('회원정보를 확인하지 못했습니다.')
      return load_notification_settings(profile.user_srno)
    },
    enabled: Boolean(session) && !session?.user.is_anonymous && Boolean(profile),
    // 관리 화면에 다시 들어올 때 서버 설정을 확인합니다.
    staleTime: 0,
  })

  // 화면에는 동시에 하나의 상태만 전달해 로딩/오류/목록의 중복 노출을 막습니다.
  let state: 'loading' | 'error' | 'ready' = 'loading'
  let message = '알림 설정을 불러오고 있어요.'
  if (profile_query.isError || (profile_query.isSuccess && !profile)) {
    state = 'error'
    message = '회원정보를 확인하지 못했습니다. 다시 로그인해주세요.'
  } else if (settings_query.isError) {
    state = 'error'
    message = settings_query.error.message
  } else if (settings_query.isSuccess) {
    state = 'ready'
    message = '알림 사용 여부를 저장할 수 있어요. 앱 푸시 연결 전이므로 아직 실제 알림은 발송되지 않습니다.'
  }

  async function toggle(kind: NotificationKind) {
    if (!session || !profile || !settings_query.data || saving.current) return
    // 빠른 연속 클릭도 첫 요청이 끝날 때까지 막습니다. 화면은 저장 성공 후에만 변경합니다.
    saving.current = true
    set_save_state('saving')
    set_save_message('저장 중이에요.')
    const query_key = ['notification-settings', session.user.id]
    const enabled = !settings_query.data[kind]
    try {
      await query_client.cancelQueries({ queryKey: query_key })
      await save_notification_setting(profile.user_srno, kind, enabled)
      query_client.setQueryData<NotificationSettings>(query_key, previous => {
        if (!previous) return previous
        return { ...previous, [kind]: enabled }
      })
      set_save_message('알림 설정을 저장했어요.')
    } catch (error) {
      set_save_message(error instanceof Error ? error.message : '알림 설정을 저장하지 못했어요.')
      // 응답 유실로 실제 저장 여부가 불명확한 경우에도 서버 값을 다시 확인합니다.
      await query_client.invalidateQueries({ queryKey: query_key })
    } finally {
      saving.current = false
      set_save_state('idle')
    }
  }

  function retry() {
    if (profile_query.isError || !profile) void profile_query.refetch()
    else void settings_query.refetch()
  }
  return { state, message, settings: settings_query.data, retry, toggle, save_state, save_message }
}
