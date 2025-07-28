import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { differenceInDays } from 'date-fns'

export interface Alvara {
  id: string
  clienteId?: string
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
  cliente_id?: string
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
      clienteId: dbAlvara.cliente_id,
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

  const loadAlvaras = async () => {
    console.log('useAlvaras: Carregando alvarás...')
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('alvaras')
        .select('*')
        .order('data_vencimento', { ascending: true })

      if (error) {
        console.error('useAlvaras: Erro do Supabase:', error)
        setError(`Erro ao carregar alvarás: ${error.message}`)
        setAlvaras([])
      } else {
        console.log('useAlvaras: ✅ Alvarás carregados:', data?.length || 0)
        
        // Converter dados do formato do banco para formato da aplicação
        const alvarasFormatted = (data || []).map((item: any) => databaseToAlvara(item))
        setAlvaras(alvarasFormatted)
      }
    } catch (error: any) {
      console.error('useAlvaras: Erro geral:', error)
      setError(`Erro ao carregar alvarás: ${error.message || error}`)
      setAlvaras([])
    } finally {
      setLoading(false)
    }
  }

  // Adicionar novo alvará
  const addAlvara = useCallback(async (alvaraData: Omit<Alvara, 'id' | 'status'>) => {
    try {
      console.log('useAlvaras: Adicionando novo alvará:', alvaraData)
      setError(null)
      
      const dbData = {
        cliente_id: alvaraData.clienteId,
        empresa: alvaraData.empresa,
        cnpj: alvaraData.cnpj,
        tipo: alvaraData.tipo,
        numero_protocolo: alvaraData.numeroProtocolo,
        data_emissao: alvaraData.dataEmissao.toISOString().split('T')[0],
        data_vencimento: alvaraData.dataVencimento.toISOString().split('T')[0],
        observacoes: alvaraData.observacoes,
        responsavel: alvaraData.responsavel,
        contato: alvaraData.contato
      }
      
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
  }, [databaseToAlvara])

  // Atualizar alvará existente
  const updateAlvara = useCallback(async (id: string, alvaraData: Partial<Omit<Alvara, 'id' | 'status'>>) => {
    try {
      console.log('useAlvaras: Atualizando alvará:', id, alvaraData)
      setError(null)
      
      const updateData: any = {}
      
      if (alvaraData.clienteId !== undefined) updateData.cliente_id = alvaraData.clienteId
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

  // Função para carregar alvarás por cliente
  const loadAlvarasByCliente = useCallback(async (clienteId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: supabaseError } = await supabase
        .from('alvaras')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
      
      if (supabaseError) {
        console.error('useAlvaras: Erro ao carregar alvarás por cliente:', supabaseError)
        throw supabaseError
      }
      
      const alvarasData = data || []
      const formattedAlvaras = alvarasData.map(databaseToAlvara)
      setAlvaras(formattedAlvaras)
      console.log(`✅ ${formattedAlvaras.length} alvarás carregados para cliente ${clienteId}`)
    } catch (err) {
      console.error('useAlvaras: Erro ao carregar alvarás por cliente:', err)
      setError('Erro ao carregar alvarás por cliente')
    } finally {
      setLoading(false)
    }
  }, [databaseToAlvara])

  // Carregar dados na inicialização
  useEffect(() => {
    console.log('useAlvaras: Hook iniciado')
    loadAlvaras()
  }, [])

  return {
    alvaras,
    loading,
    error,
    addAlvara,
    updateAlvara,
    deleteAlvara,
    loadAlvarasByCliente,
    refreshAlvaras: loadAlvaras
  }
}