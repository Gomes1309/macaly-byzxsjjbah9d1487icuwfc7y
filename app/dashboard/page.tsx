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
  Plus,
  Eye,
  FolderOpen,
  Activity,
  UserCheck,
  ArrowRight,
  ChevronRight,
  Shield,
  Zap,
  Upload,
  RefreshCw,
  LogOut,
  Lock
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
import { useClientes } from '@/hooks/useClientes'
import { useAlvaras } from '@/hooks/useAlvaras' 
import { useDocumentos } from '@/hooks/useDocumentos'
import { useObrigacoes } from '@/hooks/useObrigacoes'
import { useUsuarios } from '@/hooks/useUsuarios'

// Tipos para estatísticas do dashboard
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

// Valid login credentials
const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

// Helper functions for activity display
const getActivityIcon = (tipo: string) => {
  switch (tipo) {
    case 'alvara': return FileText
    case 'abertura': return Building
    case 'obrigacao': return ClipboardList
    case 'documento': return FolderOpen
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
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
  switch (status) {
    case 'success':
      return <span className={`${baseClasses} bg-green-100 text-green-800`}>Concluído</span>
    case 'warning':
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Atenção</span>
    case 'info':
      return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Informação</span>
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Padrão</span>
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const { toast } = useToast()

  // Hooks para dados reais do Supabase - SEMPRE chamados (não condicionalmente)
  const { clientes, loading: clientesLoading, refreshClientes } = useClientes()
  const { alvaras, loading: alvarasLoading, refreshAlvaras } = useAlvaras()
  const { documentos, loading: documentosLoading, refreshDocumentos } = useDocumentos()
  const { obrigacoes, loading: obrigacoesLoading, refreshObrigacoes } = useObrigacoes()
  const { usuarios, loading: usuariosLoading, refreshUsuarios } = useUsuarios()

  // Navigation function
  const navigateToPage = (path: string) => {
    router.push(path)
  }

  // Dashboard states
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

  // Estados para o Portal do Cliente
  const [portalStats, setPortalStats] = useState({
    responsaveisAtivos: 0,
    totalResponsaveis: 0,
    empresasVinculadas: 0,
    acessosHoje: 0
  })

  // Estados para Usuários do Sistema
  const [usuariosStats, setUsuariosStats] = useState({
    usuariosAtivos: 0,
    totalUsuarios: 0,
    administradores: 0,
    ultimoAcesso: null as Date | null
  })

  // Estados para dados locais dos documentos
  const [documentosLocais, setDocumentosLocais] = useState<any[]>([])
  const [clientesLocais, setClientesLocais] = useState<any[]>([])

  // Função para carregar dados locais dos documentos
  const loadDocumentosLocais = useCallback(() => {
    console.log('🔄 Carregando dados locais dos documentos...')
    
    try {
      // Carregar documentos do localStorage
      const savedDocumentos = localStorage.getItem('documentos_sistema')
      if (savedDocumentos) {
        const parsedDocumentos = JSON.parse(savedDocumentos).map((doc: any) => ({
          ...doc,
          dataUpload: new Date(doc.dataUpload)
        }))
        setDocumentosLocais(parsedDocumentos)
        console.log('📁 Documentos locais carregados:', parsedDocumentos.length)
        
        // Identificar clientes únicos dos documentos
        const clientesUnicos = new Set()
        parsedDocumentos.forEach((doc: any) => {
          if (doc.clienteId) {
            clientesUnicos.add(doc.clienteId)
          }
        })
        
        console.log('👥 Clientes únicos identificados:', clientesUnicos.size)
        
      } else {
        console.log('⚠️ Nenhum documento local encontrado')
        setDocumentosLocais([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar documentos locais:', error)
      setDocumentosLocais([])
    }
  }, [])

  // Função para carregar dados do Portal do Cliente
  const loadPortalData = useCallback(() => {
    console.log('Carregando dados do Portal do Cliente...')
    
    try {
      const savedResponsaveis = localStorage.getItem('portal_responsaveis')
      
      if (savedResponsaveis) {
        const responsaveis = JSON.parse(savedResponsaveis)
        console.log('Responsáveis encontrados:', responsaveis.length)
        
        // Calcular estatísticas
        const responsaveisAtivos = responsaveis.filter((r: any) => r.status === 'ativo').length
        const totalResponsaveis = responsaveis.length
        
        // Contar empresas únicas vinculadas
        const empresasUnicasSet = new Set()
        responsaveis.forEach((r: any) => {
          if (r.empresasIds && Array.isArray(r.empresasIds)) {
            r.empresasIds.forEach((empresaId: string) => empresasUnicasSet.add(empresaId))
          }
        })
        const empresasVinculadas = empresasUnicasSet.size
        
        setPortalStats({
          responsaveisAtivos,
          totalResponsaveis,
          empresasVinculadas,
          acessosHoje: 0 // Placeholder - implementar se necessário
        })
        
        console.log('Stats do Portal:', {
          responsaveisAtivos,
          totalResponsaveis,
          empresasVinculadas
        })
      } else {
        console.log('Nenhum responsável encontrado no localStorage')
        setPortalStats({
          responsaveisAtivos: 0,
          totalResponsaveis: 0,
          empresasVinculadas: 0,
          acessosHoje: 0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do portal:', error)
      setPortalStats({
        responsaveisAtivos: 0,
        totalResponsaveis: 0,
        empresasVinculadas: 0,
        acessosHoje: 0
      })
    }
  }, [])

  // Check authentication on load
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
    } else {
      // Pre-fill credentials for demo/production
      setLoginData({
        email: 'agassessoriacontrole@gmail.com',
        password: 'Fx21701313@@##'
      })
    }
  }, [])

  // Load dashboard data when authenticated 
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Dashboard autenticado - carregando dados...')
      loadPortalData() // Carregar dados do portal do cliente
      loadDocumentosLocais() // Carregar dados locais dos documentos
    }
  }, [isAuthenticated, loadPortalData, loadDocumentosLocais])

  // Recalcular estatísticas sempre que os dados mudarem
  useEffect(() => {
    if (isAuthenticated && clientes.length > 0) {
      console.log('🔄 Recalculando estatísticas com dados atualizados...')
      console.log('Clientes carregados:', clientes.length)
      console.log('Alvarás carregados:', alvaras.length)
      console.log('Documentos carregados:', documentos.length)
      console.log('Obrigações carregadas:', obrigacoes.length)
      
      // Recalcular estatísticas com dados reais
      const now = new Date()
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      
      const alvarasStats = {
        total: alvaras.length,
        pendentes: alvaras.filter(a => a.status === 'vencido').length,
        aprovados: alvaras.filter(a => a.status === 'em_dia').length,
        vencendoProximoMes: alvaras.filter(a => {
          const vencimento = new Date(a.dataVencimento)
          return vencimento >= now && vencimento <= nextMonth && a.status === 'vencendo'
        }).length,
        ultimaAtualizacao: new Date()
      }
      
      const obrigacoesStats = {
        total: obrigacoes.length,
        pendentes: obrigacoes.filter(o => o.status === 'pendente').length,
        cumpridas: obrigacoes.filter(o => o.status === 'cumprida').length,
        vencidas: obrigacoes.filter(o => o.status === 'atrasada').length,
        ultimaAtualizacao: new Date()
      }
      
      // Calculate document categories
      const categorias = {
        abertura_alteracao: documentos.filter(d => d.tipoDocumento === 'abertura').length,
        fiscal: documentos.filter(d => d.tipoDocumento === 'fiscal').length,
        contabil: documentos.filter(d => d.tipoDocumento === 'contabil').length,
        imposto_renda: documentos.filter(d => d.tipoDocumento === 'imposto_renda').length,
        pessoal: documentos.filter(d => d.tipoDocumento === 'pessoal').length
      }
      
      const documentosStats = {
        totalClientes: clientes.length, // Usar apenas clientes reais cadastrados
        totalDocumentos: documentos.length,
        uploadsMes: documentos.filter(d => {
          const uploadDate = new Date(d.dataUpload)
          return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear()
        }).length,
        categorias,
        ultimaAtualizacao: new Date()
      }
      
      setStats(prevStats => ({
        ...prevStats,
        alvaras: alvarasStats,
        obrigacoes: obrigacoesStats,
        documentos: documentosStats
      }))
      
      console.log('✅ Estatísticas atualizadas:', {
        totalClientes: clientes.length,
        totalAlvaras: alvaras.length,
        totalDocumentos: documentos.length,
        totalObrigacoes: obrigacoes.length
      })
    }
  }, [clientes, alvaras, documentos, obrigacoes, isAuthenticated])

  // Recalcular estatísticas dos documentos quando dados locais mudarem
  useEffect(() => {
    if (isAuthenticated && documentosLocais.length >= 0) { // >= 0 para incluir array vazio
      console.log('🔄 Recalculando estatísticas dos documentos com dados locais...')
      console.log('Documentos locais encontrados:', documentosLocais.length)
      
      try {
        const now = new Date()
        
        // Calcular categorias dos documentos locais
        const categoriasLocais = {
          abertura_alteracao: documentosLocais.filter(d => d.categoria === 'abertura_alteracao').length,
          fiscal: documentosLocais.filter(d => d.categoria === 'fiscal').length,
          contabil: documentosLocais.filter(d => d.categoria === 'contabil').length,
          trabalhista: documentosLocais.filter(d => d.categoria === 'trabalhista').length,
          societario: documentosLocais.filter(d => d.categoria === 'societario').length,
          juridico: documentosLocais.filter(d => d.categoria === 'juridico').length,
          outros: documentosLocais.filter(d => d.categoria === 'outros').length
        }
        
        // Contar clientes únicos dos documentos locais
        const clientesUnicos = new Set()
        documentosLocais.forEach(doc => {
          if (doc.clienteId) {
            clientesUnicos.add(doc.clienteId)
          }
        })
        
        // Documentos enviados este mês
        const uploadsMesLocal = documentosLocais.filter(d => {
          const uploadDate = new Date(d.dataUpload)
          return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear()
        }).length
        
        // Combinar dados locais com dados do Supabase
        const totalDocumentosCompleto = documentos.length + documentosLocais.length
        const totalClientesCompleto = Math.max(clientes.length, clientesUnicos.size)
        
        const documentosStatsCompleto = {
          totalClientes: totalClientesCompleto,
          totalDocumentos: totalDocumentosCompleto,
          uploadsMes: documentos.filter(d => {
            const uploadDate = new Date(d.dataUpload)
            return uploadDate.getMonth() === now.getMonth() && uploadDate.getFullYear() === now.getFullYear()
          }).length + uploadsMesLocal,
          categorias: {
            abertura_alteracao: documentos.filter(d => d.tipoDocumento === 'abertura').length + categoriasLocais.abertura_alteracao,
            fiscal: documentos.filter(d => d.tipoDocumento === 'fiscal').length + categoriasLocais.fiscal,
            contabil: documentos.filter(d => d.tipoDocumento === 'contabil').length + categoriasLocais.contabil,
            imposto_renda: documentos.filter(d => d.tipoDocumento === 'imposto_renda').length + categoriasLocais.trabalhista,
            pessoal: documentos.filter(d => d.tipoDocumento === 'pessoal').length + categoriasLocais.societario + categoriasLocais.juridico + categoriasLocais.outros
          },
          ultimaAtualizacao: new Date()
        }
        
        setStats(prevStats => ({
          ...prevStats,
          documentos: documentosStatsCompleto
        }))
        
        console.log('✅ Stats dos Documentos atualizadas (incluindo locais):', {
          totalClientes: totalClientesCompleto,
          totalDocumentos: totalDocumentosCompleto,
          uploadsMes: documentosStatsCompleto.uploadsMes,
          categoriasLocais
        })
      } catch (error) {
        console.error('❌ Erro ao recalcular estatísticas dos documentos locais:', error)
      }
    }
  }, [documentosLocais, documentos, clientes, isAuthenticated])

  // Recalcular estatísticas dos usuários sempre que os dados mudarem
  useEffect(() => {
    if (isAuthenticated && usuarios.length >= 0) { // >= 0 para incluir caso com 0 usuarios
      console.log('🔄 Recalculando estatísticas dos usuários com dados atualizados...')
      console.log('Usuários encontrados:', usuarios.length)
      
      try {
        // Calcular estatísticas dos usuários
        const usuariosAtivos = usuarios.filter(u => u.status === 'ativo').length
        const totalUsuarios = usuarios.length
        
        // Contar administradores (por cargo ou permissões)
        const administradores = usuarios.filter(u => 
          u.cargo?.toLowerCase().includes('admin') || 
          u.cargo?.toLowerCase().includes('gerente') ||
          (u.permissoes && Object.values(u.permissoes).some(permissao => permissao === true))
        ).length
        
        // Encontrar último acesso mais recente
        const ultimoAcesso = usuarios.reduce((latest, user) => {
          if (user.ultimoAcesso && (!latest || user.ultimoAcesso > latest)) {
            return user.ultimoAcesso
          }
          return latest
        }, null as Date | null)
        
        setUsuariosStats({
          usuariosAtivos,
          totalUsuarios,
          administradores,
          ultimoAcesso
        })
        
        console.log('✅ Stats dos Usuários atualizadas:', {
          usuariosAtivos,
          totalUsuarios,
          administradores,
          ultimoAcesso
        })
      } catch (error) {
        console.error('Erro ao recalcular estatísticas dos usuários:', error)
        setUsuariosStats({
          usuariosAtivos: 0,
          totalUsuarios: 0,
          administradores: 0,
          ultimoAcesso: null
        })
      }
    }
  }, [usuarios, isAuthenticated])

  const loadDashboardData = useCallback(async () => {
    console.log('Loading dashboard data from Supabase...')
    setIsLoading(true)
    
    try {
      // Refresh all data
      await Promise.all([
        refreshClientes(),
        refreshAlvaras(), 
        refreshDocumentos(),
        refreshObrigacoes(),
        refreshUsuarios()
      ])
      
      toast({
        title: "Dashboard atualizado",
        description: "Dados carregados com sucesso do banco de dados.",
      })
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [refreshClientes, refreshAlvaras, refreshDocumentos, refreshObrigacoes, refreshUsuarios, toast])

  // Função para atualizar dados manualmente
  const refreshAllData = useCallback(() => {
    console.log('🔄 Atualizando todos os dados...')
    loadDashboardData()
    loadPortalData()
    loadDocumentosLocais()
  }, [loadDashboardData, loadPortalData, loadDocumentosLocais])

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError('')

    console.log('🔐 Tentativa de login:', loginData.email)

    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (loginData.email === VALID_CREDENTIALS.email && 
          loginData.password === VALID_CREDENTIALS.password) {
        
        console.log('✅ Login bem-sucedido!')
        
        localStorage.setItem('auth_token', 'authenticated')
        setIsAuthenticated(true)
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema da AG Assessoria.",
        })
      } else {
        console.log('❌ Credenciais inválidas')
        setLoginError('Email ou senha inválidos. Tente novamente.')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      setLoginError('Erro interno. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />
      
      {/* Login Screen */}
      {!isAuthenticated && (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://images.pexels.com/photos/8296977/pexels-photo-8296977.jpeg?auto=compress&cs=tinysrgb&h=650&w=940)',
            }}
          >
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative z-10 max-w-md w-full mx-auto p-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="text-center mb-8">
                <div className="bg-white p-4 rounded-2xl shadow-lg inline-block mb-4">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/3u_JQXRJxk6byofZFcE0X/logo-instagram-03.png" 
                    alt="AG Assessoria" 
                    className="h-16 w-auto mx-auto"
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">AG ASSESSORIA</h1>
                <p className="text-gray-600 text-sm font-medium">SISTEMA DE CONTROLE CONTÁBIL</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-6">
                {loginError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">{loginError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="agassessoriacontrole@gmail.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/30"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50/30"
                      required
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Entrando...</span>
                    </div>
                  ) : (
                    <span>Entrar no Sistema</span>
                  )}
                </Button>
              </form>
              
              <div className="text-center mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Desenvolvido por <span className="font-semibold text-gray-700">AG ASSESSORIA CONTÁBIL</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Dashboard - Only show when authenticated */}
      {isAuthenticated && (
        <>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <div className="bg-white p-2 rounded-lg">
                    <img 
                      src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/3u_JQXRJxk6byofZFcE0X/logo-instagram-03.png" 
                      alt="AG Assessoria Logo" 
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">AG ASSESSORIA</h1>
                    <p className="text-xs text-gray-600">SISTEMA DE CONTROLE CONTÁBIL</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={() => {
                      console.log('🔄 Dashboard: Manual refresh triggered')
                      refreshAllData()
                    }}
                    variant="outline"
                    size="sm"
                    disabled={isLoading || clientesLoading || alvarasLoading || documentosLoading || obrigacoesLoading || usuariosLoading}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${(isLoading || clientesLoading || alvarasLoading || documentosLoading || obrigacoesLoading || usuariosLoading) ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>

                  
                  <Button 
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            {/* Welcome Banner */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center mb-2">
                    <div className="bg-yellow-400 text-yellow-900 p-1 rounded mr-2">
                      <span className="text-sm">🎯</span>
                    </div>
                    <h2 className="text-xl font-bold">Bem-vindo ao Sistema AG Assessoria!</h2>
                  </div>
                  <p className="text-blue-100 mb-4">
                    Sua plataforma completa para gerenciamento contábil e empresarial
                  </p>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Sistema Integrado</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span>100% Seguro</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>Gestão Completa</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {/* Alvarás Totais */}
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Alvarás Totais</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">{stats.alvaras.total}</div>
                  <div className="text-xs text-blue-600">📋 {stats.alvaras.aprovados} aprovados</div>
                </CardContent>
              </Card>

              {/* Processos Ativos */}
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Activity className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Processos Ativos</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">{stats.abertura.emAndamento}</div>
                  <div className="text-xs text-green-600">🏢 {stats.abertura.deferidos} deferidos</div>
                </CardContent>
              </Card>

              {/* Obrigações */}
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Obrigações</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">{stats.obrigacoes.total}</div>
                  <div className="text-xs text-purple-600">⏰ {stats.obrigacoes.cumpridas} cumpridas</div>
                </CardContent>
              </Card>

              {/* Documentos */}
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <FolderOpen className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Documentos</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">{stats.documentos.totalDocumentos}</div>
                  <div className="text-xs text-orange-600">📁 {stats.documentos.uploadsMes} este mês</div>
                </CardContent>
              </Card>

              {/* Atividades */}
              <Card className="bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-100 p-2 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">Atividades</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mb-1">{recentActivities.length}</div>
                  <div className="text-xs text-gray-600">🔄 Recentes</div>
                </CardContent>
              </Card>
            </div>

            {/* System Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              
              {/* Gestão de Clientes */}
              <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToPage('/clientes')}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-cyan-500 text-white p-3 rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {stats.documentos.totalClientes.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Clientes</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Cadastrar clientes e gerenciar informações
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Total de Clientes</span>
                      <span>{stats.documentos.totalClientes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🏢 Ativos</span>
                      <span>{stats.documentos.totalClientes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Ver Todos</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sistema de Alvarás */}
              <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToPage('/alvaras')}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-800 text-white p-3 rounded-xl">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div className="bg-blue-800 text-white text-xs font-bold px-2 py-1 rounded">
                      {stats.alvaras.total.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Alvarás</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Controlar e acompanhar licenças
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Alvarás Ativos</span>
                      <span>{stats.alvaras.aprovados}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📄 Crescimentos</span>
                      <span>{stats.alvaras.pendentes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Ver Todos</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sistema de Abertura de Empresas */}
              <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToPage('/abertura')}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-green-600 text-white p-3 rounded-xl">
                      <Building className="w-6 h-6" />
                    </div>
                    <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {stats.abertura.total.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sistema de Abertura</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Processos de abertura de empresas
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Processos Ativos</span>
                      <span>{stats.abertura.emAndamento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🏢 Nova Abertura</span>
                      <span>{stats.abertura.deferidos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Ver Todos</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Módulo de Obrigações */}
              <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToPage('/obrigacoes')}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-purple-600 text-white p-3 rounded-xl">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {stats.obrigacoes.total.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo de Obrigações</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Controlar obrigações e prazos
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Obrigações Ativas</span>
                      <span>{stats.obrigacoes.pendentes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📅 Nova Obrigação</span>
                      <span>{stats.obrigacoes.cumpridas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Ver Todos</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Módulo de Documentos */}
              <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToPage('/documentos')}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-emerald-600 text-white p-3 rounded-xl">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {stats.documentos.totalDocumentos.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Módulo de Documentos</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Gestão e organização documental
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Documentos Totais</span>
                      <span>{stats.documentos.totalDocumentos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📁 Novo Documento</span>
                      <span>{stats.documentos.uploadsMes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Ver Todos</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gestão de Usuários */}
              <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToPage('/usuarios')}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-teal-600 text-white p-3 rounded-xl">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div className="bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {usuariosStats.usuariosAtivos.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestão de Usuários</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Controle de acesso e permissões
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Usuários Ativos</span>
                      <span>{usuariosStats.usuariosAtivos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>👥 Total Cadastrados</span>
                      <span>{usuariosStats.totalUsuarios}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Ver Todos</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usuários Portal Cliente */}
              <Card className="bg-white hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToPage('/admin/portal-clientes')}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-xl">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {portalStats.responsaveisAtivos.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Portal do Cliente - Admin</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Cadastrar usuários do portal externo
                  </p>
                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Responsáveis Ativos</span>
                      <span>{portalStats.responsaveisAtivos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🏢 Empresas Vinculadas</span>
                      <span>{portalStats.empresasVinculadas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>📊 Ver Todos</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Atividades Recentes */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-lg font-semibold text-gray-900">Atividades Recentes</CardTitle>
                <CardDescription className="text-gray-600">
                  Últimas ações realizadas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Nenhuma atividade recente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => {
                      const ActivityIcon = getActivityIcon(activity.tipo)
                      return (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className={`p-2 rounded-full bg-white ${getActivityColor(activity.status)}`}>
                            <ActivityIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 text-sm">{activity.acao}</h4>
                              {getStatusBadge(activity.status)}
                            </div>
                            <p className="text-xs text-gray-600">{activity.descricao}</p>
                            <p className="text-xs text-gray-500">
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
        </>
      )}
    </div>
  )
}