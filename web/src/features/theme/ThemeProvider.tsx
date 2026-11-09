import { useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { ThemeContext } from './useTheme'
import { resolve_theme_id, theme_storage_key } from './theme.const'
import type { ThemeId } from './theme.const'
import './theme.css'

function read_saved_theme(): ThemeId {
  try { return resolve_theme_id(localStorage.getItem(theme_storage_key)) }
  catch { return 'mint' }
}

/** 개인 기기 설정만 저장하며 Supabase/인증 정보와 결합하지 않습니다. */
export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme_id, set_theme_id] = useState<ThemeId>(read_saved_theme)
  const [storage_notice, set_storage_notice] = useState('')
  useEffect(() => { document.documentElement.dataset.theme = theme_id }, [theme_id])
  // 다른 탭에서 선택한 기기 테마도 반영합니다. 로그아웃해도 테마 설정은 유지합니다.
  useEffect(() => {
    const handle_storage = (event: StorageEvent) => {
      if (event.key === theme_storage_key || event.key === null) set_theme_id(resolve_theme_id(event.newValue))
    }
    window.addEventListener('storage', handle_storage)
    return () => window.removeEventListener('storage', handle_storage)
  }, [])
  function choose_theme(next_theme: ThemeId) {
    set_theme_id(next_theme)
    set_storage_notice('')
    try { localStorage.setItem(theme_storage_key, next_theme) }
    catch { set_storage_notice('테마는 적용했지만 브라우저에 저장하지 못했습니다.') }
  }
  return <ThemeContext.Provider value={{ theme_id, storage_notice, choose_theme }}>{children}</ThemeContext.Provider>
}
