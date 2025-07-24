'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Responsavel {
  id: string
  nome: string
  email: string
  cpf: string
  telefone?: string
  senhaHash: string
  status: 'ativo' | 'inativo' | 'suspenso'
  ultimoAcesso?: Date
  dataCadastro: Date
  observacoes?: string
}

export interface ResponsavelCliente {
  id: string
  responsavelId: string
  clienteId: string
  cargo: string
  permissoes: {
    documentos: boolean
    download: boolean
    notificacoes: boolean
  }
  status: 'ativo' | 'inativo' | 'suspenso'
  dataVinculacao: Date
  observacoes?: string
}

export interface ResponsavelComVinculo extends Responsavel {
  vinculo: ResponsavelCliente
  empresas: Array<{
    clienteId: string
    clienteNome: string
    cargo: string
    permissoes: {
      documentos: boolean
      download: boolean
      notificacoes: boolean
    }
    status: 'ativo' | 'inativo' | 'suspenso'
  }>
}

export interface DatabaseResponsavel {
  id: string
  nome: string
  email: string
  cpf: string
  telefone?: string
  senha_hash: string
  status: 'ativo' | 'inativo' | 'suspenso'
  ultimo_acesso?: string
  data_cadastro: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface DatabaseResponsavelCliente {
  id: string
  responsavel_id: string
  cliente_id: string
  cargo: string
  permissoes: {
    documentos: boolean
    download: boolean
    notificacoes: boolean
  }
  status: 'ativo' | 'inativo' | 'suspenso'
  data_vinculacao: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export function useResponsaveis() {
  const [responsaveis, setResponsaveis] = useState<ResponsavelComVinculo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Converter dados do banco para formato da aplicação
  const databaseToResponsavel = useCallback((dbResponsavel: DatabaseResponsavel): Responsavel => {
    return {
      id: dbResponsavel.id,
      nome: dbResponsavel.nome,
      email: dbResponsavel.email,
      cpf: dbResponsavel.cpf,
      telefone: dbResponsavel.telefone,
      senhaHash: dbResponsavel.senha_hash,
      status: dbResponsavel.status,
      ultimoAcesso: dbResponsavel.ultimo_acesso ? new Date(dbResponsavel.ultimo_acesso) : undefined,
      dataCadastro: new Date(dbResponsavel.data_cadastro),
      observacoes: dbResponsavel.observacoes
    }
  }, [])

  // Converter dados do banco para formato da aplicação (vínculo)
  const databaseToResponsavelCliente = useCallback((dbVinculo: DatabaseResponsavelCliente): ResponsavelCliente => {
    return {
      id: dbVinculo.id,
      responsavelId: dbVinculo.responsavel_id,
      clienteId: dbVinculo.cliente_id,
      cargo: dbVinculo.cargo,
      permissoes: dbVinculo.permissoes,
      status: dbVinculo.status,
      dataVinculacao: new Date(dbVinculo.data_vinculacao),
      observacoes: dbVinculo.observacoes
    }
  }, [])

  // Converter dados da aplicação para formato do banco
  const responsavelToDatabase = useCallback((responsavel: Omit<Responsavel, 'id'>): Omit<DatabaseResponsavel, 'id' | 'created_at' | 'updated_at'> => {
    return {
      nome: responsavel.nome,
      email: responsavel.email,
      cpf: responsavel.cpf,
      telefone: responsavel.telefone,
      senha_hash: responsavel.senhaHash,
      status: responsavel.status,
      ultimo_acesso: responsavel.ultimoAcesso?.toISOString(),
      data_cadastro: responsavel.dataCadastro.toISOString().split('T')[0],
      observacoes: responsavel.observacoes
    }
  }, [])

  // Converter dados da aplicação para formato do banco (vínculo)
  const responsavelClienteToDatabase = useCallback((vinculo: Omit<ResponsavelCliente, 'id'>): Omit<DatabaseResponsavelCliente, 'id' | 'created_at' | 'updated_at'> => {
    return {
      responsavel_id: vinculo.responsavelId,
      cliente_id: vinculo.clienteId,
      cargo: vinculo.cargo,
      permissoes: vinculo.permissoes,
      status: vinculo.status,
      data_vinculacao: vinculo.dataVinculacao.toISOString().split('T')[0],
      observacoes: vinculo.observacoes
    }
  }, [])

  // Carregar responsáveis do banco com seus vínculos
  const loadResponsaveis = useCallback(async (clienteId?: string) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Iniciando loadResponsaveis:', { clienteId })
      
      let query = supabase
        .from('responsavel_cliente')
        .select(`
          *,
          responsaveis (*),
          clientes (id, nome, email, cpf_cnpj)
        `)
        .order('created_at', { ascending: false })
      
      if (clienteId) {
        query = query.eq('cliente_id', clienteId)
        console.log('Filtro por cliente aplicado:', clienteId)
      }
      
      const { data, error } = await query
      
      console.log('Resultado da query:', { data, error })
      
      if (error) {
        console.error('Erro na query:', error)
        throw error
      }
      
      // Agrupar responsáveis por ID
      const responsaveisMap = new Map<string, ResponsavelComVinculo>()
      
      console.log('Processando dados:', data?.length || 0, 'registros')
      
      data?.forEach((item: any) => {
        const responsavel = databaseToResponsavel(item.responsaveis)
        const vinculo = databaseToResponsavelCliente(item)
        
        if (responsaveisMap.has(responsavel.id)) {
          const existing = responsaveisMap.get(responsavel.id)!
          existing.empresas.push({
            clienteId: item.cliente_id,
            clienteNome: item.clientes.nome,
            cargo: item.cargo,
            permissoes: item.permissoes,
            status: item.status
          })
        } else {
          responsaveisMap.set(responsavel.id, {
            ...responsavel,
            vinculo,
            empresas: [{
              clienteId: item.cliente_id,
              clienteNome: item.clientes.nome,
              cargo: item.cargo,
              permissoes: item.permissoes,
              status: item.status
            }]
          })
        }
      })
      
      const formattedResponsaveis = Array.from(responsaveisMap.values())
      console.log('Responsáveis formatados:', formattedResponsaveis.length)
      
      setResponsaveis(formattedResponsaveis)
      
      console.log('loadResponsaveis concluído com sucesso')
    } catch (err) {
      console.error('Erro ao carregar responsáveis:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar responsáveis')
    } finally {
      setLoading(false)
    }
  }, [databaseToResponsavel, databaseToResponsavelCliente])

