'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAlvaras } from '@/hooks/useAlvaras';
import { useObrigacoes } from '@/hooks/useObrigacoes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Clock, FileText, Building, User, Users, LogOut, Shield, Sparkles, TrendingUp, Heart, Settings } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Dashboard() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { alvaras, loading: alvarasLoading, error: alvarasError } = useAlvaras();
  const { obrigacoes, loading: obrigacoesLoading, error: obrigacoesError } = useObrigacoes();
  const router = useRouter();
  
  // Estados para controlar os modals
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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

  // Dashboard normal funcionando
  const alvarasVencendoEm30Dias = alvaras.filter(alvara => {
    const hoje = new Date();
    const vencimento = new Date(alvara.dataVencimento);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
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
      {/* Logo no topo */}
      <div className="max-w-md mx-auto mb-6">
        <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
        }`}>
          <div className={`inline-block rounded-lg transition-all duration-300 ${
            isDarkMode ? 'bg-white p-2' : 'bg-transparent'
          }`}>
            <img 
              src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/-wPS_aVVNGIoLVNvtCHbY/logo.png" 
              alt="AG Assessoria" 
              className="h-16 w-auto mx-auto"
              data-macaly="dashboard-logo"
            />
          </div>
        </div>
      </div>

      {/* Cabeçalho do usuário */}
      <div className="max-w-md mx-auto mb-6">
        <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  AP
                </AvatarFallback>
              </Avatar>
            </div>
            <h2 className={`text-xl font-semibold mb-1 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>Administrador Principal</h2>
            <p className={`text-sm mb-4 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Administração</p>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full">
                  Menu do Usuário
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="center" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Administrador Principal</p>
                    <p className="text-xs leading-none text-muted-foreground">agassessoriacontrole@gmail.com</p>
                  </div>
                </DropdownMenuLabel>
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
        </div>
      </div>

      {/* Card Especial - Boas Vindas */}
      <div className="max-w-md mx-auto mb-6">
        <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-[2px] shadow-xl">
          <div className={`rounded-2xl p-6 h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
          }`}>
            <div className="text-center">
              {/* Ícone com animação */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full animate-pulse opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              
              {/* Saudação */}
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Bem-vindo de volta!
              </h2>
              <p className={`text-sm mb-4 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Tudo funcionando perfeitamente. Seu sistema está atualizado e seguro.
              </p>
              
              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className={`rounded-lg p-3 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-green-50'
                }`}>
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className={`h-4 w-4 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </div>
                  <div className={`text-lg font-bold ${
                    isDarkMode ? 'text-green-300' : 'text-green-700'
                  }`}>{alvaras.length}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>Alvarás</div>
                </div>
                
                <div className={`rounded-lg p-3 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                }`}>
                  <div className="flex items-center justify-center mb-1">
                    <Clock className={`h-4 w-4 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className={`text-lg font-bold ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>{obrigacoes.length}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>Obrigações</div>
                </div>
                
                <div className={`rounded-lg p-3 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
                }`}>
                  <div className="flex items-center justify-center mb-1">
                    <Heart className={`h-4 w-4 ${
                      isDarkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <div className={`text-lg font-bold ${
                    isDarkMode ? 'text-purple-300' : 'text-purple-700'
                  }`}>100%</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>Online</div>
                </div>
              </div>
              
              {/* Badge de status */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isDarkMode 
                  ? 'bg-green-900/50 text-green-300' 
                  : 'bg-green-100 text-green-800'
              }`}>
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Sistema Operacional
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <div className="max-w-md mx-auto mb-6">
        <div className={`rounded-2xl p-6 shadow-lg transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'
        }`}>
          <div className="text-center mb-6">
            <h1 className={`text-2xl font-bold mb-2 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>Dashboard</h1>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Visão geral do sistema</p>
          </div>





          {/* AÇÕES RÁPIDAS */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-800'
            }`}>Ações Rápidas</h3>
            
            {/* Nova Abertura - Destaque */}
            <div className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 rounded-xl p-4 cursor-pointer shadow-md hover:shadow-lg">
              <a href="/abertura" className="flex items-center text-white">
                <div className="bg-white/20 rounded-lg p-2 mr-3">
                  <Building className="h-5 w-5" />
                </div>
                <span className="font-medium text-base">Nova Abertura</span>
              </a>
            </div>
            
            {/* Cards das outras ações */}
            <div className="space-y-3">
              
              {/* Gerenciar Clientes */}
              <div className={`transition-all duration-200 rounded-xl p-4 cursor-pointer border shadow-sm hover:shadow-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}>
                <a href="/clientes" className={`flex items-center ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <div className={`rounded-lg p-2 mr-3 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    <User className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className="font-medium text-base">Gerenciar Clientes</span>
                </a>
              </div>
              
              {/* Gerenciar Usuários */}
              <div className="bg-purple-50 hover:bg-purple-100 transition-all duration-200 rounded-xl p-4 cursor-pointer border border-purple-200 shadow-sm hover:shadow-md">
                <a href="/usuarios" className="flex items-center text-purple-700">
                  <div className="bg-purple-200 rounded-lg p-2 mr-3">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-base">Gerenciar Usuários</span>
                </a>
              </div>
              
              {/* Ver Alvarás */}
              <div className={`transition-all duration-200 rounded-xl p-4 cursor-pointer border shadow-sm hover:shadow-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}>
                <a href="/alvaras" className={`flex items-center ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <div className={`rounded-lg p-2 mr-3 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    <FileText className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className="font-medium text-base">Ver Alvarás</span>
                </a>
              </div>
              
              {/* Ver Obrigações */}
              <div className={`transition-all duration-200 rounded-xl p-4 cursor-pointer border shadow-sm hover:shadow-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}>
                <a href="/obrigacoes" className={`flex items-center ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <div className={`rounded-lg p-2 mr-3 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    <Clock className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className="font-medium text-base">Ver Obrigações</span>
                </a>
              </div>
              
              {/* Documentos */}
              <div className={`transition-all duration-200 rounded-xl p-4 cursor-pointer border shadow-sm hover:shadow-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}>
                <a href="/documentos" className={`flex items-center ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <div className={`rounded-lg p-2 mr-3 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    <FileText className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className="font-medium text-base">Documentos</span>
                </a>
              </div>
              
              {/* Administração */}
              <div className={`transition-all duration-200 rounded-xl p-4 cursor-pointer border shadow-sm hover:shadow-md ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}>
                <a href="/admin/portal-clientes" className={`flex items-center ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  <div className={`rounded-lg p-2 mr-3 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    <Shield className={`h-5 w-5 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className="font-medium text-base">Administração</span>
                </a>
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
      
    </div>
  );
}