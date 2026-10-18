import { useState } from 'react'
import { useBottomSheetClose } from '../../../../lib/useBottomSheetClose'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthProvider'
import { get_group, leave_group, rename_group } from '../../groups.api'

export function useGroupDetailPage() {
  const { group_id = '' } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const query_client = useQueryClient()
  const [sheet_state, set_sheet_state] = useState<'closed' | 'editing' | 'saving'>('closed')
  const sheet = useBottomSheetClose(() => set_sheet_state('closed'))
  const [group_name, set_group_name] = useState('')
  const [form_error, set_form_error] = useState('')
  const [copy_message, set_copy_message] = useState('')
  const [leave_state, set_leave_state] = useState<'idle' | 'leaving'>('idle')
  const [leave_error, set_leave_error] = useState('')
  const query = useQuery({
    queryKey: ['groups', 'detail', session?.user.id ?? 'signed-out', group_id],
    queryFn: () => get_group(group_id),
    enabled: Boolean(session && group_id),
  })
  let data_state: 'loading' | 'error' | 'not-found' | 'ready' = 'ready'
  if (query.isPending) data_state = 'loading'
  else if (query.isError) data_state = 'error'
  else if (!query.data) data_state = 'not-found'
  let save_label = '저장'
  if (sheet_state === 'saving') save_label = '저장 중...'

  function open_sheet() {
    if (!query.data) return
    set_group_name(query.data.ledger_name)
    set_form_error('')
    set_sheet_state('editing')
  }
  function close_sheet() {
    if (sheet_state === 'saving') return
    sheet.request_close()
  }
  async function save_name() {
    if (sheet_state !== 'editing') return
    const name = group_name.trim()
    if (!name || name.length > 30) {
      set_form_error('그룹 이름을 1~30자로 입력해주세요.')
      return
    }
    set_sheet_state('saving')
    set_form_error('')
    try {
      await rename_group(group_id, name)
      // 가계부 표시 이름을 캐시하는 각 화면을 갱신합니다.
      await Promise.all([
        query_client.invalidateQueries({ queryKey: ['groups'] }),
        query_client.invalidateQueries({ queryKey: ['calendar', 'monthly-expenses', session?.user.id] }),
        query_client.invalidateQueries({ queryKey: ['category-management', 'ledgers', session?.user.id] }),
        query_client.invalidateQueries({ queryKey: ['payment-management', 'ledgers', session?.user.id] }),
        query_client.invalidateQueries({ queryKey: ['expense-entry', 'ledgers', session?.user.id] }),
      ])
      sheet.request_close()
    } catch (error) {
      set_form_error(error instanceof Error ? error.message : '그룹 이름을 변경하지 못했습니다.')
      set_sheet_state('editing')
    }
  }
  async function copy_code() {
    const code = query.data?.invite_code
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      set_copy_message('초대 코드를 복사했습니다.')
    } catch {
      set_copy_message('복사하지 못했습니다. 코드를 직접 복사해주세요.')
    }
  }
  async function leave() {
    if (leave_state === 'leaving' || !query.data) return
    // 멤버 수가 바뀌어도 삭제 가능성을 항상 안내하고 최종 판단은 DB에서 수행합니다.
    const accepted = window.confirm('그룹에서 나갈까요?\n나간 뒤에는 이 가계부를 조회할 수 없습니다. 마지막 멤버가 나가면 그룹과 모든 지출·분류·결제수단이 영구 삭제되며 복구할 수 없습니다.')
    if (!accepted) return
    set_leave_state('leaving')
    set_leave_error('')
    try {
      await leave_group(group_id)
      // 나간 가계부의 상세/거래/옵션 캐시를 지워 이전 정보를 재사용하지 않습니다.
      query_client.removeQueries({ queryKey: ['groups', 'detail', session?.user.id, group_id] })
      query_client.removeQueries({ queryKey: ['category-management', 'categories', session?.user.id, group_id] })
      query_client.removeQueries({ queryKey: ['payment-management', 'methods', session?.user.id, group_id] })
      query_client.removeQueries({ queryKey: ['expense-entry', 'options', session?.user.id, group_id] })
      query_client.removeQueries({ queryKey: ['expense-entry', 'record', session?.user.id] })
      query_client.removeQueries({ queryKey: ['calendar', 'monthly-expenses', session?.user.id] })
      await Promise.all([
        query_client.invalidateQueries({ queryKey: ['groups', 'list'] }),
        query_client.invalidateQueries({ queryKey: ['category-management', 'ledgers'] }),
        query_client.invalidateQueries({ queryKey: ['payment-management', 'ledgers'] }),
        query_client.invalidateQueries({ queryKey: ['expense-entry', 'ledgers'] }),
      ])
      navigate('/app/settings/groups', { replace: true })
    } catch (error) {
      set_leave_error(error instanceof Error ? error.message : '그룹에서 나가지 못했습니다.')
    } finally {
      set_leave_state('idle')
    }
  }
  return { query, data_state, sheet_state, sheet_phase: sheet.phase, save_label, group_name, form_error, copy_message,
    leave_state, leave_error, leave, set_group_name, open_sheet, close_sheet, save_name, copy_code }
}
