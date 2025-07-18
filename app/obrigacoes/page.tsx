"use client"

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns'
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
  Flag
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
}

const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todas')
  const [tipoFilter, setTipoFilter] = useState<string>('todos')
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todas')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedObrigacao, setSelectedObrigacao] = useState<ObrigacaoFiscal | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
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
          dataCumprimento: obrigacao.dataCumprimento ? new Date(obrigacao.dataCumprimento) : undefined
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
      
      const sampleObrigacoes: ObrigacaoFiscal[] = OBRIGACOES_PADRAO.map((obrigacao, index) => {
        let dataVencimento: Date
        let proximoVencimento: Date
        
        // Calculate due dates based on periodicidade
        switch (obrigacao.periodicidade) {
          case 'mensal':
            dataVencimento = new Date(currentYear, currentMonth, 20) // 20th of current month
            proximoVencimento = new Date(currentYear, currentMonth + 1, 20) // 20th of next month
            break
          case 'trimestral':
            dataVencimento = new Date(currentYear, currentMonth + (3 - (currentMonth % 3)), 31) // End of current quarter
            proximoVencimento = new Date(currentYear, currentMonth + (6 - (currentMonth % 3)), 31) // End of next quarter
            break
          case 'anual':
            dataVencimento = new Date(currentYear, 4, 31) // May 31st
            proximoVencimento = new Date(currentYear + 1, 4, 31) // May 31st next year
            break
          default:
            dataVencimento = new Date(currentYear, currentMonth, 25)
            proximoVencimento = new Date(currentYear, currentMonth + 1, 25)
        }
        
        // Determine status based on date
        const today = new Date()
        const daysUntilDue = differenceInDays(dataVencimento, today)
        
        let status: ObrigacaoFiscal['status']
        if (daysUntilDue < 0) {
          status = 'vencido'
        } else if (daysUntilDue <= obrigacao.diasAlerta) {
          status = 'pendente'
        } else if (index % 4 === 0) {
          status = 'cumprido'
        } else {
          status = 'pendente'
        }
        
        return {
          id: (index + 1).toString(),
          ...obrigacao,
          dataVencimento,
          proximoVencimento,
          status,
          alertaEnviado: daysUntilDue <= obrigacao.diasAlerta,
          cliente: index % 3 === 0 ? 'Tech Solutions Ltda' : index % 3 === 1 ? 'Bella Estética MEI' : undefined,
          dataCumprimento: status === 'cumprido' ? new Date(currentYear, currentMonth, 15) : undefined,
          usuarioCumprimento: status === 'cumprido' ? 'Carlos Fiscal' : undefined,
          diasAtraso: status === 'vencido' ? Math.abs(daysUntilDue) : undefined,
          valorMulta: status === 'vencido' ? Math.abs(daysUntilDue) * 50 : undefined
        }
      })
      
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

  // Calculate stats
  const stats = {
    total: obrigacoes.length,
    pendentes: obrigacoes.filter(o => o.status === 'pendente').length,
    cumpridas: obrigacoes.filter(o => o.status === 'cumprido').length,
    vencidas: obrigacoes.filter(o => o.status === 'vencido').length,
    criticas: obrigacoes.filter(o => o.prioridade === 'critica').length,
    proximasVencimento: obrigacoes.filter(o => {
      const daysUntil = getDaysUntilDue(o.dataVencimento)
      return daysUntil <= o.diasAlerta && daysUntil >= 0
    }).length,
    cumprimentoMensal: Math.round((obrigacoes.filter(o => o.status === 'cumprido').length / obrigacoes.length) * 100) || 0
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
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Sistema de Obrigações Fiscais</h2>
              <p className="text-blue-100 text-lg">
                Controle completo de prazos e cumprimento de obrigações fiscais
              </p>
              <div className="mt-6 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-300" />
                  <span className="text-sm">Controle Automatizado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-violet-300" />
                  <span className="text-sm">Alertas de Vencimento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-300" />
                  <span className="text-sm">Compliance Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total de Obrigações</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Activity className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-sm text-blue-600 font-medium">Cadastradas</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Cumpridas</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.cumpridas}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600 font-medium">{stats.cumprimentoMensal}% este mês</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Pendentes</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.pendentes}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <AlertCircle className="w-4 h-4 text-yellow-600 mr-1" />
                <span className="text-sm text-yellow-600 font-medium">{stats.proximasVencimento} próximas</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Vencidas</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.vencidas}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Flag className="w-4 h-4 text-red-600 mr-1" />
                <span className="text-sm text-red-600 font-medium">{stats.criticas} críticas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="obrigacoes">Obrigações</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 font-bold text-lg">Ações Rápidas</CardTitle>
                <CardDescription className="text-slate-600">
                  Acesse rapidamente as principais funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <Plus className="w-8 h-8" />
                    <span className="text-lg font-medium">Nova Obrigação</span>
                    <span className="text-sm opacity-90">Cadastrar nova obrigação</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="text-violet-600 border-violet-300 hover:bg-violet-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <Calendar className="w-8 h-8" />
                    <span className="text-lg font-medium">Calendário</span>
                    <span className="text-sm opacity-90">Visualizar vencimentos</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="text-green-600 border-green-300 hover:bg-green-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <FileText className="w-8 h-8" />
                    <span className="text-lg font-medium">Relatório</span>
                    <span className="text-sm opacity-90">Gerar relatório</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Urgent Obligations */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 rounded-t-lg">
                <CardTitle className="text-red-700 font-bold text-lg">Obrigações Urgentes</CardTitle>
                <CardDescription className="text-slate-600">
                  Obrigações que precisam de atenção imediata
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {obrigacoes.filter(o => o.status === 'vencido' || getDaysUntilDue(o.dataVencimento) <= o.diasAlerta).length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <p className="text-green-600 text-lg font-medium">Tudo em dia!</p>
                    <p className="text-slate-500 text-sm mt-2">Nenhuma obrigação urgente no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {obrigacoes.filter(o => o.status === 'vencido' || getDaysUntilDue(o.dataVencimento) <= o.diasAlerta).slice(0, 5).map((obrigacao) => {
                      const urgency = getUrgencyIndicator(obrigacao)
                      const UrgencyIcon = urgency.icon
                      
                      return (
                        <div key={obrigacao.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-full ${obrigacao.status === 'vencido' ? 'bg-red-100' : 'bg-orange-100'}`}>
                              <UrgencyIcon className={`w-5 h-5 ${urgency.color}`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800">{obrigacao.codigo}</h4>
                              <p className="text-sm text-slate-600">{obrigacao.nome}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`text-xs ${urgency.color} font-medium`}>
                                  {urgency.label}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Vencimento: {format(obrigacao.dataVencimento, 'dd/MM/yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={obrigacao.status === 'cumprido'}
                              onCheckedChange={() => handleToggleCumprimento(obrigacao.id)}
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewObrigacao(obrigacao)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="obrigacoes" className="space-y-6">
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
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500">
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
                                      <p><strong>Responsável:</strong> {obrigacao.responsavel}</p>
                                      <p><strong>Órgão:</strong> {obrigacao.orgaoDestino}</p>
                                    </div>
                                    <div>
                                      <p><strong>Sistema:</strong> {obrigacao.sistemaEnvio}</p>
                                      <p><strong>Vencimento:</strong> {format(obrigacao.dataVencimento, 'dd/MM/yyyy')}</p>
                                      {obrigacao.cliente && <p><strong>Cliente:</strong> {obrigacao.cliente}</p>}
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
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-t-lg">
                <CardTitle className="text-blue-700 font-bold text-lg">Calendário de Vencimentos</CardTitle>
                <CardDescription className="text-slate-600">
                  Visualize os vencimentos das obrigações fiscais
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-slate-400" />
                  </div>
                  <p className="text-slate-500 text-lg">Calendário em desenvolvimento</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Em breve você terá uma visão completa dos vencimentos
                  </p>
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
                      <p className="text-slate-900">{selectedObrigacao.responsavel}</p>
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
    </div>
  )
}