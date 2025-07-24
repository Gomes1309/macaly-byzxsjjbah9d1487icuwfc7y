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

  // Converter dados da aplicação para formato do banco
  const alvaraToDatabase = useCallback((alvara: Omit<Alvara, 'id' | 'status'>): Omit<DatabaseAlvara, 'id' | 'created_at' | 'updated_at'> => {
    return {
      cliente_id: alvara.clienteId,
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

  // Função para retry com exponential backoff
  const retryWithBackoff = useCallback(async (fn: () => Promise<any>, maxRetries = 3, initialDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        console.log(`useAlvaras: Tentativa ${attempt}/${maxRetries} falhou:`, error?.message || error)
        
        if (attempt === maxRetries) {
          throw error
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }, [])

  // Carregar alvarás do banco
  const loadAlvaras = useCallback(async () => {
    try {
      console.log('useAlvaras: Iniciando carregamento dos alvarás...')
      setLoading(true)
      setError(null)
      
      const result = await retryWithBackoff(async () => {
        const { data, error: supabaseError } = await supabase
          .from('alvaras')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (supabaseError) {
          console.error('useAlvaras: Erro do Supabase:', supabaseError)
          throw new Error(`Supabase Error: ${supabaseError.message}`)
        }
        
        return data
      })

      // Tratar tanto dados vazios quanto nulos como casos válidos
      const alvarasData = result || []
      console.log(`✅ ${alvarasData.length} alvarás carregados do Supabase`)
      
      const formattedAlvaras = alvarasData.map(databaseToAlvara)
      setAlvaras(formattedAlvaras)
      
      // Backup local
      localStorage.setItem('alvaras_backup', JSON.stringify(formattedAlvaras))
      
    } catch (err: any) {
      console.error('useAlvaras: Erro ao carregar alvarás:', {
        message: err?.message || 'Unknown error',
        details: err?.details || '',
        hint: err?.hint || '',
        code: err?.code || ''
      })
      
      // Tentar fallback para localStorage
      try {
        const backupData = localStorage.getItem('alvaras_backup')
        if (backupData) {
          const alvarasBackup = JSON.parse(backupData).map((alvara: any) => ({
            ...alvara,
            dataEmissao: new Date(alvara.dataEmissao),
            dataVencimento: new Date(alvara.dataVencimento)
          }))
          setAlvaras(alvarasBackup)
          console.log(`✅ ${alvarasBackup.length} alvarás carregados do backup local`)
          setError('Usando dados locais (problemas de conectividade)')
        } else {
          setAlvaras([])
          setError('Problemas de conectividade. Tentando reconectar...')
        }
      } catch (backupError) {
        setAlvaras([])
        setError('Erro ao carregar dados. Recarregue a página.')
      }
    } finally {
      setLoading(false)
    }
  }, [databaseToAlvara, retryWithBackoff])

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
      
      // Sync event removed - not implemented
    } catch (err: any) {
      console.error('useAlvaras: Erro ao deletar alvará:', err)
      setError(err.message || 'Erro ao deletar alvará')
      throw err
    }
  }, [])

  // Carregar dados na inicialização
  useEffect(() => {
    loadAlvaras()
    
    // Tentar reconectar automaticamente após 30 segundos se houver erro
    const retryInterval = setInterval(async () => {
      if (error && (error.includes('conectividade') || error.includes('reconectar'))) {
        console.log('Tentando reconexão automática para alvarás...')
        await loadAlvaras()
      }
    }, 30000)
    
    return () => clearInterval(retryInterval)
  }, [loadAlvaras, error])

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