  // Adicionar novo responsável ou criar vínculo
  const addResponsavelToCliente = useCallback(async (clienteId: string, responsavelData: {
    nome: string
    email: string
    cpf: string
    telefone?: string
    cargo: string
    permissoes: {
      documentos: boolean
      download: boolean
      notificacoes: boolean
    }
    status: 'ativo' | 'inativo' | 'suspenso'
    observacoes?: string
  }) => {
    try {
      setError(null)
      console.log('Iniciando addResponsavelToCliente:', { clienteId, responsavelData })
      
      // Verificar se o responsável já existe
      console.log('Verificando responsável existente por email:', responsavelData.email)
      const { data: existingResponsavel, error: searchError } = await supabase
        .from('responsaveis')
        .select('*')
        .eq('email', responsavelData.email)
        .single()
      
      console.log('Resultado da busca:', { existingResponsavel, searchError })
      
      let responsavelId: string
      
      if (existingResponsavel) {
        // Responsável existe, usar ID existente
        responsavelId = existingResponsavel.id
        console.log('Responsável existe, usando ID:', responsavelId)
      } else {
        // Criar novo responsável
        console.log('Criando novo responsável')
        const senhaHash = '$2b$10$hashedpassword' // Placeholder para desenvolvimento
        
        const dbData = responsavelToDatabase({
          nome: responsavelData.nome,
          email: responsavelData.email,
          cpf: responsavelData.cpf,
          telefone: responsavelData.telefone,
          senhaHash,
          status: responsavelData.status,
          dataCadastro: new Date(),
          observacoes: responsavelData.observacoes
        })
        
        console.log('Dados para inserção no banco:', dbData)
        
        const { data: newResponsavel, error: createError } = await supabase
          .from('responsaveis')
          .insert([dbData])
          .select()
          .single()
        
        console.log('Resultado da inserção:', { newResponsavel, createError })
        
        if (createError) {
          console.error('Erro ao criar responsável:', createError)
          throw createError
        }
        
        responsavelId = newResponsavel.id
        console.log('Novo responsável criado com ID:', responsavelId)
      }
      
      // Verificar se já existe vínculo
      console.log('Verificando vínculo existente:', { responsavelId, clienteId })
      const { data: existingVinculo, error: vinculoCheckError } = await supabase
        .from('responsavel_cliente')
        .select('*')
        .eq('responsavel_id', responsavelId)
        .eq('cliente_id', clienteId)
        .single()
      
      console.log('Resultado da verificação de vínculo:', { existingVinculo, vinculoCheckError })
      
      if (existingVinculo) {
        console.log('Vínculo já existe, não criando novo')
        throw new Error('Este responsável já está vinculado a esta empresa')
      }
      
      // Criar vínculo responsável-cliente
      console.log('Criando vínculo responsável-cliente')
      const vinculoData = responsavelClienteToDatabase({
        responsavelId,
        clienteId,
        cargo: responsavelData.cargo,
        permissoes: responsavelData.permissoes,
        status: responsavelData.status,
        dataVinculacao: new Date(),
        observacoes: responsavelData.observacoes
      })
      
      console.log('Dados do vínculo para inserção:', vinculoData)
      
      const { data: newVinculo, error: vinculoError } = await supabase
        .from('responsavel_cliente')
        .insert([vinculoData])
        .select()
        .single()
      
      console.log('Resultado da inserção do vínculo:', { newVinculo, vinculoError })
      
      if (vinculoError) {
        console.error('Erro ao criar vínculo:', vinculoError)
        throw vinculoError
      }
      
      console.log('Vínculo criado com sucesso, recarregando dados...')
      
      // Recarregar dados
      await loadResponsaveis()
      
      console.log('Dados recarregados com sucesso')
      return newVinculo
    } catch (err) {
      console.error('Erro ao adicionar responsável:', err)
      setError(err instanceof Error ? err.message : 'Erro ao adicionar responsável')
      throw err
    }
  }, [responsavelToDatabase, responsavelClienteToDatabase, loadResponsaveis])

