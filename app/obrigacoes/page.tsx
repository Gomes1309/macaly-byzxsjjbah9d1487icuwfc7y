"use client"

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, isAfter, isBefore, differenceInDays, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { 
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  LogOut,
  User,
  Home,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Target,
  TrendingUp,
  Activity,
  Users,
  Building,
  Receipt,
  Calculator,
  Banknote,
  FileCheck,
  Timer,
  Bell,
  CheckSquare,
  Square,
  Calendar as CalendarIcon,
  Zap,
  Shield,
  BookOpen,
  ClipboardList,
  Star,
  Flag,
  ChevronLeft,
  ChevronRight,
  Factory,
  UserCheck,
  ArrowRight,
  Briefcase,
  MapPin,
  Award,
  ChevronDown,
  ChevronUp,
  Printer,
  FileBarChart
} from 'lucide-react'

interface ObrigacaoFiscal {
  id: string
  codigo: string
  nome: string
  descricao: string
  tipo: 'federal' | 'estadual' | 'municipal' | 'trabalhista' | 'previdenciaria'
  periodicidade: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'conforme_movimento'
  dataVencimento: Date
  proximoVencimento: Date
  status: 'pendente' | 'em_andamento' | 'cumprido' | 'vencido' | 'isento'
  prioridade: 'baixa' | 'media' | 'alta' | 'critica'
  responsavel: string
  cliente?: string
  observacoes?: string
  dataCumprimento?: Date
  usuarioCumprimento?: string
  documentos: string[]
  valorMulta?: number
  diasAtraso?: number
  alertaEnviado: boolean
  categoria: 'declaracao' | 'pagamento' | 'informacao' | 'certidao' | 'registro'
  orgaoDestino: string
  sistemaEnvio: string
  recorrente: boolean
  diasAlerta: number
  empresasCumpridas?: EmpresaCumprida[]
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
  obrigacoes: ObrigacaoFiscal[]
}

const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

const FUNCIONARIOS = [
  'Carlos Silva - Contador',
  'Maria Santos - Auxiliar Fiscal',
  'João Oliveira - Analista Tributário',
  'Ana Costa - Assistente Contábil',
  'Pedro Alves - Coordenador Fiscal'
]

const EMPRESAS_CLIENTES = [
  { id: '1', nome: 'Tech Solutions Ltda', cnpj: '12.345.678/0001-90', tipo: 'Lucro Presumido' },
  { id: '2', nome: 'Bella Estética MEI', cnpj: '98.765.432/0001-10', tipo: 'MEI' },
  { id: '3', nome: 'Comércio Brasil S.A.', cnpj: '11.222.333/0001-44', tipo: 'Lucro Real' },
  { id: '4', nome: 'Serviços Gerais Ltda', cnpj: '55.666.777/0001-88', tipo: 'Simples Nacional' },
  { id: '5', nome: 'Indústria Alpha Ltda', cnpj: '33.444.555/0001-22', tipo: 'Lucro Real' },
  { id: '6', nome: 'Consultoria Beta ME', cnpj: '77.888.999/0001-33', tipo: 'Simples Nacional' }
]

const OBRIGACOES_PADRAO: Omit<ObrigacaoFiscal, 'id' | 'dataVencimento' | 'proximoVencimento' | 'status' | 'alertaEnviado' | 'dataCumprimento' | 'usuarioCumprimento' | 'valorMulta' | 'diasAtraso'>[] = [
  {
    codigo: 'DARF',
    nome: 'DARF - Documento de Arrecadação de Receitas Federais',
    descricao: 'Recolhimento de impostos federais (IRPJ, CSLL, PIS, COFINS, etc.)',
    tipo: 'federal',
    periodicidade: 'mensal',
    prioridade: 'alta',
    responsavel: 'Equipe Fiscal',
    categoria: 'pagamento',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'e-CAC',
    recorrente: true,
    diasAlerta: 5,
    documentos: ['Apuração dos impostos', 'DARF preenchido', 'Comprovante de pagamento']
  },
  {
    codigo: 'GFIP',
    nome: 'GFIP - Guia de Recolhimento do FGTS',
    descricao: 'Informações à Previdência Social e recolhimento do FGTS',
    tipo: 'trabalhista',
    periodicidade: 'mensal',
    prioridade: 'alta',
    responsavel: 'Depto Pessoal',
    categoria: 'informacao',
    orgaoDestino: 'Caixa Econômica Federal',
    sistemaEnvio: 'Conectividade Social',
    recorrente: true,
    diasAlerta: 7,
    documentos: ['Folha de pagamento', 'GFIP', 'Comprovante de recolhimento']
  },
  {
    codigo: 'DIRF',
    nome: 'DIRF - Declaração do Imposto de Renda Retido na Fonte',
    descricao: 'Declaração anual de valores retidos na fonte',
    tipo: 'federal',
    periodicidade: 'anual',
    prioridade: 'critica',
    responsavel: 'Controller',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'PGD - DIRF',
    recorrente: true,
    diasAlerta: 15,
    documentos: ['Relatório de retenções', 'DIRF', 'Recibo de entrega']
  },
  {
    codigo: 'RAIS',
    nome: 'RAIS - Relação Anual de Informações Sociais',
    descricao: 'Informações anuais sobre empregados e vínculos trabalhistas',
    tipo: 'trabalhista',
    periodicidade: 'anual',
    prioridade: 'alta',
    responsavel: 'Depto Pessoal',
    categoria: 'informacao',
    orgaoDestino: 'Ministério do Trabalho',
    sistemaEnvio: 'RAIS Web',
    recorrente: true,
    diasAlerta: 20,
    documentos: ['Dados dos empregados', 'RAIS', 'Protocolo de envio']
  },
  {
    codigo: 'DCTF',
    nome: 'DCTF - Declaração de Débitos e Créditos Tributários Federais',
    descricao: 'Declaração mensal de débitos e créditos tributários',
    tipo: 'federal',
    periodicidade: 'mensal',
    prioridade: 'alta',
    responsavel: 'Equipe Fiscal',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'PGD - DCTF',
    recorrente: true,
    diasAlerta: 5,
    documentos: ['Apuração tributária', 'DCTF', 'Recibo de entrega']
  },
  {
    codigo: 'EFD-CONTRIB',
    nome: 'EFD-Contribuições',
    descricao: 'Escrituração Fiscal Digital das Contribuições PIS/PASEP e COFINS',
    tipo: 'federal',
    periodicidade: 'mensal',
    prioridade: 'alta',
    responsavel: 'Equipe Fiscal',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'PVA EFD-Contribuições',
    recorrente: true,
    diasAlerta: 7,
    documentos: ['Escrituração contábil', 'EFD-Contribuições', 'Protocolo de envio']
  },
  {
    codigo: 'EFD-ICMS',
    nome: 'EFD-ICMS/IPI',
    descricao: 'Escrituração Fiscal Digital do ICMS e IPI',
    tipo: 'estadual',
    periodicidade: 'mensal',
    prioridade: 'alta',
    responsavel: 'Equipe Fiscal',
    categoria: 'declaracao',
    orgaoDestino: 'Secretaria da Fazenda',
    sistemaEnvio: 'PVA EFD-ICMS/IPI',
    recorrente: true,
    diasAlerta: 7,
    documentos: ['Livros fiscais', 'EFD-ICMS/IPI', 'Protocolo de envio']
  },
  {
    codigo: 'SPED-CONTABIL',
    nome: 'SPED Contábil',
    descricao: 'Escrituração Contábil Digital - ECD',
    tipo: 'federal',
    periodicidade: 'anual',
    prioridade: 'alta',
    responsavel: 'Contador',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'PVA ECD',
    recorrente: true,
    diasAlerta: 30,
    documentos: ['Escrituração contábil', 'ECD', 'Protocolo de envio']
  },
  {
    codigo: 'DEFIS',
    nome: 'DEFIS - Declaração de Informações Socioeconômicas e Fiscais',
    descricao: 'Declaração anual para empresas do Simples Nacional',
    tipo: 'federal',
    periodicidade: 'anual',
    prioridade: 'alta',
    responsavel: 'Contador',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'Portal do Simples Nacional',
    recorrente: true,
    diasAlerta: 15,
    documentos: ['Relatórios contábeis', 'DEFIS', 'Protocolo de envio']
  },
  {
    codigo: 'DASN',
    nome: 'DASN - Declaração Anual do Simples Nacional',
    descricao: 'Declaração anual para MEI',
    tipo: 'federal',
    periodicidade: 'anual',
    prioridade: 'media',
    responsavel: 'Equipe MEI',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'Portal do Simples Nacional',
    recorrente: true,
    diasAlerta: 10,
    documentos: ['Relatório de faturamento', 'DASN', 'Protocolo de envio']
  },
  {
    codigo: 'DES',
    nome: 'DES - Declaração Eletrônica de Serviços',
    descricao: 'Declaração mensal de serviços prestados',
    tipo: 'municipal',
    periodicidade: 'mensal',
    prioridade: 'media',
    responsavel: 'Equipe Fiscal',
    categoria: 'declaracao',
    orgaoDestino: 'Prefeitura Municipal',
    sistemaEnvio: 'Portal da Prefeitura',
    recorrente: true,
    diasAlerta: 5,
    documentos: ['Notas fiscais de serviço', 'DES', 'Protocolo de envio']
  },
  {
    codigo: 'DIPJ',
    nome: 'DIPJ - Declaração de Informações Econômico-Fiscais',
    descricao: 'Declaração anual de informações econômico-fiscais da pessoa jurídica',
    tipo: 'federal',
    periodicidade: 'anual',
    prioridade: 'critica',
    responsavel: 'Controller',
    categoria: 'declaracao',
    orgaoDestino: 'Receita Federal',
    sistemaEnvio: 'PGD - DIPJ',
    recorrente: true,
    diasAlerta: 20,
    documentos: ['Demonstrações contábeis', 'DIPJ', 'Protocolo de envio']
  }
]

