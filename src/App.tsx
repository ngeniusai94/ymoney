import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AuthCallbackPage from './features/auth/AuthCallbackPage'
import AuthIdPage from './features/auth/pages/AuthIdPage/AuthIdPage'
import IntroPage from './features/auth/IntroPage'
import AppLayout from './components/AppLayout'
import CalendarPage from './features/calendar/pages/CalendarPage/CalendarPage'
import ExpensePage from './features/transactions/pages/ExpensePage/ExpensePage'
import SettingsPage from './features/settings/pages/SettingsPage/SettingsPage'
import CategoriesPage from './features/categories/pages/CategoriesPage/CategoriesPage'
import PaymentMethodsPage from './features/payment-methods/pages/PaymentMethodsPage/PaymentMethodsPage'
import GroupsPage from './features/groups/pages/GroupsPage/GroupsPage'
import GroupDetailPage from './features/groups/pages/GroupDetailPage/GroupDetailPage'
import SettingsProfilePage from './features/settings/pages/SettingsProfilePage/SettingsProfilePage'
import SettingsThemePage from './features/settings/pages/SettingsThemePage/SettingsThemePage'
import PreviewCalendarPage from './features/preview/pages/PreviewCalendarPage/PreviewCalendarPage'

/**
 * 애플리케이션의 URL과 화면을 연결하는 최상위 컴포넌트입니다.
 * 인증 화면과 로그인 후 앱의 기본 경로를 연결합니다.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<IntroPage />} />
        <Route path="/auth/id" element={<AuthIdPage />} />
        <Route path="/auth/email" element={<Navigate to="/auth/id" replace />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/preview" element={<AppLayout mode="preview" />}>
          <Route index element={<Navigate to="calendar" replace />} />
          <Route path="calendar" element={<PreviewCalendarPage />} />
          <Route path="*" element={<Navigate to="/preview/calendar" replace />} />
        </Route>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="calendar" replace />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="expenses/new" element={<ExpensePage />} />
          <Route path="expenses/:transaction_id/edit" element={<ExpensePage />} />
          <Route path="statistics" element={<main className="app-placeholder">통계 화면은 다음 단계에서 연결합니다.</main>} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/profile" element={<SettingsProfilePage />} />
          <Route path="settings/theme" element={<SettingsThemePage />} />
          <Route path="settings/categories" element={<CategoriesPage />} />
          <Route path="settings/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="settings/groups" element={<GroupsPage />} />
          <Route path="settings/groups/:group_id" element={<GroupDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
