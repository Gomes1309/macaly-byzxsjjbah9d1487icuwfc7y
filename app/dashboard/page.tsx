"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Building, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  Crown,
  User,
  Key,
  FileCheck,
  ClipboardList,
  UserPlus,
  Database,
  Plus,
  Eye,
  FolderOpen,
  Activity,
  UserCheck,
  ArrowRight,
  Shield,
  Zap,
  Upload,
  RefreshCw,
  LogOut
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from "next/link"

interface DashboardStats {
  alvaras: {
    total: number
    pendentes: number
    aprovados: number
    vencendoProximoMes: number
    ultimaAtualizacao: Date
  }
  abertura: {
    total: number
    emAndamento: number
    deferidos: number
    ultimaAtualizacao: Date
  }
  obrigacoes: {
    total: number
    pendentes: number
    cumpridas: number
    vencidas: number
    ultimaAtualizacao: Date
  }
  documentos: {
    totalClientes: number
    totalDocumentos: number
    uploadsMes: number
    categorias: {
      abertura_alteracao: number
      fiscal: number
      contabil: number
      imposto_renda: number
      pessoal: number
    }
    ultimaAtualizacao: Date
  }
}

interface RecentActivity {
  id: string
  tipo: 'alvara' | 'abertura' | 'obrigacao' | 'documento' | 'cliente'
  acao: string
  descricao: string
  data: Date
  status: 'success' | 'warning' | 'info'
}

interface SystemModule {
  id: string
  nome: string
  descricao: string
  icone: any
  cor: string
  path: string
  stats: {
    label: string
    value: number
    trend: 'up' | 'down' | 'stable'
  }
  acoes: {
    label: string
    onclick: () => void
    icone: any
  }[]
}

