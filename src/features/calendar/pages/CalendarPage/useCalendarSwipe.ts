import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent } from 'react'

type SwipePhase = 'idle' | 'dragging' | 'exiting' | 'entering' | 'returning'
type Gesture = { id: number; x: number; y: number; time: number; width: number; axis: 'pending' | 'horizontal' | 'vertical' }

/** 손가락을 따라 이동 → 현재 월 퇴장 → 새 월 진입 순서로 월을 전환합니다. */
export function useCalendarSwipe(change_month: (delta: number) => void) {
  const gesture = useRef<Gesture | null>(null)
  const suppress_click = useRef(false)
  const phase_ref = useRef<SwipePhase>('idle')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const frames = useRef<number[]>([])
  const [motion, set_motion] = useState({ phase: 'idle' as SwipePhase, offset: 0 })

  // 화면 이동 시 남아 있는 월 변경 예약과 애니메이션 프레임을 취소합니다.
  useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    frames.current.forEach(cancelAnimationFrame)
  }, [])

  function move(phase: SwipePhase, offset: number) {
    phase_ref.current = phase
    set_motion({ phase, offset })
  }

  function finish_motion() {
    timers.current = []
    frames.current = []
    move('idle', 0)
  }

  function return_to_start() {
    move('returning', 0)
    timers.current.push(setTimeout(finish_motion, 200))
  }

  function navigate_month(delta: number, width: number) {
    if (phase_ref.current !== 'idle' && phase_ref.current !== 'dragging') return
    // 다음 달은 현재 달이 왼쪽으로 퇴장하고 새 달이 오른쪽에서 들어옵니다.
    const direction = delta > 0 ? -1 : 1
    move('exiting', direction * width)
    timers.current.push(setTimeout(() => {
      change_month(delta)
      // 전환 없이 새 달을 반대쪽에 놓은 뒤 두 프레임 후 중앙으로 이동합니다.
      move('dragging', -direction * width)
      frames.current.push(requestAnimationFrame(() => {
        frames.current.push(requestAnimationFrame(() => {
          move('entering', 0)
          timers.current.push(setTimeout(finish_motion, 200))
        }))
      }))
    }, 160))
  }

  function on_pointer_down(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0 || phase_ref.current !== 'idle') return
    suppress_click.current = false
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp,
      width: event.currentTarget.clientWidth, axis: 'pending' }
  }

  function on_pointer_move(event: PointerEvent<HTMLElement>) {
    const start = gesture.current
    if (!start || start.id !== event.pointerId || start.axis === 'vertical') return
    const delta_x = event.clientX - start.x
    const delta_y = event.clientY - start.y
    if (start.axis === 'pending') {
      if (Math.max(Math.abs(delta_x), Math.abs(delta_y)) < 8) return
      if (Math.abs(delta_x) < Math.abs(delta_y) * 1.3) { start.axis = 'vertical'; return }
      start.axis = 'horizontal'
      suppress_click.current = true
      // 가로 드래그일 때만 캡처하여 일반 날짜 클릭과 세로 스크롤을 보존합니다.
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    move('dragging', Math.max(-start.width, Math.min(start.width, delta_x)))
  }

  function on_pointer_up(event: PointerEvent<HTMLElement>) {
    const start = gesture.current
    gesture.current = null
    if (!start || start.id !== event.pointerId || start.axis !== 'horizontal') return
    const delta_x = event.clientX - start.x
    const distance = Math.abs(delta_x)
    const speed = distance / Math.max(1, event.timeStamp - start.time)
    // 충분한 거리나 빠른 플릭은 월 이동, 작은 드래그는 부드럽게 복귀합니다.
    if (distance >= Math.max(48, start.width * 0.18) || (distance >= 24 && speed >= 0.45)) {
      navigate_month(delta_x < 0 ? 1 : -1, start.width)
    } else {
      return_to_start()
    }
  }

  function on_pointer_cancel() {
    gesture.current = null
    if (phase_ref.current === 'dragging') return_to_start()
  }

  function on_click_capture(event: MouseEvent<HTMLElement>) {
    // 스와이프 직후 합성 클릭과 전환 도중 클릭으로 날짜가 바뀌지 않게 합니다.
    if (!suppress_click.current && phase_ref.current === 'idle') return
    suppress_click.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return {
    phase: motion.phase,
    grid_style: { transform: `translate3d(${motion.offset}px, 0, 0)` } as CSSProperties,
    navigate_month,
    handlers: { onPointerDown: on_pointer_down, onPointerMove: on_pointer_move,
      onPointerUp: on_pointer_up, onPointerCancel: on_pointer_cancel, onClickCapture: on_click_capture },
  }
}
