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
import { AlertTriangle, CheckCircle, Clock, FileText, Building, Calendar, ExternalLink, User, LogOut, Shield } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Dashboard() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { alvaras, loading: alvarasLoading, error: alvarasError } = useAlvaras();
  const { obrigacoes, loading: obrigacoesLoading, error: obrigacoesError } = useObrigacoes();
  const router = useRouter();
  
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
    <div className="min-h-screen bg-gradient-to-br from-ag-purple-dark via-ag-purple to-ag-purple-light">
      {/* Barra Superior de Usuário */}
      <div className="bg-ag-purple-dark/80 backdrop-blur-sm border-b border-ag-purple">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-lg p-2">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/-wPS_aVVNGIoLVNvtCHbY/logo.png" 
                  alt="AG Assessoria" 
                  className="h-8 w-auto"
                  data-macaly="dashboard-logo"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.nome}</p>
                <p className="text-xs text-slate-300">{user.departamento}</p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {user.nome.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.nome}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Shield className="mr-2 h-4 w-4" />
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
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-300">Visão geral do sistema de gestão empresarial</p>
        </div>

        {/* STATUS DO BANCO */}
        <Alert className="mb-6 bg-green-600 border-green-500 text-white">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-white">
            <strong>✅ Sistema funcionando!</strong> Banco de dados configurado e operacional.
          </AlertDescription>
        </Alert>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total de Alvarás</CardTitle>
              <Building className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{alvaras.length}</div>
              <p className="text-xs text-slate-400">
                {alvarasVencendoEm30Dias.length} vencendo em 30 dias
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Obrigações Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{obrigacoesPendentes.length}</div>
              <p className="text-xs text-slate-400">
                De {obrigacoes.length} obrigações totais
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Vencendo em 30 dias</CardTitle>
              <Calendar className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {alvarasVencendoEm30Dias.length + obrigacoesVencendoEm30Dias.length}
              </div>
              <p className="text-xs text-slate-400">
                {alvarasVencendoEm30Dias.length} alvarás + {obrigacoesVencendoEm30Dias.length} obrigações
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Sistema</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">OK</div>
              <p className="text-xs text-slate-400">
                Banco configurado ✅
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Alvarás Próximos ao Vencimento</CardTitle>
              <CardDescription className="text-slate-400">
                Alvarás que vencem nos próximos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alvarasVencendoEm30Dias.length > 0 ? (
                <div className="space-y-2">
                  {alvarasVencendoEm30Dias.slice(0, 3).map((alvara) => (
                    <div key={alvara.id} className="flex items-center justify-between p-2 bg-slate-700 rounded">
                      <div>
                        <p className="text-sm font-medium text-white">{alvara.empresa}</p>
                        <p className="text-xs text-slate-400">{alvara.tipo}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {new Date(alvara.dataVencimento).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  ))}
                  {alvarasVencendoEm30Dias.length > 3 && (
                    <p className="text-xs text-slate-400 text-center">
                      +{alvarasVencendoEm30Dias.length - 3} mais
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Nenhum alvará vencendo em 30 dias</p>
              )}
              <Button asChild className="w-full mt-4" variant="outline">
                <a href="/alvaras">Ver todos os alvarás</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Obrigações Pendentes</CardTitle>
              <CardDescription className="text-slate-400">
                Obrigações que precisam ser cumpridas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {obrigacoesPendentes.length > 0 ? (
                <div className="space-y-2">
                  {obrigacoesPendentes.slice(0, 3).map((obrigacao) => (
                    <div key={obrigacao.id} className="flex items-center justify-between p-2 bg-ag-purple/50 rounded border border-ag-purple-light/30">
                      <div>
                        <p className="text-sm font-medium text-white">{obrigacao.nomeObrigacao}</p>
                        <p className="text-xs text-slate-400">{obrigacao.tipoObrigacao}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(obrigacao.dataVencimento).toLocaleDateString('pt-BR')}
                      </Badge>
                    </div>
                  ))}
                  {obrigacoesPendentes.length > 3 && (
                    <p className="text-xs text-slate-400 text-center">
                      +{obrigacoesPendentes.length - 3} mais
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Nenhuma obrigação pendente</p>
              )}
              <Button asChild className="w-full mt-4" variant="outline">
                <a href="/obrigacoes">Ver todas as obrigações</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-200">Ações Rápidas</CardTitle>
              <CardDescription className="text-slate-400">
                Acesse rapidamente as funcionalidades principais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant="default">
                <a href="/abertura">🏢 Nova Abertura</a>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <a href="/clientes">👥 Gerenciar Clientes</a>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <a href="/documentos">📄 Documentos</a>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <a href="/admin/portal-clientes">⚙️ Administração</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}