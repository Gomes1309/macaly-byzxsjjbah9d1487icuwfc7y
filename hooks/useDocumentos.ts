'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSyncManager } from './useSyncManager'

export interface Cliente {
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
}

export interface Documento {
  id: string
  clienteId: string
  empresaId?: string
  nomeArquivo: string
  tipoDocumento: 'abertura' | 'alteracao' | 'fiscal' | 'contabil' | 'imposto_renda' | 'pessoal'
  categoria: string
  urlArquivo: string
  tamanhoArquivo?: number
  dataUpload: Date
  uploadedBy: string
  observacoes?: string
}

export interface DatabaseDocumento {
  id: string
  cliente_id: string
  empresa_id?: string
  nome_arquivo: string
  tipo_documento: 'abertura' | 'alteracao' | 'fiscal' | 'contabil' | 'imposto_renda' | 'pessoal'
  categoria: string
  url_arquivo: string
  tamanho_arquivo?: number
  data_upload: string
  uploaded_by: string
  observacoes?: string
  created_at: string
  updated_at: string
}

export function useDocumentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { emitSync, subscribe } = useSyncManager()

  // Converter dados do banco para formato da aplicação
  const databaseToDocumento = useCallback((dbDocumento: DatabaseDocumento): Documento => {
    return {
      id: dbDocumento.id,
      clienteId: dbDocumento.cliente_id,
      empresaId: dbDocumento.empresa_id,
      nomeArquivo: dbDocumento.nome_arquivo,
      tipoDocumento: dbDocumento.tipo_documento,
      categoria: dbDocumento.categoria,
      urlArquivo: dbDocumento.url_arquivo,
      tamanhoArquivo: dbDocumento.tamanho_arquivo,
      dataUpload: new Date(dbDocumento.data_upload),
      uploadedBy: dbDocumento.uploaded_by,
      observacoes: dbDocumento.observacoes
    }
  }, [])

  // Converter dados da aplicação para formato do banco
  const documentoToDatabase = useCallback((documento: Omit<Documento, 'id'>): Omit<DatabaseDocumento, 'id' | 'created_at' | 'updated_at'> => {
    return {
      cliente_id: documento.clienteId,
      empresa_id: documento.empresaId,
      nome_arquivo: documento.nomeArquivo,
      tipo_documento: documento.tipoDocumento,
      categoria: documento.categoria,
      url_arquivo: documento.urlArquivo,
      tamanho_arquivo: documento.tamanhoArquivo,
      data_upload: documento.dataUpload.toISOString().split('T')[0],
      uploaded_by: documento.uploadedBy,
      observacoes: documento.observacoes
    }
  }, [])

  // Função para enviar notificação por email
  const enviarNotificacaoEmail = useCallback(async (documento: Documento, clienteId: string) => {
    try {
      // Buscar dados do cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', clienteId)
        .single()
      
      if (clienteError || !cliente) {
        console.error('Erro ao buscar cliente:', clienteError)
        return
      }

      // Preparar dados para o email
      const emailData = {
        clienteNome: cliente.nome,
        clienteEmail: cliente.email,
        nomeDocumento: documento.nomeArquivo,
        tipoDocumento: documento.tipoDocumento,
        categoria: documento.categoria,
        dataUpload: documento.dataUpload.toLocaleDateString('pt-BR')
      }

      // Enviar notificação
      const response = await fetch('/api/notify-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar notificação por email')
      }

      console.log('Notificação por email enviada com sucesso para:', cliente.email)
    } catch (error) {
      console.error('Erro ao enviar notificação por email:', error)
      // Não falhar o upload por causa do email
    }
  }, [])

  // Carregar documentos do banco
  const loadDocumentos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedDocumentos = data.map(databaseToDocumento)
      setDocumentos(formattedDocumentos)
    } catch (err) {
      console.error('Erro ao carregar documentos:', err)
      setError('Erro ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }, [databaseToDocumento])

  // Adicionar novo documento
  const addDocumento = useCallback(async (documentoData: Omit<Documento, 'id'>) => {
    try {
      setError(null)
      
      const dbData = documentoToDatabase(documentoData)
      const { data, error } = await supabase
        .from('documentos')
        .insert([dbData])
        .select()
        .single()
      
      if (error) throw error
      
      const newDocumento = databaseToDocumento(data)
      setDocumentos(prev => [newDocumento, ...prev])
      
      // Enviar notificação por email
      await enviarNotificacaoEmail(newDocumento, documentoData.clienteId)
      
      return newDocumento
    } catch (err) {
      console.error('Erro ao adicionar documento:', err)
      setError('Erro ao adicionar documento')
      throw err
    }
  }, [documentoToDatabase, databaseToDocumento, enviarNotificacaoEmail])

  // Atualizar documento existente
  const updateDocumento = useCallback(async (id: string, documentoData: Partial<Omit<Documento, 'id'>>) => {
    try {
      setError(null)
      
      const updateData: Partial<DatabaseDocumento> = {}
      
      if (documentoData.clienteId) updateData.cliente_id = documentoData.clienteId
      if (documentoData.empresaId !== undefined) updateData.empresa_id = documentoData.empresaId
      if (documentoData.nomeArquivo) updateData.nome_arquivo = documentoData.nomeArquivo
      if (documentoData.tipoDocumento) updateData.tipo_documento = documentoData.tipoDocumento
      if (documentoData.categoria) updateData.categoria = documentoData.categoria
      if (documentoData.urlArquivo) updateData.url_arquivo = documentoData.urlArquivo
      if (documentoData.tamanhoArquivo !== undefined) updateData.tamanho_arquivo = documentoData.tamanhoArquivo
      if (documentoData.dataUpload) updateData.data_upload = documentoData.dataUpload.toISOString().split('T')[0]
      if (documentoData.uploadedBy) updateData.uploaded_by = documentoData.uploadedBy
      if (documentoData.observacoes !== undefined) updateData.observacoes = documentoData.observacoes
      
      const { data, error } = await supabase
        .from('documentos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedDocumento = databaseToDocumento(data)
      setDocumentos(prev => prev.map(documento => documento.id === id ? updatedDocumento : documento))
      
      return updatedDocumento
    } catch (err) {
      console.error('Erro ao atualizar documento:', err)
      setError('Erro ao atualizar documento')
      throw err
    }
  }, [databaseToDocumento])

  // Deletar documento
  const deleteDocumento = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setDocumentos(prev => prev.filter(documento => documento.id !== id))
      
      // Emit sync event
      emitSync({
        type: 'documentos_updated',
        action: 'delete',
        data: { id }
      })
    } catch (err) {
      console.error('Erro ao deletar documento:', err)
      setError('Erro ao deletar documento')
      throw err
    }
  }, [emitSync])

  // Carregar documentos por cliente
  const loadDocumentosByCliente = useCallback(async (clienteId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedDocumentos = data.map(databaseToDocumento)
      setDocumentos(formattedDocumentos)
    } catch (err) {
      console.error('Erro ao carregar documentos por cliente:', err)
      setError('Erro ao carregar documentos por cliente')
    } finally {
      setLoading(false)
    }
  }, [databaseToDocumento])

  // Carregar dados na inicialização
  useEffect(() => {
    loadDocumentos()
  }, [loadDocumentos])

  return {
    documentos,
    loading,
    error,
    addDocumento,
    updateDocumento,
    deleteDocumento,
    loadDocumentosByCliente,
    refreshDocumentos: loadDocumentos
  }
}