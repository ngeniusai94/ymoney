import { Link } from 'react-router-dom'
import { notification_reminders } from '../../notifications.api'
import { useSettingsNotificationsPage } from './useSettingsNotificationsPage'
import './SettingsNotificationsPage.css'

/** 조회 상태를 먼저 나누고 실제 저장된 설정을 표시합니다. OS 권한을 허용으로 가정하지 않습니다. */
export default function SettingsNotificationsPage() {
  const model = useSettingsNotificationsPage()
  let content
  switch (model.state) {
    case 'loading':
      content = <p className="notifications-notice" role="status">{model.message}</p>
      break
    case 'error':
      content = <div className="notifications-notice" role="alert"><p>{model.message}</p><button type="button" onClick={model.retry}>다시 시도</button></div>
      break
    case 'ready':
      content = (
        <>
          <p className="notifications-notice" id="notifications-connection-notice">{model.message}</p>
          <section className="notifications-reminders" aria-labelledby="notifications-reminders-title">
            <header className="notifications-section-heading">
              <h2 id="notifications-reminders-title">기록 알림</h2>
              <p>모든 알림 주기는 한국시간 기준입니다.</p>
            </header>
            <ul className="notifications-list">
              {notification_reminders.map(reminder => (
                <li className="notifications-reminder" key={reminder.id}>
                  <div className="notifications-reminder-content">
                    <h3>{reminder.title}</h3>
                    <p className="notifications-message">{reminder.message}</p>
                    <p className="notifications-period">{reminder.period}</p>
                  </div>
                  <button className="notifications-switch" type="button" role="switch" aria-checked={model.settings?.[reminder.id] ?? false} aria-label={reminder.title} aria-describedby="notifications-connection-notice" disabled={model.save_state === 'saving'} onClick={() => void model.toggle(reminder.id)}>
                    <span className="notifications-switch-track" aria-hidden="true"><span /></span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="notifications-save-message" role="status" aria-live="polite">{model.save_message}</p>
          </section>
        </>
      )
      break
  }
  return (
    <section className="notifications-screen" aria-label="알림 관리">
      <header className="notifications-topbar">
        <Link to="/app/settings" aria-label="설정으로 이동">‹</Link>
        <h1>알림 관리</h1>
        <span aria-hidden="true" />
      </header>
      <div className="notifications-body">
        {content}
      </div>
    </section>
  )
}
