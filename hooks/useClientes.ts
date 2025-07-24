import { useState, useEffect, useCallback } from 'react'
import { supabase, createResponsavelAccount, notifyNewAccount } from '@/lib/supabase'
import { useSyncManager } from './useSyncManager'

export interface Cliente {
  id: string
  nome: string
  email: string
  cpfCnpj: string
  telefone?: string
  endereco?: string
  tipoCliente: 'pessoa_fisica' | 'pessoa_juridica'
  status: 'ativo' | 'inativo' | 'suspenso'
  dataCadastro: Date
  observacoes?: string
  // Additional optional properties for UI enhancements
  plano?: string
  avatar?: string
  tags?: string[]
  totalDocumentos?: number
}

export interface DatabaseCliente {
  id: string
  nome: string
  email: string
  cpf_cnpj: string
  telefone?: string
  endereco?: string
  tipo_cliente: 'pessoa_fisica' | 'pessoa_juridica'
  status: 'ativo' | 'inativo' | 'suspenso'
  data_cadastro: string
  observacoes?: string
  created_at: string
  updated_at: string
}

// Type for the hook return value
export type ClienteHook = ReturnType<typeof useClientes>

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { emitSync, subscribe } = useSyncManager()

  // Converter dados do banco para formato da aplicação
  const databaseToCliente = useCallback((dbCliente: DatabaseCliente): Cliente => {
    return {
      id: dbCliente.id,
      nome: dbCliente.nome,
      email: dbCliente.email,
      cpfCnpj: dbCliente.cpf_cnpj,
      telefone: dbCliente.telefone,
      endereco: dbCliente.endereco,
      tipoCliente: dbCliente.tipo_cliente,
      status: dbCliente.status,
      dataCadastro: new Date(dbCliente.data_cadastro),
      observacoes: dbCliente.observacoes
    }
  }, [])

  // Converter dados da aplicação para formato do banco
  const clienteToDatabase = useCallback((cliente: Omit<Cliente, 'id'>): Omit<DatabaseCliente, 'id' | 'created_at' | 'updated_at'> => {
    // Garantir que os valores estão corretos para o banco
    const tipoCliente = cliente.tipoCliente === 'pessoa_fisica' ? 'pessoa_fisica' : 'pessoa_juridica'
    const status = cliente.status || 'ativo'

    console.log('Convertendo cliente para banco:', {
      original: cliente,
      converted: {
        tipo_cliente: tipoCliente,
        status: status
      }
    })

    return {
      nome: cliente.nome,
      email: cliente.email,
      cpf_cnpj: cliente.cpfCnpj,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      tipo_cliente: tipoCliente,
      status: status,
      data_cadastro: cliente.dataCadastro.toISOString().split('T')[0],
      observacoes: cliente.observacoes
    }
  }, [])

  // Função para retry com exponential backoff
  const retryWithBackoff = useCallback(async (fn: () => Promise<any>, maxRetries = 3, initialDelay = 1000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error: any) {
        console.log(`Tentativa ${attempt}/${maxRetries} falhou:`, error?.message || error)
        
        if (attempt === maxRetries) {
          throw error
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }, [])

  // Carregar clientes do banco com fallback para localStorage
  const loadClientes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Carregando clientes do Supabase...')
      
      const result = await retryWithBackoff(async () => {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Erro do Supabase:', error)
          throw new Error(`Supabase Error: ${error.message}`)
        }
        
        return data
      })
      
      // Tratar tanto dados vazios quanto nulos como casos válidos
      const clientesData = result || []
      console.log(`✅ ${clientesData.length} clientes carregados do Supabase`)
      
      const formattedClientes = clientesData.map(databaseToCliente)
      setClientes(formattedClientes)
      
      // Salvar no localStorage como backup
      localStorage.setItem('clientes_backup', JSON.stringify(formattedClientes))
      
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', {
        message: err?.message || 'Unknown error',
        details: err?.details || '',
        hint: err?.hint || '',
        code: err?.code || ''
      })
      
      // Tentar fallback para localStorage
      try {
        console.log('Tentando carregar clientes do backup local...')
        const backupData = localStorage.getItem('clientes_backup')
        
        if (backupData) {
          const clientesBackup = JSON.parse(backupData).map((cliente: any) => ({
            ...cliente,
            dataCadastro: new Date(cliente.dataCadastro)
          }))
          setClientes(clientesBackup)
          console.log(`✅ ${clientesBackup.length} clientes carregados do backup local`)
          setError('Usando dados locais (problemas de conectividade)')
        } else {
          console.log('Nenhum backup local encontrado')
          setClientes([])
          setError('Problemas de conectividade. Tentando reconectar...')
        }
      } catch (backupError) {
        console.error('Erro ao carregar backup local:', backupError)
        setClientes([])
        setError('Erro ao carregar dados. Recarregue a página.')
      }
    } finally {
      setLoading(false)
    }
  }, [databaseToCliente, retryWithBackoff])

  // Adicionar novo cliente
  const addCliente = useCallback(async (clienteData: Omit<Cliente, 'id'>, options?: { 
    createAccount?: boolean 
    cargo?: string 
    notifyUser?: boolean 
  }) => {
    try {
      setError(null)
      
      console.log('Iniciando criação de cliente:', clienteData, options)
      
      const dbData = clienteToDatabase(clienteData)
      const { data, error } = await supabase
        .from('clientes')
        .insert([dbData])
        .select()
        .single()
      
      if (error) throw error
      
      const newCliente = databaseToCliente(data)
      setClientes(prev => [newCliente, ...prev])
      
      console.log('Cliente criado com sucesso:', newCliente)
      
      // Criar conta de responsável automaticamente se solicitado
      if (options?.createAccount) {
        try {
          console.log('Criando conta de responsável automática...')
          
          const accountResult = await createResponsavelAccount({
            nome: clienteData.nome,
            email: clienteData.email,
            cpfCnpj: clienteData.cpfCnpj,
            telefone: clienteData.telefone,
            clienteId: newCliente.id,
            cargo: options.cargo || 'Proprietário'
          })
          
          console.log('Conta de responsável criada:', accountResult)
          
          // Notificar usuário se solicitado
          if (options?.notifyUser) {
            await notifyNewAccount(clienteData.email, accountResult.senhaTemporaria, 'cliente')
          }
          
          return {
            cliente: newCliente,
            account: accountResult,
            message: accountResult.message
          }
          
        } catch (accountError) {
          console.error('Erro ao criar conta de responsável:', accountError)
          // Cliente foi criado, mas conta não. Não falhar a operação principal.
          return {
            cliente: newCliente,
            account: null,
            message: 'Cliente criado, mas houve erro ao criar conta de acesso.',
            error: accountError
          }
        }
      }
      
      return {
        cliente: newCliente,
        account: null,
        message: 'Cliente criado com sucesso!'
      }
      
    } catch (err) {
      console.error('Erro ao adicionar cliente:', err)
      setError('Erro ao adicionar cliente')
      throw err
    }
  }, [clienteToDatabase, databaseToCliente])

  // Atualizar cliente existente
  const updateCliente = useCallback(async (id: string, clienteData: Partial<Omit<Cliente, 'id'>>) => {
    try {
      setError(null)
      
      // Construir objeto de atualização sem duplicações
      const updateData: Record<string, any> = {}
      
      if (clienteData.nome) updateData.nome = clienteData.nome
      if (clienteData.email) updateData.email = clienteData.email
      if (clienteData.cpfCnpj) updateData.cpf_cnpj = clienteData.cpfCnpj
      if (clienteData.telefone !== undefined) updateData.telefone = clienteData.telefone
      if (clienteData.endereco !== undefined) updateData.endereco = clienteData.endereco
      if (clienteData.tipoCliente) {
        // Garantir que o valor está correto para o banco
        updateData.tipo_cliente = clienteData.tipoCliente === 'pessoa_fisica' ? 'pessoa_fisica' : 'pessoa_juridica'
      }
      if (clienteData.status) {
        // Garantir que o valor está correto para o banco
        updateData.status = clienteData.status
      }
      if (clienteData.dataCadastro) updateData.data_cadastro = clienteData.dataCadastro.toISOString().split('T')[0]
      if (clienteData.observacoes !== undefined) updateData.observacoes = clienteData.observacoes
      
      console.log('Atualizando cliente:', id, updateData)
      
      const { data, error } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedCliente = databaseToCliente(data)
      setClientes(prev => prev.map(cliente => cliente.id === id ? updatedCliente : cliente))
      
      return updatedCliente
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err)
      setError('Erro ao atualizar cliente')
      throw err
    }
  }, [databaseToCliente])

  // Deletar cliente com exclusão em cascata de todos os dados relacionados
  const deleteCliente = useCallback(async (id: string) => {
    try {
      setError(null)
      console.log('Iniciando exclusão em cascata do cliente:', id)
      
      // 1. Buscar cliente para logs
      const clienteToDelete = clientes.find(c => c.id === id)
      if (clienteToDelete) {
        console.log('Excluindo cliente:', clienteToDelete.nome, clienteToDelete.cpfCnpj)
      }
      
      // 2. Remover documentos relacionados ao cliente
      console.log('Removendo documentos do cliente...')
      const { error: documentosError } = await supabase
        .from('documentos')
        .delete()
        .eq('cliente_id', id)
      
      if (documentosError) {
        console.error('Erro ao remover documentos:', documentosError)
        // Não falhar a operação, apenas logar
      }
      
      // 3. Remover alvarás relacionados ao cliente
      console.log('Removendo alvarás do cliente...')
      const { error: alvarasError } = await supabase
        .from('alvaras')
        .delete()
        .eq('cliente_id', id)
      
      if (alvarasError) {
        console.error('Erro ao remover alvarás:', alvarasError)
        // Não falhar a operação, apenas logar
      }
      
      // 4. Buscar e remover empresas relacionadas ao cliente
      console.log('Buscando empresas do cliente...')
      const { data: empresas, error: empresasSelectError } = await supabase
        .from('empresas')
        .select('id')
        .eq('cliente_id', id)
      
      if (empresasSelectError) {
        console.error('Erro ao buscar empresas:', empresasSelectError)
      } else if (empresas && empresas.length > 0) {
        const empresaIds = empresas.map(e => e.id)
        console.log('Empresas encontradas:', empresaIds)
        
        // 5. Remover obrigações relacionadas às empresas
        console.log('Removendo obrigações das empresas...')
        const { error: obrigacoesError } = await supabase
          .from('obrigacoes')
          .delete()
          .in('empresa_id', empresaIds)
        
        if (obrigacoesError) {
          console.error('Erro ao remover obrigações:', obrigacoesError)
        }
        
        // 6. Remover as empresas
        console.log('Removendo empresas...')
        const { error: deleteEmpresasError } = await supabase
          .from('empresas')
          .delete()
          .eq('cliente_id', id)
        
        if (deleteEmpresasError) {
          console.error('Erro ao remover empresas:', deleteEmpresasError)
        }
      }
      
      // 7. Remover responsáveis vinculados ao cliente
      console.log('Removendo responsáveis do cliente...')
      const { error: responsaveisError } = await supabase
        .from('responsavel_cliente')
        .delete()
        .eq('cliente_id', id)
      
      if (responsaveisError) {
        console.error('Erro ao remover responsáveis:', responsaveisError)
      }
      
      // 8. Limpar dados do portal do cliente (localStorage)
      console.log('Limpando dados do portal do cliente...')
      try {
        const portalResponsaveis = localStorage.getItem('portal_responsaveis')
        if (portalResponsaveis) {
          const responsaveisData = JSON.parse(portalResponsaveis)
          const updatedResponsaveis = responsaveisData.map((resp: any) => ({
            ...resp,
            empresas: (resp.empresas || []).filter((emp: any) => 
              emp.id !== id && !empresas?.map(e => e.id).includes(emp.id)
            ),
            empresasIds: (resp.empresasIds || []).filter((empId: string) => 
              empId !== id && !empresas?.map(e => e.id).includes(empId)
            )
          })).filter((resp: any) => resp.empresas.length > 0) // Remove responsáveis sem empresas
          
          localStorage.setItem('portal_responsaveis', JSON.stringify(updatedResponsaveis))
          console.log('Dados do portal atualizados')
        }
      } catch (localStorageError) {
        console.error('Erro ao limpar dados do portal:', localStorageError)
      }
      
      // 9. Finalmente, remover o cliente
      console.log('Removendo cliente da tabela clientes...')
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // 10. Atualizar estado local
      setClientes(prev => prev.filter(cliente => cliente.id !== id))
      
      // 11. NOVO: Emitir evento de sincronização para atualizar todo o sistema
      emitSync({
        type: 'clientes_updated', 
        action: 'delete',
        data: { id, cliente: clienteToDelete }
      })
      
      // 12. NOVO: Forçar limpeza de todos os caches relacionados
      localStorage.removeItem('clientes_backup')
      localStorage.removeItem('documentos_backup')
      localStorage.removeItem('documentos_sistema')
      localStorage.removeItem('alvaras_backup')
      localStorage.removeItem('obrigacoes_backup')
      
      console.log('✅ Exclusão em cascata concluída com sucesso!')
      console.log('Dados removidos:')
      console.log('- Cliente principal')
      console.log('- Documentos relacionados')
      console.log('- Alvarás relacionados')
      console.log('- Empresas relacionadas')
      console.log('- Obrigações das empresas')
      console.log('- Responsáveis vinculados')
      console.log('- Dados do portal do cliente')
      console.log('- Caches locais limpos')
      
    } catch (err) {
      console.error('Erro ao deletar cliente:', err)
      setError('Erro ao deletar cliente')
      throw err
    }
  }, [clientes, emitSync])

  // Função para tentar reconectar automaticamente
  const retryLoadClientes = useCallback(async (maxRetries = 3, delay = 2000) => {
    console.log('Iniciando tentativas de reconexão...')
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/${maxRetries} de reconexão...`)
        
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        if (data) {
          console.log(`✅ Reconexão bem-sucedida na tentativa ${attempt}!`)
          const formattedClientes = data.map(databaseToCliente)
          setClientes(formattedClientes)
          setError(null)
          localStorage.setItem('clientes_backup', JSON.stringify(formattedClientes))
          return true
        }
      } catch (err) {
        console.log(`Tentativa ${attempt} falhou:`, err)
        
        if (attempt === maxRetries) {
          console.log('Todas as tentativas de reconexão falharam')
          return false
        }
        
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
    
    return false
  }, [databaseToCliente])

  // Carregar dados na inicialização
  useEffect(() => {
    loadClientes()
    
    // Tentar reconectar automaticamente após 30 segundos se houver erro
    const retryInterval = setInterval(async () => {
      if (error && (error.includes('conectividade') || error.includes('conexão'))) {
        console.log('Tentando reconexão automática para clientes...')
        await loadClientes()
      }
    }, 30000)
    
    return () => clearInterval(retryInterval)
  }, [loadClientes, error])

  return {
    clientes,
    loading,
    error,
    addCliente,
    updateCliente,
    deleteCliente,
    refreshClientes: loadClientes,
    retryConnection: () => retryLoadClientes(3, 1000)
  }
}