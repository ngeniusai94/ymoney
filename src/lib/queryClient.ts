import { QueryClient } from '@tanstack/react-query'

/** 원격 데이터 조회를 화면 사이에서 캐시하고 중복 요청을 줄입니다. */
export const query_client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
