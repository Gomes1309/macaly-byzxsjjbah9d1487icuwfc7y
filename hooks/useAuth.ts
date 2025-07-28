'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  nome: string
  email: string
  departamento: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  loading: boolean
}

// Lista de usuários autorizados - APENAS conta principal
const authorizedUsers = [
  {
    id: '1',
    nome: 'Administrador Principal',
    email: 'agassessoriacontrole@gmail.com',
    password: 'Fx21701313@@##',
    departamento: 'Administração',
    role: 'admin'
  }
]

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 useAuth: Inicializando...')
    
    // Verificar se há sessão salva
    const savedUser = localStorage.getItem('agassessoria_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        console.log('✅ useAuth: Usuário encontrado no localStorage:', userData.email)
        setUser(userData)
      } catch (error) {
        console.error('❌ useAuth: Erro ao parse do localStorage:', error)
        localStorage.removeItem('agassessoria_user')
      }
    } else {
      console.log('ℹ️ useAuth: Nenhum usuário salvo encontrado')
    }
    
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔓 useAuth: Tentativa de login para:', email)
    
    try {
      // Fazer requisição para a API de login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()

      if (result.success && result.user) {
        console.log('✅ useAuth: Login bem-sucedido via API:', result.user.nome)
        
        // Salvar no localStorage
        localStorage.setItem('agassessoria_user', JSON.stringify(result.user))
        setUser(result.user)
        
        return true
      } else {
        console.log('❌ useAuth: Credenciais inválidas:', result.message || 'Erro desconhecido')
        return false
      }
    } catch (error) {
      console.error('💥 useAuth: Erro na requisição de login:', error)
      return false
    }
  }

  const logout = () => {
    console.log('🚪 useAuth: Logout executado')
    localStorage.removeItem('agassessoria_user')
    setUser(null)
  }

  return {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  }
}