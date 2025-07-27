'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !isAuthenticated) {
        console.log('🛡️ ProtectedRoute: Usuário não autenticado, redirecionando para:', redirectTo)
        router.push(redirectTo)
      } else if (!requireAuth && isAuthenticated) {
        console.log('🛡️ ProtectedRoute: Usuário já autenticado, redirecionando para /dashboard')
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Se requer autenticação mas não está autenticado, não renderiza nada (está redirecionando)
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // Se não requer autenticação mas está autenticado, não renderiza nada (está redirecionando)
  if (!requireAuth && isAuthenticated) {
    return null
  }

  return <>{children}</>
}