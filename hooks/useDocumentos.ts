'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

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
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Converter dados do banco para formato da aplicação
  const databaseToDocumento = useCallback((dbDocumento: any): Documento => {
    try {
      return {
        id: dbDocumento.id,
        clienteId: dbDocumento.cliente_id || dbDocumento.clienteId,
        empresaId: undefined, // Não existe na tabela
        nomeArquivo: dbDocumento.nome_arquivo || dbDocumento.nomeArquivo,
        tipoDocumento: dbDocumento.tipo_documento || dbDocumento.tipoDocumento || 'pessoal',
        categoria: 'geral', // Padrão, pois não existe na tabela
        urlArquivo: dbDocumento.url_arquivo || dbDocumento.urlArquivo,
        tamanhoArquivo: dbDocumento.tamanho_arquivo || dbDocumento.tamanhoArquivo || 0,
        dataUpload: dbDocumento.data_upload ? new Date(dbDocumento.data_upload) : 
                   dbDocumento.dataUpload ? new Date(dbDocumento.dataUpload) : new Date(),
        uploadedBy: 'Sistema', // Padrão, pois não existe na tabela
        observacoes: dbDocumento.observacoes
      }
    } catch (error) {
      console.error('Erro ao converter documento do banco:', error, dbDocumento);
      // Retornar documento mínimo em caso de erro
      return {
        id: dbDocumento.id || 'unknown',
        clienteId: dbDocumento.cliente_id || dbDocumento.clienteId || '',
        empresaId: undefined,
        nomeArquivo: 'Documento com erro',
        tipoDocumento: 'pessoal',
        categoria: 'geral',
        urlArquivo: '',
        tamanhoArquivo: 0,
        dataUpload: new Date(),
        uploadedBy: 'Sistema',
        observacoes: 'Documento com erro de conversão'
      };
    }
  }, []);

  const loadDocumentos = async () => {
    console.log('useDocumentos: Carregando documentos...');
    setLoading(true);
    setError(null);

    try {
      // Primeiro, tentar a query básica sem joins para testar conectividade
      let query = supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false });

      // Tentar adicionar joins se as tabelas existirem
      try {
        const { data, error } = await supabase
          .from('documentos')
          .select(`
            *,
            clientes (
              nome,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(1); // Teste com apenas 1 registro

        if (!error) {
          // Se funcionou, usar a query completa (sem empresas por enquanto)
          query = supabase
            .from('documentos')
            .select(`
              *,
              clientes (
                nome,
                email
              )
            `)
            .order('created_at', { ascending: false });
        }
      } catch (joinError) {
        console.warn('useDocumentos: Join com clientes não funcionou, usando query simples:', joinError);
      }

      const { data, error } = await query;

      if (error) {
        console.error('useDocumentos: Erro do Supabase:', error);
        // Se o erro for sobre a tabela não existir, definir como vazio
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('useDocumentos: Tabela documentos não existe, retornando lista vazia');
          setDocumentos([]);
          setError(null); // Não considerar como erro
        } else {
          setError(`Erro ao carregar documentos: ${error.message}`);
          setDocumentos([]);
        }
      } else {
        console.log('useDocumentos: ✅ Documentos carregados:', data?.length || 0);
        
        // Converter dados do formato do banco para formato da aplicação
        const documentosFormatted = (data || []).map((item: any) => {
          try {
            return databaseToDocumento(item);
          } catch (convertError) {
            console.warn('Erro ao converter documento, usando valores padrão:', convertError, item);
            // Retornar documento com valores padrão em caso de erro
            return {
              id: item.id || 'unknown',
              clienteId: item.cliente_id || item.clienteId || '',
              empresaId: item.empresa_id || item.empresaId || undefined,
              nomeArquivo: item.nome_arquivo || item.nomeArquivo || 'Arquivo sem nome',
              tipoDocumento: (item.tipo_documento || item.tipoDocumento || 'pessoal') as any,
              categoria: item.categoria || 'geral',
              urlArquivo: item.url_arquivo || item.urlArquivo || '',
              tamanhoArquivo: item.tamanho_arquivo || item.tamanhoArquivo || 0,
              dataUpload: item.data_upload ? new Date(item.data_upload) : item.dataUpload ? new Date(item.dataUpload) : new Date(),
              uploadedBy: item.uploaded_by || item.uploadedBy || 'Sistema',
              observacoes: item.observacoes || undefined
            };
          }
        });
        
        setDocumentos(documentosFormatted);
      }
    } catch (error: any) {
      console.error('useDocumentos: Erro geral:', error);
      // Verificar se é erro de configuração do banco
      if (error.message && error.message.includes('does not exist')) {
        console.warn('useDocumentos: Banco não configurado adequadamente');
        setError('Banco de dados não configurado. Execute o setup do Supabase primeiro.');
        setDocumentos([]);
      } else {
        setError(`Erro ao carregar documentos: ${error.message || error}`);
        setDocumentos([]);
      }
    } finally {
      setLoading(false);
    }
  };

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
  }, []);

  // Adicionar novo documento
  const addDocumento = useCallback(async (documentoData: Omit<Documento, 'id'>) => {
    try {
      setError(null)
      
      // Dados compatíveis com a estrutura real da tabela
      let dbData: any = {
        cliente_id: documentoData.clienteId,
        nome_arquivo: documentoData.nomeArquivo,
        tipo_documento: documentoData.tipoDocumento,
        url_arquivo: documentoData.urlArquivo,
        data_upload: documentoData.dataUpload.toISOString().split('T')[0]
      };

      // Adicionar campos opcionais que existem na tabela
      if (documentoData.tamanhoArquivo) {
        dbData.tamanho_arquivo = documentoData.tamanhoArquivo;
      }
      
      if (documentoData.observacoes) {
        dbData.observacoes = documentoData.observacoes;
      }

      console.log('useDocumentos: Tentando inserir documento:', dbData);
      
      const insertResult = await supabase
        .from('documentos')
        .insert([dbData])
        .select()
        .single()
      
      if (insertResult.error) {
        console.error('useDocumentos: Erro no insert:', insertResult.error);
        throw insertResult.error;
      }
      
      const newDocumento = databaseToDocumento(insertResult.data)
      setDocumentos(prev => [newDocumento, ...prev])
      
      // Enviar notificação por email (opcional, não falhar se der erro)
      try {
        await enviarNotificacaoEmail(newDocumento, documentoData.clienteId)
      } catch (emailError) {
        console.warn('useDocumentos: Erro ao enviar email (não crítico):', emailError);
      }
      
      console.log('useDocumentos: ✅ Documento adicionado com sucesso:', newDocumento);
      return newDocumento
    } catch (err) {
      console.error('Erro ao adicionar documento:', err)
      setError('Erro ao adicionar documento')
      throw err
    }
  }, [databaseToDocumento, enviarNotificacaoEmail]);

  // Atualizar documento existente
  const updateDocumento = useCallback(async (id: string, documentoData: Partial<Omit<Documento, 'id'>>) => {
    try {
      setError(null)
      
      const updateData: any = {}
      
      if (documentoData.clienteId) updateData.cliente_id = documentoData.clienteId
      if (documentoData.empresaId !== undefined) updateData.empresa_id = documentoData.empresaId
      if (documentoData.nomeArquivo) updateData.nome_arquivo = documentoData.nomeArquivo
      if (documentoData.tipoDocumento) updateData.tipo_documento = documentoData.tipoDocumento
      // Só adicionar categoria se o campo existir
      if (documentoData.categoria) {
        try {
          updateData.categoria = documentoData.categoria
        } catch (e) {
          console.warn('Categoria não suportada, ignorando...')
        }
      }
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
      
      if (error) {
        // Tentar sem categoria se der erro
        if (error.code === 'PGRST204' && error.message.includes('categoria')) {
          console.warn('useDocumentos: Coluna categoria não existe no update, tentando sem ela...');
          const { categoria, ...updateDataSemCategoria } = updateData;
          
          const updateResult = await supabase
            .from('documentos')
            .update(updateDataSemCategoria)
            .eq('id', id)
            .select()
            .single()
            
          if (updateResult.error) throw updateResult.error;
          
          const updatedDocumento = databaseToDocumento(updateResult.data)
          setDocumentos(prev => prev.map(documento => documento.id === id ? updatedDocumento : documento))
          return updatedDocumento
        }
        
        throw error
      }
      
      const updatedDocumento = databaseToDocumento(data)
      setDocumentos(prev => prev.map(documento => documento.id === id ? updatedDocumento : documento))
      
      return updatedDocumento
    } catch (err) {
      console.error('Erro ao atualizar documento:', err)
      setError('Erro ao atualizar documento')
      throw err
    }
  }, [databaseToDocumento]);

  // Deletar documento
  const deleteDocumento = useCallback(async (id: string) => {
    try {
      setError(null)
      
      console.log('🗑️ Deletando documento:', id)
      
      // Buscar documento para verificar se existe e obter nome original
      const documento = documentos.find(d => d.id === id)
      if (!documento) {
        console.error('Documento não encontrado:', id)
        throw new Error('Documento não encontrado')
      }
      
      console.log('Documento a ser excluído:', documento)
      
      // Remover arquivo físico do storage se existir nomeArquivo
      if (documento.nomeArquivo) {
        const { error: storageError } = await supabase.storage
          .from('documentos')
          .remove([documento.nomeArquivo])
          
        if (storageError) {
          console.error('Erro ao remover arquivo do storage:', storageError)
          // Não falhar a operação por erro de storage
        } else {
          console.log('Arquivo removido do storage:', documento.nomeArquivo)
        }
      }
      
      const { error } = await supabase
        .from('documentos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Atualizar estado local
      setDocumentos(prev => prev.filter(documento => documento.id !== id))
      
      // Limpar documento do localStorage se existir
      try {
        const localDocuments = localStorage.getItem('documentos_sistema')
        if (localDocuments) {
          const parsedDocs = JSON.parse(localDocuments)
          const filteredDocs = parsedDocs.filter((doc: any) => doc.id !== id)
          localStorage.setItem('documentos_sistema', JSON.stringify(filteredDocs))
          console.log('📁 Documento removido do localStorage')
        }
      } catch (localError) {
        console.error('Erro ao limpar localStorage:', localError)
      }
      
      console.log('✅ Documento deletado com sucesso')
      
    } catch (err) {
      console.error('Erro ao deletar documento:', err)
      setError('Erro ao deletar documento')
      throw err
    }
  }, [documentos]);

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
  }, [databaseToDocumento]);

  // Carregar dados na inicialização
  useEffect(() => {
    console.log('useDocumentos: Hook iniciado')
    loadDocumentos()
  }, []);

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