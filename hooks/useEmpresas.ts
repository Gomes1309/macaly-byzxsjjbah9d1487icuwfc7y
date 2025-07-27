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
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmpresas = async (retryCount = 0) => {
    console.log('useEmpresas: Carregando empresas...', retryCount > 0 ? `(tentativa ${retryCount + 1})` : '');
    setLoading(true);
    setError(null);

    try {
      // Verificar conectividade básica do Supabase primeiro
      const { data: healthCheck, error: healthError } = await supabase
        .from('empresas')
        .select('count(*)', { count: 'exact', head: true })
        .limit(0);

      if (healthError) {
        // Se o erro é sobre tabela não existir, configurar lista vazia
        if (healthError.code === '42P01' || healthError.message.includes('does not exist')) {
          console.warn('useEmpresas: Tabela empresas não existe, retornando lista vazia');
          setEmpresas([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Se é erro de conectividade e ainda temos tentativas, retry
        if (retryCount < 2 && (
          healthError.message.includes('Load failed') || 
          healthError.message.includes('TypeError') ||
          healthError.message.includes('fetch')
        )) {
          console.warn(`useEmpresas: Erro de conectividade (${healthError.message}), tentando novamente em 2s...`);
          setTimeout(() => loadEmpresas(retryCount + 1), 2000);
          return;
        }
        
        throw healthError;
      }

      // Tentar query com join primeiro
      let query;
      try {
        // Testar se join funciona
        const { data: testData, error: testError } = await supabase
          .from('empresas')  
          .select(`
            *,
            clientes (
              nome,
              email,
              cpf_cnpj
            )
          `)
          .limit(1);

        if (!testError) {
          // Join funciona, usar query completa
          query = supabase
            .from('empresas')  
            .select(`
              *,
              clientes (
                nome,
                email,
                cpf_cnpj
              )
            `)
            .order('created_at', { ascending: false });
        } else {
          throw testError;
        }
      } catch (joinError) {
        console.warn('useEmpresas: Join não funcionou, usando query simples:', joinError);
        // Fallback para query simples sem join
        query = supabase
          .from('empresas')
          .select('*')
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('useEmpresas: Erro do Supabase:', error);
        
        // Se o erro é sobre tabela não existir, configurar lista vazia
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('useEmpresas: Tabela empresas não existe, retornando lista vazia');
          setEmpresas([]);
          setError(null);
        } else {
          setError(`Erro ao carregar empresas: ${error.message}`);
          setEmpresas([]);
        }
      } else {
        console.log('useEmpresas: ✅ Empresas carregadas:', data?.length || 0);
        
        // Converter dados do formato do banco para formato da aplicação
        const empresasFormatted = (data || []).map((item: any) => ({
          id: item.id,
          clienteId: item.cliente_id,
          razaoSocial: item.razao_social,
          nomeFantasia: item.nome_fantasia,
          cnpj: item.cnpj,
          atividadePrincipal: item.atividade_principal,
          endereco: item.endereco,
          telefone: item.telefone,
          email: item.email,
          capitalSocial: item.capital_social,
          tipoEmpresa: item.tipo_empresa,
          status: item.status,
          dataAbertura: item.data_abertura ? new Date(item.data_abertura) : undefined,
          responsavelAbertura: item.responsavel_abertura,
          observacoes: item.observacoes
        }));
        
        setEmpresas(empresasFormatted);
      }
    } catch (error: any) {
      // Melhor extração de mensagem de erro
      let errorMessage = '';
      if (error && typeof error === 'object') {
        errorMessage = error.message || error.error_description || error.details || error.code || '';
      } else {
        errorMessage = String(error || '');
      }
      
      const errorCode = error?.code || error?.status || 'UNKNOWN';
      const isEmptyError = !errorMessage || errorMessage === '' || errorMessage === 'undefined';
      
      // Identificar se é erro de conectividade
      const isConnectivityError = isEmptyError || 
                                  errorMessage.includes('Load failed') || 
                                  errorMessage.includes('TypeError') ||
                                  errorMessage.includes('fetch') ||
                                  error?.name === 'TypeError' ||
                                  errorCode === 'NETWORK_ERROR';
      
      // Se é erro de conectividade e ainda temos tentativas, retry silenciosamente
      if (retryCount < 2 && isConnectivityError) {
        console.warn(`useEmpresas: Tentativa ${retryCount + 1}/3 falhou (conectividade), tentando novamente em 2s...`);
        setTimeout(() => loadEmpresas(retryCount + 1), 2000);
        return;
      }
      
      // Verificar se é erro de configuração do banco
      if (errorMessage && errorMessage.includes('does not exist')) {
        console.warn('useEmpresas: Tabela não existe, retornando lista vazia');
        setError('Banco de dados não configurado. Execute o setup do Supabase primeiro.');
        setEmpresas([]);
      } else if (isConnectivityError) {
        // Erro de conectividade após todas as tentativas - não mostrar ao usuário
        console.warn('useEmpresas: Problema de conectividade persistente, mantendo lista vazia');
        setEmpresas([]);
        setError(null);
      } else {
        // Apenas logar erros reais que não são de conectividade
        console.error('useEmpresas: Erro real detectado:', {
          message: errorMessage,
          code: errorCode,
          retryCount
        });
        setEmpresas([]);
        setError(`Erro ao carregar empresas: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova empresa
  const addEmpresa = useCallback(async (empresaData: Omit<Empresa, 'id'>) => {
    try {
      setError(null);
      
      const dbData = {
        cliente_id: empresaData.clienteId,
        razao_social: empresaData.razaoSocial,
        nome_fantasia: empresaData.nomeFantasia,
        cnpj: empresaData.cnpj,
        atividade_principal: empresaData.atividadePrincipal,
        endereco: empresaData.endereco,
        telefone: empresaData.telefone,
        email: empresaData.email,
        capital_social: empresaData.capitalSocial,
        tipo_empresa: empresaData.tipoEmpresa,
        status: empresaData.status,
        data_abertura: empresaData.dataAbertura?.toISOString().split('T')[0],
        responsavel_abertura: empresaData.responsavelAbertura,
        observacoes: empresaData.observacoes
      };
      
      const { data, error } = await supabase
        .from('empresas')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      
      const newEmpresa: Empresa = {
        id: data.id,
        clienteId: data.cliente_id,
        razaoSocial: data.razao_social,
        nomeFantasia: data.nome_fantasia,
        cnpj: data.cnpj,
        atividadePrincipal: data.atividade_principal,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
        capitalSocial: data.capital_social,
        tipoEmpresa: data.tipo_empresa,
        status: data.status,
        dataAbertura: data.data_abertura ? new Date(data.data_abertura) : undefined,
        responsavelAbertura: data.responsavel_abertura,
        observacoes: data.observacoes
      };
      
      setEmpresas(prev => [newEmpresa, ...prev]);
      return newEmpresa;
    } catch (err) {
      console.error('Erro ao adicionar empresa:', err);
      setError('Erro ao adicionar empresa');
      throw err;
    }
  }, []);

  // Atualizar empresa existente
  const updateEmpresa = useCallback(async (id: string, empresaData: Partial<Omit<Empresa, 'id'>>) => {
    try {
      setError(null);
      
      const updateData: any = {};
      
      if (empresaData.clienteId) updateData.cliente_id = empresaData.clienteId;
      if (empresaData.razaoSocial) updateData.razao_social = empresaData.razaoSocial;
      if (empresaData.nomeFantasia !== undefined) updateData.nome_fantasia = empresaData.nomeFantasia;
      if (empresaData.cnpj !== undefined) updateData.cnpj = empresaData.cnpj;
      if (empresaData.atividadePrincipal) updateData.atividade_principal = empresaData.atividadePrincipal;
      if (empresaData.endereco) updateData.endereco = empresaData.endereco;
      if (empresaData.telefone !== undefined) updateData.telefone = empresaData.telefone;
      if (empresaData.email !== undefined) updateData.email = empresaData.email;
      if (empresaData.capitalSocial !== undefined) updateData.capital_social = empresaData.capitalSocial;
      if (empresaData.tipoEmpresa) updateData.tipo_empresa = empresaData.tipoEmpresa;
      if (empresaData.status) updateData.status = empresaData.status;
      if (empresaData.dataAbertura) updateData.data_abertura = empresaData.dataAbertura.toISOString().split('T')[0];
      if (empresaData.responsavelAbertura) updateData.responsavel_abertura = empresaData.responsavelAbertura;
      if (empresaData.observacoes !== undefined) updateData.observacoes = empresaData.observacoes;
      
      const { data, error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      const updatedEmpresa: Empresa = {
        id: data.id,
        clienteId: data.cliente_id,
        razaoSocial: data.razao_social,
        nomeFantasia: data.nome_fantasia,
        cnpj: data.cnpj,
        atividadePrincipal: data.atividade_principal,
        endereco: data.endereco,
        telefone: data.telefone,
        email: data.email,
        capitalSocial: data.capital_social,
        tipoEmpresa: data.tipo_empresa,
        status: data.status,
        dataAbertura: data.data_abertura ? new Date(data.data_abertura) : undefined,
        responsavelAbertura: data.responsavel_abertura,
        observacoes: data.observacoes
      };
      
      setEmpresas(prev => prev.map(empresa => empresa.id === id ? updatedEmpresa : empresa));
      return updatedEmpresa;
    } catch (err) {
      console.error('Erro ao atualizar empresa:', err);
      setError('Erro ao atualizar empresa');
      throw err;
    }
  }, []);

  // Deletar empresa
  const deleteEmpresa = useCallback(async (id: string) => {
    try {
      setError(null);
      console.log('Iniciando exclusão da empresa:', id);
      
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setEmpresas(prev => prev.filter(empresa => empresa.id !== id));
      console.log('✅ Empresa excluída com sucesso!');
      
    } catch (err) {
      console.error('Erro ao deletar empresa:', err);
      setError('Erro ao deletar empresa');
      throw err;
    }
  }, []);

  // Carregar dados na inicialização
  useEffect(() => {
    console.log('useEmpresas: Hook iniciado');
    loadEmpresas();
  }, []);

  return {
    empresas,
    loading,
    error,
    addEmpresa,
    updateEmpresa,
    deleteEmpresa,
    refreshEmpresas: loadEmpresas
  };
}