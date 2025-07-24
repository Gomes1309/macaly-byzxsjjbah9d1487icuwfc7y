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
  console.log('✨ useEmpresas hook INICIADO')
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  console.log('✨ useEmpresas hook - Estado inicial:', { empresas: empresas.length, loading, error })

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
      console.log('🔄 useEmpresas - INÍCIO da função loadEmpresas')
      setLoading(true)
      setError(null)
      console.log('🔄 useEmpresas - Iniciando carregamento de empresas...', new Date().toISOString())
      
      console.log('📡 useEmpresas - Chamando Supabase...')
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('📨 useEmpresas - Resposta Supabase recebida:', { data: data?.length, error })
      
      if (error) {
        console.error('❌ useEmpresas - Erro Supabase:', error)
        throw error
      }
      
      console.log('📊 useEmpresas - Dados brutos do Supabase:', data?.length, 'empresas')
      console.log('📋 useEmpresas - Empresas detalhadas:', data?.map(e => ({ id: e.id, razao_social: e.razao_social })))
      
      const formattedEmpresas = data?.map(databaseToEmpresa) || []
      setEmpresas(formattedEmpresas)
      console.log(`✅ useEmpresas - ${formattedEmpresas.length} empresas formatadas com sucesso:`, formattedEmpresas.map(e => ({ id: e.id, razaoSocial: e.razaoSocial })))
      
      // Force a re-render by updating a dummy state if needed
      setTimeout(() => {
        console.log('🔄 useEmpresas - Estado final após timeout:', formattedEmpresas.length, 'empresas')
      }, 100)
      
    } catch (err) {
      console.error('💥 useEmpresas - Erro ao carregar empresas:', err)
      // Em caso de erro, definir lista vazia para não quebrar a interface
      setEmpresas([])
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar empresas')
    } finally {
      setLoading(false)
      console.log('🏁 useEmpresas - Loading finalizado')
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

  // Deletar empresa com exclusão em cascata de todos os dados relacionados
  const deleteEmpresa = useCallback(async (id: string) => {
    try {
      setError(null)
      console.log('Iniciando exclusão em cascata da empresa:', id)
      
      // 1. Buscar empresa para logs
      const empresaToDelete = empresas.find(e => e.id === id)
      if (empresaToDelete) {
        console.log('Excluindo empresa:', empresaToDelete.razaoSocial, empresaToDelete.cnpj)
      }
      
      // 2. Remover obrigações relacionadas à empresa
      console.log('Removendo obrigações da empresa...')
      const { error: obrigacoesError } = await supabase
        .from('obrigacoes')
        .delete()
        .eq('empresa_id', id)
      
      if (obrigacoesError) {
        console.error('Erro ao remover obrigações:', obrigacoesError)
        // Não falhar a operação, apenas logar
      }
      
      // 3. Remover documentos relacionados à empresa (campo empresaId)
      console.log('Removendo documentos específicos da empresa...')
      const { error: documentosError } = await supabase
        .from('documentos')
        .delete()
        .eq('empresa_id', id)
      
      if (documentosError) {
        console.error('Erro ao remover documentos da empresa:', documentosError)
        // Não falhar a operação, apenas logar
      }
      
      // 4. Limpar dados do portal do cliente (localStorage)
      console.log('Limpando dados do portal do cliente...')
      try {
        const portalResponsaveis = localStorage.getItem('portal_responsaveis')
        if (portalResponsaveis) {
          const responsaveisData = JSON.parse(portalResponsaveis)
          const updatedResponsaveis = responsaveisData.map((resp: any) => ({
            ...resp,
            empresas: (resp.empresas || []).filter((emp: any) => emp.id !== id),
            empresasIds: (resp.empresasIds || []).filter((empId: string) => empId !== id)
          })).filter((resp: any) => resp.empresas.length > 0) // Remove responsáveis sem empresas
          
          localStorage.setItem('portal_responsaveis', JSON.stringify(updatedResponsaveis))
          console.log('Dados do portal atualizados')
        }
      } catch (localStorageError) {
        console.error('Erro ao limpar dados do portal:', localStorageError)
      }
      
      // 5. Finalmente, remover a empresa
      console.log('Removendo empresa da tabela empresas...')
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // 6. Atualizar estado local
      setEmpresas(prev => prev.filter(empresa => empresa.id !== id))
      
      console.log('✅ Exclusão em cascata da empresa concluída com sucesso!')
      console.log('Dados removidos:')
      console.log('- Empresa principal')
      console.log('- Obrigações relacionadas')
      console.log('- Documentos específicos da empresa')
      console.log('- Dados do portal do cliente')
      
    } catch (err) {
      console.error('Erro ao deletar empresa:', err)
      setError('Erro ao deletar empresa')
      throw err
    }
  }, [empresas])

  // Carregar dados na inicialização
  useEffect(() => {
    console.log('🚀 useEmpresas - useEffect triggered')
    console.log('🚀 useEmpresas - loadEmpresas function?', typeof loadEmpresas)
    
    const init = async () => {
      console.log('⚡ useEmpresas - Iniciando carregamento imediato...')
      await loadEmpresas()
      console.log('⚡ useEmpresas - Carregamento concluído')
    }
    
    init()
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