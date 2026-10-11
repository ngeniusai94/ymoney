import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// VITE_ 접두사가 있는 값만 Vite가 브라우저 코드에 전달합니다.
const supabase_url = import.meta.env.VITE_SUPABASE_URL
const supabase_publishable_key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// 애플리케이션 전체에서 하나의 연결 객체만 재사용하기 위한 보관 변수입니다.
let supabase_client: SupabaseClient | null = null

/**
 * Supabase 클라이언트를 처음 필요로 할 때 한 번만 생성합니다.
 * 환경값을 입력하기 전에도 인증 화면 자체는 열 수 있도록 지연 생성 방식을 사용합니다.
 */
export function get_supabase_client() {
  if (!supabase_url || !supabase_publishable_key) {
    throw new Error('Supabase URL과 Publishable key를 .env에 입력해주세요.')
  }

  if (!supabase_client) {
    supabase_client = createClient(supabase_url, supabase_publishable_key)
  }

  return supabase_client
}
