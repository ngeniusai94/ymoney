import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { themes } from '../../../theme/theme.const'
import { useTheme } from '../../../theme/useTheme'
import './SettingsThemePage.css'

/** 승인 B안: 테마 이름 + 3색 미리보기 + 선택 체크. 저장 버튼 없이 즉시 적용합니다. */
function SettingsThemePage() {
  const { theme_id, choose_theme, storage_notice } = useTheme()
  let notice: ReactNode = null
  if (storage_notice) notice = <p className="theme-help" role="status">{storage_notice}</p>
  return <section className="theme-screen" aria-label="테마 변경">
    <header className="theme-topbar"><Link to="/app/settings" aria-label="설정으로 이동">‹</Link><h1>테마 변경</h1><span /></header>
    <div className="theme-body"><p className="theme-help">원하는 테마를 선택하면 바로 적용됩니다.</p>
      <div className="theme-list">{themes.map((theme) => {
        let check = ''
        if (theme.id === theme_id) check = '✓'
        return <button type="button" className="theme-row" key={theme.id} aria-pressed={theme.id === theme_id} onClick={() => choose_theme(theme.id)}>
          <strong>{theme.name}</strong><span className="theme-palette" aria-hidden="true">{theme.colors.map((color) => <span key={color} style={{ background: color }} />)}</span><span className="theme-check" aria-hidden="true">{check}</span>
        </button>
      })}</div>{notice}
    </div>
  </section>
}
export default SettingsThemePage
