import { useEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import './ReorderHandle.css'

export type ReorderTarget = { id: string; scope: string }
type Press = { pointer_id: number; x: number; y: number; active: boolean }

export default function ReorderHandle({ className, target_selector, name, disabled, on_preview, on_drop, on_step }: {
  className?: string
  target_selector: string
  name: string
  disabled: boolean
  on_preview: (target: ReorderTarget | null) => void
  on_drop: (target: ReorderTarget | null) => void
  on_step: (direction: -1 | 1) => void
}) {
  const press = useRef<Press | null>(null)
  const timer = useRef(0)
  const frame = useRef(0)
  const [dragging, set_dragging] = useState(false)

  useEffect(() => () => {
    window.clearTimeout(timer.current)
    window.cancelAnimationFrame(frame.current)
  }, [])

  function target_at(x: number, y: number): ReorderTarget | null {
    const row = document.elementFromPoint(x, y)?.closest<HTMLElement>(target_selector)
    if (!row?.dataset.reorderId || !row.dataset.reorderScope) return null
    return { id: row.dataset.reorderId, scope: row.dataset.reorderScope }
  }

  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || press.current) return
    const { pointerId, clientX, clientY } = event
    const pending = { pointer_id: pointerId, x: clientX, y: clientY, active: false }
    press.current = pending
    event.currentTarget.setPointerCapture(pointerId)
    timer.current = window.setTimeout(() => {
      pending.active = true
      set_dragging(true)

      // 스크롤 경계에서도 포인터 아래의 놓을 위치를 계속 찾습니다.
      function scroll_at_edge() {
        if (pending.y < 48) window.scrollBy(0, -8)
        else if (pending.y > window.innerHeight - 72) window.scrollBy(0, 8)
        on_preview(target_at(pending.x, pending.y))
        frame.current = window.requestAnimationFrame(scroll_at_edge)
      }
      scroll_at_edge()
    }, 300)
  }

  function move(event: PointerEvent<HTMLButtonElement>) {
    const pending = press.current
    if (!pending || pending.pointer_id !== event.pointerId) return
    if (!pending.active && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 9) {
      finish(event, false)
      return
    }
    if (pending.active) {
      pending.x = event.clientX
      pending.y = event.clientY
    }
  }

  function finish(event: PointerEvent<HTMLButtonElement>, commit: boolean) {
    const pending = press.current
    if (!pending || pending.pointer_id !== event.pointerId) return
    press.current = null
    window.clearTimeout(timer.current)
    window.cancelAnimationFrame(frame.current)
    if (!pending.active) return
    set_dragging(false)
    on_preview(null)
    if (commit) on_drop(target_at(event.clientX, event.clientY))
  }

  return (
    <button type="button" className={className ? `reorder-handle ${className}` : 'reorder-handle'} disabled={disabled}
      aria-label={`${name} 순서 변경`} aria-keyshortcuts="ArrowUp ArrowDown"
      data-dragging={dragging || undefined}
      onPointerDown={start} onPointerMove={move}
      onPointerUp={(event) => finish(event, true)}
      onPointerCancel={(event) => finish(event, false)}
      onLostPointerCapture={(event) => finish(event, false)}
      onContextMenu={(event) => event.preventDefault()}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
        event.preventDefault()
        on_step(event.key === 'ArrowUp' ? -1 : 1)
      }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
    </button>
  )
}
