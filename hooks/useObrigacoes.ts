import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSyncManager } from './useSyncManager';

export interface Obrigacao {
  id: string;
  empresaId: string;
  nomeObrigacao: string;
  descricao?: string;
  tipoObrigacao: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'eventual';
  dataVencimento: Date;
  status: 'pendente' | 'cumprida' | 'atrasada';
  responsavel: string;
  dataCumprimento?: Date;
  observacoes?: string;
}

export interface DatabaseObrigacao {
  id: string;
  empresa_id: string;
  nome_obrigacao: string;
  descricao?: string;
  tipo_obrigacao: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'eventual';
  data_vencimento: string;
  status: 'pendente' | 'cumprida' | 'atrasada';
  responsavel: string;
  data_cumprimento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export function useObrigacoes() {
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { emitSync, subscribe } = useSyncManager();

  // Estado para rastrear se o banco está configurado
  const [databaseConfigured, setDatabaseConfigured] = useState<boolean | null>(true) // Forçar como configurado;

  const checkDatabaseSetup = async () => {
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'obrigacoes')
        .single();

      const isConfigured = !error && !!data;
      setDatabaseConfigured(isConfigured);
      return isConfigured;
    } catch {
      setDatabaseConfigured(false);
      return false;
    }
  };

  const loadObrigacoes = async (retryCount = 0, maxRetries = 3) => {
    console.log('useObrigacoes: Carregando obrigações...');
    
    // Verificar se o banco está configurado primeiro
    if (databaseConfigured === null) {
      const isConfigured = await checkDatabaseSetup();
      if (!isConfigured) {
        console.log('useObrigacoes: ⚠️ Banco não configurado - tabela obrigacoes não existe');
        setError('Banco de dados não configurado. Execute o setup do Supabase primeiro.');
        setLoading(false);
        return;
      }
    }

    if (databaseConfigured === false) {
      console.log('useObrigacoes: ⚠️ Banco não configurado - pulando carregamento');
      setError('Banco de dados não configurado. Execute o setup do Supabase primeiro.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('obrigacoes')
        .select(`
          *,
          empresas (
            razao_social,
            nome_fantasia,
            cnpj
          )
        `)
        .order('data_vencimento', { ascending: true });

      if (error) {
        // Se for erro de tabela não existir, marcar banco como não configurado
        if (error.code === '42P01') {
          console.log('useObrigacoes: ⚠️ Tabela obrigacoes não existe - banco não configurado');
          setDatabaseConfigured(false);
          setError('Banco de dados não configurado. Execute o setup do Supabase primeiro.');
          setLoading(false);
          return;
        }

        throw error;
      }

      console.log('useObrigacoes: ✅ Obrigações carregadas:', data?.length || 0);
      
      // Converter dados do banco para formato da aplicação
      const formattedObrigacoes = (data || []).map((dbObrigacao: any) => ({
        id: dbObrigacao.id,
        empresaId: dbObrigacao.empresa_id,
        nomeObrigacao: dbObrigacao.nome_obrigacao,
        descricao: dbObrigacao.descricao,
        tipoObrigacao: dbObrigacao.tipo_obrigacao,
        dataVencimento: new Date(dbObrigacao.data_vencimento),
        status: dbObrigacao.status,
        responsavel: dbObrigacao.responsavel,
        dataCumprimento: dbObrigacao.data_cumprimento ? new Date(dbObrigacao.data_cumprimento) : undefined,
        observacoes: dbObrigacao.observacoes
      }));

      setObrigacoes(formattedObrigacoes);
      setError(null);
      setDatabaseConfigured(true);
    } catch (error: any) {
      console.error('Erro ao carregar obrigações:', error);
      
      // Se for erro de conexão e ainda temos tentativas, retry
      if (retryCount < maxRetries && (error.message?.includes('Failed to fetch') || error.message?.includes('Load failed'))) {
        console.log(`useObrigacoes: Tentativa ${retryCount + 1}/${maxRetries} falhou: ${error.message || error}`);
        setTimeout(() => loadObrigacoes(retryCount + 1, maxRetries), 1000 * (retryCount + 1));
        return;
      }
      
      setError(`Erro ao carregar obrigações: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar nova obrigação (funcionalidade futura)
  const addObrigacao = useCallback(async (obrigacaoData: Omit<Obrigacao, 'id'>) => {
    try {
      setError(null);
      
      const dbData = {
        empresa_id: obrigacaoData.empresaId,
        nome_obrigacao: obrigacaoData.nomeObrigacao,
        descricao: obrigacaoData.descricao,
        tipo_obrigacao: obrigacaoData.tipoObrigacao,
        data_vencimento: obrigacaoData.dataVencimento.toISOString().split('T')[0],
        status: obrigacaoData.status,
        responsavel: obrigacaoData.responsavel,
        data_cumprimento: obrigacaoData.dataCumprimento?.toISOString().split('T')[0],
        observacoes: obrigacaoData.observacoes
      };

      const { data, error } = await supabase
        .from('obrigacoes')
        .insert([dbData])
        .select()
        .single();
      
      if (error) throw error;
      
      const newObrigacao = {
        id: data.id,
        empresaId: data.empresa_id,
        nomeObrigacao: data.nome_obrigacao,
        descricao: data.descricao,
        tipoObrigacao: data.tipo_obrigacao,
        dataVencimento: new Date(data.data_vencimento),
        status: data.status,
        responsavel: data.responsavel,
        dataCumprimento: data.data_cumprimento ? new Date(data.data_cumprimento) : undefined,
        observacoes: data.observacoes
      };

      setObrigacoes(prev => [...prev, newObrigacao].sort((a, b) => a.dataVencimento.getTime() - b.dataVencimento.getTime()));
      
      console.log('✅ Nova obrigação adicionada:', newObrigacao.nomeObrigacao);
      
      return newObrigacao;
    } catch (err) {
      console.error('Erro ao adicionar obrigação:', err);
      setError('Erro ao adicionar obrigação');
      throw err;
    }
  }, []);

  // Carregar dados na inicialização
  useEffect(() => {
    loadObrigacoes();
    
    // Tentar reconectar automaticamente após 30 segundos se houver erro
    const retryInterval = setInterval(async () => {
      if (error && (error.includes('conectividade') || error.includes('reconectar'))) {
        console.log('Tentando reconexão automática para obrigações...');
        await loadObrigacoes();
      }
    }, 30000);
    
    return () => clearInterval(retryInterval);
  }, [error]);

  // Subscribe to sync events for automatic refresh
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      console.log('🔄 useObrigacoes: Received sync event:', event);
      
      // If it's a global refresh event, reload data
      if (event.type === 'global_refresh' && event.action === 'refresh') {
        console.log('🔄 useObrigacoes: Refreshing data due to global sync event');
        loadObrigacoes();
      }
    });

    return unsubscribe;
  }, [subscribe]);

  return {
    obrigacoes,
    loading,
    error,
    addObrigacao,
    refreshObrigacoes: loadObrigacoes
  };
}