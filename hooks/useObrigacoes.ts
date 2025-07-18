import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { differenceInDays } from 'date-fns'

export interface Obrigacao {
  id: string
  empresaId: string
  nomeObrigacao: string
  descricao?: string
  tipoObrigacao: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'eventual'
  dataVencimento: Date
  status: 'pendente' | 'cumprida' | 'atrasada'
  responsavel: string
  dataCumprimento?: Date
  observacoes?: string
}

export interface DatabaseObrigacao {
  id: string
  empresa_id: string
  nome_obrigacao: string
  descricao?: string
  tipo_obrigacao: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'eventual'
  data_vencimento: string
  status: 'pendente' | 'cumprida' | 'atrasada'
  responsavel: string
  data_cumprimento?: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export function useObrigacoes() {
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Converter dados do banco para formato da aplicação
  const databaseToObrigacao = useCallback((dbObrigacao: DatabaseObrigacao): Obrigacao => {
    const dataVencimento = new Date(dbObrigacao.data_vencimento)
    
    // Calcular status baseado na data de vencimento e cumprimento
    let status: Obrigacao['status'] = dbObrigacao.status
    
    if (status === 'pendente') {
      const today = new Date()
      const daysToExpire = differenceInDays(dataVencimento, today)
      
      if (daysToExpire < 0) {
        status = 'atrasada'
      }
    }
    
    return {
      id: dbObrigacao.id,
      empresaId: dbObrigacao.empresa_id,
      nomeObrigacao: dbObrigacao.nome_obrigacao,
      descricao: dbObrigacao.descricao,
      tipoObrigacao: dbObrigacao.tipo_obrigacao,
      dataVencimento,
      status,
      responsavel: dbObrigacao.responsavel,
      dataCumprimento: dbObrigacao.data_cumprimento ? new Date(dbObrigacao.data_cumprimento) : undefined,
      observacoes: dbObrigacao.observacoes
    }
  }, [])

  // Converter dados da aplicação para formato do banco
  const obrigacaoToDatabase = useCallback((obrigacao: Omit<Obrigacao, 'id'>): Omit<DatabaseObrigacao, 'id' | 'created_at' | 'updated_at'> => {
    return {
      empresa_id: obrigacao.empresaId,
      nome_obrigacao: obrigacao.nomeObrigacao,
      descricao: obrigacao.descricao,
      tipo_obrigacao: obrigacao.tipoObrigacao,
      data_vencimento: obrigacao.dataVencimento.toISOString().split('T')[0],
      status: obrigacao.status,
      responsavel: obrigacao.responsavel,
      data_cumprimento: obrigacao.dataCumprimento?.toISOString().split('T')[0],
      observacoes: obrigacao.observacoes
    }
  }, [])

  // Carregar obrigações do banco
  const loadObrigacoes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('obrigacoes')
        .select('*')
        .order('data_vencimento', { ascending: true })
      
      if (error) throw error
      
      const formattedObrigacoes = data.map(databaseToObrigacao)
      setObrigacoes(formattedObrigacoes)
    } catch (err) {
      console.error('Erro ao carregar obrigações:', err)
      setError('Erro ao carregar obrigações')
    } finally {
      setLoading(false)
    }
  }, [databaseToObrigacao])

  // Adicionar nova obrigação
  const addObrigacao = useCallback(async (obrigacaoData: Omit<Obrigacao, 'id'>) => {
    try {
      setError(null)
      
      const dbData = obrigacaoToDatabase(obrigacaoData)
      const { data, error } = await supabase
        .from('obrigacoes')
        .insert([dbData])
        .select()
        .single()
      
      if (error) throw error
      
      const newObrigacao = databaseToObrigacao(data)
      setObrigacoes(prev => [...prev, newObrigacao].sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime()))
      
      return newObrigacao
    } catch (err) {
      console.error('Erro ao adicionar obrigação:', err)
      setError('Erro ao adicionar obrigação')
      throw err
    }
  }, [obrigacaoToDatabase, databaseToObrigacao])

  // Atualizar obrigação existente
  const updateObrigacao = useCallback(async (id: string, obrigacaoData: Partial<Omit<Obrigacao, 'id'>>) => {
    try {
      setError(null)
      
      const updateData: Partial<DatabaseObrigacao> = {}
      
      if (obrigacaoData.empresaId) updateData.empresa_id = obrigacaoData.empresaId
      if (obrigacaoData.nomeObrigacao) updateData.nome_obrigacao = obrigacaoData.nomeObrigacao
      if (obrigacaoData.descricao !== undefined) updateData.descricao = obrigacaoData.descricao
      if (obrigacaoData.tipoObrigacao) updateData.tipo_obrigacao = obrigacaoData.tipoObrigacao
      if (obrigacaoData.dataVencimento) updateData.data_vencimento = obrigacaoData.dataVencimento.toISOString().split('T')[0]
      if (obrigacaoData.status) updateData.status = obrigacaoData.status
      if (obrigacaoData.responsavel) updateData.responsavel = obrigacaoData.responsavel
      if (obrigacaoData.dataCumprimento) updateData.data_cumprimento = obrigacaoData.dataCumprimento.toISOString().split('T')[0]
      if (obrigacaoData.observacoes !== undefined) updateData.observacoes = obrigacaoData.observacoes
      
      const { data, error } = await supabase
        .from('obrigacoes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedObrigacao = databaseToObrigacao(data)
      setObrigacoes(prev => prev.map(obrigacao => obrigacao.id === id ? updatedObrigacao : obrigacao))
      
      return updatedObrigacao
    } catch (err) {
      console.error('Erro ao atualizar obrigação:', err)
      setError('Erro ao atualizar obrigação')
      throw err
    }
  }, [databaseToObrigacao])

  // Deletar obrigação
  const deleteObrigacao = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('obrigacoes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setObrigacoes(prev => prev.filter(obrigacao => obrigacao.id !== id))
    } catch (err) {
      console.error('Erro ao deletar obrigação:', err)
      setError('Erro ao deletar obrigação')
      throw err
    }
  }, [])

  // Marcar obrigação como cumprida
  const marcarComoCumprida = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const { data, error } = await supabase
        .from('obrigacoes')
        .update({ 
          status: 'cumprida',
          data_cumprimento: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedObrigacao = databaseToObrigacao(data)
      setObrigacoes(prev => prev.map(obrigacao => obrigacao.id === id ? updatedObrigacao : obrigacao))
      
      return updatedObrigacao
    } catch (err) {
      console.error('Erro ao marcar obrigação como cumprida:', err)
      setError('Erro ao marcar obrigação como cumprida')
      throw err
    }
  }, [databaseToObrigacao])

  // Carregar obrigações por empresa
  const loadObrigacoesByEmpresa = useCallback(async (empresaId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('obrigacoes')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_vencimento', { ascending: true })
      
      if (error) throw error
      
      const formattedObrigacoes = data.map(databaseToObrigacao)
      setObrigacoes(formattedObrigacoes)
    } catch (err) {
      console.error('Erro ao carregar obrigações por empresa:', err)
      setError('Erro ao carregar obrigações por empresa')
    } finally {
      setLoading(false)
    }
  }, [databaseToObrigacao])

  // Carregar dados na inicialização
  useEffect(() => {
    loadObrigacoes()
  }, [loadObrigacoes])

  return {
    obrigacoes,
    loading,
    error,
    addObrigacao,
    updateObrigacao,
    deleteObrigacao,
    marcarComoCumprida,
    loadObrigacoesByEmpresa,
    refreshObrigacoes: loadObrigacoes
  }
}