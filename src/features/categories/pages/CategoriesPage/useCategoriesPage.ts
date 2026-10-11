import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { loadCurrentProfile } from '../../../auth/auth.api'
import { useAuth } from '../../../auth/AuthProvider'
import { list_my_ledgers } from '../../../ledgers/ledgers.api'
import { create_category_group, create_child_category, create_parent_category, deactivate_category, deactivate_category_group, get_category_management_data, update_category, update_category_group } from '../../categories.api'
import { build_category_sections, get_category_group_error, get_child_category_error, get_parent_category_error } from '../../categories.utils'
import type { CategoryGroup, ManagedCategory } from '../../categories.utils'

const icon_choices = ['🍚', '☕', '🛒', '🏠', '🎨', '🐾']

/** 관리할 가계부 선택과 해당 가계부의 카테고리 조회 상태를 소유합니다. */
export function useCategoriesPage() {
  const { session } = useAuth()
  const query_client = useQueryClient()
  const [chosen_ledger_id, set_chosen_ledger_id] = useState<string | null>(null)
  const [sheet_state, set_sheet_state] = useState<'closed' | 'category-editing' | 'category-saving' | 'group-editing' | 'group-saving' | 'child-editing' | 'child-saving'>('closed')
  const [child_parent, set_child_parent] = useState<ManagedCategory | null>(null)
  const [editing_category, set_editing_category] = useState<ManagedCategory | null>(null)
  const [editing_group, set_editing_group] = useState<CategoryGroup | null>(null)
  const [new_name, set_new_name] = useState('')
  const [new_icon, set_new_icon] = useState('')
  const [new_group_id, set_new_group_id] = useState<string | null>(null)
  const [new_group_name, set_new_group_name] = useState('')
  const [form_error, set_form_error] = useState('')

  const ledger_query = useQuery({
    queryKey: ['category-management', 'ledgers', session?.user.id ?? 'signed-out'],
    queryFn: async () => {
      if (!session) throw new Error('로그인이 필요합니다.')
      const profile = await loadCurrentProfile(session.user.id)
      if (!profile) throw new Error('회원정보를 확인하지 못했습니다.')
      const ledgers = await list_my_ledgers(profile.user_srno)
      return { profile, ledgers }
    },
    enabled: Boolean(session),
  })
  const ledgers = ledger_query.data?.ledgers ?? []
  const default_ledger = ledgers.find((ledger) => ledger.ledger_type === 'PERSONAL') ?? ledgers[0]
  const ledger_id = chosen_ledger_id ?? default_ledger?.ledger_id ?? null
  const selected_ledger = ledgers.find((ledger) => ledger.ledger_id === ledger_id)

  const category_query = useQuery({
    queryKey: ['category-management', 'categories', session?.user.id ?? 'signed-out', ledger_id],
    queryFn: () => {
      if (!ledger_id) throw new Error('가계부를 선택해주세요.')
      return get_category_management_data(ledger_id)
    },
    enabled: Boolean(session && ledger_id),
  })
  const sections = category_query.data
    ? build_category_sections(category_query.data.groups, category_query.data.categories)
    : []

  function choose_ledger(next_ledger_id: string) {
    if (sheet_state.endsWith('saving')) return
    set_sheet_state('closed')
    set_editing_category(null)
    set_editing_group(null)
    set_chosen_ledger_id(next_ledger_id)
  }

  function open_add_sheet() {
    set_editing_group(null)
    set_editing_category(null)
    set_new_name('')
    set_new_icon('')
    set_new_group_id(null)
    set_form_error('')
    set_sheet_state('category-editing')
  }

  function close_add_sheet() {
    if (sheet_state.endsWith('saving')) return
    set_sheet_state('closed')
  }

  function open_add_group_sheet() {
    set_editing_group(null)
    set_editing_category(null)
    set_new_group_name('')
    set_form_error('')
    set_sheet_state('group-editing')
  }

  function open_add_child_sheet(parent: ManagedCategory) {
    if (!parent.is_active || parent.parent_category_id !== null) return
    set_editing_group(null)
    set_editing_category(null)
    set_child_parent(parent)
    set_new_name('')
    set_form_error('')
    set_sheet_state('child-editing')
  }

  /** 추가 폼과 같은 UI를 사용하되 수정 대상을 별도로 보관합니다. */
  function open_edit_sheet(category: ManagedCategory) {
    set_editing_group(null)
    set_editing_category(category)
    set_new_name(category.category_name)
    set_new_icon(category.icon_key ?? '')
    set_new_group_id(category.category_group_id)
    set_form_error('')
    if (category.parent_category_id === null) {
      set_sheet_state('category-editing')
      return
    }
    const parent = category_query.data?.categories.find((item) => item.category_id === category.parent_category_id)
    if (!parent) {
      set_editing_category(null)
      return
    }
    set_child_parent(parent)
    set_sheet_state('child-editing')
  }

  /** 그룹 ID는 바꾸지 않고 이름만 편집합니다. */
  function open_edit_group_sheet(group_id: string) {
    const group = category_query.data?.groups.find((item) => item.category_group_id === group_id)
    if (!group) return
    set_editing_category(null)
    set_editing_group(group)
    set_new_group_name(group.group_name)
    set_form_error('')
    set_sheet_state('group-editing')
  }

  /** 선택한 아이콘을 다시 누르면 미선택 상태로 돌아갑니다. */
  function toggle_icon(icon: string) {
    set_new_icon((current) => {
      if (current === icon) return ''
      return icon
    })
  }

  // JSX에서는 제목 선택을 위한 중첩 삼항식을 추가하지 않습니다.
  let sheet_title = '카테고리 추가'
  if (sheet_state.startsWith('group-')) sheet_title = '그룹 추가'
  else if (sheet_state.startsWith('child-')) sheet_title = '하위 카테고리 추가'
  if (editing_category) {
    sheet_title = '카테고리 수정'
    if (editing_category.parent_category_id !== null) sheet_title = '하위 카테고리 수정'
  }
  if (editing_group) sheet_title = '그룹 수정'

  function toggle_group(group_id: string) {
    set_new_group_id((current) => current === group_id ? null : group_id)
  }

  /** 기존 거래를 보존한다는 안내를 확인한 뒤에만 비활성화합니다. */
  async function disable_category() {
    if (!ledger_id || !editing_category || sheet_state.endsWith('saving')) return
    if (editing_category.is_active === false) {
      await save_category(true)
      return
    }
    let message = `${editing_category.category_name}을(를) 비활성화할까요?\n새 지출 선택에서 제외되며 기존 지출은 유지됩니다.`
    let saving_state: 'category-saving' | 'child-saving' = 'child-saving'
    let editing_state: 'category-editing' | 'child-editing' = 'child-editing'
    if (editing_category.parent_category_id === null) {
      message += '\n하위 카테고리도 함께 비활성화됩니다.'
      saving_state = 'category-saving'
      editing_state = 'category-editing'
    }
    if (!window.confirm(message)) return
    set_sheet_state(saving_state)
    set_form_error('')
    try {
      await deactivate_category(ledger_id, editing_category)
      await Promise.all([
        query_client.invalidateQueries({ queryKey: ['category-management', 'categories', session?.user.id, ledger_id] }),
        query_client.invalidateQueries({ queryKey: ['expense-entry', 'options', session?.user.id, ledger_id] }),
        query_client.invalidateQueries({ queryKey: ['calendar', 'monthly-expenses', session?.user.id] }),
      ])
      set_sheet_state('closed')
    } catch (error) {
      set_form_error(error instanceof Error ? error.message : '카테고리를 비활성화하지 못했습니다.')
      set_sheet_state(editing_state)
    }
  }

  async function save_category(activate = false) {
    if (!ledger_id || (sheet_state !== 'category-editing' && sheet_state !== 'child-editing')) return
    const parent_id = sheet_state === 'child-editing' ? child_parent?.category_id : null
    if (sheet_state === 'child-editing' && !parent_id) return
    const categories = category_query.data?.categories ?? []
    // 이름을 바꾸지 않고 저장할 때 자기 자신을 중복으로 판단하지 않습니다.
    const other_categories = categories.filter((category) => category.category_id !== editing_category?.category_id)
    const error = parent_id
      ? get_child_category_error(new_name, parent_id, other_categories)
      : get_parent_category_error(new_name, other_categories)
    if (error) {
      set_form_error(error)
      return
    }
    set_sheet_state(parent_id ? 'child-saving' : 'category-saving')
    set_form_error('')
    try {
      const next_order = Math.max(-1, ...categories
        .filter((category) => category.parent_category_id === parent_id)
        .map((category) => category.sort_order)) + 1
      if (editing_category) {
        const input: Parameters<typeof update_category>[0] = { ledger_id, category: editing_category, category_name: new_name.trim(), icon_key: new_icon.trim() || null, category_group_id: new_group_id }
        if (activate) input.is_active = true
        await update_category(input)
      } else if (parent_id) {
        await create_child_category({ ledger_id, parent_category_id: parent_id, category_name: new_name.trim(), sort_order: next_order })
      } else {
        await create_parent_category({
          ledger_id,
          category_name: new_name.trim(),
          icon_key: new_icon.trim() || null,
          category_group_id: new_group_id,
          sort_order: next_order,
        })
      }
      await Promise.all([
        query_client.invalidateQueries({ queryKey: ['category-management', 'categories', session?.user.id, ledger_id] }),
        query_client.invalidateQueries({ queryKey: ['expense-entry', 'options', session?.user.id, ledger_id] }),
        // 달력의 과거 지출도 변경된 분류 이름/아이콘으로 다시 표시합니다.
        query_client.invalidateQueries({ queryKey: ['calendar', 'monthly-expenses', session?.user.id] }),
      ])
      set_sheet_state('closed')
    } catch (save_error) {
      set_form_error(save_error instanceof Error ? save_error.message : '카테고리를 저장하지 못했습니다.')
      set_sheet_state(parent_id ? 'child-editing' : 'category-editing')
    }
  }

  /** 그룹 복구 시 이전 카테고리 배정은 되돌리지 않습니다. */
  async function disable_group() {
    if (!ledger_id || !editing_group || sheet_state !== 'group-editing') return
    if (editing_group.is_active === false) {
      await save_group(true)
      return
    }
    if (!window.confirm(`${editing_group.group_name} 그룹을 비활성화할까요?\n소속 카테고리는 그룹 없이 옮겨지며 카테고리와 기존 지출은 유지됩니다.`)) return
    set_sheet_state('group-saving')
    set_form_error('')
    try {
      await deactivate_category_group(ledger_id, editing_group.category_group_id)
      set_sheet_state('closed')
    } catch (error) {
      set_form_error(error instanceof Error ? error.message : '그룹을 비활성화하지 못했습니다.')
      set_sheet_state('group-editing')
    } finally {
      // 일부 요청만 성공한 경우에도 실제 목록과 상세 필터를 다시 읽습니다.
      await refresh_group_options()
    }
  }

  async function refresh_group_options() {
    await Promise.all([
      query_client.invalidateQueries({ queryKey: ['category-management', 'categories', session?.user.id, ledger_id] }),
      query_client.invalidateQueries({ queryKey: ['expense-entry', 'options', session?.user.id, ledger_id] }),
      query_client.invalidateQueries({ queryKey: ['calendar', 'filter-options'] }),
    ])
  }

  async function save_group(activate = false) {
    if (!ledger_id || sheet_state !== 'group-editing') return
    const groups = category_query.data?.groups ?? []
    const other_groups = groups.filter((group) => group.category_group_id !== editing_group?.category_group_id)
    const error = get_category_group_error(new_group_name, other_groups)
    if (error) {
      set_form_error(error)
      return
    }
    set_sheet_state('group-saving')
    set_form_error('')
    try {
      const next_order = Math.max(-1, ...groups.map((group) => group.sort_order)) + 1
      if (editing_group) {
        const input: Parameters<typeof update_category_group>[0] = { ledger_id, category_group_id: editing_group.category_group_id, group_name: new_group_name.trim(), current_is_active: editing_group.is_active }
        if (activate) input.is_active = true
        await update_category_group(input)
      } else {
        await create_category_group({ ledger_id, group_name: new_group_name.trim(), sort_order: next_order })
      }
      await refresh_group_options()
      set_sheet_state('closed')
    } catch (save_error) {
      set_form_error(save_error instanceof Error ? save_error.message : '카테고리 그룹을 저장하지 못했습니다.')
      set_sheet_state('group-editing')
    }
  }

  return {
    category_query,
    child_parent,
    choose_ledger,
    close_add_sheet,
    disable_category,
    disable_group,
    editing_category,
    editing_group,
    form_error,
    icon_choices,
    ledger_query,
    ledgers,
    nickname: ledger_query.data?.profile.nickname ?? null,
    new_group_id,
    new_group_name,
    new_icon,
    new_name,
    open_add_sheet,
    open_add_group_sheet,
    open_add_child_sheet,
    open_edit_sheet,
    open_edit_group_sheet,
    save_category,
    save_group,
    sections,
    selected_ledger,
    set_new_icon,
    set_new_group_name,
    set_new_name,
    sheet_state,
    sheet_title,
    toggle_group,
    toggle_icon,
  }
}
