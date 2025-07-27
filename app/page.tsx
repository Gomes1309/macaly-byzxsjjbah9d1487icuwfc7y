'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('🏠 HomePage: Estado auth - loading:', loading, 'isAuthenticated:', isAuthenticated)
    
    if (!loading && isAuthenticated) {
      console.log('🏠 HomePage: Usuário autenticado, redirecionando para dashboard')
      router.push('/dashboard')
    } else if (!loading && !isAuthenticated) {
      console.log('🏠 HomePage: Usuário não autenticado, redirecionando para login')
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  // Não renderizar nada enquanto redireciona
  return null
}