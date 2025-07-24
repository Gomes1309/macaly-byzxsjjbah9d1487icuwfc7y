"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { format, addDays, isAfter, isBefore, differenceInDays, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { useUsuarios } from '@/hooks/useUsuarios'
import QuickObligationForm from '@/components/QuickObrigationForm'
import { useEmpresas } from '@/hooks/useEmpresas'
import { Plus, Search, Download, Check, Edit, Eye, Trash2, FileText, Printer } from 'lucide-react'
import RelatorioObrigacoesPDF from '@/components/RelatorioObrigacoesPDF'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'


// Adaptando para interface compatível com Supabase
interface ObrigacaoFiscal {
  id: string
  codigo: string
  nome: string
  nomeObrigacao: string
  descricao?: string
  tipo: 'federal' | 'estadual' | 'municipal' | 'trabalhista' | 'previdenciaria'
  tipoObrigacao: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'eventual'
  periodicidade: 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual' | 'conforme_movimento'
  dataVencimento: Date
  proximoVencimento?: Date
  status: 'pendente' | 'cumprida' | 'atrasada' | 'cumprido' | 'vencido' | 'em_andamento' | 'isento'
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  responsavel: string
  dataCumprimento?: Date
  usuarioCumprimento?: string
  observacoes?: string
  empresaId?: string
  cliente?: string
  categoria: 'declaracao' | 'pagamento' | 'informacao'
  orgaoDestino: string
  sistemaEnvio: string
  recorrente: boolean
  diasAlerta: number
  alertaEnviado?: boolean
  valorMulta?: number
  diasAtraso?: number
  empresasCumpridas?: EmpresaCumprida[]
  documentos?: string[]
}

interface EmpresaCumprida {
  id: string
  nomeEmpresa: string
  cnpj: string
  dataCumprimento: Date
  funcionarioResponsavel: string
  observacoes?: string
  valor?: number
  protocolo?: string
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  obrigações: ObrigacaoFiscal[]
}

const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

// Empty funcionarios array - will be loaded from localStorage or sample data
const FUNCIONARIOS_EXEMPLO = [
  'Carlos Silva - Contador',
  'Maria Santos - Auxiliar Fiscal', 
  'João Oliveira - Analista Tributário',
  'Ana Costa - Assistente Contábil',
  'Pedro Alves - Coordenador Fiscal'
]

// Empresas reais serão carregadas via hook useEmpresas

const OBRIGACOES_PADRAO: Omit<ObrigacaoFiscal, 'id' | 'dataVencimento' | 'proximoVencimento' | 'status' | 'alertaEnviado' | 'dataCumprimento' | 'usuarioCumprimento' | 'valorMulta' | 'diasAtraso' | 'empresasCumpridas'>[] = [
  {
    codigo: 'DARF',
    nome: 'DARF - Documento de Arrecadação de Receitas Federais',
    nomeObrigacao: 'DARF - Documento de Arrecadação de Receitas Federais',
    descricao: 'Recolhimento de impostos federais (IRPJ, CSLL, PIS, COFINS, etc.)',
    tipo: 'federal',
    tipoObrigacao: 'mensal',
    periodicidade: 'mensal',
    prioridade: 'alta',
    responsavel: 'Equipe Fiscal',
    categoria: 'pagamento',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'e-CAC',
    recorrente: true,
    diasAlerta: 5
  },
  {
    codigo: 'GFIP',
    nome: 'GFIP - Guia de Recolhimento do FGTS',
    nomeObrigacao: 'GFIP - Guia de Recolhimento do FGTS',
    descricao: 'Informações à Previdência Social e recolhimento do FGTS',
    tipo: 'trabalhista',
    tipoObrigacao: 'mensal',
    periodicidade: 'mensal',
    prioridade: 'alta',
    responsavel: 'Depto Pessoal',
    categoria: 'informacao',
    orgaoDestino: 'Caixa Econômica Federal',
    sistemaEnvio: 'Conectividade Social',
    recorrente: true,
    diasAlerta: 7
  },
  {
    codigo: 'DIPJ',
    nome: 'Declaração Simplificada da Pessoa Jurídica',
    nomeObrigacao: 'Declaração Simplificada da Pessoa Jurídica',
    descricao: 'Declaração Simplificada da Pessoa Jurídica - deve ser entregue anualmente até 31 de maio',
    tipo: 'federal',
    tipoObrigacao: 'anual',
    periodicidade: 'anual',
    prioridade: 'alta',
    responsavel: 'João Silva',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'e-CAC',
    recorrente: true,
    diasAlerta: 30
  },
  {
    codigo: 'SIMPLES',
    nome: 'Declaração Mensal do Simples Nacional',
    nomeObrigacao: 'Declaração Mensal do Simples Nacional',
    descricao: 'Declaração Mensal do Simples Nacional - deve ser transmitida até o dia 20 do mês subsequente',
    tipo: 'federal',
    tipoObrigacao: 'mensal',
    periodicidade: 'mensal',
    prioridade: 'alta',
    responsavel: 'João Silva',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'e-CAC',
    recorrente: true,
    diasAlerta: 7,
    observacoes: 'Obrigação mensal para empresas optantes pelo Simples Nacional'
  }
]

