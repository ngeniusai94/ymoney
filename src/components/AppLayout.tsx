import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { loadCurrentProfile } from '../features/auth/auth.api'
import { useAuth } from '../features/auth/AuthProvider'

/** 로그인 프로필을 확인한 뒤 앱 본문과 아이콘 탭바를 제공합니다. */
function AppLayout({ mode = 'live' }: { mode?: 'live' | 'preview' }) {
  const { session, is_loading } = useAuth()
  const location = useLocation()
  const profile_query = useQuery({
    queryKey: ['app-profile', session?.user.id ?? 'signed-out'],
    queryFn: async () => {
      if (mode === 'preview') return null
      if (!session) throw new Error('로그인이 필요합니다.')
      return loadCurrentProfile(session.user.id)
    },
    enabled: mode === 'live' && Boolean(session),
  })

  if (mode === 'live' && (is_loading || (session && profile_query.isPending))) {
    return <main className="app-page app-message">로그인 상태를 확인하고 있어요.</main>
  }

  if (mode === 'live' && !session) return <Navigate to="/auth" replace state={{ from: location }} />

  if (mode === 'live' && (profile_query.isError || !profile_query.data)) {
    return (
      <main className="app-page app-message">
        <p>회원정보를 확인하지 못했습니다.</p>
        <Link to="/auth/id">다시 로그인</Link>
      </main>
    )
  }

  const route_root = mode === 'preview' ? '/preview' : '/app'
  // 입력 전용 화면에서는 승인 목업처럼 저장 버튼에 집중하도록 하단 탭을 숨깁니다.
  let tab_bar: ReactNode = (
    <nav className="app-tab-bar" aria-label="주요 화면" onClickCapture={(event) => {
      if (mode === 'preview') {
        event.preventDefault(); event.stopPropagation(); window.alert('로그인 후 이용 가능합니다.')
      }
    }}>
      <Link className={`app-tab${location.pathname.startsWith(`${route_root}/calendar`) ? ' is-active' : ''}`} to={`${route_root}/calendar`} aria-label="가계부">
        <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H19a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5z"/><path d="M4 7h16M15 12h5"/></svg></span>
      </Link>
      <Link className={`app-tab${location.pathname.startsWith(`${route_root}/statistics`) ? ' is-active' : ''}`} to={`${route_root}/statistics`} aria-label="통계">
        <span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></span>
      </Link>
      <Link className={`app-tab${location.pathname.startsWith(`${route_root}/settings`) ? ' is-active' : ''}`} to={`${route_root}/settings`} aria-label="설정">
        <span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/></svg></span>
      </Link>
    </nav>
  )
  if (location.pathname.startsWith('/app/expenses/')) tab_bar = null

  return (
    <div className="app-page">
      <main className="app-content"><Outlet /></main>
      {tab_bar}
    </div>
  )
}

export default AppLayout
