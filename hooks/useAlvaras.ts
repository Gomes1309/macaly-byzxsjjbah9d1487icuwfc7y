import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { differenceInDays } from 'date-fns'

export interface Alvara {
  id: string
  empresa: string
  cnpj: string
  tipo: 'vigilancia_sanitaria' | 'bombeiro' | 'municipal'
  numeroProtocolo: string
  dataEmissao: Date
  dataVencimento: Date
  status: 'em_dia' | 'vencendo' | 'vencido'
  observacoes?: string
  responsavel: string
  contato: string
}

interface DatabaseAlvara {
  id: string
  empresa: string
  cnpj: string
  tipo: 'vigilancia_sanitaria' | 'bombeiro' | 'municipal'
  numero_protocolo: string
  data_emissao: string
  data_vencimento: string
  observacoes?: string
  responsavel: string
  contato: string
  created_at?: string
  updated_at?: string
}

export function useAlvaras() {
  const [alvaras, setAlvaras] = useState<Alvara[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('useAlvaras: Hook iniciado')

  // Converter dados do banco para formato da aplicação
  const databaseToAlvara = useCallback((dbAlvara: DatabaseAlvara): Alvara => {
    const dataEmissao = new Date(dbAlvara.data_emissao)
    const dataVencimento = new Date(dbAlvara.data_vencimento)
    
    // Calcular status baseado na data de vencimento
    const today = new Date()
    const daysToExpire = differenceInDays(dataVencimento, today)
    
    let status: Alvara['status']
    if (daysToExpire < 0) {
      status = 'vencido'
    } else if (daysToExpire <= 30) {
      status = 'vencendo'
    } else {
      status = 'em_dia'
    }

    return {
      id: dbAlvara.id,
      empresa: dbAlvara.empresa,
      cnpj: dbAlvara.cnpj,
      tipo: dbAlvara.tipo,
      numeroProtocolo: dbAlvara.numero_protocolo,
      dataEmissao,
      dataVencimento,
      status,
      observacoes: dbAlvara.observacoes,
      responsavel: dbAlvara.responsavel,
      contato: dbAlvara.contato
    }
  }, [])

  // Converter dados da aplicação para formato do banco
  const alvaraToDatabase = useCallback((alvara: Omit<Alvara, 'id' | 'status'>): Omit<DatabaseAlvara, 'id' | 'created_at' | 'updated_at'> => {
    return {
      empresa: alvara.empresa,
      cnpj: alvara.cnpj,
      tipo: alvara.tipo,
      numero_protocolo: alvara.numeroProtocolo,
      data_emissao: alvara.dataEmissao.toISOString().split('T')[0],
      data_vencimento: alvara.dataVencimento.toISOString().split('T')[0],
      observacoes: alvara.observacoes,
      responsavel: alvara.responsavel,
      contato: alvara.contato
    }
  }, [])

  // Carregar alvarás do banco
  const loadAlvaras = useCallback(async () => {
    try {
      console.log('useAlvaras: Iniciando carregamento dos alvarás...')
      setLoading(true)
      setError(null)
      
      const { data, error: supabaseError } = await supabase
        .from('alvaras')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (supabaseError) {
        console.error('useAlvaras: Erro do Supabase:', supabaseError)
        throw supabaseError
      }

      console.log('useAlvaras: Dados carregados:', data)
      
      if (data) {
        const formattedAlvaras = data.map(databaseToAlvara)
        setAlvaras(formattedAlvaras)
        console.log('useAlvaras: Alvarás formatados:', formattedAlvaras)
      }
    } catch (err: any) {
      console.error('useAlvaras: Erro ao carregar alvarás:', err)
      setError(err.message || 'Erro ao carregar alvarás')
    } finally {
      setLoading(false)
    }
  }, [databaseToAlvara])

  // Adicionar novo alvará
  const addAlvara = useCallback(async (alvaraData: Omit<Alvara, 'id' | 'status'>) => {
    try {
      console.log('useAlvaras: Adicionando novo alvará:', alvaraData)
      setError(null)
      
      const dbData = alvaraToDatabase(alvaraData)
      console.log('useAlvaras: Dados para inserção:', dbData)
      
      const { data, error: supabaseError } = await supabase
        .from('alvaras')
        .insert([dbData])
        .select()
        .single()
      
      if (supabaseError) {
        console.error('useAlvaras: Erro ao inserir:', supabaseError)
        throw supabaseError
      }
      
      console.log('useAlvaras: Alvará inserido:', data)
      
      if (data) {
        const newAlvara = databaseToAlvara(data)
        setAlvaras(prev => [newAlvara, ...prev])
        console.log('useAlvaras: Alvará adicionado à lista:', newAlvara)
        return newAlvara
      }
    } catch (err: any) {
      console.error('useAlvaras: Erro ao adicionar alvará:', err)
      setError(err.message || 'Erro ao adicionar alvará')
      throw err
    }
  }, [alvaraToDatabase, databaseToAlvara])

  // Atualizar alvará existente
  const updateAlvara = useCallback(async (id: string, alvaraData: Partial<Omit<Alvara, 'id' | 'status'>>) => {
    try {
      console.log('useAlvaras: Atualizando alvará:', id, alvaraData)
      setError(null)
      
      const updateData: Partial<DatabaseAlvara> = {}
      
      if (alvaraData.empresa) updateData.empresa = alvaraData.empresa
      if (alvaraData.cnpj) updateData.cnpj = alvaraData.cnpj
      if (alvaraData.tipo) updateData.tipo = alvaraData.tipo
      if (alvaraData.numeroProtocolo) updateData.numero_protocolo = alvaraData.numeroProtocolo
      if (alvaraData.dataEmissao) updateData.data_emissao = alvaraData.dataEmissao.toISOString().split('T')[0]
      if (alvaraData.dataVencimento) updateData.data_vencimento = alvaraData.dataVencimento.toISOString().split('T')[0]
      if (alvaraData.observacoes !== undefined) updateData.observacoes = alvaraData.observacoes
      if (alvaraData.responsavel) updateData.responsavel = alvaraData.responsavel
      if (alvaraData.contato) updateData.contato = alvaraData.contato
      
      const { data, error: supabaseError } = await supabase
        .from('alvaras')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (supabaseError) {
        console.error('useAlvaras: Erro ao atualizar:', supabaseError)
        throw supabaseError
      }
      
      console.log('useAlvaras: Alvará atualizado:', data)
      
      if (data) {
        const updatedAlvara = databaseToAlvara(data)
        setAlvaras(prev => prev.map(alvara => alvara.id === id ? updatedAlvara : alvara))
        return updatedAlvara
      }
    } catch (err: any) {
      console.error('useAlvaras: Erro ao atualizar alvará:', err)
      setError(err.message || 'Erro ao atualizar alvará')
      throw err
    }
  }, [databaseToAlvara])

  // Deletar alvará
  const deleteAlvara = useCallback(async (id: string) => {
    try {
      console.log('useAlvaras: Deletando alvará:', id)
      setError(null)
      
      const { error: supabaseError } = await supabase
        .from('alvaras')
        .delete()
        .eq('id', id)
      
      if (supabaseError) {
        console.error('useAlvaras: Erro ao deletar:', supabaseError)
        throw supabaseError
      }
      
      console.log('useAlvaras: Alvará deletado com sucesso')
      setAlvaras(prev => prev.filter(alvara => alvara.id !== id))
    } catch (err: any) {
      console.error('useAlvaras: Erro ao deletar alvará:', err)
      setError(err.message || 'Erro ao deletar alvará')
      throw err
    }
  }, [])

  // Carregar dados na inicialização
  useEffect(() => {
    loadAlvaras()
  }, [loadAlvaras])

  return {
    alvaras,
    loading,
    error,
    addAlvara,
    updateAlvara,
    deleteAlvara,
    refreshAlvaras: loadAlvaras
  }
}