export default function ObrigacoesFiscais() {
  console.log('🚀 ObrigacoesFiscais component loaded at:', new Date().toISOString())
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoFiscal[]>([])
  const [filteredObrigacoes, setFilteredObrigacoes] = useState<ObrigacaoFiscal[]>([])
  const [funcionarios, setFuncionarios] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todas')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todas')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('mensal')
  const [expandedObrigacao, setExpandedObrigacao] = useState<string | null>(null)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportType, setReportType] = useState<'mensal' | 'personalizado'>('mensal')
  const [reportPeriod, setReportPeriod] = useState({
    dataInicio: '',
    dataFim: ''
  })
  
  // New states for PDF and actions
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedObrigacao, setSelectedObrigacao] = useState<ObrigacaoFiscal | null>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [showConcluirDialog, setShowConcluirDialog] = useState(false)
  const [observacoesConclusao, setObservacoesConclusao] = useState('')
  const pdfRef = useRef<HTMLDivElement>(null)
  
  const { toast } = useToast()
  
  // Initialize real users hook
  const { usuarios, loading: usuariosLoading, error: usuariosError, refreshUsuarios } = useUsuarios()
  
  // Initialize real companies hook  
  const { empresas, loading: empresasLoading, error: empresasError, refreshEmpresas } = useEmpresas()
  console.log('🏢 useEmpresas hook result:', { empresas: empresas?.length, empresasLoading, empresasError })

  // Login data state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Form state for adding/editing obligations
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    tipo: 'federal',
    tipoObrigacao: 'mensal',
    periodicidade: 'mensal',
    dataVencimento: '',
    status: 'pendente',
    prioridade: 'media',
    responsavel: '',
    cliente: '',
    observacoes: '',
    categoria: 'declaracao',
    orgaoDestino: '',
    sistemaEnvio: '',
    diasAlerta: '5', // Changed to string
    recorrente: true,
    diaVencimento: ''
  })

  // Authentication check - always authenticated for this system
  useEffect(() => {
    setIsAuthenticated(true)
    localStorage.setItem('auth_token', 'authenticated')
  }, [])

  // Load obrigações
  useEffect(() => {
    if (isAuthenticated) {
      loadObrigacoes()
    }
  }, [isAuthenticated])

  // Load obrigações from localStorage
  const loadObrigacoes = useCallback(() => {
    console.log('Loading obrigações fiscais...')
    setIsLoading(true)
    
    const saved = localStorage.getItem('obrigacoes_fiscais')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((obrigacao: any) => ({
          ...obrigacao,
          dataVencimento: new Date(obrigacao.dataVencimento),
          proximoVencimento: obrigacao.proximoVencimento ? new Date(obrigacao.proximoVencimento) : undefined,
          dataCumprimento: obrigacao.dataCumprimento ? new Date(obrigacao.dataCumprimento) : undefined,
          empresasCumpridas: obrigacao.empresasCumpridas || []
        }))
        setObrigacoes(parsed)
      } catch (error) {
        console.error('Error loading obrigações:', error)
        setObrigacoes([])
      }
    } else {
      setObrigacoes([])
    }
    
    setIsLoading(false)
  }, [])

  // Filter obrigações
  useEffect(() => {
    let filtered = obrigacoes

    if (searchTerm) {
      filtered = filtered.filter(obrigacao =>
        obrigacao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obrigacao.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obrigacao.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obrigacao.orgaoDestino.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'todas') {
      filtered = filtered.filter(obrigacao => obrigacao.status === statusFilter)
    }

    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(obrigacao => obrigacao.tipo === tipoFilter)
    }

    if (prioridadeFilter !== 'todas') {
      filtered = filtered.filter(obrigacao => obrigacao.prioridade === prioridadeFilter)
    }

    setFilteredObrigacoes(filtered)
  }, [obrigacoes, searchTerm, statusFilter, tipoFilter, prioridadeFilter])

  // Login handler
  const handleLogin = useCallback(() => {
    console.log('Login attempt:', loginData)
    setLoginError('')
    
    if (loginData.email === VALID_CREDENTIALS.email && loginData.password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true)
      localStorage.setItem('auth_token', 'authenticated')
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema de obrigações fiscais.",
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

  // Load real users from Supabase
  useEffect(() => {
    console.log('useEffect usuarios - Current state:', { usuarios: usuarios.length, usuariosLoading })
    
    if (usuarios && usuarios.length > 0) {
      console.log('Loading real users from Supabase:', usuarios)
      const usuariosAtivos = usuarios
        .filter(user => user.status === 'ativo')
        .map(user => user.nome)
      
      setFuncionarios(usuariosAtivos)
      
      toast({
        title: "Usuários carregados com sucesso!",
        description: `${usuariosAtivos.length} funcionário(s) ativo(s) encontrado(s) no sistema.`,
      })
    } else if (!usuariosLoading && usuarios.length === 0) {
      console.log('No users found, using fallback funcionarios')
      const savedFuncionarios = localStorage.getItem('funcionarios_responsaveis')
      if (savedFuncionarios) {
        try {
          const parsedFuncionarios = JSON.parse(savedFuncionarios)
          setFuncionarios(parsedFuncionarios)
        } catch (error) {
          console.error('Error loading funcionarios from localStorage:', error)
          setFuncionarios([])
        }
      } else {
        setFuncionarios([])
        
        toast({
          title: "Nenhum usuário encontrado",
          description: "Para que funcionários apareçam nas obrigações, cadastre usuários no sistema.",
          variant: "destructive"
        })
      }
    }
  }, [usuarios, usuariosLoading, toast])

  // Debug para empresas
  useEffect(() => {
    console.log('useEffect empresas - Current state:', { 
      empresasCount: empresas.length, 
      empresasLoading, 
      empresasError,
      empresas: empresas.map(e => ({ id: e.id, razaoSocial: e.razaoSocial }))
    })
  }, [empresas, empresasLoading, empresasError])

  // Handle add obligation
  const handleAddObrigacao = useCallback(async () => {
    console.log('Adding obligation:', formData)
    setIsLoading(true)
    
    try {
      if (!formData.codigo || !formData.nome) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha código e nome da obrigação.",
          variant: "destructive"
        })
        setIsLoading(false)
        return
      }

      // Generate dataVencimento based on diaVencimento and periodicidade
      let dataVencimento = new Date()
      if (formData.diaVencimento && parseInt(formData.diaVencimento) > 0) {
        const dia = parseInt(formData.diaVencimento)
        const hoje = new Date()
        
        // Set the day for current month
        dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth(), Math.min(dia, 28))
        
        // If the date has already passed this month, move to next month
        if (dataVencimento <= hoje) {
          dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, Math.min(dia, 28))
        }
      } else {
        // Default to end of current month if no day specified
        const hoje = new Date()
        dataVencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      }

      const novaObrigacao: ObrigacaoFiscal = {
        id: Date.now().toString(),
        codigo: formData.codigo,
        nome: formData.nome,
        nomeObrigacao: formData.nome,
        descricao: formData.descricao || '',
        tipo: formData.tipo as ObrigacaoFiscal['tipo'],
        tipoObrigacao: formData.tipoObrigacao as ObrigacaoFiscal['tipoObrigacao'],
        periodicidade: formData.periodicidade as ObrigacaoFiscal['periodicidade'],
        dataVencimento: formData.dataVencimento ? new Date(formData.dataVencimento) : dataVencimento,
        status: formData.status as ObrigacaoFiscal['status'],
        prioridade: formData.prioridade as ObrigacaoFiscal['prioridade'],
        responsavel: formData.responsavel,
        cliente: formData.cliente,
        observacoes: formData.observacoes,
        categoria: formData.categoria as ObrigacaoFiscal['categoria'],
        orgaoDestino: formData.orgaoDestino,
        sistemaEnvio: formData.sistemaEnvio,
        diasAlerta: parseInt(formData.diasAlerta.toString()) || 5,
        recorrente: formData.recorrente
      }
      
      console.log('📝 Salvando obrigação:', novaObrigacao)
      
      const updatedObrigacoes = [...obrigacoes, novaObrigacao]
      setObrigacoes(updatedObrigacoes)
      localStorage.setItem('obrigacoes_fiscais', JSON.stringify(updatedObrigacoes))
      
      setShowAddDialog(false)
      
      // Reset form
      setFormData({
        codigo: '',
        nome: '',
        descricao: '',
        tipo: 'federal',
        tipoObrigacao: 'mensal',
        periodicidade: 'mensal',
        dataVencimento: '',
        status: 'pendente',
        prioridade: 'media',
        responsavel: '',
        cliente: '',
        observacoes: '',
        categoria: 'declaracao',
        orgaoDestino: '',
        sistemaEnvio: '',
        diasAlerta: '5', // Changed to string
        recorrente: true,
        diaVencimento: ''
      })
      
      toast({
        title: "Obrigação adicionada com sucesso!",
        description: "A nova obrigação fiscal foi cadastrada no sistema.",
      })
    } catch (error) {
      console.error('Error adding obligation:', error)
      toast({
        title: "Erro ao adicionar obrigação",
        description: "Ocorreu um erro ao cadastrar a obrigação.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [formData, toast, obrigacoes])

  // PDF Generation Handler
  const handleGeneratePDF = useCallback(async () => {
    if (!pdfRef.current) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Componente de relatório não encontrado",
        variant: "destructive"
      })
      return
    }

    try {
      // Show loading toast
      toast({
        title: "Gerando PDF...",
        description: "Por favor, aguarde enquanto o relatório é gerado."
      })

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(pdfRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = pdf.internal.pageSize.getWidth()
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pageHeight = pdf.internal.pageSize.getHeight()

      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Download the PDF
      const fileName = `Relatorio_Obrigacoes_Fiscais_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`
      pdf.save(fileName)

      toast({
        title: "PDF gerado com sucesso!",
        description: `Relatório salvo como: ${fileName}`
      })

    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro durante a geração do relatório",
        variant: "destructive"
      })
    }
  }, [toast])

  // Action Handlers for Obligations
  const handleConcluirObrigacao = useCallback((obrigacao: ObrigacaoFiscal) => {
    setSelectedObrigacao(obrigacao)
    setObservacoesConclusao('')
    setShowConcluirDialog(true)
  }, [])

  const handleConfirmConcluir = useCallback(() => {
    if (!selectedObrigacao) return
    
    const updatedObrigacoes = obrigacoes.map(obr => 
      obr.id === selectedObrigacao.id 
        ? { 
            ...obr, 
            status: 'cumprida' as const,
            dataCumprimento: new Date(),
            usuarioCumprimento: funcionarios[0] || 'Sistema',
            observacoes: observacoesConclusao
          }
        : obr
    )
    
    setObrigacoes(updatedObrigacoes)
    localStorage.setItem('obrigacoes_fiscais', JSON.stringify(updatedObrigacoes))
    setShowConcluirDialog(false)
    setSelectedObrigacao(null)
    
    toast({
      title: "Obrigação concluída!",
      description: `A obrigação ${selectedObrigacao.codigo} foi marcada como cumprida.`,
    })
  }, [selectedObrigacao, obrigacoes, observacoesConclusao, funcionarios, toast])

  const handleViewObrigacao = useCallback((obrigacao: ObrigacaoFiscal) => {
    setSelectedObrigacao(obrigacao)
    setShowViewDialog(true)
  }, [])

  const handleEditObrigacao = useCallback((obrigacao: ObrigacaoFiscal) => {
    setSelectedObrigacao(obrigacao)
    setEditFormData({
      codigo: obrigacao.codigo,
      nome: obrigacao.nome,
      descricao: obrigacao.descricao || '',
      tipo: obrigacao.tipo,
      tipoObrigacao: obrigacao.tipoObrigacao,
      periodicidade: obrigacao.periodicidade,
      prioridade: obrigacao.prioridade,
      responsavel: obrigacao.responsavel,
      cliente: obrigacao.cliente || '',
      observacoes: obrigacao.observacoes || '',
      categoria: obrigacao.categoria,
      orgaoDestino: obrigacao.orgaoDestino,
      sistemaEnvio: obrigacao.sistemaEnvio,
      diasAlerta: typeof obrigacao.diasAlerta === 'string' ? obrigacao.diasAlerta : obrigacao.diasAlerta.toString(),
      recorrente: obrigacao.recorrente,
      diaVencimento: obrigacao.dataVencimento.getDate().toString()
    })
    setShowEditDialog(true)
  }, [])

  const handleConfirmEdit = useCallback(() => {
    if (!selectedObrigacao) return
    
    const updatedObrigacoes = obrigacoes.map(obr => 
      obr.id === selectedObrigacao.id 
        ? { 
            ...obr, 
            codigo: editFormData.codigo,
            nome: editFormData.nome,
            descricao: editFormData.descricao,
            tipo: editFormData.tipo,
            tipoObrigacao: editFormData.tipoObrigacao,
            periodicidade: editFormData.periodicidade,
            prioridade: editFormData.prioridade,
            responsavel: editFormData.responsavel,
            cliente: editFormData.cliente,
            observacoes: editFormData.observacoes,
            categoria: editFormData.categoria,
            orgaoDestino: editFormData.orgaoDestino,
            sistemaEnvio: editFormData.sistemaEnvio,
            diasAlerta: parseInt(editFormData.diasAlerta),
            recorrente: editFormData.recorrente
          }
        : obr
    )
    
    setObrigacoes(updatedObrigacoes)
    localStorage.setItem('obrigacoes_fiscais', JSON.stringify(updatedObrigacoes))
    setShowEditDialog(false)
    setSelectedObrigacao(null)
    
    toast({
      title: "Obrigação atualizada!",
      description: `A obrigação ${editFormData.codigo} foi atualizada com sucesso.`,
    })
  }, [selectedObrigacao, obrigacoes, editFormData, toast])

  const handleDeleteObrigacao = useCallback((obrigacao: ObrigacaoFiscal) => {
    setSelectedObrigacao(obrigacao)
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!selectedObrigacao) return
    
    const updatedObrigacoes = obrigacoes.filter(obr => obr.id !== selectedObrigacao.id)
    
    setObrigacoes(updatedObrigacoes)
    localStorage.setItem('obrigacoes_fiscais', JSON.stringify(updatedObrigacoes))
    setShowDeleteDialog(false)
    setSelectedObrigacao(null)
    
    toast({
      title: "Obrigação excluída!",
      description: `A obrigação ${selectedObrigacao.codigo} foi removida do sistema.`,
      variant: "destructive"
    })
  }, [selectedObrigacao, obrigacoes, toast])

  // Skip login screen for testing - always show main app

  // Main dashboard component with companies from useEmpresas
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-violet-50">
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
                  <p className="text-sm text-slate-600 font-medium">OBRIGAÇÕES FISCAIS</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                Dashboard
              </Button>
              
              <Button 
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
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
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Obrigações Fiscais</h2>
                  <p className="text-blue-100 text-lg">
                    Controle mensal de obrigações e empresas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <CardTitle className="text-blue-700 font-bold text-lg">
                  Empresas Cadastradas ({empresasLoading ? '...' : (empresas?.length || 0)})
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Empresas reais do sistema para vinculação às obrigações
                </CardDescription>
              </div>
              <Button 
                onClick={refreshEmpresas}
                variant="outline"
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                🔄 Atualizar
              </Button>
            </div>
            
            {/* Search empresas */}
            {!empresasLoading && empresas && empresas.length > 3 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar empresas por nome ou CNPJ..."
                  className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                />
              </div>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {empresasLoading ? (
              <div className="text-center py-8">
                <div className="bg-slate-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
                <p className="text-slate-500">Carregando empresas...</p>
              </div>
            ) : empresasError ? (
              <div className="text-center py-8">
                <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-red-600 text-lg">!</span>
                </div>
                <p className="text-red-600">Erro ao carregar empresas</p>
                <p className="text-slate-400 text-sm mt-1">{empresasError}</p>
              </div>
            ) : (!empresas || empresas.length === 0) ? (
              <div className="text-center py-8">
                <div className="bg-slate-100 p-3 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <span className="text-slate-400 text-lg">🏢</span>
                </div>
                <p className="text-slate-500">Nenhuma empresa cadastrada</p>
                <p className="text-slate-400 text-sm mt-1">
                  Cadastre empresas no sistema para vincular às obrigações
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {empresas && empresas.map((empresa, index) => (
                  <div key={empresa.id} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    index % 2 === 0 ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200'
                  } hover:border-blue-300`}>
                    
                    {/* Empresa Info - Left Side */}
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <span className="text-blue-600 text-sm font-bold">🏢</span>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 text-sm truncate">
                          {empresa.razaoSocial}
                        </h4>
                        {empresa.nomeFantasia && (
                          <p className="text-xs text-slate-600 truncate">
                            {empresa.nomeFantasia}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* CNPJ - Center */}
                    <div className="hidden sm:flex flex-col items-center min-w-0 px-4">
                      <span className="text-xs text-slate-500 uppercase font-medium">CNPJ</span>
                      <span className="text-sm font-mono font-medium text-slate-700">
                        {empresa.cnpj || '—'}
                      </span>
                    </div>

                    {/* Type - Center */}
                    <div className="hidden md:flex flex-col items-center min-w-0 px-4">
                      <span className="text-xs text-slate-500 uppercase font-medium">Tipo</span>
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {empresa.tipoEmpresa}
                      </span>
                    </div>

                    {/* Status - Right Side */}
                    <div className="flex flex-col items-end">
                      <Badge className={`text-xs font-medium ${
                        empresa.status === 'aprovada' ? 'bg-green-100 text-green-700 border-green-200' :
                        empresa.status === 'em_andamento' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        empresa.status === 'documentos_pendentes' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {empresa.status === 'aprovada' ? '✓ Aprovada' :
                         empresa.status === 'em_andamento' ? '⏳ Em Andamento' :
                         empresa.status === 'documentos_pendentes' ? '📋 Docs Pendentes' :
                         '❌ Rejeitada'
                        }
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {/* Scroll indicator */}
                {empresas.length > 5 && (
                  <div className="text-center pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-400">
                      Mostrando {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} • Role para ver mais
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Obligations Management Section */}
        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-violet-700 font-bold text-lg">
                  Gerenciar Obrigações Fiscais ({filteredObrigacoes.length})
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Adicione, edite e acompanhe as obrigações fiscais das empresas
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleGeneratePDF}
                  variant="outline"
                  className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                  disabled={filteredObrigacoes.length === 0}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Relatório PDF
                </Button>
                {obrigacoes.length === 0 && (
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/load-sample-data')
                        const data = await response.json()
                        if (data.success) {
                          localStorage.setItem('obrigacoes_fiscais', JSON.stringify(data.obrigacoes))
                          window.location.reload()
                        }
                      } catch (error) {
                        console.error('Erro ao carregar dados de exemplo:', error)
                      }
                    }}
                    variant="outline"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Carregar Exemplos
                  </Button>
                )}
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Obrigação
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar obrigações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-slate-300 focus:border-violet-500 focus:ring-violet-500">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cumprida">Cumprida</SelectItem>
                  <SelectItem value="atrasada">Atrasada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="border-slate-300 focus:border-violet-500 focus:ring-violet-500">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="federal">Federal</SelectItem>
                  <SelectItem value="estadual">Estadual</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="trabalhista">Trabalhista</SelectItem>
                </SelectContent>
              </Select>

              <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                <SelectTrigger className="border-slate-300 focus:border-violet-500 focus:ring-violet-500">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Prioridades</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Obligations List */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
                <p className="text-slate-500 text-lg">Carregando obrigações...</p>
              </div>
            ) : filteredObrigacoes.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-slate-400 text-xl">📋</span>
                </div>
                <p className="text-slate-500 text-lg">Nenhuma obrigação encontrada</p>
                <p className="text-slate-400 text-sm mt-2">
                  {obrigacoes.length === 0 
                    ? "Clique em 'Nova Obrigação' para adicionar a primeira obrigação fiscal"
                    : "Tente ajustar os filtros de busca"
                  }
                </p>
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  className="mt-4 text-violet-600 border-violet-300 hover:bg-violet-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeira Obrigação
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredObrigacoes.map((obrigacao) => (
                  <Card key={obrigacao.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-full ${
                            obrigacao.prioridade === 'critica' ? 'bg-red-100' :
                            obrigacao.prioridade === 'alta' ? 'bg-orange-100' :
                            obrigacao.prioridade === 'media' ? 'bg-yellow-100' :
                            'bg-green-100'
                          }`}>
                            <span className={`font-semibold ${
                              obrigacao.prioridade === 'critica' ? 'text-red-600' :
                              obrigacao.prioridade === 'alta' ? 'text-orange-600' :
                              obrigacao.prioridade === 'media' ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {obrigacao.codigo}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg">{obrigacao.nome}</h3>
                            <p className="text-slate-600">{obrigacao.descricao}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={
                            obrigacao.status === 'cumprida' ? 'bg-green-100 text-green-800' :
                            obrigacao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                            obrigacao.status === 'atrasada' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {obrigacao.status}
                          </Badge>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-1 ml-4">
                            {obrigacao.status !== 'cumprida' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConcluirObrigacao(obrigacao)}
                                className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 px-2 py-1"
                                title="Marcar como concluída"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewObrigacao(obrigacao)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-400 px-2 py-1"
                              title="Visualizar detalhes"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditObrigacao(obrigacao)}
                              className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-400 px-2 py-1"
                              title="Editar obrigação"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteObrigacao(obrigacao)}
                              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 px-2 py-1"
                              title="Excluir obrigação"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Tipo:</span>
                          <p className="font-medium capitalize">{obrigacao.tipo}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Periodicidade:</span>
                          <p className="font-medium capitalize">{obrigacao.periodicidade}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Vencimento:</span>
                          <p className="font-medium">{obrigacao.dataVencimento.toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Responsável:</span>
                          <p className="font-medium">{obrigacao.responsavel}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Obligation Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
            <DialogHeader className="px-6 pt-6 pb-0">
              <DialogTitle className="sr-only">Nova Obrigação Fiscal</DialogTitle>
              <DialogDescription className="sr-only">
                Cadastre uma nova obrigação fiscal para acompanhamento
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[85vh] px-6 pb-6">
              <QuickObligationForm
                formData={formData}
                setFormData={(data) => setFormData({
                  ...formData,
                  codigo: data.codigo,
                  nome: data.nome,
                  descricao: data.descricao,
                  tipo: data.tipo,
                  tipoObrigacao: data.periodicidade, // Map periodicidade to tipoObrigacao
                  periodicidade: data.periodicidade,
                  prioridade: data.prioridade,
                  responsavel: data.responsavel,
                  cliente: data.cliente,
                  observacoes: data.observacoes,
                  categoria: data.categoria,
                  orgaoDestino: data.orgaoDestino,
                  sistemaEnvio: data.sistemaEnvio,
                  diasAlerta: String(data.diasAlerta || 5),
                  recorrente: data.recorrente,
                  diaVencimento: data.diaVencimento || ''
                })}
                onSubmit={handleAddObrigacao}
                onCancel={() => setShowAddDialog(false)}
                funcionarios={funcionarios}
                isLoading={isLoading}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Report Component (Hidden) */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <RelatorioObrigacoesPDF
            ref={pdfRef}
            obrigacoes={filteredObrigacoes}
            filtros={{
              periodo: 'Atual',
              status: statusFilter === 'todas' ? 'Todos' : statusFilter,
              tipo: tipoFilter === 'todos' ? 'Todos' : tipoFilter,
              prioridade: prioridadeFilter === 'todas' ? 'Todas' : prioridadeFilter
            }}
          />
        </div>

        {/* View Obligation Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                Detalhes da Obrigação Fiscal
              </DialogTitle>
              <DialogDescription>
                Visualize todas as informações da obrigação selecionada
              </DialogDescription>
            </DialogHeader>
            {selectedObrigacao && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Código</Label>
                    <p className="text-lg font-bold text-slate-800">{selectedObrigacao.codigo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Nome</Label>
                    <p className="text-lg font-bold text-slate-800">{selectedObrigacao.nome}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold text-slate-600">Descrição</Label>
                  <p className="text-slate-700">{selectedObrigacao.descricao || 'Não informada'}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Tipo</Label>
                    <Badge className="mt-1 capitalize">{selectedObrigacao.tipo}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Status</Label>
                    <Badge className={`mt-1 ${
                      selectedObrigacao.status === 'cumprida' ? 'bg-green-100 text-green-800' :
                      selectedObrigacao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      selectedObrigacao.status === 'atrasada' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedObrigacao.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Prioridade</Label>
                    <Badge className={`mt-1 ${
                      selectedObrigacao.prioridade === 'critica' ? 'bg-red-100 text-red-800' :
                      selectedObrigacao.prioridade === 'alta' ? 'bg-orange-100 text-orange-800' :
                      selectedObrigacao.prioridade === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedObrigacao.prioridade}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Periodicidade</Label>
                    <p className="text-slate-700 capitalize">{selectedObrigacao.periodicidade}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Data de Vencimento</Label>
                    <p className="text-slate-700">{selectedObrigacao.dataVencimento.toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Responsável</Label>
                    <p className="text-slate-700">{selectedObrigacao.responsavel}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Órgão Destino</Label>
                    <p className="text-slate-700">{selectedObrigacao.orgaoDestino}</p>
                  </div>
                </div>

                {selectedObrigacao.observacoes && (
                  <div>
                    <Label className="text-sm font-semibold text-slate-600">Observações</Label>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedObrigacao.observacoes}</p>
                  </div>
                )}

                {selectedObrigacao.status === 'cumprida' && selectedObrigacao.dataCumprimento && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <Label className="text-sm font-semibold text-green-800">Cumprida em</Label>
                    <p className="text-green-700 font-medium">
                      {selectedObrigacao.dataCumprimento.toLocaleDateString('pt-BR')} por {selectedObrigacao.usuarioCumprimento}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Obligation Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">
                Editar Obrigação Fiscal
              </DialogTitle>
              <DialogDescription>
                Modifique as informações da obrigação selecionada
              </DialogDescription>
            </DialogHeader>
            {selectedObrigacao && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-codigo">Código *</Label>
                    <Input
                      id="edit-codigo"
                      value={editFormData.codigo || ''}
                      onChange={(e) => setEditFormData({...editFormData, codigo: e.target.value})}
                      placeholder="Ex: DARF, GFIP, ECF"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-nome">Nome da Obrigação *</Label>
                    <Input
                      id="edit-nome"
                      value={editFormData.nome || ''}
                      onChange={(e) => setEditFormData({...editFormData, nome: e.target.value})}
                      placeholder="Nome completo da obrigação"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-descricao">Descrição</Label>
                  <Textarea
                    id="edit-descricao"
                    value={editFormData.descricao || ''}
                    onChange={(e) => setEditFormData({...editFormData, descricao: e.target.value})}
                    placeholder="Descrição detalhada da obrigação"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="edit-tipo">Tipo</Label>
                    <Select value={editFormData.tipo || ''} onValueChange={(value) => setEditFormData({...editFormData, tipo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="federal">Federal</SelectItem>
                        <SelectItem value="estadual">Estadual</SelectItem>
                        <SelectItem value="municipal">Municipal</SelectItem>
                        <SelectItem value="trabalhista">Trabalhista</SelectItem>
                        <SelectItem value="previdenciaria">Previdenciária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-periodicidade">Periodicidade</Label>
                    <Select value={editFormData.periodicidade || ''} onValueChange={(value) => setEditFormData({...editFormData, periodicidade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Periodicidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="bimestral">Bimestral</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-prioridade">Prioridade</Label>
                    <Select value={editFormData.prioridade || ''} onValueChange={(value) => setEditFormData({...editFormData, prioridade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-responsavel">Responsável</Label>
                    <Select value={editFormData.responsavel || ''} onValueChange={(value) => setEditFormData({...editFormData, responsavel: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarios.map((funcionario) => (
                          <SelectItem key={funcionario} value={funcionario}>
                            {funcionario}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-orgao">Órgão Destino</Label>
                    <Input
                      id="edit-orgao"
                      value={editFormData.orgaoDestino || ''}
                      onChange={(e) => setEditFormData({...editFormData, orgaoDestino: e.target.value})}
                      placeholder="Ex: Receita Federal, SEFAZ"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-observacoes">Observações</Label>
                  <Textarea
                    id="edit-observacoes"
                    value={editFormData.observacoes || ''}
                    onChange={(e) => setEditFormData({...editFormData, observacoes: e.target.value})}
                    placeholder="Observações adicionais"
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmEdit} className="bg-blue-600 hover:bg-blue-700">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Concluir Obligation Dialog */}
        <Dialog open={showConcluirDialog} onOpenChange={setShowConcluirDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-green-800">
                Marcar Obrigação como Concluída
              </DialogTitle>
              <DialogDescription>
                Confirme a conclusão da obrigação {selectedObrigacao?.codigo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="observacoes-conclusao">Observações da Conclusão</Label>
                <Textarea
                  id="observacoes-conclusao"
                  value={observacoesConclusao}
                  onChange={(e) => setObservacoesConclusao(e.target.value)}
                  placeholder="Adicione observações sobre a conclusão desta obrigação..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConcluirDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmConcluir} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />
                Confirmar Conclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-800">
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a obrigação <strong>{selectedObrigacao?.codigo}</strong>?
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir Definitivamente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Instructions */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
            <CardTitle className="text-green-700 font-bold text-lg">
              ✅ Sistema de Cadastro de Obrigações Fiscais
            </CardTitle>
            <CardDescription className="text-slate-600">
              Sistema integrado com empresas reais para criar obrigações fiscais
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">🎯 Funcionalidades:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• ➕ Criar novas obrigações fiscais</li>
                  <li>• 📊 Acompanhar status das obrigações</li>
                  <li>• 📋 Templates inteligentes automáticos</li>
                  <li>• 🏢 Vinculação com empresas cadastradas</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">🔍 Filtros e Busca:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• 🔍 Busca por nome ou código</li>
                  <li>• 📊 Filtro por status</li>
                  <li>• 🏛️ Filtro por tipo (federal, estadual, etc.)</li>
                  <li>• ⚠️ Filtro por prioridade</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}