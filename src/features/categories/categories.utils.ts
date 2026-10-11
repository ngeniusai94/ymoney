export type CategoryGroup = {
  category_group_id: string
  group_name: string
  sort_order: number
  is_active: boolean
}

export type ManagedCategory = {
  category_id: string
  category_group_id: string | null
  parent_category_id: string | null
  category_name: string
  icon_key: string | null
  sort_order: number
  is_active: boolean
}

export type CategoryItem = ManagedCategory & { children: ManagedCategory[] }
export type CategorySection = { group_id: string | null; group_name: string | null; group_status: string; items: CategoryItem[] }

/** 상위 이름은 그룹과 관계없이 한 가계부 안에서 중복되지 않게 검사합니다. */
export function get_parent_category_error(name: string, categories: ManagedCategory[]): string | null {
  const trimmed_name = name.trim()
  if (!trimmed_name) return '카테고리 이름을 입력해주세요.'
  if (trimmed_name.length > 30) return '카테고리 이름은 30자 이내로 입력해주세요.'
  if (categories.some((category) =>
    category.parent_category_id === null &&
    category.is_active &&
    category.category_name.trim() === trimmed_name,
  )) return '이미 사용 중인 카테고리 이름입니다.'
  return null
}

/** 그룹 이름이 비었거나 기존 활성 그룹과 중복되는지 확인합니다. */
export function get_category_group_error(name: string, groups: CategoryGroup[]): string | null {
  const trimmed_name = name.trim()
  if (!trimmed_name) return '그룹 이름을 입력해주세요.'
  if (trimmed_name.length > 30) return '그룹 이름은 30자 이내로 입력해주세요.'
  if (groups.some((group) => group.is_active && group.group_name.trim() === trimmed_name)) {
    return '이미 사용 중인 그룹 이름입니다.'
  }
  return null
}

/** 같은 부모에 속한 활성 하위 이름만 중복 검사합니다. */
export function get_child_category_error(name: string, parent_id: string, categories: ManagedCategory[]): string | null {
  const trimmed_name = name.trim()
  if (!trimmed_name) return '카테고리 이름을 입력해주세요.'
  if (trimmed_name.length > 30) return '카테고리 이름은 30자 이내로 입력해주세요.'
  if (categories.some((category) => category.is_active && category.parent_category_id === parent_id && category.category_name.trim() === trimmed_name)) {
    return '이미 사용 중인 하위 카테고리 이름입니다.'
  }
  return null
}

/** 그룹은 선택 사항이며 하위 카테고리는 부모 항목에만 연결해 화면 구조를 만듭니다. */
export function build_category_sections(groups: CategoryGroup[], categories: ManagedCategory[]): CategorySection[] {
  const parents = categories.filter((category) => category.parent_category_id === null)
  const items = parents.map((parent) => ({
    ...parent,
    children: categories.filter((category) => category.parent_category_id === parent.category_id),
  }))
  const sections: CategorySection[] = groups.map((group) => ({
    group_id: group.category_group_id,
    group_name: group.group_name,
    group_status: group.is_active ? '' : '비활성',
    items: items.filter((item) => item.category_group_id === group.category_group_id),
  }))
  const ungrouped_items = items.filter((item) => item.category_group_id === null)

  if (ungrouped_items.length > 0) {
    sections.push({ group_id: null, group_name: null, group_status: '', items: ungrouped_items })
  }

  return sections
}
