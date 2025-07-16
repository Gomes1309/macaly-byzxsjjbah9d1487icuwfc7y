"use client"

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { useAlvaras } from '@/hooks/useAlvaras'
import { AuthService } from '@/lib/supabase'
import { setupDatabase } from '@/lib/database-setup'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

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
  User
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

export default function SistemaAlvara() {
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
    alvaras, 
    loading, 
    error,
    addAlvara,
    updateAlvara,
    deleteAlvara,
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

  // Initial setup
  useEffect(() => {
    // Check authentication
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
      // Setup database when authenticated
      setupDatabase().then(result => {
        if (result.success) {
          console.log('Database setup concluído!')
        } else {
          console.error('Erro no setup do database:', result.error)
        }
      })
    }
  }, [])

  // Login handler
  const handleLogin = useCallback(async () => {
    setLoginError('')
    
    try {
      await AuthService.signIn(loginData.email, loginData.password)
      setIsAuthenticated(true)
      localStorage.setItem('auth_token', 'authenticated')
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Conectado ao Supabase com sucesso.",
      })
    } catch (error) {
      console.error('Erro no login:', error)
      setLoginError('Email ou senha incorretos')
    }
  }, [loginData, toast])

  // Logout handler
  const handleLogout = useCallback(async () => {
    try {
      await AuthService.signOut()
    } catch (error) {
      console.error('Erro no logout:', error)
    }
    
    setIsAuthenticated(false)
    localStorage.removeItem('auth_token')
    setLoginData({ email: '', password: '' })
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do Supabase.",
    })
  }, [toast])

  // Add alvara handler
  const handleAddAlvara = useCallback(async () => {
    try {
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

      await addAlvara(newAlvaraData)
      
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
        description: `Alvará da ${newAlvaraData.empresa} foi cadastrado no Supabase.`,
      })
    } catch (error) {
      console.error('Erro ao adicionar alvará:', error)
      toast({
        title: "Erro ao adicionar alvará",
        description: "Tente novamente.",
        variant: "destructive"
      })
    }
  }, [formData, addAlvara, toast])

  // Delete alvara handler
  const handleDeleteAlvara = useCallback(async (id: string) => {
    try {
      const alvara = alvaras.find(a => a.id === id)
      await deleteAlvara(id)
      
      toast({
        title: "Alvará removido",
        description: `Alvará da ${alvara?.empresa} foi removido do Supabase.`,
      })
    } catch (error) {
      console.error('Erro ao deletar alvará:', error)
      toast({
        title: "Erro ao deletar alvará",
        description: "Tente novamente.",
        variant: "destructive"
      })
    }
  }, [alvaras, deleteAlvara, toast])

  // Filter alvaras
  const filteredAlvaras = alvaras.filter(alvara => {
    try {
      const matchesTipo = filtroTipo === 'todos' || alvara.tipo === filtroTipo
      const matchesStatus = filtroStatus === 'todos' || alvara.status === filtroStatus
      
      // Validação robusta para pesquisa - garantir que valores existam antes de fazer .toLowerCase()
      const empresa = (alvara.empresa || '').toString().toLowerCase()
      const numeroProtocolo = (alvara.numeroProtocolo || '').toString().toLowerCase()
      const responsavel = (alvara.responsavel || '').toString().toLowerCase()
      const cnpj = (alvara.cnpj || '').toString().toLowerCase()
      const termoPesquisa = pesquisa.toLowerCase()
      
      const matchesPesquisa = pesquisa === '' || 
                             empresa.includes(termoPesquisa) ||
                             numeroProtocolo.includes(termoPesquisa) ||
                             responsavel.includes(termoPesquisa) ||
                             cnpj.includes(termoPesquisa)
      
      return matchesTipo && matchesStatus && matchesPesquisa
    } catch (error) {
      console.error('Erro ao filtrar alvará:', error, alvara)
      return false
    }
  })

  // Calculate stats
  const stats = {
    total: alvaras.length,
    emDia: alvaras.filter(a => a.status === 'em_dia').length,
    vencendo: alvaras.filter(a => a.status === 'vencendo').length,
    vencidos: alvaras.filter(a => a.status === 'vencido').length
  }

  // Helper functions
  const getStatusBadge = (status: Alvara['status']) => {
    const configs = {
      em_dia: { label: 'Em Dia', className: 'bg-green-100 text-green-800 border-green-200' },
      vencendo: { label: 'Vencendo', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      vencido: { label: 'Vencido', className: 'bg-red-100 text-red-800 border-red-200' }
    }
    const config = configs[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getTipoIcon = (tipo: Alvara['tipo']) => {
    if (tipo === 'vigilancia_sanitaria') return <Shield className="w-4 h-4" />
    if (tipo === 'bombeiro') return <Flame className="w-4 h-4" />
    return <Building className="w-4 h-4" />
  }

  const getTipoLabel = (tipo: Alvara['tipo']) => {
    if (tipo === 'vigilancia_sanitaria') return 'Vigilância Sanitária'
    if (tipo === 'bombeiro') return 'Corpo de Bombeiros'
    return 'Municipal'
  }

  const handleStatCardClick = (status: string) => {
    setFiltroStatus(status)
    setFiltroTipo('todos')
    setPesquisa('')
  }

  // View alvara handler
  const handleViewAlvara = useCallback((alvara: Alvara) => {
    setSelectedAlvara(alvara)
    setShowViewDialog(true)
  }, [])

  // Edit alvara handler
  const handleEditAlvara = useCallback((alvara: Alvara) => {
    setSelectedAlvara(alvara)
    setFormData({
      empresa: alvara.empresa,
      cnpj: alvara.cnpj,
      tipo: alvara.tipo,
      numeroProtocolo: alvara.numeroProtocolo,
      dataEmissao: format(alvara.dataEmissao, 'yyyy-MM-dd'),
      dataVencimento: format(alvara.dataVencimento, 'yyyy-MM-dd'),
      observacoes: alvara.observacoes || '',
      responsavel: alvara.responsavel,
      contato: alvara.contato
    })
    setShowEditDialog(true)
  }, [])

  // Update alvara handler
  const handleUpdateAlvara = useCallback(async () => {
    if (!selectedAlvara) return
    
    try {
      const updatedData = {
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

      await updateAlvara(selectedAlvara.id, updatedData)
      
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
      setShowEditDialog(false)
      setSelectedAlvara(null)
      
      toast({
        title: "Alvará atualizado com sucesso!",
        description: `Alvará da ${updatedData.empresa} foi atualizado no Supabase.`,
      })
    } catch (error) {
      console.error('Erro ao atualizar alvará:', error)
      toast({
        title: "Erro ao atualizar alvará",
        description: "Tente novamente.",
        variant: "destructive"
      })
    }
  }, [formData, selectedAlvara, updateAlvara, toast])

  // Export handler
  const handleExport = useCallback(() => {
    console.log('Iniciando exportação PDF...', filteredAlvaras.length, 'alvarás')
    
    if (filteredAlvaras.length === 0) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Não há alvarás para exportar com os filtros aplicados.",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('Criando documento PDF...')
      
      // Test PDF creation
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      console.log('Documento criado, adicionando cabeçalho...')
      
      // Cabeçalho
      doc.setFontSize(20)
      doc.text('AG ASSESSORIA CONTÁBIL', 20, 20)
      
      doc.setFontSize(16)
      doc.text('Relatório de Alvarás', 20, 30)
      
      doc.setFontSize(12)
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 40)
      doc.text(`Total de alvarás: ${filteredAlvaras.length}`, 20, 50)
      
      console.log('Preparando dados da tabela...')
      
      // Dados da tabela - validar e converter todos os valores
      const tableData = filteredAlvaras.map(alvara => [
        String(alvara.empresa || '').trim(),
        String(alvara.cnpj || '').trim(),
        String(getTipoLabel(alvara.tipo) || '').trim(),
        String(alvara.numeroProtocolo || '').trim(),
        String(alvara.responsavel || '').trim(),
        format(alvara.dataEmissao, 'dd/MM/yyyy'),
        format(alvara.dataVencimento, 'dd/MM/yyyy'),
        alvara.status === 'em_dia' ? 'Em Dia' : alvara.status === 'vencendo' ? 'Vencendo' : 'Vencido'
      ])
      
      console.log('Dados da tabela preparados:', tableData.length, 'linhas')
      
      // Cabeçalhos da tabela
      const headers = [
        ['Empresa', 'CNPJ', 'Tipo', 'Protocolo', 'Responsável', 'Emissão', 'Vencimento', 'Status']
      ]
      
      console.log('Adicionando tabela ao PDF...')
      
      // Verificar se autoTable está disponível
      if (typeof doc.autoTable === 'function') {
        console.log('autoTable está disponível')
        
        // Adiciona a tabela
        doc.autoTable({
          head: headers,
          body: tableData,
          startY: 60,
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [37, 99, 235], // blue-600
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252], // slate-50
          },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 30 },
            2: { cellWidth: 30 },
            3: { cellWidth: 30 },
            4: { cellWidth: 30 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 },
            7: { cellWidth: 20 },
          },
        })
      } else {
        console.log('autoTable não está disponível, criando PDF simples...')
        
        // Criar PDF simples sem tabela
        let y = 70
        doc.setFontSize(10)
        
        // Adiciona cabeçalhos
        doc.text('Empresa', 20, y)
        doc.text('CNPJ', 80, y)
        doc.text('Tipo', 120, y)
        doc.text('Status', 160, y)
        y += 10
        
        // Adiciona dados com validação rigorosa
        filteredAlvaras.forEach((alvara, index) => {
          console.log(`Processando alvará ${index + 1}:`, alvara)
          
          try {
            // Validar e converter valores para string - usando apenas textos simples
            const empresa = (alvara.empresa || 'N/A').toString().substring(0, 25)
            const cnpj = (alvara.cnpj || 'N/A').toString().substring(0, 18)
            const tipo = (getTipoLabel(alvara.tipo) || 'N/A').toString().substring(0, 15)
            const status = alvara.status === 'em_dia' ? 'Em Dia' : alvara.status === 'vencendo' ? 'Vencendo' : 'Vencido'
            
            console.log(`Valores para PDF:`, { empresa, cnpj, tipo, status })
            
            // Adicionar texto com coordenadas fixas
            doc.text(empresa, 20, y)
            doc.text(cnpj, 80, y)
            doc.text(tipo, 120, y)
            doc.text(status, 160, y)
            
            y += 10
            
            // Quebra de página se necessário
            if (y > 180) {
              doc.addPage()
              y = 20
            }
          } catch (itemError) {
            console.error(`Erro ao processar alvará ${index + 1}:`, itemError)
            // Pular este item e continuar
          }
        })
      }
      
      console.log('Salvando PDF...')
      
      // Salva o PDF
      const fileName = `relatorio_alvaras_${format(new Date(), 'dd-MM-yyyy')}.pdf`
      doc.save(fileName)
      
      console.log('PDF gerado com sucesso!', fileName)
      
      toast({
        title: "Exportação realizada com sucesso!",
        description: `${filteredAlvaras.length} alvarás exportados para PDF.`,
      })
      
    } catch (error) {
      console.error('Erro na exportação:', error)
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      toast({
        title: "Erro na exportação",
        description: `Houve um problema ao gerar o PDF: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive"
      })
    }
  }, [filteredAlvaras, getTipoLabel, toast])

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
                <CardDescription className="text-slate-700 font-semibold text-lg">
                  SISTEMA DE CONTROLE DE ALVARÁS
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
                  <p className="text-sm text-slate-600 font-medium">CONTROLE DE ALVARÁS</p>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-slate-600">Carregando dados do Supabase...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-medium">Erro ao carregar dados: {error}</p>
            {error.includes('42P01') && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">📋 Configuração Necessária:</p>
                <p className="text-blue-700 mt-2">
                  A tabela do banco de dados precisa ser criada. Siga os passos:
                </p>
                <ol className="mt-3 text-blue-700 list-decimal list-inside space-y-1">
                  <li>
                    Acesse o painel do Supabase: 
                    <a 
                      href="https://supabase.com/dashboard/project/sctlaitmqghnoxiqmbiw/sql" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 underline hover:text-blue-800"
                    >
                      SQL Editor
                    </a>
                  </li>
                  <li>Execute o script que está no arquivo <code className="bg-blue-100 px-1 rounded">supabase_schema.sql</code></li>
                  <li>Atualize esta página após executar o script</li>
                </ol>
                <div className="mt-4">
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-blue-500 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105" onClick={() => handleStatCardClick('todos')}>
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
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-green-500 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105" onClick={() => handleStatCardClick('em_dia')}>
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
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-yellow-500 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105" onClick={() => handleStatCardClick('vencendo')}>
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
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-red-500 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105" onClick={() => handleStatCardClick('vencido')}>
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

        {/* Filters */}
        <Card className="mb-6 bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-blue-700 font-bold text-lg">Filtros e Pesquisa</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="pesquisa" className="text-slate-700 font-medium">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    id="pesquisa"
                    placeholder="Empresa, CNPJ, protocolo ou responsável..."
                    value={pesquisa}
                    onChange={(e) => {
                      console.log('Pesquisa alterada:', e.target.value)
                      setPesquisa(e.target.value)
                    }}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="filtro-tipo" className="text-slate-700 font-medium">Tipo de Alvará</Label>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="vigilancia_sanitaria">Vigilância Sanitária</SelectItem>
                    <SelectItem value="bombeiro">Corpo de Bombeiros</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="filtro-status" className="text-slate-700 font-medium">Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="em_dia">Em Dia</SelectItem>
                    <SelectItem value="vencendo">Vencendo</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 font-medium rounded-lg transition-colors duration-200"
                  onClick={() => {
                    console.log('Botão de exportar clicado!')
                    handleExport()
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alvarás List */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-blue-700 font-bold text-lg">Lista de Alvarás</CardTitle>
            <CardDescription className="text-slate-600">
              Gerencie todos os alvarás da sua empresa em um só lugar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {filteredAlvaras.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-500 text-lg">Nenhum alvará encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredAlvaras.map((alvara) => (
                  <Card key={alvara.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="bg-blue-100 p-2 rounded-full">
                              {getTipoIcon(alvara.tipo)}
                            </div>
                            <h3 className="font-bold text-lg text-slate-800">{alvara.empresa}</h3>
                            {getStatusBadge(alvara.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <p className="text-slate-600">
                                <span className="font-semibold text-slate-700">CNPJ:</span> {alvara.cnpj}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-semibold text-slate-700">Tipo:</span> {getTipoLabel(alvara.tipo)}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-semibold text-slate-700">Protocolo:</span> {alvara.numeroProtocolo}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-semibold text-slate-700">Responsável:</span> {alvara.responsavel}
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-slate-600">
                                <span className="font-semibold text-slate-700">Emissão:</span> {format(alvara.dataEmissao, 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-semibold text-slate-700">Vencimento:</span> {format(alvara.dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                              <p className="text-slate-600">
                                <span className="font-semibold text-slate-700">Contato:</span> {alvara.contato}
                              </p>
                            </div>
                          </div>
                          
                          {alvara.observacoes && (
                            <div className="mt-4 p-3 bg-slate-50 rounded-md">
                              <p className="text-sm text-slate-700">
                                <span className="font-semibold">Observações:</span> {alvara.observacoes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                            onClick={() => handleViewAlvara(alvara)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                            onClick={() => handleEditAlvara(alvara)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 transition-colors duration-200"
                            onClick={() => handleDeleteAlvara(alvara.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Desenvolvimento por <span className="font-bold text-blue-600">AG ASSESSORIA CONTÁBIL</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Alvará</DialogTitle>
            <DialogDescription>
              Adicione um novo alvará ao sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="empresa">Empresa *</Label>
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                  placeholder="Nome da empresa"
                  className="border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo de Alvará *</Label>
                <Select value={formData.tipo} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vigilancia_sanitaria">Vigilância Sanitária</SelectItem>
                    <SelectItem value="bombeiro">Corpo de Bombeiros</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numeroProtocolo">Número do Protocolo *</Label>
                <Input
                  id="numeroProtocolo"
                  value={formData.numeroProtocolo}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroProtocolo: e.target.value }))}
                  placeholder="Ex: VS-2024-001"
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataEmissao">Data de Emissão *</Label>
                <Input
                  id="dataEmissao"
                  type="date"
                  value={formData.dataEmissao}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataEmissao: e.target.value }))}
                  className="border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={formData.dataVencimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataVencimento: e.target.value }))}
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="responsavel">Responsável *</Label>
                <Input
                  id="responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                  className="border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="contato">Contato *</Label>
                <Input
                  id="contato"
                  value={formData.contato}
                  onChange={(e) => setFormData(prev => ({ ...prev, contato: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais (opcional)"
                className="border-slate-300"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddAlvara}
                disabled={!formData.empresa || !formData.cnpj || !formData.numeroProtocolo || !formData.dataEmissao || !formData.dataVencimento || !formData.responsavel || !formData.contato}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Adicionar Alvará
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Visualizar Alvará</DialogTitle>
            <DialogDescription>
              Detalhes do alvará selecionado
            </DialogDescription>
          </DialogHeader>
          {selectedAlvara && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Empresa</Label>
                  <p className="text-slate-900 font-semibold">{selectedAlvara.empresa}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">CNPJ</Label>
                  <p className="text-slate-900">{selectedAlvara.cnpj}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Tipo</Label>
                  <p className="text-slate-900">{getTipoLabel(selectedAlvara.tipo)}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Protocolo</Label>
                  <p className="text-slate-900">{selectedAlvara.numeroProtocolo}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Data de Emissão</Label>
                  <p className="text-slate-900">{format(selectedAlvara.dataEmissao, 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Data de Vencimento</Label>
                  <p className="text-slate-900">{format(selectedAlvara.dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Responsável</Label>
                  <p className="text-slate-900">{selectedAlvara.responsavel}</p>
                </div>
                <div>
                  <Label className="text-slate-700 font-medium">Contato</Label>
                  <p className="text-slate-900">{selectedAlvara.contato}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-slate-700 font-medium">Status</Label>
                <div className="mt-1">
                  {getStatusBadge(selectedAlvara.status)}
                </div>
              </div>
              
              {selectedAlvara.observacoes && (
                <div>
                  <Label className="text-slate-700 font-medium">Observações</Label>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-md">{selectedAlvara.observacoes}</p>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowViewDialog(false)}
                  className="text-slate-600"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Alvará</DialogTitle>
            <DialogDescription>
              Edite as informações do alvará selecionado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-empresa">Empresa *</Label>
                <Input
                  id="edit-empresa"
                  value={formData.empresa}
                  onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
                  placeholder="Nome da empresa"
                  className="border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="edit-cnpj">CNPJ *</Label>
                <Input
                  id="edit-cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                  placeholder="00.000.000/0000-00"
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tipo">Tipo de Alvará *</Label>
                <Select value={formData.tipo} onValueChange={(value: any) => setFormData(prev => ({ ...prev, tipo: value }))}>
                  <SelectTrigger className="border-slate-300">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vigilancia_sanitaria">Vigilância Sanitária</SelectItem>
                    <SelectItem value="bombeiro">Corpo de Bombeiros</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-numeroProtocolo">Número do Protocolo *</Label>
                <Input
                  id="edit-numeroProtocolo"
                  value={formData.numeroProtocolo}
                  onChange={(e) => setFormData(prev => ({ ...prev, numeroProtocolo: e.target.value }))}
                  placeholder="Ex: VS-2024-001"
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-dataEmissao">Data de Emissão *</Label>
                <Input
                  id="edit-dataEmissao"
                  type="date"
                  value={formData.dataEmissao}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataEmissao: e.target.value }))}
                  className="border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="edit-dataVencimento">Data de Vencimento *</Label>
                <Input
                  id="edit-dataVencimento"
                  type="date"
                  value={formData.dataVencimento}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataVencimento: e.target.value }))}
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-responsavel">Responsável *</Label>
                <Input
                  id="edit-responsavel"
                  value={formData.responsavel}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                  placeholder="Nome do responsável"
                  className="border-slate-300"
                />
              </div>
              <div>
                <Label htmlFor="edit-contato">Contato *</Label>
                <Input
                  id="edit-contato"
                  value={formData.contato}
                  onChange={(e) => setFormData(prev => ({ ...prev, contato: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais (opcional)"
                className="border-slate-300"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateAlvara}
                disabled={!formData.empresa || !formData.cnpj || !formData.numeroProtocolo || !formData.dataEmissao || !formData.dataVencimento || !formData.responsavel || !formData.contato}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}