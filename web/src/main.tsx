import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthProvider.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { query_client } from './lib/queryClient.ts'
import { ThemeProvider } from './features/theme/ThemeProvider'

// index.html의 #root가 React 애플리케이션이 그려질 시작점입니다.
const root_element = document.getElementById('root')

// HTML 구조가 잘못되어 시작점을 찾지 못하면 조용히 실패하지 않고 원인을 알려줍니다.
if (!root_element) {
  throw new Error('React 시작점 #root를 찾을 수 없습니다.')
}

createRoot(root_element).render(
  <StrictMode>
    <QueryClientProvider client={query_client}>
      <AuthProvider>
        <ThemeProvider><App /></ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
