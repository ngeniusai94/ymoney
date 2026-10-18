import { useCallback, useEffect, useRef, useState } from 'react'
import './bottom-sheet.css'

/** 모든 바텀시트의 닫기 순서: closing 표시 → 320ms 이동 → 제거/다음 화면 이동. */
export function useBottomSheetClose(on_closed: () => void) {
  const [phase, set_phase] = useState<'open' | 'closing'>('open')
  const closing = useRef(false)
  const completion = useRef<() => void>(() => {})

  const request_close = useCallback((after_close?: () => void) => {
    // 연속 클릭으로 타이머나 저장 후 이동 콜백이 덮어써지지 않게 합니다.
    if (closing.current) return
    closing.current = true
    completion.current = after_close ?? on_closed
    set_phase('closing')
  }, [on_closed])

  useEffect(() => {
    if (phase !== 'closing') return
    const timer = window.setTimeout(() => {
      closing.current = false
      set_phase('open')
      completion.current()
    }, 320)
    return () => window.clearTimeout(timer)
  }, [phase])

  return { phase, request_close }
}
