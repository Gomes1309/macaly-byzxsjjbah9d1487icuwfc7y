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
    
    // PASSO 1: Verificar usuários principais (hardcoded) - PRIORIDADE MÁXIMA
    const foundMainUser = authorizedUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (foundMainUser) {
      const userData = {
        id: foundMainUser.id,
        nome: foundMainUser.nome,
        email: foundMainUser.email,
        departamento: foundMainUser.departamento,
        role: foundMainUser.role
      }
      
      console.log('✅ useAuth: Login principal bem-sucedido:', userData.nome)
      
      // Salvar no localStorage
      localStorage.setItem('agassessoria_user', JSON.stringify(userData))
      setUser(userData)
      
      return true
    }

    // PASSO 2: Verificar usuários cadastrados no Supabase
    console.log('🔍 useAuth: Verificando usuários do banco Supabase...')
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('status', 'ativo')
        .single()

      if (error) {
        console.log('ℹ️ useAuth: Usuário não encontrado no banco:', error.message)
      } else if (data) {
        console.log('👤 useAuth: Usuário encontrado no banco:', data.nome)
        
        // Para usuários do banco, verificar senha padrão ou senha definida
        const validPasswords = [
          'senha123',           // Senha padrão
          'agassessoria123',    // Senha da empresa
          password === data.senha ? data.senha : null, // Senha personalizada se existir
          data.email.split('@')[0] + '123' // Email + 123
        ].filter(Boolean)

        const isPasswordValid = validPasswords.includes(password)
        console.log('🔐 useAuth: Testando senhas válidas para usuário do banco...')

        if (isPasswordValid) {
          const userData = {
            id: data.id,
            nome: data.nome,
            email: data.email,
            departamento: data.departamento || 'Geral',
            role: data.cargo === 'Administrador' ? 'admin' : 'operador'
          }
          
          console.log('✅ useAuth: Login do banco bem-sucedido:', userData.nome)
          
          // Atualizar último acesso
          await supabase
            .from('usuarios')
            .update({ ultimo_acesso: new Date().toISOString() })
            .eq('id', data.id)
          
          // Salvar no localStorage
          localStorage.setItem('agassessoria_user', JSON.stringify(userData))
          setUser(userData)
          
          return true
        } else {
          console.log('❌ useAuth: Senha inválida para usuário do banco')
        }
      }
    } catch (err) {
      console.error('💥 useAuth: Erro ao verificar banco:', err)
    }

    console.log('❌ useAuth: Credenciais inválidas (não encontrado em nenhum local)')
    return false
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