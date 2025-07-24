"use client"

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { useAlvaras } from '@/hooks/useAlvaras'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Plus, 
  Search,
  Shield,
  Flame,
  Building,
  Eye,
  Edit,
  Trash2,
  Download,
  LogOut,
  Lock,
  User,
  Database,
  HardDrive,
  Calendar
} from 'lucide-react'

interface Alvara {
  id: string
  empresa: string
  cnpj: string
  tipo: 'vigilancia_sanitaria' | 'bombeiro' | 'municipal'
  numeroProtocolo: string
  dataEmissao: Date
  dataVencimento: Date
  status: 'em_dia' | 'vencendo' | 'vencido'
  observacoes?: string
  responsavel: string
  contato: string
}

const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

export default function AlvaraWithSupabase() {
  const [useSupabase, setUseSupabase] = useState(false)
  const [localAlvaras, setLocalAlvaras] = useState<Alvara[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [pesquisa, setPesquisa] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedAlvara, setSelectedAlvara] = useState<Alvara | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const { toast } = useToast()

  // Supabase hook
  const { 
    alvaras: supabaseAlvaras, 
    loading: supabaseLoading, 
    error: supabaseError,
    addAlvara: addSupabaseAlvara,
    updateAlvara: updateSupabaseAlvara,
    deleteAlvara: deleteSupabaseAlvara,
    refreshAlvaras
  } = useAlvaras()

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    empresa: '',
    cnpj: '',
    tipo: 'vigilancia_sanitaria' as 'vigilancia_sanitaria' | 'bombeiro' | 'municipal',
    numeroProtocolo: '',
    dataEmissao: '',
    dataVencimento: '',
    observacoes: '',
    responsavel: '',
    contato: ''
  })

  // Escolher qual lista usar
  const alvaras = useSupabase ? supabaseAlvaras : localAlvaras
  const loading = useSupabase ? supabaseLoading : false

  // Update alvara status based on expiration date
  const updateAlvaraStatus = useCallback((alvara: Alvara): Alvara => {
    const today = new Date()
    const daysToExpire = differenceInDays(alvara.dataVencimento, today)
    
    let newStatus: Alvara['status']
    if (daysToExpire < 0) {
      newStatus = 'vencido'
    } else if (daysToExpire <= 30) {
      newStatus = 'vencendo'
    } else {
      newStatus = 'em_dia'
    }
    
    return { ...alvara, status: newStatus }
  }, [])

  // Initial setup
  useEffect(() => {
    // Check authentication
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
    }

    // Load local data
    const savedAlvaras = localStorage.getItem('alvaras')
    if (savedAlvaras) {
      try {
        const parsedAlvaras = JSON.parse(savedAlvaras).map((alvara: any) => ({
          ...alvara,
          dataEmissao: new Date(alvara.dataEmissao),
          dataVencimento: new Date(alvara.dataVencimento)
        }))
        setLocalAlvaras(parsedAlvaras.map(updateAlvaraStatus))
      } catch (error) {
        console.error('Error loading data:', error)
      }
    } else {
      // Sample data
      const sampleData: Alvara[] = [
        {
          id: '1',
          empresa: 'Restaurante Sabor Mineiro',
          cnpj: '12.345.678/0001-90',
          tipo: 'vigilancia_sanitaria',
          numeroProtocolo: 'VS-2024-001',
          dataEmissao: new Date('2024-01-15'),
          dataVencimento: new Date('2025-01-15'),
          status: 'em_dia',
          observacoes: 'Renovação sem pendências',
          responsavel: 'João Silva',
          contato: '(11) 99999-9999'
        },
        // ... outros dados de exemplo
      ]
      setLocalAlvaras(sampleData.map(updateAlvaraStatus))
    }
  }, [updateAlvaraStatus])

  // Save local data when alvaras change
  useEffect(() => {
    if (localAlvaras.length > 0 && !useSupabase) {
      localStorage.setItem('alvaras', JSON.stringify(localAlvaras))
    }
  }, [localAlvaras, useSupabase])

  // Login handler
  const handleLogin = useCallback(async () => {
    setLoginError('')
    
    if (useSupabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginData.email,
          password: loginData.password
        })
        
        if (error) throw error
        
        setIsAuthenticated(true)
        localStorage.setItem('auth_token', 'authenticated')
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema de controle de alvarás.",
        })
      } catch (error: any) {
        setLoginError(error.message || 'Erro na autenticação com Supabase')
      }
    } else {
      if (loginData.email === VALID_CREDENTIALS.email && loginData.password === VALID_CREDENTIALS.password) {
        setIsAuthenticated(true)
        localStorage.setItem('auth_token', 'authenticated')
        
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao sistema de controle de alvarás.",
        })
      } else {
        setLoginError('Email ou senha incorretos')
      }
    }
  }, [loginData, toast, useSupabase])

  // Logout handler
  const handleLogout = useCallback(async () => {
    if (useSupabase) {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Erro no logout:', error)
      }
    }
    
    setIsAuthenticated(false)
    localStorage.removeItem('auth_token')
    setLoginData({ email: '', password: '' })
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do sistema.",
    })
  }, [toast, useSupabase])

  // Add alvara handler
  const handleAddAlvara = useCallback(async () => {
    const newAlvaraData = {
      empresa: formData.empresa,
      cnpj: formData.cnpj,
      tipo: formData.tipo,
      numeroProtocolo: formData.numeroProtocolo,
      dataEmissao: new Date(formData.dataEmissao),
      dataVencimento: new Date(formData.dataVencimento),
      observacoes: formData.observacoes,
      responsavel: formData.responsavel,
      contato: formData.contato
    }

    try {
      if (useSupabase) {
        await addSupabaseAlvara(newAlvaraData)
      } else {
        const newAlvara: Alvara = {
          id: Date.now().toString(),
          ...newAlvaraData,
          status: 'em_dia'
        }
        setLocalAlvaras(prev => [...prev, updateAlvaraStatus(newAlvara)])
      }

      setFormData({
        empresa: '',
        cnpj: '',
        tipo: 'vigilancia_sanitaria',
        numeroProtocolo: '',
        dataEmissao: '',
        dataVencimento: '',
        observacoes: '',
        responsavel: '',
        contato: ''
      })
      setShowAddDialog(false)
      
      toast({
        title: "Alvará adicionado com sucesso!",
        description: `Alvará da ${newAlvaraData.empresa} foi cadastrado.`,
      })
    } catch (error) {
      toast({
        title: "Erro ao adicionar alvará",
        description: "Tente novamente.",
        variant: "destructive"
      })
    }
  }, [formData, updateAlvaraStatus, toast, useSupabase, addSupabaseAlvara])

  // Resto dos handlers similares...

  const filteredAlvaras = alvaras.filter(alvara => {
    const matchesTipo = filtroTipo === 'todos' || alvara.tipo === filtroTipo
    const matchesStatus = filtroStatus === 'todos' || alvara.status === filtroStatus
    const matchesPesquisa = alvara.empresa.toLowerCase().includes(pesquisa.toLowerCase()) ||
                           alvara.numeroProtocolo.toLowerCase().includes(pesquisa.toLowerCase()) ||
                           alvara.responsavel.toLowerCase().includes(pesquisa.toLowerCase()) ||
                           alvara.cnpj.toLowerCase().includes(pesquisa.toLowerCase())
    
    return matchesTipo && matchesStatus && matchesPesquisa
  })

  const stats = {
    total: alvaras.length,
    emDia: alvaras.filter(a => a.status === 'em_dia').length,
    vencendo: alvaras.filter(a => a.status === 'vencendo').length,
    vencidos: alvaras.filter(a => a.status === 'vencido').length
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-black/20"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/6779716/pexels-photo-6779716.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')`
          }}
        ></div>
        <Toaster />
        <div className="max-w-md w-full relative z-10">
          <Card className="shadow-2xl bg-white/95 backdrop-blur-sm border-0">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-8">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                    alt="AG Assessoria Logo" 
                    className="h-24 w-auto object-contain"
                  />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">AG ASSESSORIA</h1>
                <h2 className="text-lg font-semibold text-slate-700 mb-1">CONTABILIDADE</h2>
                <CardDescription className="text-slate-600 font-medium">
                  SISTEMA DE CONTROLE DE ALVARÁS
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Toggle para escolher entre localStorage e Supabase */}
              <div className="flex items-center justify-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <HardDrive className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Local</span>
                <Switch 
                  checked={useSupabase}
                  onCheckedChange={setUseSupabase}
                />
                <span className="text-sm font-medium text-slate-700">Supabase</span>
                <Database className="w-4 h-4 text-slate-600" />
              </div>

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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
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
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                    alt="AG Assessoria Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">AG ASSESSORIA</h1>
                  <p className="text-sm text-slate-600 font-medium">CONTROLE DE ALVARÁS</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {useSupabase ? (
                      <div className="flex items-center space-x-1">
                        <Database className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Supabase</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Local</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Alvará
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

      {/* Resto do conteúdo similar ao original... */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Stats Cards */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Total de Alvarás</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Em Dia</p>
                  <p className="text-3xl font-bold text-green-600">{stats.emDia}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Vencendo</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.vencendo}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium mb-1">Vencidos</p>
                  <p className="text-3xl font-bold text-red-600">{stats.vencidos}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Diálogos e resto do conteúdo... */}
    </div>
  )
}