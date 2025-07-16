import { useState, useEffect, useCallback } from 'react'
import { AlvaraService, DatabaseAlvara } from '@/lib/supabase'
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
      setLoading(true)
      setError(null)
      
      const dbAlvaras = await AlvaraService.getAll()
      const formattedAlvaras = dbAlvaras.map(databaseToAlvara)
      
      setAlvaras(formattedAlvaras)
    } catch (err) {
      console.error('Erro ao carregar alvarás:', err)
      setError('Erro ao carregar alvarás')
    } finally {
      setLoading(false)
    }
  }, [databaseToAlvara])

  // Adicionar novo alvará
  const addAlvara = useCallback(async (alvaraData: Omit<Alvara, 'id' | 'status'>) => {
    try {
      setError(null)
      
      const dbData = alvaraToDatabase(alvaraData)
      const newDbAlvara = await AlvaraService.create(dbData)
      const newAlvara = databaseToAlvara(newDbAlvara)
      
      setAlvaras(prev => [newAlvara, ...prev])
      
      return newAlvara
    } catch (err) {
      console.error('Erro ao adicionar alvará:', err)
      setError('Erro ao adicionar alvará')
      throw err
    }
  }, [alvaraToDatabase, databaseToAlvara])

  // Atualizar alvará existente
  const updateAlvara = useCallback(async (id: string, alvaraData: Partial<Omit<Alvara, 'id' | 'status'>>) => {
    try {
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
      
      const updatedDbAlvara = await AlvaraService.update(id, updateData)
      const updatedAlvara = databaseToAlvara(updatedDbAlvara)
      
      setAlvaras(prev => prev.map(alvara => alvara.id === id ? updatedAlvara : alvara))
      
      return updatedAlvara
    } catch (err) {
      console.error('Erro ao atualizar alvará:', err)
      setError('Erro ao atualizar alvará')
      throw err
    }
  }, [databaseToAlvara])

  // Deletar alvará
  const deleteAlvara = useCallback(async (id: string) => {
    try {
      setError(null)
      
      await AlvaraService.delete(id)
      setAlvaras(prev => prev.filter(alvara => alvara.id !== id))
    } catch (err) {
      console.error('Erro ao deletar alvará:', err)
      setError('Erro ao deletar alvará')
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