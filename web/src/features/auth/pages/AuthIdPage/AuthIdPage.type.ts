import type { FormEvent } from 'react'

/** 아이디 인증 화면에서 보여줄 전체 폼 모드입니다. */
export type AuthIdMode = 'login' | 'signup'

/** 로그인/가입 폼이 부모 화면으로부터 받는 최소 입력 계약입니다. */
export type AuthIdFormProps = {
  is_submitting: boolean
  notice: string
  on_submit: (event: FormEvent<HTMLFormElement>) => void
}
