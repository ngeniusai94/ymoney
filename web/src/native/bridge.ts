// &로 브라우저의 Window 타입에 RN WebView가 제공하는 속성을 더합니다.
// ?는 일반 브라우저처럼 이 속성이 없는 환경도 허용한다는 뜻입니다.
type NativeWindow = Window & {
  ReactNativeWebView?: { postMessage: (message: string) => void }
}

/**
 * 앱의 WebView onMessage로 메시지를 보냅니다.
 * message.type은 앱이 실행할 명령을 구분하는 문자열입니다.
 * 반환 타입 void는 이 함수에서 앱의 실행 결과를 받지 않는다는 뜻입니다.
 */
export function postToApp(message: { type: string }): void {
  // Node 등 window가 없는 환경에서는 전송할 대상이 없습니다.
  if (typeof window === 'undefined') return

  // as는 TypeScript에 속성의 타입을 알려줍니다. 실제 속성을 만드는 코드는 아닙니다.
  const bridge = (window as NativeWindow).ReactNativeWebView
  // ?.는 bridge가 없으면 undefined를 반환합니다. 함수가 있을 때만 호출합니다.
  if (typeof bridge?.postMessage !== 'function') return

  // WebView는 문자열을 받으므로 객체를 JSON으로 변환해 보냅니다.
  bridge.postMessage(JSON.stringify(message))
}
