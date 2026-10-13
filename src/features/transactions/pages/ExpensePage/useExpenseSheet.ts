import { useCallback, useEffect, useRef, useState } from 'react'

/** 닫기 애니메이션이 끝날 때까지 폼을 유지하고, 저장 중에는 바깥/ESC 닫기를 막습니다. */
export function useExpenseSheet(on_close: () => void) {
  const dialog_ref = useRef<HTMLDialogElement>(null)
  const busy_ref = useRef(false)
  const [phase, set_phase] = useState<'opening' | 'open' | 'closing'>('opening')

  useEffect(() => {
    const dialog = dialog_ref.current
    const previous_overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // 네이티브 dialog가 배경을 inert 처리하고 포커스를 시트 안에 가둡니다.
    dialog?.showModal()
    // 첫 프레임에서 화면 아래의 위치를 그린 뒤 다음 프레임에 전환을 시작합니다.
    // 바로 최종 위치로 렌더링되거나 StrictMode 재실행으로 시작 상태가 생략되는 것을 막습니다.
    let next_frame = 0
    const first_frame = window.requestAnimationFrame(() => {
      next_frame = window.requestAnimationFrame(() => {
        set_phase((current) => current === 'opening' ? 'open' : current)
      })
    })
    return () => {
      window.cancelAnimationFrame(first_frame)
      window.cancelAnimationFrame(next_frame)
      dialog?.close()
      document.body.style.overflow = previous_overflow
    }
  }, [])

  useEffect(() => {
    if (phase !== 'closing') return
    // CSS 종료 시간과 동일합니다. 모션 감소 설정에서도 닫기는 완료됩니다.
    const timer = window.setTimeout(on_close, 320)
    return () => window.clearTimeout(timer)
  }, [phase, on_close])

  const set_busy = useCallback((busy: boolean) => { busy_ref.current = busy }, [])
  const request_close = useCallback(() => {
    if (busy_ref.current) return
    set_phase('closing')
  }, [])

  return { dialog_ref, phase, request_close, set_busy }
}
