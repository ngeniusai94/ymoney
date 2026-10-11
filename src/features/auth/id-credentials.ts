/** 화면의 아이디를 Supabase Auth가 요구하는 내부 이메일 형식으로 바꿉니다. */
export function to_auth_email(user_id: string): string {
  const normalized_id = user_id.trim().toLowerCase()

  if (!/^[a-z0-9_]{4,20}$/.test(normalized_id)) {
    throw new Error('아이디는 영문 소문자, 숫자, 밑줄로 4~20자 입력해주세요.')
  }

  return `${normalized_id}@ymoney.com`
}
