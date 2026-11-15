import { postToApp } from './bridge.ts'

/**
 * 화면에서 호출하는 앱 기능의 진입점입니다.
 * 키패드는 callApp.triggerHaptic()처럼 사용하고,
 * 어떤 메시지를 보낼지는 여기서, 어떻게 보낼지는 bridge.ts에서 관리합니다.
 */
export const callApp = {
  /** 앱에 짧은 햅틱을 요청합니다. 이 호출에는 앱 응답을 기다리는 단계가 없습니다. */
  triggerHaptic(): void {
    try {
      // 앱의 onMessage가 이 문자열을 확인하고 실제 햅틱을 실행합니다.
      postToApp({ type: 'HAPTIC_TAP' })
    } catch {
      // 햅틱 전송에 실패해도 금액 입력은 계속합니다.
    }
  },
}
