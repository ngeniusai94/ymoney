import { Link } from 'react-router-dom'
import { CalendarView } from '../../../calendar/pages/CalendarPage/CalendarPage'
import { usePreviewCalendarPage } from './usePreviewCalendarPage'

/** 샘플임을 표시하고 쓰기 동작은 안내만 합니다. 인증 사용자로 들어와도 실제 데이터를 사용하지 않습니다. */
export default function PreviewCalendarPage() {
  const page = usePreviewCalendarPage()
  return <>
    <p className="calendar-preview-note">둘러보기 · 예시 데이터 <Link to="/auth">로그인하기</Link></p>
    <div onClickCapture={(event) => {
      // 날짜/버튼뿐 아니라 선택 상자를 여는 클릭도 기능 실행 전에 안내합니다.
      if (event.target instanceof Element && event.target.closest('button, select')) {
        event.preventDefault(); event.stopPropagation(); page.request_login()
      }
    }}>
      <CalendarView page={page.view} on_add={page.request_login} on_edit={page.request_login} />
    </div>
  </>
}
