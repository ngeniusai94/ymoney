import { createContext, useContext } from 'react'
import type { ThemeId } from './theme.const'

export const ThemeContext = createContext<{
  theme_id: ThemeId
  storage_notice: string
  choose_theme: (theme_id: ThemeId) => void
} | null>(null)

/** 화면은 테마 상태를 직접 저장하지 않고 Provider의 선택 동작을 사용합니다. */
export function useTheme() {
  const theme = useContext(ThemeContext)
  if (!theme) throw new Error('useTheme는 ThemeProvider 내부에서 사용해야 합니다.')
  return theme
}
