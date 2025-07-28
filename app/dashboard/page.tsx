'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAlvaras } from '@/hooks/useAlvaras';
import { useObrigacoes } from '@/hooks/useObrigacoes';
import { useClientes } from '@/hooks/useClientes';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useUsuarios } from '@/hooks/useUsuarios';
import { useEmpresas } from '@/hooks/useEmpresas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, FileText, Building, User, Users, LogOut, Shield, Settings, UserCheck, Star, UserPlus, Edit, Trash2, Search, Filter, MoreHorizontal, UserCog, Key, Activity, Database, Download, RefreshCw, Timer, Upload, Share, AlertTriangle, CheckCircle, Calendar, Menu, Zap, AlertCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReportGenerator from '@/components/ReportGenerator';

export default function Dashboard() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { alvaras, loading: alvarasLoading, error: alvarasError } = useAlvaras();
  const { obrigacoes, loading: obrigacoesLoading, error: obrigacoesError } = useObrigacoes();
  const { clientes, loading: clientesLoading, error: clientesError } = useClientes();
  const { documentos, loading: documentosLoading, error: documentosError } = useDocumentos();
  const { usuarios, loading: usuariosLoading, error: usuariosError } = useUsuarios();
  const { empresas, loading: empresasLoading, error: empresasError } = useEmpresas();
  const router = useRouter();
  const { toast } = useToast();
  
  // Estados para loading dos botões
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isBackupingUsers, setIsBackupingUsers] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<any>(null)
  
  // Estados para controlar os modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  
  // Estados para configurações
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [documentAlerts, setDocumentAlerts] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  
  // Estados para o perfil
  const [profileData, setProfileData] = useState({
    nome: 'Administrador Principal',
    email: 'agassessoriacontrole@gmail.com',
    cargo: 'Administração',
    telefone: '',
    empresa: 'AG Assessoria'
  });

  // Carregar configurações do localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedEmailNotifications = localStorage.getItem('emailNotifications') !== 'false';
    const savedDocumentAlerts = localStorage.getItem('documentAlerts') !== 'false';
    const savedAutoBackup = localStorage.getItem('autoBackup') !== 'false';
    
    setIsDarkMode(savedDarkMode);
    setEmailNotifications(savedEmailNotifications);
    setDocumentAlerts(savedDocumentAlerts);
    setAutoBackup(savedAutoBackup);
    
    console.log('🌙 Configurações carregadas:', { 
      darkMode: savedDarkMode, 
      email: savedEmailNotifications,
      alerts: savedDocumentAlerts,
      backup: savedAutoBackup 
    });
  }, []);

  // Função para alternar tema escuro
  const toggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    localStorage.setItem('darkMode', enabled.toString());
    console.log('🌙 Tema alterado para:', enabled ? 'Escuro' : 'Claro');
    console.log('🎨 Logotipo adaptado para tema:', enabled ? 'Escuro (fundo branco)' : 'Claro (transparente)');
  };

  // Função para salvar configurações
  const saveSettings = () => {
    localStorage.setItem('emailNotifications', emailNotifications.toString());
    localStorage.setItem('documentAlerts', documentAlerts.toString());
    localStorage.setItem('autoBackup', autoBackup.toString());
    
    console.log('⚙️ Configurações salvas:', {
      darkMode: isDarkMode,
      emailNotifications,
      documentAlerts,
      autoBackup
    });
    setIsSettingsOpen(false);
  };
  
  // Redirecionar se não autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('🛡️ Dashboard: Usuário não autenticado, redirecionando...');
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Função para gerar relatório PDF de clientes
  const handleGenerateClientReportPDF = async () => {
    console.log('📊 Iniciando geração de relatório PDF de clientes...');
    setIsGeneratingReport(true);
    
    try {
      const response = await fetch('/api/generate-client-report-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'pdf',
          orderBy: 'alphabetical',
          reportType: 'complete'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Dados do relatório recebidos:', result.data.metadata);
        
        // Gerar PDF usando os dados recebidos
        try {
          // Importação dinâmica para evitar erros de SSR
          const jsPDF = (await import('jspdf')).default;
          const autoTable = (await import('jspdf-autotable')).default;

          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.width;

          // Header
          doc.setFillColor(79, 70, 229);
          doc.rect(0, 0, pageWidth, 25, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.text('AG ASSESSORIA', 15, 16);
          
          doc.setFontSize(10);
          doc.text('RELATÓRIO DE CLIENTES', 15, 21);

          // Título
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(16);
          doc.text(result.data.metadata.titulo, 15, 40);

          // Estatísticas
          doc.setFontSize(10);
          doc.text(`Data: ${result.data.metadata.dataGeracao}`, 15, 50);
          doc.text(`Total de Clientes: ${result.data.metadata.totalClientes}`, 15, 55);
          doc.text(`Clientes Ativos: ${result.data.metadata.clientesAtivos}`, 15, 60);
          doc.text(`Pessoas Jurídicas: ${result.data.metadata.pessoasJuridicas}`, 15, 65);

          // Tabela de clientes
          const tableData = result.data.clientes.map((cliente: any) => [
            cliente.nome,
            cliente.cpfCnpj,
            cliente.tipoCliente,
            cliente.status,
            cliente.email,
            cliente.telefone
          ]);

          autoTable(doc, {
            startY: 75,
            head: [['Nome', 'CPF/CNPJ', 'Tipo', 'Status', 'Email', 'Telefone']],
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] },
            columnStyles: {
              0: { cellWidth: 35 },
              1: { cellWidth: 30 },
              2: { cellWidth: 20 },
              3: { cellWidth: 15 },
              4: { cellWidth: 35 },
              5: { cellWidth: 25 }
            }
          });

          // Download do PDF
          const filename = `relatorio-clientes-${new Date().toISOString().split('T')[0]}.pdf`;
          doc.save(filename);
          
          toast({
            title: "✅ PDF Gerado com Sucesso!",
            description: `Relatório com ${result.data.metadata.totalClientes} clientes baixado`,
            variant: "default",
          });
          
        } catch (pdfError) {
          console.error('❌ Erro ao gerar PDF:', pdfError);
          toast({
            title: "❌ Erro na Geração do PDF",
            description: "Erro ao processar os dados para PDF",
            variant: "destructive",
          });
        }
        
      } else {
        console.error('❌ Erro ao buscar dados:', result.error);
        toast({
          title: "❌ Erro nos Dados",
          description: result.error || "Não foi possível buscar os dados",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      toast({
        title: "❌ Erro de Conexão",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Função para testar conectividade do Supabase
  const testSupabaseConnection = async () => {
    console.log('🧪 Iniciando teste de conectividade...')
    setTestingConnection(true)
    setConnectionResult(null)
    
    try {
      const response = await fetch('/api/test-supabase-connectivity')
      const data = await response.json()
      
      console.log('🔍 Resultado do teste de conectividade:', data)
      setConnectionResult(data)
      
      if (data.success) {
        toast({
          title: "✅ Conectividade OK",
          description: `${data.summary.tablesFound}/${data.summary.totalTables} tabelas encontradas`,
          variant: "default",
        })
      } else {
        toast({
          title: "⚠️ Problemas Detectados",
          description: `${data.result.errors.length} erro(s) encontrado(s)`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('❌ Erro no teste:', error)
      toast({
        title: "❌ Erro no Teste",
        description: "Não foi possível executar o teste de conectividade",
        variant: "destructive",
      })
    } finally {
      setTestingConnection(false)
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ag-purple-dark via-ag-purple to-ag-purple-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Não renderizar se não autenticado
  if (!isAuthenticated || !user) {
    return null;
  }
  
  console.log('Dashboard: Sistema carregado e funcionando para usuário:', user.nome);
  console.log('🎯 Painel Gerenciar Cliente: Adicionado com sucesso ao dashboard!');
  console.log('👥 Painel Gerenciar Usuário: Implementado com gradiente azul-índigo-roxo!');
  console.log('⭐ Card Gerenciar Usuários: Atualizado com gradiente roxo-índigo destacado!');
  console.log('🛡️ Painel Alvará: Adicionado com gradiente amarelo-laranja!');
  console.log('📄 Painel Documento: Implementado com gradiente roxo-violeta-fúcsia!');
  console.log('⏰ Painel Obrigações: Implementado com gradiente ciano-teal-azul!');
  console.log('🏢 NOVO: Painel Abertura Empresa adicionado com gradiente verde-esmeralda-lima!');
  console.log('🎨 Dashboard reorganizado com 8 painéis principais!');
  console.log('🍔 MENU HAMBÚRGUER: Adicionado no canto superior com "Administrador Principal" e "Administração no Dashboard"!');
  console.log('🔄 MENU HAMBÚRGUER: Movido para o canto superior direito conforme solicitado!');
  console.log('🗑️ DUPLICAÇÃO REMOVIDA: "Painel do Cliente" removido - mantendo apenas "Gerenciar Cliente"!');

  // Dashboard normal funcionando - COM NOVOS PAINÉIS ADICIONADOS!
  console.log('🚀 VERSÃO FINAL: Dashboard com 7 painéis incluindo Obrigações!');
  console.log('✅ LIMPEZA DASHBOARD: Card "Menu do Usuário" removido para interface mais limpa!');
  console.log('🗂️ BACKUP NO MENU: Funcionalidade de backup movida para o menu sanduíche!');
  console.log('🎨 INTERFACE OTIMIZADA: Dashboard mais organizado e limpo!');
  console.log('✅ AÇÕES RÁPIDAS REMOVIDAS: Dashboard agora mostra apenas os painéis principais!');
  console.log('🎯 INTERFACE SUPER LIMPA: Removido título duplicado e ações rápidas para máxima simplicidade!');
  console.log('🧹 LIMPEZA FINAL: Título "Dashboard" e "Ações Rápidas" removidos - interface minimalista completa!');
  console.log('✨ DASHBOARD MINIMALISTA: Apenas painéis principais + menu hambúrguer + rodapé!');

  const alvarasVencendoEm30Dias = alvaras.filter(alvara => {
    const hoje = new Date();
    const vencimento = new Date(alvara.dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  });

  const alvarasVencidos = alvaras.filter(alvara => {
    const hoje = new Date();
    const vencimento = new Date(alvara.dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0;
  });

  const obrigacoesPendentes = obrigacoes.filter(obrigacao => obrigacao.status === 'pendente');

  const obrigacoesVencendoEm30Dias = obrigacoes.filter(obrigacao => {
    const hoje = new Date();
    const vencimento = new Date(obrigacao.dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  });

  console.log('Dashboard: Dados carregados', {
    alvaras: alvaras.length,
    obrigacoes: obrigacoes.length,
    vencendoEm30Dias: alvarasVencendoEm30Dias.length + obrigacoesVencendoEm30Dias.length
  });

  return (
    <div className={`min-h-screen p-4 transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700' 
        : 'bg-gradient-to-br from-ag-purple-dark via-ag-purple to-ag-purple-light'
    }`}>
      
      {/* Menu Hambúrguer no Topo */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={`${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-white/90 border-white/20 text-gray-800 hover:bg-white'
              } backdrop-blur-sm shadow-lg transition-all duration-300`}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Menu do Sistema</p>
                <p className="text-xs leading-none text-muted-foreground">Acesso rápido às principais funções</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Administrador Principal</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/dashboard'}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Administração no Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => window.location.href = '/admin/backup'}>
              <Database className="mr-2 h-4 w-4" />
              <span>Backups do Sistema</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logo no topo */}
      <div className="max-w-lg mx-auto mb-6">
        <div className={`rounded-2xl p-8 shadow-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
        }`}>
          <div className="flex justify-center items-center">
            <img 
              src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/o-h2__8-krHhyceVQM4UJ/image.png" 
              alt="AG Assessoria" 
              className="h-20 w-auto object-contain"
              data-macaly="dashboard-logo"
            />
          </div>
        </div>
      </div>

      {/* Grid Container para os Cards */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">

      {/* Painel Gerenciar Cliente */}
      <div className="">
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-[2px] shadow-xl h-full">
          <div className={`rounded-2xl p-6 h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className="text-center mb-4">
              {/* Ícone Gerenciar */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-pink-600 rounded-full p-3">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Gerenciar Cliente
              </h2>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Ferramentas avançadas para gestão completa de clientes
              </p>
            </div>
            
            {/* Estatísticas de Gerenciamento */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-orange-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <UserPlus className={`h-3 w-3 ${
                    isDarkMode ? 'text-orange-400' : 'text-orange-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-700'
                }`}>{clientes.filter(c => c.status === 'ativo').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>Ativos</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-red-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Edit className={`h-3 w-3 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-red-300' : 'text-red-700'
                }`}>{clientes.filter(c => c.tipoCliente === 'pessoa_juridica').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-red-400' : 'text-red-600'
                }`}>Empresas</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-pink-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Search className={`h-3 w-3 ${
                    isDarkMode ? 'text-pink-400' : 'text-pink-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-pink-300' : 'text-pink-700'
                }`}>{clientes.length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-pink-400' : 'text-pink-600'
                }`}>Total</div>
              </div>
            </div>
            
            {/* Ações de Gestão */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a 
                href="/clientes" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-orange-900/50 text-orange-300 hover:bg-orange-900/70' 
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Novo Cliente
              </a>
              <a 
                href="/clientes" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar Lista
              </a>
              <a 
                href="/clientes" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-pink-900/50 text-pink-300 hover:bg-pink-900/70' 
                    : 'bg-pink-100 text-pink-800 hover:bg-pink-200'
                }`}
              >
                <Search className="h-3 w-3 mr-1" />
                Buscar Cliente
              </a>
              <a 
                href="/clientes" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-3 w-3 mr-1" />
                Filtros
              </a>
            </div>
            
            {/* Ações Avançadas */}
            <div className="space-y-2">
              <div className={`p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Relatório Personalizado</p>
                    <p className={`text-sm font-bold ${
                      isDarkMode ? 'text-orange-300' : 'text-orange-700'
                    }`}>PDF com CNPJ Ordem A-Z</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleGenerateClientReportPDF}
                    disabled={isGeneratingReport}
                    className={`text-xs ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
                        : 'border-orange-300 text-orange-700 hover:bg-orange-50'
                    }`}
                  >
                    {isGeneratingReport ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <FileText className="h-3 w-3 mr-1" />
                    )}
                    {isGeneratingReport ? 'Gerando...' : 'PDF'}
                  </Button>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Estatísticas Completas</p>
                    <p className={`text-sm font-bold ${
                      isDarkMode ? 'text-red-300' : 'text-red-700'
                    }`}>Total Empresas + Clientes</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/generate-client-report-pdf')
                        const result = await response.json()
                        
                        if (result.success) {
                          alert(`📊 Estatísticas Atuais:\n\n` +
                            `• Total Clientes: ${result.stats.totalClientes}\n` +
                            `• Clientes Ativos: ${result.stats.clientesAtivos}\n` +
                            `• Pessoas Jurídicas: ${result.stats.pessoasJuridicas}\n` +
                            `• Total Empresas: ${result.stats.totalEmpresas}\n\n` +
                            `Última Atualização: ${result.stats.ultimaAtualizacao}`)
                        }
                      } catch (error) {
                        alert('Erro ao buscar estatísticas')
                      }
                    }}
                    className={`text-xs ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
                        : 'border-red-300 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    <Users className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Alvará */}
      <div className="">
        <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-amber-500 rounded-2xl p-[2px] shadow-xl h-full">
          <div className={`rounded-2xl p-6 h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className="text-center mb-4">
              {/* Ícone Alvará */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full p-3">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-2">
                Painel Alvará
              </h2>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Controle completo de alvarás e licenças
              </p>
            </div>
            
            {/* Estatísticas de Alvará */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Shield className={`h-3 w-3 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                }`}>{alvaras.length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                }`}>Total</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-orange-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Clock className={`h-3 w-3 ${
                    isDarkMode ? 'text-orange-400' : 'text-orange-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-orange-300' : 'text-orange-700'
                }`}>{alvarasVencendoEm30Dias.length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`}>Vencendo</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-amber-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Building className={`h-3 w-3 ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-amber-300' : 'text-amber-700'
                }`}>{alvarasVencidos.length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-amber-400' : 'text-amber-600'
                }`}>Vencidos</div>
              </div>
            </div>
            
            {/* Ações de Alvará */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a 
                href="/alvaras" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-900/70' 
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                }`}
              >
                <Shield className="h-3 w-3 mr-1" />
                Ver Alvarás
              </a>
              <a 
                href="/alvaras" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-orange-900/50 text-orange-300 hover:bg-orange-900/70' 
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Novo Alvará
              </a>
              <a 
                href="/alvaras" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-amber-900/50 text-amber-300 hover:bg-amber-900/70' 
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                <Search className="h-3 w-3 mr-1" />
                Buscar
              </a>
              <a 
                href="/alvaras" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <Filter className="h-3 w-3 mr-1" />
                Filtros
              </a>
            </div>
            
            {/* Status dos Alvarás */}
            <div className="space-y-2">

            </div>
          </div>
        </div>
      </div>

      {/* Painel Documento */}
      <div className="">
        <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 rounded-2xl p-[2px] shadow-xl h-full">
          <div className={`rounded-2xl p-6 h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className="text-center mb-4">
              {/* Ícone Documento */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-fuchsia-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-full p-3">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent mb-2">
                Painel Documento
              </h2>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Gestão completa de documentos e arquivos
              </p>
            </div>
            
            {/* Estatísticas de Documentos */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <FileText className={`h-3 w-3 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>{documentos.length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>Total</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-violet-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Upload className={`h-3 w-3 ${
                    isDarkMode ? 'text-violet-400' : 'text-violet-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-violet-300' : 'text-violet-700'
                }`}>{documentos.filter(d => d.tipoDocumento === 'fiscal').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-violet-400' : 'text-violet-600'
                }`}>Fiscais</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-fuchsia-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Share className={`h-3 w-3 ${
                    isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700'
                }`}>{documentos.filter(d => d.tipoDocumento === 'abertura').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600'
                }`}>Abertura</div>
              </div>
            </div>
            
            {/* Ações de Documento */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a 
                href="/documentos" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-900/70' 
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                <FileText className="h-3 w-3 mr-1" />
                Ver Docs
              </a>
              <a 
                href="/documentos" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-violet-900/50 text-violet-300 hover:bg-violet-900/70' 
                    : 'bg-violet-100 text-violet-800 hover:bg-violet-200'
                }`}
              >
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </a>
              <a 
                href="/documentos" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-fuchsia-900/50 text-fuchsia-300 hover:bg-fuchsia-900/70' 
                    : 'bg-fuchsia-100 text-fuchsia-800 hover:bg-fuchsia-200'
                }`}
              >
                <Search className="h-3 w-3 mr-1" />
                Buscar
              </a>
              <a 
                href="/documentos" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <Share className="h-3 w-3 mr-1" />
                Compartilhar
              </a>
            </div>
            
            {/* Status dos Documentos */}
            <div className="space-y-2">
              <div className={`p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Último Upload</p>
                    <p className={`text-sm font-bold ${
                      isDarkMode ? 'text-purple-300' : 'text-purple-700'
                    }`}>
                      {documentos.length > 0 
                        ? documentos[0].nomeArquivo.length > 20 
                          ? `${documentos[0].nomeArquivo.substring(0, 20)}...`
                          : documentos[0].nomeArquivo
                        : 'Nenhum documento'
                      }
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    documentos.length > 0 ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Total de Arquivos</p>
                    <p className={`text-sm font-bold ${
                      isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700'
                    }`}>
                      {documentos.length} {documentos.length === 1 ? 'arquivo' : 'arquivos'}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => window.location.href = '/documentos'}
                    className={`text-xs ${
                      isDarkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
                        : 'border-violet-300 text-violet-700 hover:bg-violet-50'
                    }`}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Obrigações */}
      <div className="">
        <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-500 rounded-2xl p-[2px] shadow-xl h-full">
          <div className={`rounded-2xl p-6 h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className="text-center mb-4">
              {/* Ícone Obrigações */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full p-3">
                  <Clock className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Painel Obrigações
              </h2>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Controle completo de obrigações e prazos
              </p>
            </div>
            
            {/* Estatísticas de Obrigações */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-cyan-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Clock className={`h-3 w-3 ${
                    isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                }`}>{obrigacoes.filter(o => o.status === 'pendente').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-cyan-400' : 'text-cyan-600'
                }`}>Ativas</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-teal-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <AlertTriangle className={`h-3 w-3 ${
                    isDarkMode ? 'text-teal-400' : 'text-teal-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-teal-300' : 'text-teal-700'
                }`}>{obrigacoes.filter(o => o.status === 'atrasada').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-teal-400' : 'text-teal-600'
                }`}>Urgentes</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className={`h-3 w-3 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>{obrigacoes.filter(o => o.status === 'cumprida').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>Concluídas</div>
              </div>
            </div>
            
            {/* Ações de Obrigações */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a 
                href="/obrigacoes" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-cyan-900/50 text-cyan-300 hover:bg-cyan-900/70' 
                    : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                }`}
              >
                <Clock className="h-3 w-3 mr-1" />
                Ver Obrigações
              </a>
              <a 
                href="/obrigacoes" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-teal-900/50 text-teal-300 hover:bg-teal-900/70' 
                    : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                }`}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Nova Obrigação
              </a>
              <a 
                href="/obrigacoes" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <Search className="h-3 w-3 mr-1" />
                Buscar
              </a>
              <a 
                href="/obrigacoes" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <Calendar className="h-3 w-3 mr-1" />
                Calendário
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Gerenciar Usuário */}
      <div className="">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-[2px] shadow-xl h-full">
          <div className={`rounded-2xl p-6 h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className="text-center mb-4">
              {/* Ícone Gerenciar Usuários */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                  <UserCog className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Gerenciar Usuário
              </h2>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Controle total sobre usuários e permissões do sistema
              </p>
            </div>
            
            {/* Estatísticas de Usuários */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Users className={`h-3 w-3 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>{usuarios.filter(u => u.status === 'ativo').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>Ativos</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Key className={`h-3 w-3 ${
                    isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-indigo-300' : 'text-indigo-700'
                }`}>{usuarios.filter(u => u.cargo === 'Administrador' || u.cargo === 'admin').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
                }`}>Admins</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Activity className={`h-3 w-3 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-purple-300' : 'text-purple-700'
                }`}>{usuarios.length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>Total</div>
              </div>
            </div>
            
            {/* Ações de Gestão de Usuários */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a 
                href="/usuarios" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70' 
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                <UserPlus className="h-3 w-3 mr-1" />
                Novo Usuário
              </a>
              <a 
                href="/usuarios" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/70' 
                    : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                }`}
              >
                <UserCog className="h-3 w-3 mr-1" />
                Permissões
              </a>
              <a 
                href="/usuarios" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-900/70' 
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                <Activity className="h-3 w-3 mr-1" />
                Atividade
              </a>
              <a 
                href="/usuarios" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <Search className="h-3 w-3 mr-1" />
                Buscar
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Abertura Empresa - NOVO PAINEL */}
      <div className="">
        <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500 rounded-2xl p-[2px] shadow-xl h-full">
          <div className={`rounded-2xl p-6 h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className="text-center mb-4">
              {/* Ícone Abertura Empresa */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-lime-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-emerald-500 to-lime-600 rounded-full p-3">
                  <Building className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-lime-600 bg-clip-text text-transparent mb-2">
                Abertura Empresa
              </h2>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Processo completo de abertura e legalização de empresas
              </p>
            </div>
            
            {/* Estatísticas de Abertura */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-emerald-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Building className={`h-3 w-3 ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                }`}>{empresas.filter(e => e.status === 'em_andamento').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>Em Processo</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-green-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle className={`h-3 w-3 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-green-300' : 'text-green-700'
                }`}>{empresas.filter(e => e.status === 'aprovada').length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`}>Aprovadas</div>
              </div>
              
              <div className={`rounded-lg p-2 text-center ${
                isDarkMode ? 'bg-gray-700' : 'bg-lime-50'
              }`}>
                <div className="flex items-center justify-center mb-1">
                  <Timer className={`h-3 w-3 ${
                    isDarkMode ? 'text-lime-400' : 'text-lime-600'
                  }`} />
                </div>
                <div className={`text-sm font-bold ${
                  isDarkMode ? 'text-lime-300' : 'text-lime-700'
                }`}>{empresas.length}</div>
                <div className={`text-xs ${
                  isDarkMode ? 'text-lime-400' : 'text-lime-600'
                }`}>Total</div>
              </div>
            </div>
            
            {/* Ações de Abertura */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <a 
                href="/abertura" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70' 
                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                <Building className="h-3 w-3 mr-1" />
                Nova Abertura
              </a>
              <a 
                href="/abertura" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                <Search className="h-3 w-3 mr-1" />
                Consultar Status
              </a>
              <a 
                href="/abertura" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-lime-900/50 text-lime-300 hover:bg-lime-900/70' 
                    : 'bg-lime-100 text-lime-800 hover:bg-lime-200'
                }`}
              >
                <FileText className="h-3 w-3 mr-1" />
                Documentos
              </a>
              <a 
                href="/abertura" 
                className={`flex items-center justify-center p-2 rounded-lg text-xs font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <Timer className="h-3 w-3 mr-1" />
                Prazos
              </a>
            </div>
            
            {/* Status das Solicitações */}
            <div className="space-y-2">

            </div>
          </div>
        </div>
      </div>



        </div>
      </div>

      {/* Rodapé */}
      <div className={`text-center text-sm ${
        isDarkMode ? 'text-gray-400' : 'text-white/70'
      }`}>
        Sistema seguro • Dados protegidos por criptografia
      </div>
      
      {/* Modal de Perfil */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Perfil do Usuário
            </DialogTitle>
            <DialogDescription>
              Visualize e edite suas informações pessoais.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input
                id="nome"
                value={profileData.nome}
                onChange={(e) => setProfileData({...profileData, nome: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                className="col-span-3"
                type="email"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cargo" className="text-right">
                Cargo
              </Label>
              <Input
                id="cargo"
                value={profileData.cargo}
                onChange={(e) => setProfileData({...profileData, cargo: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="telefone" className="text-right">
                Telefone
              </Label>
              <Input
                id="telefone"
                placeholder="(xx) xxxxx-xxxx"
                value={profileData.telefone}
                onChange={(e) => setProfileData({...profileData, telefone: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="empresa" className="text-right">
                Empresa
              </Label>
              <Input
                id="empresa"
                value={profileData.empresa}
                onChange={(e) => setProfileData({...profileData, empresa: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsProfileOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              console.log('Perfil salvo:', profileData);
              setIsProfileOpen(false);
            }}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Configurações do Sistema
            </DialogTitle>
            <DialogDescription>
              Configure as preferências e configurações do sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            
            {/* Seção Notificações */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Notificações</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Email sobre vencimentos</label>
                  <input 
                    type="checkbox" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="rounded" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Alertas de documentos</label>
                  <input 
                    type="checkbox" 
                    checked={documentAlerts}
                    onChange={(e) => setDocumentAlerts(e.target.checked)}
                    className="rounded" 
                  />
                </div>
              </div>
            </div>
            
            {/* Seção Sistema */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Sistema</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Tema escuro</label>
                  <input 
                    type="checkbox" 
                    checked={isDarkMode}
                    onChange={(e) => toggleDarkMode(e.target.checked)}
                    className="rounded" 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-600">Backup automático</label>
                  <input 
                    type="checkbox" 
                    checked={autoBackup}
                    onChange={(e) => setAutoBackup(e.target.checked)}
                    className="rounded" 
                  />
                </div>
              </div>
            </div>
            
            {/* Seção Segurança */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Segurança</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Shield className="mr-2 h-4 w-4" />
                  Alterar Senha
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Encerrar Outras Sessões
                </Button>
              </div>
            </div>
            
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSettings}>
              Salvar Configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal do Gerador de Relatórios */}
      <Dialog open={showReportGenerator} onOpenChange={setShowReportGenerator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Gerador de Relatórios PDF
            </DialogTitle>
            <DialogDescription>
              Gere relatórios personalizados de clientes com CNPJ em ordem alfabética
            </DialogDescription>
          </DialogHeader>
          <ReportGenerator onClose={() => setShowReportGenerator(false)} />
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </div>
  );
}