import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../../auth/AuthProvider'
import { loadCurrentProfile } from '../../../auth/auth.api'
import { create_group, join_group, list_groups } from '../../groups.api'

/** 그룹 목록은 기존 본인 가계부 조회를 사용하며 임의 샘플을 만들지 않습니다. */
export function useGroupsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const query_client = useQueryClient()
  const [sheet_mode, set_sheet_mode] = useState<'closed' | 'create' | 'join'>('closed')
  const [request_state, set_request_state] = useState<'idle' | 'saving'>('idle')
  const [group_name, set_group_name] = useState('')
  const [invite_code, set_invite_code] = useState('')
  const [form_error, set_form_error] = useState('')
  const query = useQuery({
    queryKey: ['groups', 'list', session?.user.id ?? 'signed-out'],
    queryFn: async () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      const profile = await loadCurrentProfile(session.user.id)
      if (!profile) throw new Error('회원정보를 확인하지 못했습니다.')
      return list_groups(profile.user_srno)
    },
    enabled: Boolean(session),
  })
  let data_state: 'loading' | 'error' | 'empty' | 'ready' = 'ready'
  if (query.isPending) data_state = 'loading'
  else if (query.isError) data_state = 'error'
  else if (query.data.length === 0) data_state = 'empty'
  function open_sheet(mode: 'create' | 'join') {
    set_group_name('')
    set_invite_code('')
    set_form_error('')
    set_sheet_mode(mode)
  }
  function close_sheet() {
    if (request_state === 'saving') return
    set_sheet_mode('closed')
  }
  async function submit_sheet() {
    if (request_state === 'saving' || sheet_mode === 'closed') return
    const name = group_name.trim()
    const code = invite_code.trim().toUpperCase()
    if (sheet_mode === 'create' && (name.length === 0 || name.length > 30)) {
      set_form_error('그룹 이름을 1~30자로 입력해주세요.')
      return
    }
    if (sheet_mode === 'join' && !/^[A-Z0-9]{8}$/.test(code)) {
      window.alert('영문·숫자 8자리 초대 코드를 입력해주세요.')
      return
    }
    set_request_state('saving')
    set_form_error('')
    try {
      let ledger_id = ''
      if (sheet_mode === 'create') ledger_id = await create_group(name)
      else ledger_id = await join_group(code)
      // 목록을 캐시하는 화면들이 새로 참여한 가계부를 다시 읽도록 갱신합니다.
      await Promise.all([
        query_client.invalidateQueries({ queryKey: ['groups'] }),
        query_client.invalidateQueries({ queryKey: ['calendar'] }),
        query_client.invalidateQueries({ queryKey: ['category-management', 'ledgers'] }),
        query_client.invalidateQueries({ queryKey: ['payment-management', 'ledgers'] }),
        query_client.invalidateQueries({ queryKey: ['expense-entry', 'ledgers'] }),
      ])
      navigate(`/app/settings/groups/${ledger_id}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '요청을 완료하지 못했습니다.'
      if (sheet_mode === 'join') window.alert(message)
      else set_form_error(message)
    } finally {
      set_request_state('idle')
    }
  }
  return { query, data_state, groups: query.data ?? [], sheet_mode, request_state, group_name, invite_code,
    form_error, set_group_name, set_invite_code, open_sheet, close_sheet, submit_sheet }
}
