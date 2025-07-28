'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Usuario {
  id: string
  nome: string
  email: string
  cargo?: string
  departamento?: string
  permissoes: Record<string, boolean>
  status: 'ativo' | 'inativo' | 'suspenso'
  ultimoAcesso?: Date
}

export function useUsuariosSimple() {
  console.log('🚀 HOOK useUsuariosSimple INICIADO - v2.0 com carregamento de banco')
  
  // Usuários de teste padrão
  const defaultTestUsers: Usuario[] = [
    {
      id: 'admin-sistema',
      nome: 'Administrador do Sistema',
      email: 'admin@agassessoria.com',
      cargo: 'Administrador',
      departamento: 'TI', 
      permissoes: { dashboard: true, usuarios: true, documentos: true },
      status: 'ativo',
      ultimoAcesso: new Date()
    },
    {
      id: 'operador-teste',
      nome: 'Operador Teste',
      email: 'operador@agassessoria.com',
      cargo: 'Operador',
      departamento: 'Operacional',
      permissoes: { documentos: true, dashboard: false, usuarios: false },
      status: 'ativo',
      ultimoAcesso: new Date(Date.now() - 86400000)
    }
  ]

  // Estados
  const [usuarios, setUsuarios] = useState<Usuario[]>(defaultTestUsers) // Iniciar com usuários padrão
  const [deletedTestUsers, setDeletedTestUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para salvar/carregar localStorage
  const getDeletedFromStorage = (): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('deletedTestUsers')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Erro ao carregar localStorage:', error)
      return []
    }
  }

  const saveDeletedToStorage = (deleted: string[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem('deletedTestUsers', JSON.stringify(deleted))
      console.log('💾 Usuários excluídos salvos:', deleted)
    } catch (error) {
      console.error('Erro ao salvar localStorage:', error)
    }
  }

  // Inicialização simples - carregar apenas usuários de teste, banco via refresh manual
  useEffect(() => {
    console.log('🔄 USEEFFECT SIMPLES EXECUTADO - Inicializando usuários de teste...')
    
    // Carregar excluídos do localStorage
    const deletedFromStorage = getDeletedFromStorage()
    console.log('🗑️ Usuários excluídos carregados do localStorage:', deletedFromStorage)
    setDeletedTestUsers(deletedFromStorage)
    
    // Filtrar usuários de teste ativos
    const activeTestUsers = defaultTestUsers.filter(user => !deletedFromStorage.includes(user.id))
    console.log('✅ Usuários de teste ativos carregados:', activeTestUsers.length)
    console.log('📝 IDs ativos:', activeTestUsers.map(u => u.id))
    
    setUsuarios(activeTestUsers)
    setError(null)
    
    console.log('✅ Hook iniciado - use "Atualizar (Carregar do Banco)" para sincronizar')
  }, []) // Execução única na montagem

  console.log('👀 Estado atual - Usuários:', usuarios.length, 'Excluídos:', deletedTestUsers.length, '[VERSÃO ATUALIZADA v2.0]')
  
  // Função para tentar carregar dados reais do banco (chamada manualmente)
  const loadRealData = async () => {
    console.log('🔄 Tentando carregar dados reais do banco...')
    setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Erro do banco:', error)
        setError('Estrutura do banco ainda não está pronta - Execute o script SQL primeiro')
        return
      }
      
      if (data && data.length > 0) {
        const realUsers = data.map(user => ({
          id: user.id,
          nome: user.nome,
          email: user.email,
          cargo: user.departamento || 'Usuário', // Derivar cargo do departamento
          departamento: user.departamento || 'Geral',
          permissoes: user.permissoes || {},
          status: (user.status as 'ativo' | 'inativo' | 'suspenso') || 'ativo',
          ultimoAcesso: user.ultimo_acesso ? new Date(user.ultimo_acesso) : undefined
        }))
        
        // Combinar com usuários de teste ativos
        const currentActiveTestUsers = defaultTestUsers.filter(user => !deletedTestUsers.includes(user.id))
        setUsuarios([...realUsers, ...currentActiveTestUsers])
        setError(null)
        console.log('✅ Dados reais carregados:', realUsers.length)
      }
      
    } catch (err) {
      console.error('💥 Erro ao carregar dados reais:', err)
      setError('Erro de conexão com banco')
    } finally {
      setLoading(false)
    }
  }

  const addUsuario = async (userData: Omit<Usuario, 'id'>, options?: { 
    createAccount?: boolean 
    notifyUser?: boolean 
  }) => {
    console.log('➕ INICIANDO CRIAÇÃO DE USUÁRIO:', userData, options)
    console.log('📊 Estado antes da criação - Total usuários:', usuarios.length)
    
    try {
      // Garantir que todos os campos obrigatórios estejam preenchidos
      const cargoFinal = userData.cargo || userData.departamento || 'Usuário'
      const departamentoFinal = userData.departamento || 'Geral'
      
      const insertData = {
        nome: userData.nome,
        email: userData.email,
        departamento: departamentoFinal,
        permissoes: userData.permissoes || {},
        status: userData.status || 'ativo',
        ultimo_acesso: new Date().toISOString()
      }
      
      console.log('📝 Dados para inserção no banco:', insertData)
      
      const { data, error } = await supabase
        .from('usuarios')
        .insert([insertData])
        .select()
        .single()
      
      if (error) {
        console.error('❌ Erro do Supabase:', error)
        throw new Error(`Erro ao cadastrar usuário: ${error.message}`)
      }
      
      console.log('✅ Usuário inserido no banco com sucesso:', data)
      
      const newUser: Usuario = {
        id: data.id,
        nome: data.nome,
        email: data.email,
        cargo: cargoFinal, // Usar o valor calculado localmente
        departamento: data.departamento || 'Geral',
        permissoes: data.permissoes || {},
        status: data.status || 'ativo',
        ultimoAcesso: new Date()
      }
      
      console.log('👤 Objeto de usuário criado:', newUser)
      
      // Adicionar ao estado local IMEDIATAMENTE
      setUsuarios(prev => {
        const updated = [newUser, ...prev]
        console.log('📋 Estado atualizado - antes:', prev.length, 'depois:', updated.length)
        console.log('📝 IDs após adição:', updated.map(u => u.id))
        return updated
      })
      
      console.log('✅ USUÁRIO CRIADO E ADICIONADO COM SUCESSO!')
      
      return {
        usuario: newUser,
        account: options?.createAccount ? { 
          created: true,
          senhaTemporaria: 'senha123' // Senha temporária de exemplo
        } : null,
        message: 'Usuário criado com sucesso!'
      }
      
    } catch (err) {
      console.error('💥 ERRO COMPLETO AO CRIAR USUÁRIO:', err)
      
      // Log detalhado do erro
      if (err instanceof Error) {
        console.error('📄 Mensagem do erro:', err.message)
        console.error('📄 Stack do erro:', err.stack)
      }
      
      throw err
    }
  }

  const updateUsuario = async (id: string, updates: Partial<Usuario>) => {
    console.log('🔄 Atualizando usuário:', id, updates)
    
    try {
      // Se for usuário de teste, apenas atualizar localmente
      const isTestUser = ['admin-sistema', 'operador-teste'].includes(id)
      
      if (isTestUser) {
        console.log('👤 Atualizando usuário de teste localmente:', id)
        setUsuarios(prev => prev.map(user => 
          user.id === id ? { ...user, ...updates } : user
        ))
        console.log('✅ Usuário de teste atualizado localmente')
        return
      }
      
      // Para usuários reais, tentar atualizar no banco
      const updateData: any = {}
      if (updates.nome) updateData.nome = updates.nome
      if (updates.email) updateData.email = updates.email
      if (updates.departamento) updateData.departamento = updates.departamento
      if (updates.permissoes) updateData.permissoes = updates.permissoes
      if (updates.status) updateData.status = updates.status
      if (updates.ultimoAcesso) updateData.ultimo_acesso = updates.ultimoAcesso.toISOString()
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('usuarios')
          .update(updateData)
          .eq('id', id)
        
        if (error) throw error
      }
      
      // Atualizar estado local
      setUsuarios(prev => prev.map(user => 
        user.id === id ? { ...user, ...updates } : user
      ))
      
      console.log('✅ Usuário atualizado com sucesso')
      
    } catch (err) {
      console.error('❌ Erro ao atualizar usuário:', err)
      throw err
    }
  }

  const deleteUsuario = async (id: string) => {
    console.log('🗑️ INICIANDO EXCLUSÃO DO USUÁRIO:', id)
    console.log('📊 Estado atual antes da exclusão - Usuários:', usuarios.length, 'Excluídos:', deletedTestUsers.length)
    
    try {
      // Verificar se é um usuário de teste (IDs específicos)
      const isTestUser = ['admin-sistema', 'operador-teste'].includes(id)
      console.log('🔍 É usuário de teste?', isTestUser)
      
      if (isTestUser) {
        console.log('👤 CONFIRMADO: Usuário de teste detectado:', id)
        
        // Verificar se já está na lista de excluídos
        if (deletedTestUsers.includes(id)) {
          console.log('⚠️ Usuário já está na lista de excluídos!')
          return
        }
        
        // PASSO 1: Adicionar à lista de excluídos permanentemente
        const newDeletedList = [...deletedTestUsers, id]
        console.log('📝 Nova lista de excluídos:', newDeletedList)
        
        // PASSO 2: Salvar no localStorage ANTES de atualizar estados
        saveDeletedToStorage(newDeletedList)
        console.log('💾 Salvou no localStorage')
        
        // PASSO 3: Atualizar estado de excluídos
        setDeletedTestUsers(newDeletedList)
        console.log('✅ Estado de excluídos atualizado')
        
        // PASSO 4: Filtrar usuários restantes
        const filteredUsers = usuarios.filter(user => user.id !== id)
        console.log('📋 Usuários filtrados - antes:', usuarios.length, 'depois:', filteredUsers.length)
        console.log('📝 IDs restantes:', filteredUsers.map(u => u.id))
        
        // PASSO 5: Atualizar estado de usuários
        setUsuarios(filteredUsers)
        
        console.log('✅ EXCLUSÃO DE TESTE CONCLUÍDA COM SUCESSO!')
        console.log('📊 Estado final - Usuários:', filteredUsers.length, 'Excluídos:', newDeletedList.length)
        return
      }
      
      // Para usuários reais do banco
      console.log('🔄 Tentando deletar usuário real do banco de dados:', id)
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('❌ Erro específico do Supabase:', error)
        throw new Error(`Erro ao excluir do banco: ${error.message}`)
      }
      
      // Remover do estado local após sucesso no banco
      const filteredUsers = usuarios.filter(user => user.id !== id)
      setUsuarios(filteredUsers)
      console.log('✅ Usuário real excluído com sucesso do banco e estado local')
      
    } catch (err) {
      console.error('💥 ERRO GERAL AO DELETAR USUÁRIO:', err)
      
      // Log detalhado do erro
      if (err instanceof Error) {
        console.error('📄 Mensagem do erro:', err.message)
        console.error('📄 Stack do erro:', err.stack)
      }
      
      // Relançar o erro para mostrar toast de erro
      throw err
    }
  }

  const refreshUsuarios = async () => {
    console.log('🔄 REFRESH INICIADO - recarregando TODOS os dados (reais + teste)')
    setLoading(true)
    
    try {
      // Buscar lista atual de excluídos do localStorage
      const currentDeletedUsers = getDeletedFromStorage()
      console.log('🗑️ Usuários excluídos encontrados no localStorage:', currentDeletedUsers)
      setDeletedTestUsers(currentDeletedUsers)
      
      // Filtrar usuários de teste ativos
      const currentActiveTestUsers = defaultTestUsers.filter(user => {
        const isDeleted = currentDeletedUsers.includes(user.id)
        console.log(`👤 Usuário de teste ${user.id} (${user.nome}) - Excluído: ${isDeleted}`)
        return !isDeleted
      })
      console.log('📋 Usuários de teste ativos:', currentActiveTestUsers.length)
      
      // Tentar carregar usuários reais do banco
      try {
        console.log('🔄 Carregando usuários reais do banco...')
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.warn('⚠️ Erro ao carregar do banco:', error.message)
          // Se der erro, usar apenas usuários de teste
          setUsuarios(currentActiveTestUsers)
          setError('Estrutura do banco não configurada - usando dados de teste')
        } else if (data && data.length > 0) {
          console.log('✅ Usuários reais carregados:', data.length)
          
          // Converter dados do banco
          const realUsers = data.map(user => ({
            id: user.id,
            nome: user.nome,
            email: user.email,
            cargo: user.departamento || 'Usuário', // Derivar cargo do departamento 
            departamento: user.departamento || 'Geral',
            permissoes: user.permissoes || {},
            status: (user.status as 'ativo' | 'inativo' | 'suspenso') || 'ativo',
            ultimoAcesso: user.ultimo_acesso ? new Date(user.ultimo_acesso) : undefined
          }))
          
          // Combinar usuários reais + usuários de teste ativos
          const allUsers = [...realUsers, ...currentActiveTestUsers]
          console.log('📋 Total usuários após refresh:', allUsers.length)
          console.log('📝 IDs após refresh:', allUsers.map(u => u.id))
          
          setUsuarios(allUsers)
          setError(null)
        } else {
          console.log('📋 Nenhum usuário real, mantendo apenas usuários de teste')
          setUsuarios(currentActiveTestUsers)
          setError(null)
        }
      } catch (err) {
        console.error('💥 Erro ao carregar do banco:', err)
        setUsuarios(currentActiveTestUsers)
        setError('Erro de conexão - usando dados de teste')
      }
      
      console.log('✅ REFRESH CONCLUÍDO COM SUCESSO')
    } catch (err) {
      console.error('💥 Erro geral no refresh:', err)
      setError('Erro ao atualizar dados')
    } finally {
      setLoading(false)
    }
  }

  // Função para restaurar usuários excluídos (útil para testes/depuração)
  const restoreDeletedUsers = () => {
    console.log('♻️ RESTAURANDO todos os usuários excluídos')
    console.log('📊 Estado antes da restauração - Usuários:', usuarios.length, 'Excluídos:', deletedTestUsers.length)
    
    // Limpar lista de excluídos
    setDeletedTestUsers([])
    saveDeletedToStorage([])
    
    // Restaurar todos os usuários de teste
    console.log('📋 Restaurando usuários padrão:', defaultTestUsers.length)
    console.log('📝 IDs dos usuários padrão:', defaultTestUsers.map(u => u.id))
    
    setUsuarios(defaultTestUsers)
    
    console.log('✅ RESTAURAÇÃO CONCLUÍDA')
    console.log('📊 Estado após restauração - Usuários:', defaultTestUsers.length, 'Excluídos: 0')
  }

  // Função para forçar reset completo (para debug)
  const forceResetSystem = () => {
    console.log('🔄 RESET COMPLETO DO SISTEMA')
    
    // Limpar localStorage completamente
    if (typeof window !== 'undefined') {
      localStorage.removeItem('deletedTestUsers')
      console.log('🗑️ localStorage limpo')
    }
    
    // Resetar todos os estados
    setDeletedTestUsers([])
    setUsuarios(defaultTestUsers)
    setError(null)
    
    console.log('✅ RESET COMPLETO FINALIZADO')
    console.log('📊 Estado final - Usuários:', defaultTestUsers.length, 'Excluídos: 0')
  }

  return {
    usuarios,
    loading,
    error,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    refreshUsuarios,
    restoreDeletedUsers, // Função para restaurar usuários excluídos
    forceResetSystem, // Função para reset completo (debug)
    loadRealData // Função para carregar dados reais do banco (manual)
  }
}