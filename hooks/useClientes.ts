import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    return {
      nome: cliente.nome,
      email: cliente.email,
      cpf_cnpj: cliente.cpfCnpj,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      tipo_cliente: cliente.tipoCliente,
      status: cliente.status,
      data_cadastro: cliente.dataCadastro.toISOString().split('T')[0],
      observacoes: cliente.observacoes
    }
  }, [])

  // Carregar clientes do banco
  const loadClientes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedClientes = data.map(databaseToCliente)
      setClientes(formattedClientes)
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
      setError('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [databaseToCliente])

  // Adicionar novo cliente
  const addCliente = useCallback(async (clienteData: Omit<Cliente, 'id'>) => {
    try {
      setError(null)
      
      const dbData = clienteToDatabase(clienteData)
      const { data, error } = await supabase
        .from('clientes')
        .insert([dbData])
        .select()
        .single()
      
      if (error) throw error
      
      const newCliente = databaseToCliente(data)
      setClientes(prev => [newCliente, ...prev])
      
      return newCliente
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
      
      const updateData: Partial<DatabaseCliente> = {}
      
      if (clienteData.nome) updateData.nome = clienteData.nome
      if (clienteData.email) updateData.email = clienteData.email
      if (clienteData.cpfCnpj) updateData.cpf_cnpj = clienteData.cpfCnpj
      if (clienteData.telefone !== undefined) updateData.telefone = clienteData.telefone
      if (clienteData.endereco !== undefined) updateData.endereco = clienteData.endereco
      if (clienteData.tipoCliente) updateData.tipo_cliente = clienteData.tipoCliente
      if (clienteData.status) updateData.status = clienteData.status
      if (clienteData.dataCadastro) updateData.data_cadastro = clienteData.dataCadastro.toISOString().split('T')[0]
      if (clienteData.observacoes !== undefined) updateData.observacoes = clienteData.observacoes
      
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

  // Deletar cliente
  const deleteCliente = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setClientes(prev => prev.filter(cliente => cliente.id !== id))
    } catch (err) {
      console.error('Erro ao deletar cliente:', err)
      setError('Erro ao deletar cliente')
      throw err
    }
  }, [])

  // Carregar dados na inicialização
  useEffect(() => {
    loadClientes()
  }, [loadClientes])

  return {
    clientes,
    loading,
    error,
    addCliente,
    updateCliente,
    deleteCliente,
    refreshClientes: loadClientes
  }
}