import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Usuario {
  id: string
  nome: string
  email: string
  cargo: string
  departamento: string
  permissoes: Record<string, boolean>
  status: 'ativo' | 'inativo' | 'suspenso'
  ultimoAcesso?: Date
}

export interface DatabaseUsuario {
  id: string
  nome: string
  email: string
  cargo: string
  departamento: string
  permissoes: Record<string, boolean>
  status: 'ativo' | 'inativo' | 'suspenso'
  ultimo_acesso?: string
  created_at: string
  updated_at: string
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Converter dados do banco para formato da aplicação
  const databaseToUsuario = useCallback((dbUsuario: DatabaseUsuario): Usuario => {
    return {
      id: dbUsuario.id,
      nome: dbUsuario.nome,
      email: dbUsuario.email,
      cargo: dbUsuario.cargo,
      departamento: dbUsuario.departamento,
      permissoes: dbUsuario.permissoes,
      status: dbUsuario.status,
      ultimoAcesso: dbUsuario.ultimo_acesso ? new Date(dbUsuario.ultimo_acesso) : undefined
    }
  }, [])

  // Converter dados da aplicação para formato do banco
  const usuarioToDatabase = useCallback((usuario: Omit<Usuario, 'id'>): Omit<DatabaseUsuario, 'id' | 'created_at' | 'updated_at'> => {
    return {
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      departamento: usuario.departamento,
      permissoes: usuario.permissoes,
      status: usuario.status,
      ultimo_acesso: usuario.ultimoAcesso?.toISOString()
    }
  }, [])

  // Carregar usuários do banco
  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedUsuarios = data.map(databaseToUsuario)
      setUsuarios(formattedUsuarios)
    } catch (err) {
      console.error('Erro ao carregar usuários:', err)
      setError('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }, [databaseToUsuario])

  // Adicionar novo usuário
  const addUsuario = useCallback(async (usuarioData: Omit<Usuario, 'id'>) => {
    try {
      setError(null)
      
      const dbData = usuarioToDatabase(usuarioData)
      const { data, error } = await supabase
        .from('usuarios')
        .insert([dbData])
        .select()
        .single()
      
      if (error) throw error
      
      const newUsuario = databaseToUsuario(data)
      setUsuarios(prev => [newUsuario, ...prev])
      
      return newUsuario
    } catch (err) {
      console.error('Erro ao adicionar usuário:', err)
      setError('Erro ao adicionar usuário')
      throw err
    }
  }, [usuarioToDatabase, databaseToUsuario])

  // Atualizar usuário existente
  const updateUsuario = useCallback(async (id: string, usuarioData: Partial<Omit<Usuario, 'id'>>) => {
    try {
      setError(null)
      
      const updateData: Partial<DatabaseUsuario> = {}
      
      if (usuarioData.nome) updateData.nome = usuarioData.nome
      if (usuarioData.email) updateData.email = usuarioData.email
      if (usuarioData.cargo) updateData.cargo = usuarioData.cargo
      if (usuarioData.departamento) updateData.departamento = usuarioData.departamento
      if (usuarioData.permissoes) updateData.permissoes = usuarioData.permissoes
      if (usuarioData.status) updateData.status = usuarioData.status
      if (usuarioData.ultimoAcesso) updateData.ultimo_acesso = usuarioData.ultimoAcesso.toISOString()
      
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedUsuario = databaseToUsuario(data)
      setUsuarios(prev => prev.map(usuario => usuario.id === id ? updatedUsuario : usuario))
      
      return updatedUsuario
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      setError('Erro ao atualizar usuário')
      throw err
    }
  }, [databaseToUsuario])

  // Deletar usuário
  const deleteUsuario = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setUsuarios(prev => prev.filter(usuario => usuario.id !== id))
    } catch (err) {
      console.error('Erro ao deletar usuário:', err)
      setError('Erro ao deletar usuário')
      throw err
    }
  }, [])

  // Carregar dados na inicialização
  useEffect(() => {
    loadUsuarios()
  }, [loadUsuarios])

  return {
    usuarios,
    loading,
    error,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    refreshUsuarios: loadUsuarios
  }
}