const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##',
  uid: 'e5461be6-9a76-443a-9958-cfbcf360abb9'
}

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const { toast } = useToast()

  // Login state
  const [loginError, setLoginError] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    alvaras: {
      total: 0,
      pendentes: 0,
      aprovados: 0,
      vencendoProximoMes: 0,
      ultimaAtualizacao: new Date()
    },
    abertura: {
      total: 0,
      emAndamento: 0,
      deferidos: 0,
      ultimaAtualizacao: new Date()
    },
    obrigacoes: {
      total: 0,
      pendentes: 0,
      cumpridas: 0,
      vencidas: 0,
      ultimaAtualizacao: new Date()
    },
    documentos: {
      totalClientes: 0,
      totalDocumentos: 0,
      uploadsMes: 0,
      categorias: {
        abertura_alteracao: 0,
        fiscal: 0,
        contabil: 0,
        imposto_renda: 0,
        pessoal: 0
      },
      ultimaAtualizacao: new Date()
    }
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Authentication check
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Load dashboard data
  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    }
  }, [isAuthenticated])

  const loadDashboardData = useCallback(() => {
    console.log('Loading dashboard data...')
    setIsLoading(true)
    
    // Clear old data to ensure fresh start
    const clearOldData = () => {
      localStorage.removeItem('alvaras')
      localStorage.removeItem('processos_abertura') 
      localStorage.removeItem('obrigacoes_fiscais')
      localStorage.removeItem('clientes_documentos')
      localStorage.removeItem('documentos_sistema')
      console.log('Old localStorage data cleared')
    }
    
    // Clear old data first
    clearOldData()
    
    // Load alvarás data
    const savedAlvaras = localStorage.getItem('alvaras')
    let alvarasData = []
    if (savedAlvaras) {
      try {
        alvarasData = JSON.parse(savedAlvaras)
      } catch (error) {
        console.error('Error loading alvarás:', error)
      }
    }
    
    // Load abertura data
    const savedAbertura = localStorage.getItem('processos_abertura')
    let aberturaData = []
    if (savedAbertura) {
      try {
        aberturaData = JSON.parse(savedAbertura)
      } catch (error) {
        console.error('Error loading abertura:', error)
      }
    }
    
    // Load obrigacoes data
    const savedObrigacoes = localStorage.getItem('obrigacoes_fiscais')
    let obrigacoesData = []
    if (savedObrigacoes) {
      try {
        obrigacoesData = JSON.parse(savedObrigacoes)
      } catch (error) {
        console.error('Error loading obrigações:', error)
      }
    }
    
    // Load documentos data
    const savedClientes = localStorage.getItem('clientes_documentos')
    const savedDocumentos = localStorage.getItem('documentos_sistema')
    let clientesData = []
    let documentosData = []
    
    if (savedClientes) {
      try {
        clientesData = JSON.parse(savedClientes)
      } catch (error) {
        console.error('Error loading clientes:', error)
      }
    }
    
    if (savedDocumentos) {
      try {
        documentosData = JSON.parse(savedDocumentos)
      } catch (error) {
        console.error('Error loading documentos:', error)
      }
    }
    
    // Calculate stats
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
    
    const alvarasStats = {
      total: alvarasData.length,
      pendentes: alvarasData.filter((a: any) => a.status === 'pendente').length,
      aprovados: alvarasData.filter((a: any) => a.status === 'aprovado').length,
      vencendoProximoMes: alvarasData.filter((a: any) => {
        if (a.dataVencimento) {
          const vencimento = new Date(a.dataVencimento)
          return vencimento >= now && vencimento <= nextMonth
        }
        return false
      }).length,
      ultimaAtualizacao: new Date()
    }
    
    const aberturaStats = {
      total: aberturaData.length,
      emAndamento: aberturaData.filter((a: any) => ['iniciado', 'documentacao', 'protocolado', 'em_analise'].includes(a.status)).length,
      deferidos: aberturaData.filter((a: any) => a.status === 'deferido').length,
      ultimaAtualizacao: new Date()
    }
    
    const obrigacoesStats = {
      total: obrigacoesData.length,
      pendentes: obrigacoesData.filter((o: any) => o.status === 'pendente').length,
      cumpridas: obrigacoesData.filter((o: any) => o.status === 'cumprido').length,
      vencidas: obrigacoesData.filter((o: any) => o.status === 'vencido').length,
      ultimaAtualizacao: new Date()
    }
    
    const categorias = {
      abertura_alteracao: documentosData.filter((d: any) => d.categoria === 'abertura_alteracao').length,
      fiscal: documentosData.filter((d: any) => d.categoria === 'fiscal').length,
      contabil: documentosData.filter((d: any) => d.categoria === 'contabil').length,
      imposto_renda: documentosData.filter((d: any) => d.categoria === 'imposto_renda').length,
      pessoal: documentosData.filter((d: any) => d.categoria === 'pessoal').length
    }
    
    const documentosStats = {
      totalClientes: clientesData.length,
      totalDocumentos: documentosData.length,
      uploadsMes: documentosData.filter((d: any) => {
        const uploadDate = new Date(d.dataUpload)
        return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear()
      }).length,
      categorias,
      ultimaAtualizacao: new Date()
    }
    
    setStats({
      alvaras: alvarasStats,
      abertura: aberturaStats,
      obrigacoes: obrigacoesStats,
      documentos: documentosStats
    })
    
    // Generate recent activities
    const activities: RecentActivity[] = []
    
    // Add recent alvarás activities
    alvarasData.slice(0, 2).forEach((alvara: any) => {
      activities.push({
        id: `alvara-${alvara.id}`,
        tipo: 'alvara',
        acao: 'Alvará criado',
        descricao: `${alvara.nomeEmpresa} - ${alvara.tipoAlvara}`,
        data: new Date(alvara.dataSubmissao),
        status: alvara.status === 'aprovado' ? 'success' : 'warning'
      })
    })
    
    // Add recent abertura activities
    aberturaData.slice(0, 2).forEach((processo: any) => {
      activities.push({
        id: `abertura-${processo.id}`,
        tipo: 'abertura',
        acao: 'Processo de abertura iniciado',
        descricao: `${processo.nomeEmpresa} - ${processo.tipoEmpresa.toUpperCase()}`,
        data: new Date(processo.dataInicio),
        status: processo.status === 'deferido' ? 'success' : 'info'
      })
    })
    
    // Add recent obrigações activities
    obrigacoesData.slice(0, 2).forEach((obrigacao: any) => {
      activities.push({
        id: `obrigacao-${obrigacao.id}`,
        tipo: 'obrigacao',
        acao: obrigacao.status === 'cumprido' ? 'Obrigação cumprida' : 'Obrigação pendente',
        descricao: `${obrigacao.codigo} - ${obrigacao.nome}`,
        data: obrigacao.dataCumprimento ? new Date(obrigacao.dataCumprimento) : new Date(obrigacao.dataVencimento),
        status: obrigacao.status === 'cumprido' ? 'success' : obrigacao.status === 'vencido' ? 'warning' : 'info'
      })
    })
    
    // Add recent documentos activities
    documentosData.slice(0, 2).forEach((doc: any) => {
      activities.push({
        id: `doc-${doc.id}`,
        tipo: 'documento',
        acao: 'Documento enviado',
        descricao: `${doc.nome} - ${doc.nomeOriginal}`,
        data: new Date(doc.dataUpload),
        status: 'info'
      })
    })
    
    // Add recent clientes activities
    clientesData.slice(0, 2).forEach((cliente: any) => {
      activities.push({
        id: `cliente-${cliente.id}`,
        tipo: 'cliente',
        acao: 'Cliente cadastrado',
        descricao: `${cliente.nome} - ${cliente.cnpj}`,
        data: new Date(cliente.dataCadastro),
        status: 'success'
      })
    })
    
    // Sort by date and take latest 8
    activities.sort((a, b) => b.data.getTime() - a.data.getTime())
    setRecentActivities(activities.slice(0, 8))
    
    setIsLoading(false)
    
    toast({
      title: "Dashboard atualizado",
      description: "Dados carregados com sucesso.",
    })
  }, [toast])

  // Clear all data handler
  const handleClearAllData = useCallback(() => {
    console.log('Clearing all localStorage data...')
    localStorage.removeItem('alvaras')
    localStorage.removeItem('processos_abertura') 
    localStorage.removeItem('obrigacoes_fiscais')
    localStorage.removeItem('clientes_documentos')
    localStorage.removeItem('documentos_sistema')
    
    // Reset stats to zero
    setStats({
      alvaras: {
        total: 0,
        pendentes: 0,
        aprovados: 0,
        vencendoProximoMes: 0,
        ultimaAtualizacao: new Date()
      },
      abertura: {
        total: 0,
        emAndamento: 0,
        deferidos: 0,
        ultimaAtualizacao: new Date()
      },
      obrigacoes: {
        total: 0,
        pendentes: 0,
        cumpridas: 0,
        vencidas: 0,
        ultimaAtualizacao: new Date()
      },
      documentos: {
        totalClientes: 0,
        totalDocumentos: 0,
        uploadsMes: 0,
        categorias: {
          abertura_alteracao: 0,
          fiscal: 0,
          contabil: 0,
          imposto_renda: 0,
          pessoal: 0
        },
        ultimaAtualizacao: new Date()
      }
    })
    
    setRecentActivities([])
    
    toast({
      title: "Dados limpos com sucesso!",
      description: "Todos os dados foram removidos do sistema.",
    })
  }, [toast])

  // Login handler
  const handleLogin = useCallback(() => {
    console.log('Login attempt:', loginData)
    setLoginError('')
    
    if (loginData.email === VALID_CREDENTIALS.email && loginData.password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true)
      localStorage.setItem('auth_token', 'authenticated')
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema da AG Assessoria.",
      })
    } else {
      setLoginError('Email ou senha incorretos')
    }
  }, [loginData, toast])

  // Logout handler
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false)
    localStorage.removeItem('auth_token')
    setLoginData({ email: '', password: '' })
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema.",
    })
  }, [toast])

  // System modules configuration
  const systemModules: SystemModule[] = [
    {
      id: 'alvaras',
      nome: 'Sistema de Alvarás',
      descricao: 'Gerenciamento completo de alvarás e licenças',
      icone: Building,
      cor: 'blue',
      path: '/alvaras',
      stats: {
        label: 'Alvarás Ativos',
        value: stats.alvaras.total,
        trend: 'up'
      },
      acoes: [
        {
          label: 'Novo Alvará',
          onclick: () => {},
          icone: Plus
        },
        {
          label: 'Ver Todos',
          onclick: () => {},
          icone: Eye
        }
      ]
    },
    {
      id: 'abertura',
      nome: 'Sistema de Abertura',
      descricao: 'Processos de abertura e alteração de empresas',
      icone: Building,
      cor: 'emerald',
      path: '/abertura',
      stats: {
        label: 'Processos Ativos',
        value: stats.abertura.emAndamento,
        trend: 'up'
      },
      acoes: [
        {
          label: 'Nova Abertura',
          onclick: () => {},
          icone: Plus
        },
        {
          label: 'Ver Todos',
          onclick: () => {},
          icone: Eye
        }
      ]
    },
    {
      id: 'obrigacoes',
      nome: 'Sistema de Obrigações',
      descricao: 'Controle de obrigações fiscais e prazos',
      icone: FileCheck,
      cor: 'purple',
      path: '/obrigacoes',
      stats: {
        label: 'Obrigações Ativas',
        value: stats.obrigacoes.pendentes + stats.obrigacoes.vencidas,
        trend: 'up'
      },
      acoes: [
        {
          label: 'Nova Obrigação',
          onclick: () => {},
          icone: Plus
        },
        {
          label: 'Ver Todas',
          onclick: () => {},
          icone: Eye
        }
      ]
    },
    {
      id: 'documentos',
      nome: 'Sistema de Documentos',
      descricao: 'Organização de documentos por cliente e categoria',
      icone: FolderOpen,
      cor: 'green',
      path: '/documentos',
      stats: {
        label: 'Documentos Totais',
        value: stats.documentos.totalDocumentos,
        trend: 'up'
      },
      acoes: [
        {
          label: 'Novo Cliente',
          onclick: () => {},
          icone: Plus
        },
        {
          label: 'Ver Todos',
          onclick: () => {},
          icone: Eye
        }
      ]
    }
  ]

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'alvara': return Building
      case 'abertura': return Building
      case 'obrigacao': return FileCheck
      case 'documento': return FileText
      case 'cliente': return Users
      default: return Activity
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'info': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
      case 'info': return <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
      default: return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  // Login Component
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-white/10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/6779714/pexels-photo-6779714.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')`
          }}
        ></div>
        <Toaster />
        <div className="max-w-md w-full relative z-10">
          <Card className="shadow-2xl bg-white/95 backdrop-blur-sm border-0">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-8">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png" 
                    alt="AG Assessoria Logo" 
                    className="h-20 w-auto object-contain"
                  />
                </div>
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  AG ASSESSORIA
                </CardTitle>
                <CardDescription className="text-slate-700 font-semibold text-lg">
                  SISTEMA DE CONTROLE CONTÁBIL
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="email"
                    placeholder="Digite seu email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    autoComplete="current-password"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Digite sua senha"
                  />
                </div>
              </div>
              
              {loginError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {loginError}
                </div>
              )}
              
              <Button 
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
                disabled={!loginData.email || !loginData.password}
              >
                Entrar no Sistema
              </Button>
              
              <div className="text-center pt-4">
                <p className="text-xs text-slate-500">
                  Desenvolvimento por <span className="font-semibold text-slate-700">AG ASSESSORIA CONTÁBIL</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png" 
                    alt="AG Assessoria Logo" 
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">AG ASSESSORIA</h1>
                  <p className="text-sm text-slate-600 font-medium">SISTEMA DE CONTROLE CONTÁBIL</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={loadDashboardData}
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Carregando...' : 'Atualizar'}
              </Button>
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">🎉 Bem-vindo ao Sistema AG Assessoria!</h2>
              <p className="text-blue-100 text-lg mb-2">
                Sua plataforma completa para gerenciamento contábil e empresarial
              </p>
              <div className="mt-6 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-sm">Sistema Integrado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-300" />
                  <span className="text-sm">100% Seguro</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm">Gestão Completa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-blue-500 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div 
                onClick={() => router.push('/alvaras')}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium group-hover:text-blue-600 transition-colors">Alvarás Totais</p>
                    <p className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300">{stats.alvaras.total}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200 transition-colors duration-300">
                    <Building className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{stats.alvaras.aprovados} aprovados</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-emerald-500 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div 
                onClick={() => router.push('/abertura')}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium group-hover:text-emerald-600 transition-colors">Aberturas Ativas</p>
                    <p className="text-3xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors duration-300">{stats.abertura.emAndamento}</p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-full group-hover:bg-emerald-200 transition-colors duration-300">
                    <Building className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{stats.abertura.deferidos} deferidos</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-purple-500 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div 
                onClick={() => router.push('/obrigacoes')}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium group-hover:text-purple-600 transition-colors">Obrigações</p>
                    <p className="text-3xl font-bold text-slate-800 group-hover:text-purple-600 transition-colors duration-300">{stats.obrigacoes.total}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full group-hover:bg-purple-200 transition-colors duration-300">
                    <FileCheck className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{stats.obrigacoes.cumpridas} cumpridas</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-green-500 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div 
                onClick={() => router.push('/documentos')}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium group-hover:text-green-600 transition-colors">Documentos</p>
                    <p className="text-3xl font-bold text-slate-800 group-hover:text-green-600 transition-colors duration-300">{stats.documentos.totalDocumentos}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full group-hover:bg-green-200 transition-colors duration-300">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Upload className="w-4 h-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">+{stats.documentos.uploadsMes} este mês</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-orange-500 hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <div 
                onClick={() => router.push('/admin/clientes')}
                className="cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium group-hover:text-orange-600 transition-colors">Clientes</p>
                    <p className="text-3xl font-bold text-slate-800 group-hover:text-orange-600 transition-colors duration-300">{stats.documentos.totalClientes}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-full group-hover:bg-orange-200 transition-colors duration-300">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <Activity className="w-4 h-4 text-orange-600 mr-1" />
                  <span className="text-sm text-orange-600 font-medium">Ativos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
          {/* Gestão de Clientes Card */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Link href="/admin/clientes" className="block h-full">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg group-hover:from-cyan-50 group-hover:to-blue-100 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-cyan-100 p-3 rounded-full group-hover:bg-cyan-200 group-hover:scale-110 transition-all duration-300">
                      <UserCheck className="w-8 h-8 text-cyan-600" />
                    </div>
                    <div>
                      <CardTitle className="text-blue-700 font-bold text-lg group-hover:text-blue-800">Gestão de Clientes</CardTitle>
                      <CardDescription className="text-slate-600 group-hover:text-slate-700">Cadastrar e gerenciar clientes</CardDescription>
                    </div>
                  </div>
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 group-hover:scale-110">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div 
                    onClick={() => router.push('/admin/clientes')}
                    className="cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm text-slate-600 font-medium group-hover:text-cyan-600 transition-colors">Total de Clientes</p>
                      <p className="text-2xl font-bold text-slate-800 group-hover:text-cyan-600 transition-colors duration-300">{stats.documentos.totalClientes}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Crescimento</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-slate-600 group-hover:border-cyan-300 group-hover:text-cyan-600 transition-colors duration-300">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Cliente
                  </Badge>
                  <Badge variant="outline" className="text-slate-600 group-hover:border-cyan-300 group-hover:text-cyan-600 transition-colors duration-300">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Todos
                  </Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Portal do Cliente Card */}
          <Card className="bg-white shadow-lg border-0 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group">
            <Link href="/clientes" className="block h-full">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg group-hover:from-indigo-50 group-hover:to-blue-100 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-indigo-100 p-3 rounded-full group-hover:bg-indigo-200 group-hover:scale-110 transition-all duration-300">
                      <Shield className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-blue-700 font-bold text-lg group-hover:text-blue-800">Portal do Cliente</CardTitle>
                      <CardDescription className="text-slate-600 group-hover:text-slate-700">Acesso direto aos documentos</CardDescription>
                    </div>
                  </div>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 group-hover:scale-110">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div 
                    onClick={() => router.push('/clientes')}
                    className="cursor-pointer group"
                  >
                    <div>
                      <p className="text-sm text-slate-600 font-medium group-hover:text-indigo-600 transition-colors">Clientes Ativos</p>
                      <p className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors duration-300">{stats.documentos.totalClientes}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Autônomo</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-slate-600 group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors duration-300">
                    <User className="w-4 h-4 mr-2" />
                    Acessar Portal
                  </Badge>
                  <Badge variant="outline" className="text-slate-600 group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors duration-300">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Dados
                  </Badge>
                </div>
              </CardContent>
            </Link>
          </Card>

          {systemModules.map((module) => {
            const Icon = module.icone
            const getColorClasses = (color: string) => {
              switch (color) {
                case 'blue': return {
                  iconBg: 'bg-blue-100',
                  iconColor: 'text-blue-600',
                  buttonBg: 'bg-blue-600 hover:bg-blue-700',
                  hoverBg: 'group-hover:bg-blue-200',
                  hoverText: 'group-hover:text-blue-600',
                  hoverBorder: 'group-hover:border-blue-300'
                }
                case 'emerald': return {
                  iconBg: 'bg-emerald-100',
                  iconColor: 'text-emerald-600',
                  buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
                  hoverBg: 'group-hover:bg-emerald-200',
                  hoverText: 'group-hover:text-emerald-600',
                  hoverBorder: 'group-hover:border-emerald-300'
                }
                case 'purple': return {
                  iconBg: 'bg-purple-100',
                  iconColor: 'text-purple-600',
                  buttonBg: 'bg-purple-600 hover:bg-purple-700',
                  hoverBg: 'group-hover:bg-purple-200',
                  hoverText: 'group-hover:text-purple-600',
                  hoverBorder: 'group-hover:border-purple-300'
                }
                case 'green': return {
                  iconBg: 'bg-green-100',
                  iconColor: 'text-green-600',
                  buttonBg: 'bg-green-600 hover:bg-green-700',
                  hoverBg: 'group-hover:bg-green-200',
                  hoverText: 'group-hover:text-green-600',
                  hoverBorder: 'group-hover:border-green-300'
                }
                default: return {
                  iconBg: 'bg-gray-100',
                  iconColor: 'text-gray-600',
                  buttonBg: 'bg-gray-600 hover:bg-gray-700',
                  hoverBg: 'group-hover:bg-gray-200',
                  hoverText: 'group-hover:text-gray-600',
                  hoverBorder: 'group-hover:border-gray-300'
                }
              }
            }
            const colors = getColorClasses(module.cor)
            
            return (
              <Card key={module.id} className="bg-white shadow-lg border-0 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                <Link href={module.path} className="block h-full">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg group-hover:from-slate-100 group-hover:to-blue-100 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`${colors.iconBg} ${colors.hoverBg} p-3 rounded-full group-hover:scale-110 transition-all duration-300`}>
                          <Icon className={`w-8 h-8 ${colors.iconColor}`} />
                        </div>
                        <div>
                          <CardTitle className="text-blue-700 font-bold text-lg group-hover:text-blue-800">{module.nome}</CardTitle>
                          <CardDescription className="text-slate-600 group-hover:text-slate-700">{module.descricao}</CardDescription>
                        </div>
                      </div>
                      <Button className={`${colors.buttonBg} text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 group-hover:scale-110`}>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div 
                        onClick={() => router.push(module.path)}
                        className="cursor-pointer group"
                      >
                        <div>
                          <p className="text-sm text-slate-600 font-medium group-hover:text-blue-600 transition-colors">{module.stats.label}</p>
                          <p className={`text-2xl font-bold text-slate-800 ${colors.hoverText} transition-colors duration-300`}>{module.stats.value}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Crescimento</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {module.acoes.map((acao, index) => {
                        const ActionIcon = acao.icone
                        return (
                          <Badge key={index} variant="outline" className={`text-slate-600 ${colors.hoverBorder} ${colors.hoverText} transition-colors duration-300`}>
                            <ActionIcon className="w-4 h-4 mr-2" />
                            {acao.label}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>

        {/* Recent Activity */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-blue-700 font-bold text-lg">Atividades Recentes</CardTitle>
            <CardDescription className="text-slate-600">
              Últimas ações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-slate-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.tipo)
                  return (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.status)} bg-white`}>
                        <ActivityIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-800">{activity.acao}</h4>
                          {getStatusBadge(activity.status)}
                        </div>
                        <p className="text-sm text-slate-600">{activity.descricao}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(activity.data, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}