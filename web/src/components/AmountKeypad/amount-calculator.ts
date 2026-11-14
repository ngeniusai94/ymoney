export type AmountKey = '+' | '-' | 'backspace' | '0' | '00' | '000' |
  '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

type AmountState = {
  total: number
  operator: '+' | '-' | null
  digits: string
}

const max_digits = 14
const max_amount = 10 ** max_digits - 1
const formatter = new Intl.NumberFormat('ko-KR')

export function createAmount(digits: string): AmountState {
  return { total: 0, operator: null, digits }
}

function calculate({ total, operator, digits }: AmountState): number {
  if (operator === null) return Number(digits)
  const operand = Number(digits)
  return operator === '+' ? total + operand : total - operand
}

export function pressAmountKey(state: AmountState, key: AmountKey): AmountState {
  if (key === 'backspace') {
    if (state.digits) return { ...state, digits: state.digits.slice(0, -1) }
    // 새 피연산자가 비어 있으면 마지막 연산자부터 지웁니다.
    return createAmount(String(completeAmount(state)))
  }

  if (key === '+' || key === '-') {
    // 피연산자를 입력하기 전에는 직전에 누른 연산자만 교체합니다.
    if (state.operator && !state.digits) return { ...state, operator: key }
    return { total: calculate(state), operator: key, digits: '' }
  }

  const digits = (state.digits + key).replace(/^0+(?=\d)/, '')
  if (digits.length > max_digits) return state
  return { ...state, digits }
}

export function completeAmount(state: AmountState): number {
  return Math.min(max_amount, Math.max(0, calculate(state)))
}

export function formatAmount({ total, operator, digits }: AmountState): string {
  const current = digits ? formatter.format(Number(digits)) : ''
  if (!operator) return current || '0'
  return [formatter.format(total), operator, current].filter(Boolean).join(' ')
}