  // Atualizar vínculo responsável-cliente
  const updateResponsavelCliente = useCallback(async (vinculoId: string, vinculoData: Partial<{
    cargo: string
    permissoes: {
      documentos: boolean
      download: boolean
      notificacoes: boolean
    }
    status: 'ativo' | 'inativo' | 'suspenso'
    observacoes?: string
  }>) => {
    try {
      setError(null)
      
      const updateData: Partial<DatabaseResponsavelCliente> = {}
      
      if (vinculoData.cargo) updateData.cargo = vinculoData.cargo
      if (vinculoData.permissoes) updateData.permissoes = vinculoData.permissoes
      if (vinculoData.status) updateData.status = vinculoData.status
      if (vinculoData.observacoes !== undefined) updateData.observacoes = vinculoData.observacoes
      
      const { data, error } = await supabase
        .from('responsavel_cliente')
        .update(updateData)
        .eq('id', vinculoId)
        .select()
        .single()
      
      if (error) throw error
      
      // Recarregar dados
      await loadResponsaveis()
      
      return data
    } catch (err) {
      console.error('Erro ao atualizar vínculo:', err)
      setError('Erro ao atualizar vínculo')
      throw err
    }
  }, [loadResponsaveis])

  // Deletar vínculo responsável-cliente
  const deleteResponsavelCliente = useCallback(async (vinculoId: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('responsavel_cliente')
        .delete()
        .eq('id', vinculoId)
      
      if (error) throw error
      
      // Recarregar dados
      await loadResponsaveis()
    } catch (err) {
      console.error('Erro ao deletar vínculo:', err)
      setError('Erro ao deletar vínculo')
      throw err
    }
  }, [loadResponsaveis])

  // Buscar responsáveis por cliente
  const getResponsaveisByCliente = useCallback((clienteId: string) => {
    return responsaveis.filter(resp => 
      resp.empresas.some(empresa => empresa.clienteId === clienteId)
    )
  }, [responsaveis])

  // Atualizar último acesso
  const updateLastAccess = useCallback(async (responsavelId: string) => {
    try {
      const { error } = await supabase
        .from('responsaveis')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('id', responsavelId)
      
      if (error) throw error
      
      // Atualizar estado local
      setResponsaveis(prev => prev.map(resp => 
        resp.id === responsavelId 
          ? { ...resp, ultimoAcesso: new Date() }
          : resp
      ))
    } catch (err) {
      console.error('Erro ao atualizar último acesso:', err)
    }
  }, [])

  // Validar login de responsável
  const validateResponsavelLogin = useCallback(async (email: string, senha: string) => {
    try {
      const { data, error } = await supabase
        .from('responsaveis')
        .select('*')
        .eq('email', email)
        .eq('status', 'ativo')
        .single()
      
      if (error) throw error
      
      // Em produção, verificar hash da senha
      if (senha === '123456') { // Placeholder para desenvolvimento
        const responsavel = databaseToResponsavel(data)
        await updateLastAccess(responsavel.id)
        return responsavel
      }
      
      return null
    } catch (err) {
      console.error('Erro ao validar login:', err)
      return null
    }
  }, [databaseToResponsavel, updateLastAccess])

  // Buscar empresas de um responsável
  const getEmpresasByResponsavel = useCallback((responsavelId: string) => {
    const responsavel = responsaveis.find(resp => resp.id === responsavelId)
    return responsavel?.empresas || []
  }, [responsaveis])

  // Carregar dados na inicialização
  useEffect(() => {
    loadResponsaveis()
  }, [loadResponsaveis])

  // Função de teste para verificar conexão
  const testConnection = useCallback(async () => {
    try {
      console.log('Testando conexão com Supabase...')
      
      // Teste 1: Verificar se consegue conectar
      const { data: healthCheck, error: healthError } = await supabase
        .from('clientes')
        .select('count')
        .limit(1)
      
      console.log('Teste de conexão:', { healthCheck, healthError })
      
      // Teste 2: Verificar se as tabelas existem
      const { data: tablesCheck, error: tablesError } = await supabase
        .from('responsaveis')
        .select('id')
        .limit(1)
      
      console.log('Teste de tabelas:', { tablesCheck, tablesError })
      
      // Teste 3: Verificar clientes existentes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .limit(5)
      
      console.log('Clientes existentes:', { clientesData, clientesError })
      
    } catch (err) {
      console.error('Erro no teste de conexão:', err)
    }
  }, [])

  return {
    responsaveis,
    loading,
    error,
    addResponsavelToCliente,
    updateResponsavelCliente,
    deleteResponsavelCliente,
    getResponsaveisByCliente,
    getEmpresasByResponsavel,
    validateResponsavelLogin,
    updateLastAccess,
    refreshResponsaveis: loadResponsaveis,
    testConnection
  }
}