export default function ObrigacoesFiscais() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoFiscal[]>([])
  const [filteredObrigacoes, setFilteredObrigacoes] = useState<ObrigacaoFiscal[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todas')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todas')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showEmpresasDialog, setShowEmpresasDialog] = useState(false)
  const [selectedObrigacao, setSelectedObrigacao] = useState<ObrigacaoFiscal | null>(null)
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
  const { toast } = useToast()

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    tipo: 'federal',
    periodicidade: 'mensal',
    prioridade: 'media',
    responsavel: '',
    cliente: '',
    observacoes: '',
    categoria: 'declaracao',
    orgaoDestino: '',
    sistemaEnvio: '',
    diasAlerta: '5',
    recorrente: true,
    dataVencimento: ''
  })

  // Authentication check
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Load obrigações
  useEffect(() => {
    if (isAuthenticated) {
      loadObrigacoes()
    }
  }, [isAuthenticated])

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

  const loadObrigacoes = useCallback(() => {
    console.log('Loading obrigações fiscais...')
    setIsLoading(true)
    
    const saved = localStorage.getItem('obrigacoes_fiscais')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((obrigacao: any) => ({
          ...obrigacao,
          dataVencimento: new Date(obrigacao.dataVencimento),
          proximoVencimento: new Date(obrigacao.proximoVencimento),
          dataCumprimento: obrigacao.dataCumprimento ? new Date(obrigacao.dataCumprimento) : undefined,
          empresasCumpridas: obrigacao.empresasCumpridas || []
        }))
        setObrigacoes(parsed)
      } catch (error) {
        console.error('Error loading obrigações:', error)
      }
    } else {
      // Generate sample data with current dates
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const sampleObrigacoes: ObrigacaoFiscal[] = []
      
      // Generate obligations for current month and next 2 months
      for (let monthOffset = -1; monthOffset <= 2; monthOffset++) {
        const targetMonth = currentMonth + monthOffset
        const targetYear = targetMonth < 0 ? currentYear - 1 : targetMonth > 11 ? currentYear + 1 : currentYear
        const adjustedMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth > 11 ? targetMonth - 12 : targetMonth
        
        OBRIGACOES_PADRAO.forEach((obrigacao, index) => {
          let dataVencimento: Date
          let proximoVencimento: Date
          
          // Calculate due dates based on periodicidade
          switch (obrigacao.periodicidade) {
            case 'mensal':
              dataVencimento = new Date(targetYear, adjustedMonth, 20) // 20th of target month
              proximoVencimento = new Date(targetYear, adjustedMonth + 1, 20) // 20th of next month
              break
            case 'trimestral':
              if (adjustedMonth % 3 === 0) { // Only quarterly months
                dataVencimento = new Date(targetYear, adjustedMonth, 31)
                proximoVencimento = new Date(targetYear, adjustedMonth + 3, 31)
              } else {
                return // Skip non-quarterly months
              }
              break
            case 'anual':
              if (adjustedMonth === 4) { // Only May
                dataVencimento = new Date(targetYear, 4, 31) // May 31st
                proximoVencimento = new Date(targetYear + 1, 4, 31) // May 31st next year
              } else {
                return // Skip non-annual months
              }
              break
            default:
              dataVencimento = new Date(targetYear, adjustedMonth, 25)
              proximoVencimento = new Date(targetYear, adjustedMonth + 1, 25)
          }
          
          // Determine status based on date
          const today = new Date()
          const daysUntilDue = differenceInDays(dataVencimento, today)
          
          let status: ObrigacaoFiscal['status']
          const randomStatus = Math.random()
          
          if (daysUntilDue < 0) {
            status = randomStatus > 0.7 ? 'cumprido' : 'vencido'
          } else if (daysUntilDue <= obrigacao.diasAlerta) {
            status = randomStatus > 0.4 ? 'cumprido' : 'pendente'
          } else {
            status = randomStatus > 0.6 ? 'cumprido' : 'pendente'
          }
          
          const obrigacaoCompleta: ObrigacaoFiscal = {
            id: `${index}-${monthOffset}-${adjustedMonth}`,
            ...obrigacao,
            dataVencimento,
            proximoVencimento,
            status,
            alertaEnviado: daysUntilDue <= obrigacao.diasAlerta,
            cliente: EMPRESAS_CLIENTES[index % EMPRESAS_CLIENTES.length].nome,
            dataCumprimento: status === 'cumprido' ? new Date(targetYear, adjustedMonth, Math.floor(Math.random() * 20) + 1) : undefined,
            usuarioCumprimento: status === 'cumprido' ? FUNCIONARIOS[Math.floor(Math.random() * FUNCIONARIOS.length)] : undefined,
            diasAtraso: status === 'vencido' ? Math.abs(daysUntilDue) : undefined,
            valorMulta: status === 'vencido' ? Math.abs(daysUntilDue) * (50 + Math.random() * 200) : undefined,
            empresasCumpridas: []
          }
          
          // Generate empresas cumpridas if status is cumprido
          if (status === 'cumprido') {
            obrigacaoCompleta.empresasCumpridas = generateEmpresasCumpridas(obrigacaoCompleta)
          }
          
          sampleObrigacoes.push(obrigacaoCompleta)
        })
      }
      
      setObrigacoes(sampleObrigacoes)
    }
    
    setIsLoading(false)
  }, [])

  // Save obrigações
  useEffect(() => {
    if (obrigacoes.length > 0 && isAuthenticated) {
      localStorage.setItem('obrigacoes_fiscais', JSON.stringify(obrigacoes))
    }
  }, [obrigacoes, isAuthenticated])

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

  // Toggle cumprimento
  const handleToggleCumprimento = useCallback((obrigacaoId: string) => {
    console.log('Toggle cumprimento:', obrigacaoId)
    
    setObrigacoes(prev => prev.map(obrigacao => {
      if (obrigacao.id === obrigacaoId) {
        const isCumprido = obrigacao.status === 'cumprido'
        return {
          ...obrigacao,
          status: isCumprido ? 'pendente' : 'cumprido',
          dataCumprimento: isCumprido ? undefined : new Date(),
          usuarioCumprimento: isCumprido ? undefined : 'Usuário Atual'
        }
      }
      return obrigacao
    }))
    
    const obrigacao = obrigacoes.find(o => o.id === obrigacaoId)
    if (obrigacao) {
      const novoCumprimento = obrigacao.status !== 'cumprido'
      toast({
        title: novoCumprimento ? "Obrigação cumprida!" : "Cumprimento desmarcado",
        description: `${obrigacao.codigo} - ${obrigacao.nome}`,
      })
    }
  }, [obrigacoes, toast])

  // Add obrigação handler
  const handleAddObrigacao = useCallback(() => {
    console.log('Adding obrigação:', formData)
    
    const novaObrigacao: ObrigacaoFiscal = {
      id: Date.now().toString(),
      codigo: formData.codigo,
      nome: formData.nome,
      descricao: formData.descricao,
      tipo: formData.tipo as ObrigacaoFiscal['tipo'],
      periodicidade: formData.periodicidade as ObrigacaoFiscal['periodicidade'],
      dataVencimento: new Date(formData.dataVencimento),
      proximoVencimento: new Date(formData.dataVencimento),
      status: 'pendente',
      prioridade: formData.prioridade as ObrigacaoFiscal['prioridade'],
      responsavel: formData.responsavel,
      cliente: formData.cliente,
      observacoes: formData.observacoes,
      alertaEnviado: false,
      categoria: formData.categoria as ObrigacaoFiscal['categoria'],
      orgaoDestino: formData.orgaoDestino,
      sistemaEnvio: formData.sistemaEnvio,
      recorrente: formData.recorrente,
      diasAlerta: parseInt(formData.diasAlerta),
      documentos: []
    }
    
    setObrigacoes(prev => [...prev, novaObrigacao])
    setShowAddDialog(false)
    
    // Reset form
    setFormData({
      codigo: '',
      nome: '',
      descricao: '',
      tipo: 'federal',
      periodicidade: 'mensal',
      prioridade: 'media',
      responsavel: '',
      cliente: '',
      observacoes: '',
      categoria: 'declaracao',
      orgaoDestino: '',
      sistemaEnvio: '',
      diasAlerta: '5',
      recorrente: true,
      dataVencimento: ''
    })
    
    toast({
      title: "Obrigação adicionada com sucesso!",
      description: `${novaObrigacao.codigo} - ${novaObrigacao.nome}`,
    })
  }, [formData, toast])

  // View obrigação handler
  const handleViewObrigacao = useCallback((obrigacao: ObrigacaoFiscal) => {
    setSelectedObrigacao(obrigacao)
    setShowViewDialog(true)
  }, [])

  // Quick filter handlers
  const handleQuickFilter = (filterType: 'todas' | 'cumpridas' | 'pendentes' | 'empresas') => {
    setActiveTab('obrigacoes')
    
    switch (filterType) {
      case 'todas':
        setStatusFilter('todas')
        break
      case 'cumpridas':
        setStatusFilter('cumprido')
        break
      case 'pendentes':
        setStatusFilter('pendente')
        break
      case 'empresas':
        setStatusFilter('cumprido') // Show only fulfilled obligations to see companies
        break
    }
    
    // Clear other filters
    setTipoFilter('todos')
    setPrioridadeFilter('todas')
    setSearchTerm('')
    
    toast({
      title: "Filtro aplicado!",
      description: `Visualizando ${filterType === 'todas' ? 'todas as obrigações' : 
                    filterType === 'cumpridas' ? 'obrigações cumpridas' :
                    filterType === 'pendentes' ? 'obrigações pendentes' :
                    'empresas atendidas'}`
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'em_andamento': return 'bg-blue-100 text-blue-800'
      case 'cumprido': return 'bg-green-100 text-green-800'
      case 'vencido': return 'bg-red-100 text-red-800'
      case 'isento': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get priority color
  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-green-100 text-green-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'alta': return 'bg-orange-100 text-orange-800'
      case 'critica': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get type color
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'federal': return 'bg-blue-100 text-blue-800'
      case 'estadual': return 'bg-purple-100 text-purple-800'
      case 'municipal': return 'bg-green-100 text-green-800'
      case 'trabalhista': return 'bg-orange-100 text-orange-800'
      case 'previdenciaria': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Pendente'
      case 'em_andamento': return 'Em Andamento'
      case 'cumprido': return 'Cumprido'
      case 'vencido': return 'Vencido'
      case 'isento': return 'Isento'
      default: return 'Desconhecido'
    }
  }

  // Get priority label
  const getPriorityLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'Baixa'
      case 'media': return 'Média'
      case 'alta': return 'Alta'
      case 'critica': return 'Crítica'
      default: return 'Desconhecida'
    }
  }

  // Get tipo label
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'federal': return 'Federal'
      case 'estadual': return 'Estadual'
      case 'municipal': return 'Municipal'
      case 'trabalhista': return 'Trabalhista'
      case 'previdenciaria': return 'Previdenciária'
      default: return 'Não especificado'
    }
  }

  // Get periodicidade label
  const getPeriodicidadeLabel = (periodicidade: string) => {
    switch (periodicidade) {
      case 'mensal': return 'Mensal'
      case 'trimestral': return 'Trimestral'
      case 'semestral': return 'Semestral'
      case 'anual': return 'Anual'
      case 'conforme_movimento': return 'Conforme Movimento'
      default: return 'Não especificado'
    }
  }

  // Get days until due
  const getDaysUntilDue = (dataVencimento: Date) => {
    const today = new Date()
    return differenceInDays(dataVencimento, today)
  }

  // Get urgency indicator
  const getUrgencyIndicator = (obrigacao: ObrigacaoFiscal) => {
    const daysUntil = getDaysUntilDue(obrigacao.dataVencimento)
    
    if (obrigacao.status === 'vencido') {
      return { color: 'text-red-600', icon: AlertTriangle, label: `${obrigacao.diasAtraso} dias em atraso` }
    } else if (daysUntil <= 0) {
      return { color: 'text-red-600', icon: AlertCircle, label: 'Vence hoje' }
    } else if (daysUntil <= obrigacao.diasAlerta) {
      return { color: 'text-orange-600', icon: Clock, label: `${daysUntil} dias restantes` }
    } else {
      return { color: 'text-green-600', icon: CheckCircle2, label: `${daysUntil} dias restantes` }
    }
  }

  // Navigation functions
  const navigateToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const navigateToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  const navigateToCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  // Get obligations for current month
  const getObrigacoesDoMes = useCallback(() => {
    return obrigacoes.filter(obrigacao => 
      isSameMonth(obrigacao.dataVencimento, currentMonth) ||
      isSameMonth(obrigacao.proximoVencimento, currentMonth)
    )
  }, [obrigacoes, currentMonth])

  // Generate empresas cumpridas for sample data
  const generateEmpresasCumpridas = (obrigacao: ObrigacaoFiscal): EmpresaCumprida[] => {
    if (obrigacao.status !== 'cumprido') return []
    
    const numEmpresas = Math.floor(Math.random() * 4) + 1 // 1-4 empresas
    const empresas: EmpresaCumprida[] = []
    
    for (let i = 0; i < numEmpresas; i++) {
      const empresa = EMPRESAS_CLIENTES[Math.floor(Math.random() * EMPRESAS_CLIENTES.length)]
      const funcionario = FUNCIONARIOS[Math.floor(Math.random() * FUNCIONARIOS.length)]
      
      empresas.push({
        id: `${obrigacao.id}-${empresa.id}`,
        nomeEmpresa: empresa.nome,
        cnpj: empresa.cnpj,
        dataCumprimento: obrigacao.dataCumprimento || new Date(),
        funcionarioResponsavel: funcionario,
        observacoes: Math.random() > 0.5 ? 'Cumprido dentro do prazo' : 'Processamento normal',
        valor: Math.random() > 0.5 ? Math.floor(Math.random() * 50000) + 1000 : undefined,
        protocolo: `${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      })
    }
    
    return empresas
  }

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    const firstDay = startOfMonth(calendarDate)
    const lastDay = endOfMonth(calendarDate)
    const startDate = addDays(firstDay, -firstDay.getDay())
    const endDate = addDays(lastDay, 6 - lastDay.getDay())
    
    const days: CalendarDay[] = []
    let currentDate = startDate
    
    while (currentDate <= endDate) {
      const dayObrigacoes = obrigacoes.filter(obrigacao => 
        isSameDay(obrigacao.dataVencimento, currentDate)
      )
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: isSameMonth(currentDate, calendarDate),
        obrigacoes: dayObrigacoes
      })
      
      currentDate = addDays(currentDate, 1)
    }
    
    return days
  }
  
  // Generate report
  const generateReport = () => {
    console.log('Generating report:', reportType, reportPeriod)
    
    let filteredObrigacoes = obrigacoes
    
    if (reportType === 'personalizado' && reportPeriod.dataInicio && reportPeriod.dataFim) {
      const startDate = new Date(reportPeriod.dataInicio)
      const endDate = new Date(reportPeriod.dataFim)
      
      filteredObrigacoes = obrigacoes.filter(obrigacao => 
        obrigacao.dataVencimento >= startDate && obrigacao.dataVencimento <= endDate
      )
    } else {
      filteredObrigacoes = getObrigacoesDoMes()
    }
    
    const reportData = {
      period: reportType === 'personalizado' 
        ? `${format(new Date(reportPeriod.dataInicio), 'dd/MM/yyyy')} - ${format(new Date(reportPeriod.dataFim), 'dd/MM/yyyy')}`
        : format(currentMonth, 'MMMM yyyy', { locale: ptBR }),
      generated: new Date(),
      obrigacoes: filteredObrigacoes,
      stats: {
        total: filteredObrigacoes.length,
        cumpridas: filteredObrigacoes.filter(o => o.status === 'cumprido').length,
        pendentes: filteredObrigacoes.filter(o => o.status === 'pendente').length,
        vencidas: filteredObrigacoes.filter(o => o.status === 'vencido').length,
        empresasAtendidas: filteredObrigacoes.reduce((total, o) => total + (o.empresasCumpridas?.length || 0), 0)
      }
    }
    
    // Generate HTML report
    const reportHtml = generateReportHtml(reportData)
    
    // Open report in new window
    const reportWindow = window.open('', '_blank')
    if (reportWindow) {
      reportWindow.document.write(reportHtml)
      reportWindow.document.close()
    }
    
    setShowReportDialog(false)
    
    toast({
      title: "Relatório gerado com sucesso!",
      description: "O relatório foi aberto em uma nova janela."
    })
  }
  
  // Generate report HTML
  const generateReportHtml = (reportData: any) => {
    const logoUrl = "https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png"
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Obrigações Fiscais - AG Assessoria</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { max-height: 80px; margin-bottom: 10px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 5px; }
          .report-title { font-size: 18px; color: #64748b; margin-bottom: 10px; }
          .report-period { font-size: 14px; color: #64748b; }
          .stats { display: flex; justify-content: space-around; margin: 30px 0; }
          .stat-card { text-align: center; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .stat-number { font-size: 32px; font-weight: bold; color: #1e40af; }
          .stat-label { font-size: 14px; color: #64748b; }
          .obrigacoes-list { margin-top: 30px; }
          .obrigacao-item { border: 1px solid #e2e8f0; margin-bottom: 15px; padding: 15px; border-radius: 8px; }
          .obrigacao-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
          .obrigacao-codigo { font-weight: bold; font-size: 16px; color: #1e40af; }
          .obrigacao-status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .status-cumprido { background-color: #dcfce7; color: #166534; }
          .status-pendente { background-color: #fef3c7; color: #92400e; }
          .status-vencido { background-color: #fecaca; color: #991b1b; }
          .obrigacao-details { font-size: 14px; line-height: 1.5; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" alt="AG Assessoria Logo" class="logo">
          <div class="company-name">AG ASSESSORIA CONTÁBIL</div>
          <div class="report-title">Relatório de Obrigações Fiscais</div>
          <div class="report-period">Período: ${reportData.period}</div>
          <div class="report-period">Gerado em: ${format(reportData.generated, 'dd/MM/yyyy HH:mm')}</div>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${reportData.stats.total}</div>
            <div class="stat-label">Total de Obrigações</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${reportData.stats.cumpridas}</div>
            <div class="stat-label">Cumpridas</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${reportData.stats.pendentes}</div>
            <div class="stat-label">Pendentes</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${reportData.stats.vencidas}</div>
            <div class="stat-label">Vencidas</div>
          </div>
        </div>
        
        <div class="obrigacoes-list">
          <h3>Detalhamento das Obrigações</h3>
          ${reportData.obrigacoes.map((obrigacao: ObrigacaoFiscal) => `
            <div class="obrigacao-item">
              <div class="obrigacao-header">
                <div class="obrigacao-codigo">${obrigacao.codigo}</div>
                <div class="obrigacao-status ${obrigacao.status === 'cumprido' ? 'status-cumprido' : 
                  obrigacao.status === 'pendente' ? 'status-pendente' : 
                  obrigacao.status === 'vencido' ? 'status-vencido' : ''}">
                  ${getStatusLabel(obrigacao.status)}
                </div>
              </div>
              <div class="obrigacao-details">
                <strong>Nome:</strong> ${obrigacao.nome}<br>
                <strong>Vencimento:</strong> ${format(obrigacao.dataVencimento, 'dd/MM/yyyy')}<br>
                <strong>Responsável:</strong> ${obrigacao.responsavel}<br>
                <strong>Órgão:</strong> ${obrigacao.orgaoDestino}<br>
                <strong>Tipo:</strong> ${getTipoLabel(obrigacao.tipo)}<br>
                <strong>Prioridade:</strong> ${getPriorityLabel(obrigacao.prioridade)}<br>
                ${obrigacao.status === 'cumprido' && obrigacao.usuarioCumprimento ? `<strong>Executado por:</strong> ${obrigacao.usuarioCumprimento}<br>` : ''}
                ${obrigacao.status === 'cumprido' && obrigacao.dataCumprimento ? `<strong>Data de Cumprimento:</strong> ${format(obrigacao.dataCumprimento, 'dd/MM/yyyy HH:mm')}<br>` : ''}
                ${obrigacao.empresasCumpridas && obrigacao.empresasCumpridas.length > 0 ? `<strong>Empresas:</strong> ${obrigacao.empresasCumpridas.length} empresas atendidas<br>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p>Relatório gerado automaticamente pelo Sistema de Obrigações Fiscais</p>
          <p>AG ASSESSORIA CONTÁBIL - Todos os direitos reservados</p>
        </div>
        
        <script>
          window.print();
        </script>
      </body>
      </html>
    `
  }

  // View empresas dialog handler
  const handleViewEmpresas = (obrigacao: ObrigacaoFiscal) => {
    setSelectedObrigacao(obrigacao)
    setShowEmpresasDialog(true)
  }

  // Toggle expanded obrigacao
  const toggleExpanded = (obrigacaoId: string) => {
    setExpandedObrigacao(prev => prev === obrigacaoId ? null : obrigacaoId)
  }

  // Get funcionario responsible for obligation
  const getFuncionarioResponsavel = (obrigacao: ObrigacaoFiscal) => {
    if (obrigacao.status === 'cumprido') {
      return obrigacao.usuarioCumprimento || 'Não informado'
    }
    return obrigacao.responsavel || 'Não atribuído'
  }

  // Get funcionario avatar color
  const getFuncionarioColor = (funcionario: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800'
    ]
    
    const index = funcionario.split(' ')[0].length % colors.length
    return colors[index]
  }

  // Get funcionario status indicator
  const getFuncionarioStatusIndicator = (obrigacao: ObrigacaoFiscal) => {
    const responsavelOriginal = obrigacao.responsavel
    const executorFinal = obrigacao.usuarioCumprimento
    
    if (obrigacao.status === 'cumprido' && executorFinal && responsavelOriginal !== executorFinal) {
      return {
        isTransferred: true,
        original: responsavelOriginal,
        executor: executorFinal
      }
    }
    
    return {
      isTransferred: false,
      original: responsavelOriginal,
      executor: executorFinal || responsavelOriginal
    }
  }

  // Calculate stats for current month
  const obrigacoesMes = getObrigacoesDoMes()
  const stats = {
    total: obrigacoesMes.length,
    pendentes: obrigacoesMes.filter(o => o.status === 'pendente').length,
    cumpridas: obrigacoesMes.filter(o => o.status === 'cumprido').length,
    vencidas: obrigacoesMes.filter(o => o.status === 'vencido').length,
    criticas: obrigacoesMes.filter(o => o.prioridade === 'critica').length,
    proximasVencimento: obrigacoesMes.filter(o => {
      const daysUntil = getDaysUntilDue(o.dataVencimento)
      return daysUntil <= o.diasAlerta && daysUntil >= 0
    }).length,
    cumprimentoMensal: obrigacoesMes.length > 0 ? Math.round((obrigacoesMes.filter(o => o.status === 'cumprido').length / obrigacoesMes.length) * 100) : 0,
    totalEmpresas: obrigacoesMes.reduce((total, o) => total + (o.empresasCumpridas?.length || 0), 0)
  }

  // Group obligations by type for month view
  const obrigacoesPorTipo = obrigacoesMes.reduce((acc, obrigacao) => {
    if (!acc[obrigacao.tipo]) {
      acc[obrigacao.tipo] = []
    }
    acc[obrigacao.tipo].push(obrigacao)
    return acc
  }, {} as Record<string, ObrigacaoFiscal[]>)

  // Login Component
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-violet-50 to-purple-50 flex items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-white/10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/6863183/pexels-photo-6863183.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')`
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
                  OBRIGAÇÕES FISCAIS
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
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              
              <Button 
                onClick={() => setShowReportDialog(true)}
                variant="outline"
                className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Printer className="w-4 h-4 mr-2" />
                Relatório
              </Button>
              
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Obrigação
              </Button>
              
              <Button 
                onClick={loadObrigacoes}
                variant="outline"
                className="text-violet-600 border-violet-300 hover:bg-violet-50 hover:border-violet-500 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
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
        
        {/* Welcome Section with Month Navigation */}
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
                
                {/* Month Navigation */}
                <div className="flex items-center space-x-4 bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateToPreviousMonth}
                    className="text-white hover:bg-white/30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {format(currentMonth, 'MMMM', { locale: ptBR })}
                    </p>
                    <p className="text-sm text-blue-100">
                      {format(currentMonth, 'yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={navigateToNextMonth}
                    className="text-white hover:bg-white/30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div 
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/30 transition-all duration-200"
                  onClick={() => handleQuickFilter('todas')}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <ClipboardList className="w-5 h-5 text-blue-300" />
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  <p className="text-xs text-blue-600 mt-1">Clique para ver todas</p>
                </div>
                
                <div 
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/30 transition-all duration-200"
                  onClick={() => handleQuickFilter('cumpridas')}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-300" />
                    <span className="text-sm font-medium">Cumpridas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.cumpridas}</p>
                  <p className="text-xs text-green-600 mt-1">Clique para ver cumpridas</p>
                </div>
                
                <div 
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/30 transition-all duration-200"
                  onClick={() => handleQuickFilter('pendentes')}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm font-medium">Pendentes</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
                  <p className="text-xs text-yellow-600 mt-1">Clique para ver pendentes</p>
                </div>
                
                <div 
                  className="bg-white/20 backdrop-blur-sm rounded-lg p-4 cursor-pointer hover:bg-white/30 transition-all duration-200"
                  onClick={() => handleQuickFilter('empresas')}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Factory className="w-5 h-5 text-purple-300" />
                    <span className="text-sm font-medium">Empresas</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalEmpresas}</p>
                  <p className="text-xs text-purple-600 mt-1">Clique para ver empresas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Month Button */}
        <div className="mb-6 text-center">
          <Button
            onClick={navigateToCurrentMonth}
            variant="outline"
            className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 font-medium px-6 py-2 rounded-lg transition-colors duration-200"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Voltar ao Mês Atual
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mensal">Visão Mensal</TabsTrigger>
            <TabsTrigger value="obrigacoes">Todas Obrigações</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="mensal" className="space-y-6">
            {/* Monthly Performance */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 font-bold text-lg">
                  Performance do Mês - {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Acompanhe o cumprimento das obrigações fiscais
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div 
                    className="text-center cursor-pointer hover:bg-slate-50 rounded-lg p-4 transition-all duration-200"
                    onClick={() => handleQuickFilter('todas')}
                  >
                    <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <ClipboardList className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    <p className="text-sm text-slate-600">Total de Obrigações</p>
                    <p className="text-xs text-blue-600 mt-1">👆 Clique para ver todas</p>
                  </div>
                  
                  <div 
                    className="text-center cursor-pointer hover:bg-slate-50 rounded-lg p-4 transition-all duration-200"
                    onClick={() => handleQuickFilter('cumpridas')}
                  >
                    <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.cumpridas}</p>
                    <p className="text-sm text-slate-600">Cumpridas</p>
                    <div className="mt-2">
                      <Progress value={stats.cumprimentoMensal} className="h-2" />
                      <p className="text-xs text-slate-500 mt-1">{stats.cumprimentoMensal}%</p>
                    </div>
                    <p className="text-xs text-green-600 mt-1">👆 Clique para ver cumpridas</p>
                  </div>
                  
                  <div 
                    className="text-center cursor-pointer hover:bg-slate-50 rounded-lg p-4 transition-all duration-200"
                    onClick={() => handleQuickFilter('pendentes')}
                  >
                    <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
                    <p className="text-sm text-slate-600">Pendentes</p>
                    <p className="text-xs text-yellow-600 mt-1">👆 Clique para ver pendentes</p>
                  </div>
                  
                  <div 
                    className="text-center cursor-pointer hover:bg-slate-50 rounded-lg p-4 transition-all duration-200"
                    onClick={() => handleQuickFilter('empresas')}
                  >
                    <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Factory className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalEmpresas}</p>
                    <p className="text-sm text-slate-600">Empresas Atendidas</p>
                    <p className="text-xs text-purple-600 mt-1">👆 Clique para ver empresas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Funcionários Performance */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-purple-700 font-bold text-lg">
                  Funcionários Responsáveis - {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Acompanhe a performance da equipe contábil
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FUNCIONARIOS.map((funcionario, index) => {
                    const obrigacoesFuncionario = obrigacoesMes.filter(o => 
                      o.status === 'cumprido' && o.usuarioCumprimento === funcionario
                    )
                    const empresasAtendidas = obrigacoesFuncionario.reduce((total, o) => 
                      total + (o.empresasCumpridas?.length || 0), 0
                    )
                    
                    return (
                      <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-3 rounded-full ${getFuncionarioColor(funcionario)}`}>
                              <UserCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800">{funcionario}</h4>
                              <p className="text-sm text-slate-600">Equipe Contábil</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{obrigacoesFuncionario.length}</p>
                              <p className="text-sm text-slate-600">Obrigações</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{empresasAtendidas}</p>
                              <p className="text-sm text-slate-600">Empresas</p>
                            </div>
                          </div>
                          
                          {obrigacoesFuncionario.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <p className="text-xs text-slate-500 font-medium mb-2">Últimas obrigações:</p>
                              <div className="space-y-1">
                                {obrigacoesFuncionario.slice(0, 3).map((obrigacao, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600">{obrigacao.codigo}</span>
                                    <span className="text-xs text-green-600">
                                      {obrigacao.dataCumprimento && format(obrigacao.dataCumprimento, 'dd/MM')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Obligations by Type */}
            <div className="space-y-6">
              {Object.entries(obrigacoesPorTipo).map(([tipo, obrigacoesTipo]) => (
                <Card key={tipo} className="bg-white shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                    <CardTitle className="text-blue-700 font-bold text-lg flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${getTipoColor(tipo)}`}>
                        {tipo === 'federal' && <Building className="w-5 h-5" />}
                        {tipo === 'estadual' && <MapPin className="w-5 h-5" />}
                        {tipo === 'municipal' && <Home className="w-5 h-5" />}
                        {tipo === 'trabalhista' && <Users className="w-5 h-5" />}
                        {tipo === 'previdenciaria' && <Shield className="w-5 h-5" />}
                      </div>
                      Obrigações {getTipoLabel(tipo)} ({obrigacoesTipo.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {obrigacoesTipo.map((obrigacao) => {
                        const urgency = getUrgencyIndicator(obrigacao)
                        const UrgencyIcon = urgency.icon
                        const isExpanded = expandedObrigacao === obrigacao.id
                        
                        return (
                          <Card key={obrigacao.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  <div className="flex items-center space-x-3">
                                    <Checkbox
                                      checked={obrigacao.status === 'cumprido'}
                                      onCheckedChange={() => handleToggleCumprimento(obrigacao.id)}
                                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                    />
                                    <div className="bg-blue-100 p-3 rounded-lg">
                                      <FileText className="w-6 h-6 text-blue-600" />
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                      <h3 className="font-bold text-lg text-slate-800">{obrigacao.codigo}</h3>
                                      <Badge className={getStatusColor(obrigacao.status)}>
                                        {getStatusLabel(obrigacao.status)}
                                      </Badge>
                                      <Badge className={getPriorityColor(obrigacao.prioridade)}>
                                        {getPriorityLabel(obrigacao.prioridade)}
                                      </Badge>
                                      <Badge className={getTipoColor(obrigacao.tipo)}>
                                        {getTipoLabel(obrigacao.tipo)}
                                      </Badge>
                                    </div>
                                    
                                    <p className="text-slate-700 font-medium mb-2">{obrigacao.nome}</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                                      <div>
                                        <p><strong>Periodicidade:</strong> {getPeriodicidadeLabel(obrigacao.periodicidade)}</p>
                                        <p><strong>Vencimento:</strong> {format(obrigacao.dataVencimento, 'dd/MM/yyyy')}</p>
                                        {obrigacao.cliente && <p><strong>Cliente:</strong> {obrigacao.cliente}</p>}
                                      </div>
                                      <div>
                                        <p><strong>Sistema:</strong> {obrigacao.sistemaEnvio}</p>
                                        <p><strong>Órgão:</strong> {obrigacao.orgaoDestino}</p>
                                        <div className="space-y-2 mt-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-slate-500">Responsável:</span>
                                            <Badge className={getFuncionarioColor(obrigacao.responsavel)}>
                                              <Briefcase className="w-3 h-3 mr-1" />
                                              {obrigacao.responsavel}
                                            </Badge>
                                          </div>
                                          
                                          {obrigacao.status === 'cumprido' && obrigacao.usuarioCumprimento && (
                                            <div className="flex items-center space-x-2">
                                              <span className="text-xs font-medium text-green-600">Executado por:</span>
                                              <Badge className={`${getFuncionarioColor(obrigacao.usuarioCumprimento)} border-green-300`}>
                                                <UserCheck className="w-3 h-3 mr-1" />
                                                {obrigacao.usuarioCumprimento}
                                              </Badge>
                                              {obrigacao.responsavel !== obrigacao.usuarioCumprimento && (
                                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                                  <ArrowRight className="w-3 h-3 mr-1" />
                                                  Transferido
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                          
                                          {obrigacao.status === 'cumprido' && obrigacao.dataCumprimento && (
                                            <div className="flex items-center space-x-2">
                                              <span className="text-xs font-medium text-green-600">Cumprido em:</span>
                                              <span className="text-xs text-green-600 font-medium">
                                                {format(obrigacao.dataCumprimento, 'dd/MM/yyyy HH:mm')}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4">
                                      <div className="flex items-center space-x-2">
                                        <UrgencyIcon className={`w-4 h-4 ${urgency.color}`} />
                                        <span className={`text-sm font-medium ${urgency.color}`}>
                                          {urgency.label}
                                        </span>
                                      </div>
                                      {obrigacao.status === 'vencido' && obrigacao.valorMulta && (
                                        <div className="flex items-center space-x-2">
                                          <Banknote className="w-4 h-4 text-red-500" />
                                          <span className="text-sm text-red-500 font-medium">
                                            Multa: R$ {obrigacao.valorMulta.toFixed(2)}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Empresas Summary */}
                                    {obrigacao.status === 'cumprido' && obrigacao.empresasCumpridas && obrigacao.empresasCumpridas.length > 0 && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="text-sm font-medium text-green-800">Empresas que cumpriram:</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {obrigacao.empresasCumpridas.slice(0, 3).map((empresa, index) => (
                                                <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                                                  {empresa.nomeEmpresa}
                                                </Badge>
                                              ))}
                                              {obrigacao.empresasCumpridas.length > 3 && (
                                                <Badge variant="outline" className="text-green-700 border-green-300">
                                                  +{obrigacao.empresasCumpridas.length - 3} mais
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleExpanded(obrigacao.id)}
                                            className="text-green-600 border-green-300 hover:bg-green-50"
                                          >
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                          </Button>
                                        </div>
                                        
                                        {/* Expanded View */}
                                        {isExpanded && (
                                          <div className="mt-4 pt-4 border-t border-green-200">
                                            <div className="space-y-3">
                                              {obrigacao.empresasCumpridas.map((empresa, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                                                  <div className="flex items-center space-x-3">
                                                    <div className="bg-green-100 p-2 rounded-full">
                                                      <Building className="w-4 h-4 text-green-600" />
                                                    </div>
                                                    <div>
                                                      <p className="font-medium text-slate-800">{empresa.nomeEmpresa}</p>
                                                      <p className="text-sm text-slate-600">CNPJ: {empresa.cnpj}</p>
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-sm font-medium text-green-600">
                                                      {format(empresa.dataCumprimento, 'dd/MM/yyyy')}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{empresa.funcionarioResponsavel}</p>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                                    onClick={() => handleViewObrigacao(obrigacao)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {obrigacao.status === 'cumprido' && obrigacao.empresasCumpridas && obrigacao.empresasCumpridas.length > 0 && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 transition-colors duration-200"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="obrigacoes" className="space-y-6">
            {/* Quick Access Filters */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 font-bold text-lg">Acesso Rápido</CardTitle>
                <CardDescription className="text-slate-600">
                  Clique para filtrar rapidamente as obrigações
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-all duration-200"
                    onClick={() => handleQuickFilter('todas')}
                  >
                    <ClipboardList className="w-6 h-6" />
                    <span className="text-sm font-medium">Todas ({stats.total})</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 transition-all duration-200"
                    onClick={() => handleQuickFilter('cumpridas')}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="text-sm font-medium">Cumpridas ({stats.cumpridas})</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-yellow-600 border-yellow-300 hover:bg-yellow-50 hover:border-yellow-500 transition-all duration-200"
                    onClick={() => handleQuickFilter('pendentes')}
                  >
                    <Clock className="w-6 h-6" />
                    <span className="text-sm font-medium">Pendentes ({stats.pendentes})</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-purple-600 border-purple-300 hover:bg-purple-50 hover:border-purple-500 transition-all duration-200"
                    onClick={() => handleQuickFilter('empresas')}
                  >
                    <Factory className="w-6 h-6" />
                    <span className="text-sm font-medium">Empresas ({stats.totalEmpresas})</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Filters */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 font-bold text-lg">Filtros e Pesquisa</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="search" className="text-slate-700 font-medium">Pesquisar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Código, nome ou responsável..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="status-filter" className="text-slate-700 font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="cumprido">Cumprido</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                        <SelectItem value="isento">Isento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tipo-filter" className="text-slate-700 font-medium">Tipo</Label>
                    <Select value={tipoFilter} onValueChange={setTipoFilter}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="federal">Federal</SelectItem>
                        <SelectItem value="estadual">Estadual</SelectItem>
                        <SelectItem value="municipal">Municipal</SelectItem>
                        <SelectItem value="trabalhista">Trabalhista</SelectItem>
                        <SelectItem value="previdenciaria">Previdenciária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority-filter" className="text-slate-700 font-medium">Prioridade</Label>
                    <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="critica">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 font-medium rounded-lg transition-colors duration-200"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('todas')
                        setTipoFilter('todos')
                        setPrioridadeFilter('todas')
                      }}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Obligations List */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 font-bold text-lg">Obrigações Fiscais ({filteredObrigacoes.length})</CardTitle>
                <CardDescription className="text-slate-600">
                  Gerencie todas as obrigações fiscais da empresa
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {filteredObrigacoes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg">Nenhuma obrigação encontrada</p>
                    <p className="text-slate-400 text-sm mt-2">
                      {searchTerm || statusFilter !== 'todas' || tipoFilter !== 'todos' || prioridadeFilter !== 'todas'
                        ? 'Tente ajustar os filtros de pesquisa'
                        : 'Clique em "Nova Obrigação" para começar'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredObrigacoes.map((obrigacao) => {
                      const urgency = getUrgencyIndicator(obrigacao)
                      const UrgencyIcon = urgency.icon
                      
                      return (
                        <Card key={obrigacao.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4 flex-1">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    checked={obrigacao.status === 'cumprido'}
                                    onCheckedChange={() => handleToggleCumprimento(obrigacao.id)}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                  />
                                  <div className="bg-blue-100 p-3 rounded-lg">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="font-bold text-lg text-slate-800">{obrigacao.codigo}</h3>
                                    <Badge className={getStatusColor(obrigacao.status)}>
                                      {getStatusLabel(obrigacao.status)}
                                    </Badge>
                                    <Badge className={getPriorityColor(obrigacao.prioridade)}>
                                      {getPriorityLabel(obrigacao.prioridade)}
                                    </Badge>
                                    <Badge className={getTipoColor(obrigacao.tipo)}>
                                      {getTipoLabel(obrigacao.tipo)}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-slate-700 font-medium mb-2">{obrigacao.nome}</p>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                                    <div>
                                      <p><strong>Periodicidade:</strong> {getPeriodicidadeLabel(obrigacao.periodicidade)}</p>
                                      <p><strong>Vencimento:</strong> {format(obrigacao.dataVencimento, 'dd/MM/yyyy')}</p>
                                      {obrigacao.cliente && <p><strong>Cliente:</strong> {obrigacao.cliente}</p>}
                                    </div>
                                    <div>
                                      <p><strong>Sistema:</strong> {obrigacao.sistemaEnvio}</p>
                                      <p><strong>Órgão:</strong> {obrigacao.orgaoDestino}</p>
                                      <div className="space-y-2 mt-2">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs font-medium text-slate-500">Responsável:</span>
                                          <Badge className={getFuncionarioColor(obrigacao.responsavel)}>
                                            <Briefcase className="w-3 h-3 mr-1" />
                                            {obrigacao.responsavel}
                                          </Badge>
                                        </div>
                                        
                                        {obrigacao.status === 'cumprido' && obrigacao.usuarioCumprimento && (
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-green-600">Executado por:</span>
                                            <Badge className={`${getFuncionarioColor(obrigacao.usuarioCumprimento)} border-green-300`}>
                                              <UserCheck className="w-3 h-3 mr-1" />
                                              {obrigacao.usuarioCumprimento}
                                            </Badge>
                                            {obrigacao.responsavel !== obrigacao.usuarioCumprimento && (
                                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                                <ArrowRight className="w-3 h-3 mr-1" />
                                                Transferido
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                        
                                        {obrigacao.status === 'cumprido' && obrigacao.dataCumprimento && (
                                          <div className="flex items-center space-x-2">
                                            <span className="text-xs font-medium text-green-600">Cumprido em:</span>
                                            <span className="text-xs text-green-600 font-medium">
                                              {format(obrigacao.dataCumprimento, 'dd/MM/yyyy HH:mm')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                      <UrgencyIcon className={`w-4 h-4 ${urgency.color}`} />
                                      <span className={`text-sm font-medium ${urgency.color}`}>
                                        {urgency.label}
                                      </span>
                                    </div>
                                    {obrigacao.status === 'vencido' && obrigacao.valorMulta && (
                                      <div className="flex items-center space-x-2">
                                        <Banknote className="w-4 h-4 text-red-500" />
                                        <span className="text-sm text-red-500 font-medium">
                                          Multa: R$ {obrigacao.valorMulta.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                                  onClick={() => handleViewObrigacao(obrigacao)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 transition-colors duration-200"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calendario" className="space-y-6">
            {/* Calendar Navigation */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 font-bold text-lg flex items-center justify-between">
                  <span>Calendário de Vencimentos</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-semibold text-blue-700 px-4">
                      {format(calendarDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Visualize os vencimentos das obrigações fiscais em calendário
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-slate-600 p-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((day, index) => {
                    const isToday = isSameDay(day.date, new Date())
                    const hasObrigacoes = day.obrigacoes.length > 0
                    const urgentObrigacoes = day.obrigacoes.filter(o => {
                      const daysUntil = getDaysUntilDue(o.dataVencimento)
                      return daysUntil <= 3 && o.status !== 'cumprido'
                    })
                    
                    return (
                      <div
                        key={index}
                        className={`min-h-[80px] p-2 border border-slate-200 rounded-lg cursor-pointer transition-colors duration-200
                          ${day.isCurrentMonth ? 'bg-white' : 'bg-slate-50'}
                          ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                          ${hasObrigacoes ? 'hover:bg-slate-50' : ''}
                        `}
                        onClick={() => hasObrigacoes && setSelectedObrigacao(day.obrigacoes[0])}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium
                            ${day.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}
                            ${isToday ? 'text-blue-600 font-bold' : ''}
                          `}>
                            {format(day.date, 'd')}
                          </span>
                          {urgentObrigacoes.length > 0 && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        
                        {hasObrigacoes && (
                          <div className="space-y-1">
                            {day.obrigacoes.slice(0, 2).map((obrigacao, idx) => (
                              <div
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full text-center font-medium
                                  ${obrigacao.status === 'cumprido' ? 'bg-green-100 text-green-800' :
                                    obrigacao.status === 'vencido' ? 'bg-red-100 text-red-800' :
                                    obrigacao.prioridade === 'critica' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'}`}
                              >
                                {obrigacao.codigo}
                              </div>
                            ))}
                            {day.obrigacoes.length > 2 && (
                              <div className="text-xs text-slate-500 text-center">
                                +{day.obrigacoes.length - 2} mais
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {/* Calendar Legend */}
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">Legenda:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-100 rounded-full"></div>
                      <span className="text-slate-600">Cumprido</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-100 rounded-full"></div>
                      <span className="text-slate-600">Pendente</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-orange-100 rounded-full"></div>
                      <span className="text-slate-600">Prioridade Alta</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-100 rounded-full"></div>
                      <span className="text-slate-600">Crítico/Vencido</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Calendar Summary */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-purple-700 font-bold text-lg">
                  Resumo do Mês - {format(calendarDate, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Estatísticas das obrigações do mês selecionado
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {obrigacoes.filter(o => isSameMonth(o.dataVencimento, calendarDate)).length}
                    </p>
                    <p className="text-sm text-slate-600">Total no Mês</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      {obrigacoes.filter(o => isSameMonth(o.dataVencimento, calendarDate) && o.status === 'cumprido').length}
                    </p>
                    <p className="text-sm text-slate-600">Cumpridas</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-yellow-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {obrigacoes.filter(o => isSameMonth(o.dataVencimento, calendarDate) && o.status === 'pendente').length}
                    </p>
                    <p className="text-sm text-slate-600">Pendentes</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-red-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                      {obrigacoes.filter(o => isSameMonth(o.dataVencimento, calendarDate) && (o.status === 'vencido' || o.prioridade === 'critica')).length}
                    </p>
                    <p className="text-sm text-slate-600">Críticas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Obligation Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Obrigação Fiscal</DialogTitle>
            <DialogDescription>
              Cadastre uma nova obrigação fiscal para acompanhamento
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                placeholder="Ex: DARF, GFIP, DIRF"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="nome">Nome da Obrigação *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome completo da obrigação"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
              >
                <SelectTrigger className="border-slate-300">
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
              <Label htmlFor="periodicidade">Periodicidade *</Label>
              <Select 
                value={formData.periodicidade} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, periodicidade: value }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione a periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                  <SelectItem value="conforme_movimento">Conforme Movimento</SelectItem>
                </SelectContent>
              </Select>
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
            
            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select 
                value={formData.prioridade} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, prioridade: value }))}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
              <Label htmlFor="orgaoDestino">Órgão Destinatário</Label>
              <Input
                id="orgaoDestino"
                value={formData.orgaoDestino}
                onChange={(e) => setFormData(prev => ({ ...prev, orgaoDestino: e.target.value }))}
                placeholder="Ex: Receita Federal, Prefeitura"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="sistemaEnvio">Sistema de Envio</Label>
              <Input
                id="sistemaEnvio"
                value={formData.sistemaEnvio}
                onChange={(e) => setFormData(prev => ({ ...prev, sistemaEnvio: e.target.value }))}
                placeholder="Ex: e-CAC, Portal da Prefeitura"
                className="border-slate-300"
              />
            </div>
            
            <div>
              <Label htmlFor="diasAlerta">Dias para Alerta</Label>
              <Input
                id="diasAlerta"
                type="number"
                value={formData.diasAlerta}
                onChange={(e) => setFormData(prev => ({ ...prev, diasAlerta: e.target.value }))}
                placeholder="5"
                className="border-slate-300"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição da obrigação fiscal"
                className="border-slate-300"
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais"
                className="border-slate-300"
                rows={2}
              />
            </div>
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
              onClick={handleAddObrigacao}
              disabled={!formData.codigo || !formData.nome || !formData.responsavel || !formData.dataVencimento}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Cadastrar Obrigação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Obligation Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Obrigação</DialogTitle>
            <DialogDescription>
              Visualize todas as informações da obrigação fiscal
            </DialogDescription>
          </DialogHeader>
          {selectedObrigacao && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Código</Label>
                      <p className="text-slate-900 font-semibold">{selectedObrigacao.codigo}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Nome</Label>
                      <p className="text-slate-900">{selectedObrigacao.nome}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Tipo</Label>
                      <p className="text-slate-900">{getTipoLabel(selectedObrigacao.tipo)}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Periodicidade</Label>
                      <p className="text-slate-900">{getPeriodicidadeLabel(selectedObrigacao.periodicidade)}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Status</Label>
                      <Badge className={getStatusColor(selectedObrigacao.status)}>
                        {getStatusLabel(selectedObrigacao.status)}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Prioridade</Label>
                      <Badge className={getPriorityColor(selectedObrigacao.prioridade)}>
                        {getPriorityLabel(selectedObrigacao.prioridade)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dates and Responsibility */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Prazos e Responsabilidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Data de Vencimento</Label>
                      <p className="text-slate-900">{format(selectedObrigacao.dataVencimento, 'dd/MM/yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Responsável</Label>
                      <p className="text-slate-900">{getFuncionarioResponsavel(selectedObrigacao)}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Órgão Destinatário</Label>
                      <p className="text-slate-900">{selectedObrigacao.orgaoDestino}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Sistema de Envio</Label>
                      <p className="text-slate-900">{selectedObrigacao.sistemaEnvio}</p>
                    </div>
                    {selectedObrigacao.dataCumprimento && (
                      <div>
                        <Label className="text-slate-700 font-medium">Data de Cumprimento</Label>
                        <p className="text-slate-900">{format(selectedObrigacao.dataCumprimento, 'dd/MM/yyyy')}</p>
                      </div>
                    )}
                    {selectedObrigacao.usuarioCumprimento && (
                      <div>
                        <Label className="text-slate-700 font-medium">Cumprido por</Label>
                        <p className="text-slate-900">{selectedObrigacao.usuarioCumprimento}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {selectedObrigacao.descricao && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Descrição</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{selectedObrigacao.descricao}</p>
                  </CardContent>
                </Card>
              )}

              {/* Documents */}
              {selectedObrigacao.documentos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Documentos Necessários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedObrigacao.documentos.map((doc, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-slate-700">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowViewDialog(false)}
              className="text-slate-600"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Empresas Dialog */}
      <Dialog open={showEmpresasDialog} onOpenChange={setShowEmpresasDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Empresas que Cumpriram a Obrigação</DialogTitle>
            <DialogDescription>
              {selectedObrigacao && (
                <>
                  <span className="font-medium">{selectedObrigacao.codigo}</span> - {selectedObrigacao.nome}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedObrigacao && selectedObrigacao.empresasCumpridas && (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo do Cumprimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="bg-green-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <Factory className="w-6 h-6 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">{selectedObrigacao.empresasCumpridas.length}</p>
                      <p className="text-sm text-slate-600">Empresas Atendidas</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-blue-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {new Set(selectedObrigacao.empresasCumpridas.map(e => e.funcionarioResponsavel)).size}
                      </p>
                      <p className="text-sm text-slate-600">Funcionários Envolvidos</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-purple-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <CalendarIcon className="w-6 h-6 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {format(selectedObrigacao.dataVencimento, 'dd/MM')}
                      </p>
                      <p className="text-sm text-slate-600">Vencimento</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-orange-100 p-3 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                        <Award className="w-6 h-6 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-orange-600">100%</p>
                      <p className="text-sm text-slate-600">Cumprimento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detalhes por Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedObrigacao.empresasCumpridas.map((empresa, index) => (
                      <Card key={index} className="border-0 shadow-md">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="bg-green-100 p-3 rounded-lg">
                                <Building className="w-6 h-6 text-green-600" />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-bold text-lg text-slate-800 mb-2">{empresa.nomeEmpresa}</h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                                  <div>
                                    <p><strong>CNPJ:</strong> {empresa.cnpj}</p>
                                    <p><strong>Data Cumprimento:</strong> {format(empresa.dataCumprimento, 'dd/MM/yyyy HH:mm')}</p>
                                  </div>
                                  <div>
                                    <p><strong>Funcionário:</strong> {empresa.funcionarioResponsavel}</p>
                                    {empresa.protocolo && <p><strong>Protocolo:</strong> {empresa.protocolo}</p>}
                                  </div>
                                </div>
                                
                                {empresa.valor && (
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Banknote className="w-4 h-4 text-green-600" />
                                    <span className="text-sm text-green-600 font-medium">
                                      Valor: R$ {empresa.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                                
                                {empresa.observacoes && (
                                  <div className="bg-slate-50 p-3 rounded-lg">
                                    <p className="text-sm text-slate-700">{empresa.observacoes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-green-100 text-green-800">
                                Cumprido
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEmpresasDialog(false)}
              className="text-slate-600"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileBarChart className="w-5 h-5 text-blue-600" />
              <span>Gerar Relatório de Obrigações</span>
            </DialogTitle>
            <DialogDescription>
              Configure o relatório personalizado com a logomarca da AG Assessoria
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Report Type */}
            <div className="space-y-3">
              <Label className="text-slate-700 font-medium">Tipo de Relatório</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant={reportType === 'mensal' ? 'default' : 'outline'}
                  onClick={() => setReportType('mensal')}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <Calendar className="w-6 h-6" />
                  <span>Relatório Mensal</span>
                  <span className="text-xs text-slate-500">Mês atual selecionado</span>
                </Button>
                
                <Button
                  variant={reportType === 'personalizado' ? 'default' : 'outline'}
                  onClick={() => setReportType('personalizado')}
                  className="h-20 flex flex-col items-center justify-center space-y-2"
                >
                  <FileBarChart className="w-6 h-6" />
                  <span>Relatório Personalizado</span>
                  <span className="text-xs text-slate-500">Período customizado</span>
                </Button>
              </div>
            </div>
            
            {/* Custom Period */}
            {reportType === 'personalizado' && (
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Período Personalizado</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dataInicio" className="text-sm text-slate-600">Data Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={reportPeriod.dataInicio}
                      onChange={(e) => setReportPeriod(prev => ({ ...prev, dataInicio: e.target.value }))}
                      className="border-slate-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim" className="text-sm text-slate-600">Data Fim</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={reportPeriod.dataFim}
                      onChange={(e) => setReportPeriod(prev => ({ ...prev, dataFim: e.target.value }))}
                      className="border-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Preview */}
            <Card className="bg-slate-50 border-0">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png" 
                    alt="AG Assessoria Logo" 
                    className="h-8 w-auto object-contain"
                  />
                  <span className="text-blue-700">AG ASSESSORIA CONTÁBIL</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-slate-600">
                  <p><strong>Relatório:</strong> Obrigações Fiscais</p>
                  <p><strong>Período:</strong> {reportType === 'personalizado' && reportPeriod.dataInicio && reportPeriod.dataFim 
                    ? `${format(new Date(reportPeriod.dataInicio), 'dd/MM/yyyy')} - ${format(new Date(reportPeriod.dataFim), 'dd/MM/yyyy')}`
                    : format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                  </p>
                  <p><strong>Gerado em:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                  <p><strong>Inclui:</strong> Estatísticas, detalhes das obrigações, funcionários responsáveis</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
              className="text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={generateReport}
              disabled={reportType === 'personalizado' && (!reportPeriod.dataInicio || !reportPeriod.dataFim)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}