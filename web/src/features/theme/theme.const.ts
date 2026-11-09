/** 승인된 B안의 네 가지 파스텔 팔레트입니다. 인트로/소셜 로고에는 적용하지 않습니다. */
export const themes = [
  { id: 'mint', name: '민트', colors: ['#f2fbf7', '#d7f0e5', '#4f8f78'] },
  { id: 'lavender', name: '라벤더', colors: ['#f8f5ff', '#e8e1fa', '#7567a8'] },
  { id: 'peach', name: '피치', colors: ['#fff7f1', '#f7dfd1', '#a96545'] },
  { id: 'sky', name: '스카이', colors: ['#f2f8fd', '#d9eaf7', '#507fa5'] },
] as const
export type ThemeId = typeof themes[number]['id']
export const theme_storage_key = 'household-ledger-toktok-theme'

/** 알 수 없는 저장값은 기본 민트로 복원합니다. */
export function resolve_theme_id(value: string | null): ThemeId {
  const theme = themes.find((item) => item.id === value)
  return theme?.id ?? 'mint'
}
