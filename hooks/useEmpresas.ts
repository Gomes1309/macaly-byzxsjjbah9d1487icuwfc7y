import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Empresa {
  id: string
  clienteId: string
  razaoSocial: string
  nomeFantasia?: string
  cnpj?: string
  atividadePrincipal: string
  endereco: string
  telefone?: string
  email?: string
  capitalSocial?: number
  tipoEmpresa: 'mei' | 'ltda' | 'sa' | 'eireli'
  status: 'em_andamento' | 'documentos_pendentes' | 'aprovada' | 'cancelada'
  dataAbertura?: Date
  responsavelAbertura: string
  observacoes?: string
}

export interface DatabaseEmpresa {
  id: string
  cliente_id: string
  razao_social: string
  nome_fantasia?: string
  cnpj?: string
  atividade_principal: string
  endereco: string
  telefone?: string
  email?: string
  capital_social?: number
  tipo_empresa: 'mei' | 'ltda' | 'sa' | 'eireli'
  status: 'em_andamento' | 'documentos_pendentes' | 'aprovada' | 'cancelada'
  data_abertura?: string
  responsavel_abertura: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export function useEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Converter dados do banco para formato da aplicação
  const databaseToEmpresa = useCallback((dbEmpresa: DatabaseEmpresa): Empresa => {
    return {
      id: dbEmpresa.id,
      clienteId: dbEmpresa.cliente_id,
      razaoSocial: dbEmpresa.razao_social,
      nomeFantasia: dbEmpresa.nome_fantasia,
      cnpj: dbEmpresa.cnpj,
      atividadePrincipal: dbEmpresa.atividade_principal,
      endereco: dbEmpresa.endereco,
      telefone: dbEmpresa.telefone,
      email: dbEmpresa.email,
      capitalSocial: dbEmpresa.capital_social,
      tipoEmpresa: dbEmpresa.tipo_empresa,
      status: dbEmpresa.status,
      dataAbertura: dbEmpresa.data_abertura ? new Date(dbEmpresa.data_abertura) : undefined,
      responsavelAbertura: dbEmpresa.responsavel_abertura,
      observacoes: dbEmpresa.observacoes
    }
  }, [])

  // Converter dados da aplicação para formato do banco
  const empresaToDatabase = useCallback((empresa: Omit<Empresa, 'id'>): Omit<DatabaseEmpresa, 'id' | 'created_at' | 'updated_at'> => {
    return {
      cliente_id: empresa.clienteId,
      razao_social: empresa.razaoSocial,
      nome_fantasia: empresa.nomeFantasia,
      cnpj: empresa.cnpj,
      atividade_principal: empresa.atividadePrincipal,
      endereco: empresa.endereco,
      telefone: empresa.telefone,
      email: empresa.email,
      capital_social: empresa.capitalSocial,
      tipo_empresa: empresa.tipoEmpresa,
      status: empresa.status,
      data_abertura: empresa.dataAbertura?.toISOString().split('T')[0],
      responsavel_abertura: empresa.responsavelAbertura,
      observacoes: empresa.observacoes
    }
  }, [])

  // Carregar empresas do banco
  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedEmpresas = data.map(databaseToEmpresa)
      setEmpresas(formattedEmpresas)
    } catch (err) {
      console.error('Erro ao carregar empresas:', err)
      setError('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }, [databaseToEmpresa])

  // Adicionar nova empresa
  const addEmpresa = useCallback(async (empresaData: Omit<Empresa, 'id'>) => {
    try {
      setError(null)
      
      const dbData = empresaToDatabase(empresaData)
      const { data, error } = await supabase
        .from('empresas')
        .insert([dbData])
        .select()
        .single()
      
      if (error) throw error
      
      const newEmpresa = databaseToEmpresa(data)
      setEmpresas(prev => [newEmpresa, ...prev])
      
      return newEmpresa
    } catch (err) {
      console.error('Erro ao adicionar empresa:', err)
      setError('Erro ao adicionar empresa')
      throw err
    }
  }, [empresaToDatabase, databaseToEmpresa])

  // Atualizar empresa existente
  const updateEmpresa = useCallback(async (id: string, empresaData: Partial<Omit<Empresa, 'id'>>) => {
    try {
      setError(null)
      
      const updateData: Partial<DatabaseEmpresa> = {}
      
      if (empresaData.clienteId) updateData.cliente_id = empresaData.clienteId
      if (empresaData.razaoSocial) updateData.razao_social = empresaData.razaoSocial
      if (empresaData.nomeFantasia !== undefined) updateData.nome_fantasia = empresaData.nomeFantasia
      if (empresaData.cnpj !== undefined) updateData.cnpj = empresaData.cnpj
      if (empresaData.atividadePrincipal) updateData.atividade_principal = empresaData.atividadePrincipal
      if (empresaData.endereco) updateData.endereco = empresaData.endereco
      if (empresaData.telefone !== undefined) updateData.telefone = empresaData.telefone
      if (empresaData.email !== undefined) updateData.email = empresaData.email
      if (empresaData.capitalSocial !== undefined) updateData.capital_social = empresaData.capitalSocial
      if (empresaData.tipoEmpresa) updateData.tipo_empresa = empresaData.tipoEmpresa
      if (empresaData.status) updateData.status = empresaData.status
      if (empresaData.dataAbertura) updateData.data_abertura = empresaData.dataAbertura.toISOString().split('T')[0]
      if (empresaData.responsavelAbertura) updateData.responsavel_abertura = empresaData.responsavelAbertura
      if (empresaData.observacoes !== undefined) updateData.observacoes = empresaData.observacoes
      
      const { data, error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedEmpresa = databaseToEmpresa(data)
      setEmpresas(prev => prev.map(empresa => empresa.id === id ? updatedEmpresa : empresa))
      
      return updatedEmpresa
    } catch (err) {
      console.error('Erro ao atualizar empresa:', err)
      setError('Erro ao atualizar empresa')
      throw err
    }
  }, [databaseToEmpresa])

  // Deletar empresa
  const deleteEmpresa = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setEmpresas(prev => prev.filter(empresa => empresa.id !== id))
    } catch (err) {
      console.error('Erro ao deletar empresa:', err)
      setError('Erro ao deletar empresa')
      throw err
    }
  }, [])

  // Carregar dados na inicialização
  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  return {
    empresas,
    loading,
    error,
    addEmpresa,
    updateEmpresa,
    deleteEmpresa,
    refreshEmpresas: loadEmpresas
  }
}