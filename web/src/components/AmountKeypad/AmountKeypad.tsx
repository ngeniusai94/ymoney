import { triggerHaptic } from '../../lib/triggerHaptic'
import type { AmountKey } from './amount-calculator'
import './AmountKeypad.css'

type KeypadKey = AmountKey | 'done'

const keys: ReadonlyArray<{ value: KeypadKey; label?: string; path?: string }> = [
  { value: '7' }, { value: '8' }, { value: '9' },
  { value: 'backspace', label: '한 자리 지우기', path: 'M9 5h12v14H9l-6-7 6-7Zm3 4 5 6m0-6-5 6' },
  { value: '4' }, { value: '5' }, { value: '6' }, { value: '-', label: '빼기', path: 'M5 12h14' },
  { value: '1' }, { value: '2' }, { value: '3' }, { value: '+', label: '더하기', path: 'M5 12h14m-7-7v14' },
  { value: '0' }, { value: '00' }, { value: '000' }, { value: 'done', label: '금액 입력 완료', path: 'm5 12 4 4L19 6' },
]

export default function AmountKeypad({ id, on_key, on_done }: {
  id: string
  on_key: (key: AmountKey) => void
  on_done: (restore_focus: boolean) => void
}) {
  function press(key: KeypadKey, from_keyboard: boolean) {
    triggerHaptic()
    if (key === 'done') on_done(from_keyboard)
    else on_key(key)
  }

  return (
    <div id={id} className="amount-keypad" role="group" aria-label="금액 키패드">
      {keys.map(({ value, label, path }) => (
        <button key={value} type="button" aria-label={label} data-key={value}
          onClick={(event) => {
            // 터치·마우스 입력의 포커스를 남기지 않고 키보드 탐색은 유지합니다.
            const from_keyboard = event.detail === 0
            if (!from_keyboard) event.currentTarget.blur()
            press(value, from_keyboard)
          }}>
          {path ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg> : value}
        </button>
      ))}
    </div>
  )
}
