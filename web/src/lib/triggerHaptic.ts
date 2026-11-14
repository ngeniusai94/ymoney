type HapticWindow = Window & { ReactNativeWebView?: { postMessage: (message: string) => void } }

/** 네이티브 브릿지가 있을 때만 키 탭 햅틱을 요청합니다. */
export function triggerHaptic(): void {
  if (typeof window === 'undefined') return
  const bridge = (window as HapticWindow).ReactNativeWebView
  try {
    bridge?.postMessage(JSON.stringify({ type: 'HAPTIC_TAP' }))
  } catch {
    // 브릿지가 응답하지 않아도 입력은 계속 처리합니다.
  }
}
