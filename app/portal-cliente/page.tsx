'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Search,
  Building,
  FileText,
  Upload,
  Download,
  Eye,
  Calendar,
  Bell,
  User,
  ArrowLeft,
  LogOut,
  Phone,
  Mail,
  Star,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  Edit,
  Save,
  X,
  Trash2,
  Settings,
  AlertCircle,
  Shield,
  LogIn,
  Loader2,
  Key,
  Lock,
  Folder,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Link from 'next/link'
import MultipleUploadManager from '@/components/MultipleUploadManager'

// Interfaces
interface ResponsavelPF {
  id: string
  cpf: string
  nome: string
  email: string
  telefone: string
  senha: string
  senhaInicial: boolean // Primeira vez logando
  empresas: ClientePortal[]
  empresasIds: string[] // IDs das empresas que tem acesso
  dataCriacao: Date
  ultimoAcesso?: Date
}

interface ClientePortal {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
  email: string
  telefone: string
  endereco: string
  responsavelContabil: string
  dataVinculacao: Date
  status: 'ativo' | 'inativo' | 'suspenso'
  plano: 'basico' | 'completo' | 'premium'
  avatar?: string
  responsavelCpf: string // CPF do responsável
}

interface DocumentoCliente {
  id: string
  clienteId: string
  categoria: 'abertura_alteracao' | 'fiscal' | 'contabil' | 'trabalhista' | 'societario' | 'juridico' | 'outros'
  nome: string
  nomeOriginal: string
  tipo: string
  tamanho: number
  dataUpload: Date
  uploadPor: string
  descricao?: string
  tags?: string[]
  status: 'disponivel' | 'processando' | 'vencido' | 'enviado'
  prioridade: 'baixa' | 'media' | 'alta'
  confidencial: boolean
  dataVencimento?: Date
  observacoes?: string
  arquivo?: File
}

interface ObrigacaoCliente {
  id: string
  clienteId: string
  descricao: string
  tipo: 'imposto' | 'declaracao' | 'certidao' | 'relatorio'
  dataVencimento: Date
  valor?: number
  status: 'pendente' | 'cumprida' | 'vencida'
  responsavel: string
  observacoes?: string
}

interface NotificacaoCliente {
  id: string
  clienteId: string
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'success' | 'error'
  dataEnvio: Date
  dataLeitura?: Date
  lida: boolean
  acao?: {
    label: string
    url: string
  }
}

// Interface para Portal do Cliente
interface ResponsavelPortal {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  status: 'ativo' | 'inativo'
  senha: string
  senhaInicial: boolean
  empresaId: string
  empresaNome: string
  empresaCnpj: string
  dataCriacao: Date
  ultimoAcesso?: Date
}

// Mock Data - Remover para usar dados reais
const mockResponsavelPF: ResponsavelPF[] = []

const mockDocumentosCliente: DocumentoCliente[] = []

const mockObrigacoesCliente: ObrigacaoCliente[] = []

const mockNotificacoesCliente: NotificacaoCliente[] = []

// Funções auxiliares para formatação
const formatCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatCNPJ = (cnpj: string) => {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

const normalizeCPF = (cpf: string) => {
  return cpf.replace(/\D/g, '')
}

// Configuração de planos
const planoConfig = {
  basico: { label: 'Básico', color: 'bg-gray-100 text-gray-800' },
  completo: { label: 'Completo', color: 'bg-blue-100 text-blue-800' },
  premium: { label: 'Premium', color: 'bg-green-100 text-green-800' }
}

const categoriaConfig = {
  abertura_alteracao: {
    label: 'Abertura/Alteração',
    color: 'bg-blue-100 text-blue-800',
    icon: Building,
  },
  fiscal: {
    label: 'Fiscal',
    color: 'bg-red-100 text-red-800',
    icon: FileText,
  },
  contabil: {
    label: 'Contábil',
    color: 'bg-purple-100 text-purple-800',
    icon: FileText,
  },
  trabalhista: {
    label: 'Trabalhista',
    color: 'bg-green-100 text-green-800',
    icon: User,
  },
  societario: {
    label: 'Societário',
    color: 'bg-orange-100 text-orange-800',
    icon: Building,
  },
  juridico: {
    label: 'Jurídico',
    color: 'bg-indigo-100 text-indigo-800',
    icon: FileText,
  },
  outros: {
    label: 'Outros',
    color: 'bg-gray-100 text-gray-800',
    icon: Folder,
  },
}

// Função para carregar dados de fallback se não existirem
const loadFallbackData = async (): Promise<ResponsavelPortal[] | null> => {
  try {
    console.log('🔄 Carregando dados de fallback...')
    
    // Tentar carregar dados do Eduardo via API
    const response = await fetch('/api/sync-eduardo-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.responsavel) {
        console.log('✅ Dados do Eduardo carregados via API')
        
        // Criar estrutura completa do responsável
        const responsavelCompleto: ResponsavelPortal = {
          id: 'eduardo-gomes-001',
          nome: result.responsavel.nome,
          cpf: result.responsavel.cpf,
          email: result.responsavel.email,
          telefone: result.responsavel.telefone,
          status: 'ativo',
          senha: '22HHgYhJ',
          senhaInicial: true, // FORÇAR troca de senha no primeiro login
          empresaId: 'leg-comercio-001',
          empresaNome: 'LEG - COMERCIO E SERVICOS LTDA',
          empresaCnpj: '14.200.166/0001-11', // CNPJ CORRETO da LEG
          dataCriacao: new Date('2024-01-15T00:00:00.000Z'),
          ultimoAcesso: new Date()
        }
        
        // Salvar no localStorage para próximas vezes
        const responsaveisArray = [responsavelCompleto]
        localStorage.setItem('portal_responsaveis', JSON.stringify(responsaveisArray))
        console.log('💾 Dados salvos no localStorage:', responsaveisArray)
        
        return responsaveisArray
      }
    }
    
    // Fallback para dados de demonstração se a API falhar
    console.log('⚠️ API falhou, usando dados de demonstração')
    const fallbackData: ResponsavelPortal[] = [{
      id: 'eduardo-gomes-demo',
      nome: 'Eduardo Aparecido Gomes',
      cpf: '218.680.918-48',
      email: 'gomes1309@gmail.com',
      telefone: '16992714270',
      status: 'ativo',
      senha: '22HHgYhJ',
      senhaInicial: true, // FORÇAR troca de senha no primeiro login
      empresaId: 'leg-comercio-001',
      empresaNome: 'LEG - COMERCIO E SERVICOS LTDA',
      empresaCnpj: '14.200.166/0001-11', // CNPJ CORRETO da LEG
      dataCriacao: new Date('2024-01-15T00:00:00.000Z'),
      ultimoAcesso: new Date()
    }]
    
    localStorage.setItem('portal_responsaveis', JSON.stringify(fallbackData))
    return fallbackData
    
  } catch (error) {
    console.error('❌ Erro ao carregar dados de fallback:', error)
    return null
  }
}

export default function PortalClientePage() {
  // Estados principais
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentResponsavel, setCurrentResponsavel] = useState<ResponsavelPF | null>(null)
  const [currentCliente, setCurrentCliente] = useState<ClientePortal | null>(null)
  const [showEmpresaSelection, setShowEmpresaSelection] = useState(false)
  
  // Estados do login
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  
  // Estados para primeira vez logando
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordChangeData, setPasswordChangeData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })
  const [passwordChangeError, setPasswordChangeError] = useState('')
  
  // Estados para controle do PIN
  const [isPinMode, setIsPinMode] = useState(true) // Modo PIN ativo por padrão
  const [pinLength, setPinLength] = useState(4) // Tamanho padrão do PIN
  
  // Estados para recuperação de senha
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false)
  const [recoveryData, setRecoveryData] = useState({
    email: ''
  })
  const [recoveryError, setRecoveryError] = useState('')
  const [recoveryStep, setRecoveryStep] = useState<'input' | 'sent' | 'reset'>('input')
  
  // Estados dos dados - integrar com documentos reais
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([])
  const [obrigacoes, setObrigacoes] = useState<ObrigacaoCliente[]>(mockObrigacoesCliente)
  const [notificacoes, setNotificacoes] = useState<NotificacaoCliente[]>(mockNotificacoesCliente)
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Estados para edição do perfil
  const [isEditingEmpresa, setIsEditingEmpresa] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [empresaEditForm, setEmpresaEditForm] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    email: '',
    telefone: '',
    endereco: ''
  })

  console.log('Portal do Cliente carregado')

  // Função de debug para verificar dados no localStorage
  const debugLocalStorage = () => {
    console.log('🔍 === DEBUG DO LOCALSTORAGE ===')
    
    // Verificar dados de autenticação
    const authData = {
      responsavel: localStorage.getItem('portal_responsavel_auth'),
      cliente: localStorage.getItem('portal_client_auth'),
      responsaveis: localStorage.getItem('portal_responsaveis')
    }
    
    console.log('🔐 Dados de autenticação:', {
      responsavel: !!authData.responsavel,
      cliente: !!authData.cliente,
      responsaveis: !!authData.responsaveis
    })
    
    // Verificar dados de documentos
    const documentosData = localStorage.getItem('documentos_sistema')
    const clientesData = localStorage.getItem('clientes_documentos')
    
    console.log('📄 Dados de documentos:', {
      documentos: !!documentosData,
      clientes: !!clientesData,
      documentosCount: documentosData ? JSON.parse(documentosData).length : 0,
      clientesCount: clientesData ? JSON.parse(clientesData).length : 0
    })
    
    if (documentosData && clientesData) {
      const docs = JSON.parse(documentosData)
      const clients = JSON.parse(clientesData)
      
      console.log('📋 Detalhes dos documentos:', docs.map((d: any) => ({
        id: d.id,
        clienteId: d.clienteId,
        nome: d.nome,
        categoria: d.categoria
      })))
      
      console.log('👥 Detalhes dos clientes:', clients.map((c: any) => ({
        id: c.id,
        cnpj: c.cnpj,
        razaoSocial: c.razaoSocial
      })))
    }
    
    console.log('🔍 === FIM DO DEBUG ===')
  }
  
  // Expor função de debug globalmente para teste
  useEffect(() => {
    (window as any).debugPortalCliente = debugLocalStorage
    console.log('🛠️ Debug disponível: execute "debugPortalCliente()" no console do navegador')
  }, [])

  // Criar dados de teste
  const createTestData = async () => {
    try {
      console.log('Criando dados de teste...')
      const response = await fetch('/api/create-eduardo-gomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      console.log('Resultado da API:', result)
      
      if (result.success) {
        // Salvar dados no localStorage
        const responsaveis = [result.data.responsavel]
        localStorage.setItem('portal_responsaveis', JSON.stringify(responsaveis))
        console.log('Dados de teste criados com sucesso!')
        setDebugInfo('Dados de teste criados! Use as credenciais mostradas acima.')
      } else {
        setError('Erro ao criar dados de teste: ' + result.message)
      }
    } catch (error) {
      console.error('Erro ao criar dados de teste:', error)
      setError('Erro ao comunicar com o servidor')
    }
  }

  // Limpar dados
  const clearData = async () => {
    try {
      console.log('🧹 Limpando todos os dados do portal...')
      
      // Limpar localStorage
      const itemsToRemove = [
        'portal_responsaveis',
        'portal_responsavel_auth', 
        'portal_client_auth',
        'portal_current_responsavel',
        'portal_current_cliente'
      ]
      
      itemsToRemove.forEach(item => {
        localStorage.removeItem(item)
        console.log(`🗑️ ${item} removido`)
      })
      
      // Resetar estados
      setCurrentResponsavel(null)
      setCurrentCliente(null)
      setIsAuthenticated(false)
      setShowEmpresaSelection(false)
      setCpf('')
      setSenha('')
      setPasswordChangeData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
      setRecoveryData({ email: '' })
      
      console.log('✅ Portal limpo com sucesso!')
      
      // Opcional: Chamar API para limpeza no servidor
      await fetch('/api/clear-portal-data', { method: 'POST' })
      
    } catch (error) {
      console.error('❌ Erro ao limpar portal:', error)
    }
  }

  // Handle CPF input change - format CPF
  const handleCPFInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatCPF(e.target.value)
    setCpf(value)
  }, [])

  // Handle PIN input change - aceita apenas números
  const handlePINInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Remove tudo que não é dígito
    if (value.length <= 6) { // Máximo 6 dígitos
      setSenha(value)
    }
  }, [])

  // Função para validar PIN
  const isValidPIN = (pin: string) => {
    return pin.length >= 4 && pin.length <= 6 && /^\d+$/.test(pin)
  }

  // Função de login principal
  const handleLogin = async () => {
    try {
      console.log('Tentativa de login:', { cpf, senha: '***' })
      setIsLoading(true)
      setError('')
      setDebugInfo('')
      
      // Validação básica
      if (!cpf || !senha) {
        throw new Error('Por favor, preencha CPF e senha.')
      }
      
      // Buscar dados do localStorage
      const storedData = localStorage.getItem('portal_responsaveis')
      console.log('Dados armazenados encontrados:', !!storedData)
      
      let responsaveis: ResponsavelPortal[] = []
      
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData)
          responsaveis = Array.isArray(parsed) ? parsed : []
          console.log('Responsáveis carregados:', responsaveis.length)
        } catch (parseError) {
          console.error('Erro ao fazer parse dos dados:', parseError)
        }
      }
      
      // Se não há dados, tentar carregar dados de fallback
      if (responsaveis.length === 0) {
        console.log('Nenhum responsável encontrado, inicializando sistema...')
        const loadedData = await loadFallbackData()
        responsaveis = loadedData || []
        
        console.log('Responsáveis após inicialização:', responsaveis.length)
      }
      
      if (responsaveis.length === 0) {
        setError('Sistema não inicializado. Entre em contato com o suporte da AG Assessoria pelo telefone (16) 3987-3829.')
        return
      }
      
      // Buscar responsável por CPF
      const responsavel = responsaveis.find((r: ResponsavelPortal) => 
        r.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')
      )
      
      if (!responsavel) {
        console.log('CPF não encontrado. Responsáveis disponíveis:', responsaveis.map(r => r.cpf))
        setError('CPF não encontrado em nossos registros. Verifique o CPF ou entre em contato com AG Assessoria.')
        return
      }
      
      console.log('Responsável encontrado:', { nome: responsavel.nome, cpf: responsavel.cpf })
      
      // Verificar senha
      if (responsavel.senha !== senha) {
        console.log('Senha incorreta para CPF:', cpf)
        setError('Senha incorreta. Verifique sua senha ou use a opção "Esqueci minha senha" abaixo.')
        return
      }
      
      // Login bem-sucedido
      console.log('Login realizado com sucesso!')
      
      // Verificar se é senha inicial e precisa trocar
      if (responsavel.senhaInicial) {
        console.log('🔑 Primeira vez logando - será necessário trocar senha')
        
        // Converter ResponsavelPortal para ResponsavelPF para o estado
        const responsavelPortal = responsavel as ResponsavelPortal
        const empresaFromPortal = {
          id: responsavelPortal.empresaId,
          cnpj: responsavelPortal.empresaCnpj,
          razaoSocial: responsavelPortal.empresaNome,
          nomeFantasia: responsavelPortal.empresaNome && responsavelPortal.empresaNome.includes('LTDA') ? responsavelPortal.empresaNome.replace(' LTDA', '') : responsavelPortal.empresaNome,
          email: responsavelPortal.email,
          telefone: responsavelPortal.telefone,
          endereco: 'Rua das Empresas, 123 - Centro - Ribeirão Preto/SP',
          responsavelContabil: 'AG Assessoria Contábil',
          dataVinculacao: new Date('2024-01-15T00:00:00.000Z'),
          status: 'ativo' as 'ativo' | 'inativo' | 'suspenso',
          plano: 'completo' as 'basico' | 'completo' | 'premium',
          responsavelCpf: responsavelPortal.cpf
        }
        
        const responsavelPF: ResponsavelPF = {
          id: responsavelPortal.id,
          nome: responsavelPortal.nome,
          cpf: responsavelPortal.cpf,
          email: responsavelPortal.email,
          telefone: responsavelPortal.telefone,
          senha: responsavelPortal.senha,
          senhaInicial: responsavelPortal.senhaInicial,
          empresas: [empresaFromPortal],
          empresasIds: [responsavelPortal.empresaId],
          dataCriacao: new Date('2024-01-15T00:00:00.000Z'),
          ultimoAcesso: new Date()
        }
        
        setCurrentResponsavel(responsavelPF)
        setShowPasswordChange(true)
        return
      }
      
      handleLoginSuccess(responsavel)
      
    } catch (error) {
      console.error('Erro no login:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido no login.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função auxiliar para processar login bem-sucedido
  const handleLoginSuccess = (responsavel: ResponsavelPortal | ResponsavelPF) => {
    console.log('🎯 Processando login bem-sucedido para:', responsavel.nome)
    
    // Converter ResponsavelPortal para ResponsavelPF se necessário
    let responsavelProcessado: ResponsavelPF
    
    if ('empresas' in responsavel && 'empresasIds' in responsavel) {
      // Já é do tipo ResponsavelPF - garantir que as datas estão como Date
      responsavelProcessado = {
        ...responsavel,
        dataCriacao: responsavel.dataCriacao instanceof Date ? responsavel.dataCriacao : new Date(),
        ultimoAcesso: responsavel.ultimoAcesso ? new Date(responsavel.ultimoAcesso) : undefined,
        empresas: responsavel.empresas ? responsavel.empresas.map((empresa: any) => ({
          ...empresa,
          dataVinculacao: empresa.dataVinculacao instanceof Date ? empresa.dataVinculacao : new Date()
        })) : []
      }
    } else {
      // É do tipo ResponsavelPortal, criar empresa baseada nos dados
      const responsavelPortal = responsavel as ResponsavelPortal
      const empresaFromPortal = {
        id: responsavelPortal.empresaId,
        cnpj: responsavelPortal.empresaCnpj,
        razaoSocial: responsavelPortal.empresaNome,
        nomeFantasia: responsavelPortal.empresaNome && responsavelPortal.empresaNome.includes('LTDA') ? responsavelPortal.empresaNome.replace(' LTDA', '') : responsavelPortal.empresaNome,
        email: responsavelPortal.email,
        telefone: responsavelPortal.telefone,
        endereco: 'Endereço não cadastrado',
        responsavelContabil: 'AG Assessoria Contábil',
        dataVinculacao: responsavelPortal.dataCriacao instanceof Date ? responsavelPortal.dataCriacao : new Date(responsavelPortal.dataCriacao),
        status: responsavel.status as 'ativo' | 'inativo' | 'suspenso',
        plano: 'completo' as 'basico' | 'completo' | 'premium',
        responsavelCpf: responsavelPortal.cpf
      }
      
      // Converter para ResponsavelPF
      responsavelProcessado = {
        id: responsavelPortal.id,
        nome: responsavelPortal.nome,
        cpf: responsavelPortal.cpf,
        email: responsavelPortal.email,
        telefone: responsavelPortal.telefone,
        senha: responsavelPortal.senha,
        senhaInicial: responsavelPortal.senhaInicial,
        empresas: [empresaFromPortal],
        empresasIds: [responsavelPortal.empresaId],
        dataCriacao: responsavelPortal.dataCriacao instanceof Date ? responsavelPortal.dataCriacao : new Date(responsavelPortal.dataCriacao),
        ultimoAcesso: new Date() // Sempre definir como agora no login
      }
    }
    
    console.log('📋 Responsável processado:', {
      nome: responsavelProcessado.nome,
      empresasCount: responsavelProcessado.empresas.length,
      empresas: responsavelProcessado.empresas.map(e => e.razaoSocial)
    })
    
    // Atualizar estados
    setCurrentResponsavel(responsavelProcessado)
    
    // Verificar se tem empresas
    if (!responsavelProcessado.empresas || responsavelProcessado.empresas.length === 0) {
      console.log('❌ Erro: Responsável não tem empresas cadastradas')
      throw new Error('Nenhuma empresa encontrada para este responsável. Contate o suporte.')
    }
    
    // Filtrar empresas baseado no acesso do usuário
    const empresasComAcesso = responsavelProcessado.empresas.filter(empresa => 
      responsavelProcessado.empresasIds.includes(empresa.id)
    )
    
    console.log('🏢 Empresas com acesso:', {
      total: empresasComAcesso.length,
      empresas: empresasComAcesso.map(e => ({ id: e.id, razaoSocial: e.razaoSocial }))
    })
    
    if (empresasComAcesso.length === 0) {
      console.log('❌ Erro: Nenhuma empresa com acesso encontrada')
      throw new Error('Nenhuma empresa vinculada ao seu acesso. Contate o suporte.')
    }
    
    // Salvar autenticação no localStorage ANTES de definir estados
    localStorage.setItem('portal_responsavel_auth', JSON.stringify(responsavelProcessado))
    console.log('💾 Dados do responsável salvos no localStorage')
    
    // Se tem apenas 1 empresa com acesso, vai direto para ela
    if (empresasComAcesso.length === 1) {
      const empresaSelecionada = empresasComAcesso[0]
      setCurrentCliente(empresaSelecionada)
      setIsAuthenticated(true)
      
      // Salvar também dados da empresa
      localStorage.setItem('portal_client_auth', JSON.stringify(empresaSelecionada))
      console.log('💾 Dados da empresa salvos no localStorage')
      
      console.log('✅ Login direto para empresa única:', empresaSelecionada.razaoSocial)
    } else {
      // Se tem múltiplas empresas com acesso, mostra seleção
      setShowEmpresaSelection(true)
      console.log('🏢 Login bem-sucedido, mostrando seleção de empresas:', empresasComAcesso.length)
    }
    
    console.log('🎉 Login processado com sucesso!')
  }

  // Função para trocar senha na primeira vez
  const handlePasswordChange = async () => {
    setPasswordChangeError('')
    
    if (!passwordChangeData.novaSenha || !passwordChangeData.confirmarSenha) {
      setPasswordChangeError('Preencha todos os campos')
      return
    }
    
    if (passwordChangeData.novaSenha.length < 6) {
      setPasswordChangeError('A nova senha deve ter pelo menos 6 caracteres')
      return
    }
    
    if (passwordChangeData.novaSenha !== passwordChangeData.confirmarSenha) {
      setPasswordChangeError('As senhas não coincidem')
      return
    }
    
    console.log('Trocando senha inicial para:', passwordChangeData.novaSenha)
    
    try {
      // Simular atualização da senha
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (currentResponsavel) {
        // Atualizar senha e marcar como não sendo mais primeira vez
        const responsavelAtualizado = {
          ...currentResponsavel,
          senha: passwordChangeData.novaSenha,
          senhaInicial: false,
          ultimoAcesso: new Date()
        }
        
        setCurrentResponsavel(responsavelAtualizado)
        
        // Salvar no localStorage
        localStorage.setItem('portal_responsavel_auth', JSON.stringify(responsavelAtualizado))
        
        // Atualizar também na lista de responsáveis
        const storedData = localStorage.getItem('portal_responsaveis')
        if (storedData) {
          try {
            const responsaveis = JSON.parse(storedData)
            const updatedResponsaveis = responsaveis.map((r: any) => 
              r.cpf === currentResponsavel.cpf ? 
                { ...r, senha: passwordChangeData.novaSenha, senhaInicial: false } : 
                r
            )
            localStorage.setItem('portal_responsaveis', JSON.stringify(updatedResponsaveis))
            console.log('📝 Lista de responsáveis atualizada com nova senha')
          } catch (error) {
            console.error('❌ Erro ao atualizar lista de responsáveis:', error)
          }
        }
        
        // Filtrar empresas baseado no acesso
        const empresasComAcesso = responsavelAtualizado.empresas.filter(empresa => 
          responsavelAtualizado.empresasIds.includes(empresa.id)
        )
        
        setShowPasswordChange(false)
        setPasswordChangeData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
        
        console.log('🎯 Senha alterada, continuando fluxo de login...')
        
        // Continuar com o fluxo normal
        if (empresasComAcesso.length === 1) {
          const empresaSelecionada = empresasComAcesso[0]
          setCurrentCliente(empresaSelecionada)
          setIsAuthenticated(true)
          
          // Salvar dados da empresa
          localStorage.setItem('portal_client_auth', JSON.stringify(empresaSelecionada))
          console.log('✅ Login completo após troca de senha!')
        } else {
          setShowEmpresaSelection(true)
          console.log('🏢 Mostrando seleção de empresas após troca de senha')
        }
        
        console.log('✅ Senha alterada com sucesso!')
      }
    } catch (error) {
      console.error('❌ Erro ao trocar senha:', error)
      setPasswordChangeError('Erro ao alterar senha. Tente novamente.')
    }
  }

  // Função para iniciar recuperação de senha
  const handlePasswordRecovery = async () => {
    setRecoveryError('')
    setIsLoading(true)
    
    if (!recoveryData.email) {
      setRecoveryError('Preencha o email')
      setIsLoading(false)
      return
    }
    
    console.log('🔄 Iniciando recuperação de senha para:', recoveryData.email)
    
    try {
      // Verificar se o email existe nos dados locais primeiro e buscar nome
      const storedData = localStorage.getItem('portal_responsaveis')
      let emailExists = false
      let nomeUsuario = 'Eduardo Aparecido Gomes' // fallback
      
      if (storedData) {
        try {
          const responsaveis = JSON.parse(storedData)
          const usuarioEncontrado = responsaveis.find((r: any) => 
            r.email.toLowerCase() === recoveryData.email.toLowerCase()
          )
          
          if (usuarioEncontrado) {
            emailExists = true
            nomeUsuario = usuarioEncontrado.nome
            console.log('👤 Usuário encontrado:', nomeUsuario)
          }
          
          console.log('📧 Email encontrado localmente:', emailExists)
        } catch (error) {
          console.error('❌ Erro ao verificar dados locais:', error)
        }
      }
      
      if (!emailExists) {
        setRecoveryError('Email não encontrado em nossos registros. Verifique o email ou entre em contato com AG Assessoria.')
        setIsLoading(false)
        return
      }
      
      // Gerar nova senha temporária mais amigável
      const novaSenhaTemporaria = 'AG' + Math.random().toString(36).substring(2, 8).toUpperCase()
      console.log('🔑 Nova senha temporária gerada:', novaSenhaTemporaria)
      
      // Chamar API de recuperação de senha com dados completos
      const response = await fetch('/api/send-password-reset-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryData.email,
          nome: nomeUsuario, // Nome real do usuário
          novaSenha: novaSenhaTemporaria // Nova senha temporária única
        })
      })
      
      const result = await response.json()
      console.log('📧 Resultado do envio de email:', result)
      
      if (result.success) {
        // Atualizar a senha no localStorage para permitir login
        if (storedData) {
          try {
            const responsaveis = JSON.parse(storedData)
            const responsaveisAtualizados = responsaveis.map((r: any) => 
              r.email.toLowerCase() === recoveryData.email.toLowerCase() ? 
                { ...r, senha: novaSenhaTemporaria, senhaInicial: true } : // Forçar troca de senha
                r
            )
            localStorage.setItem('portal_responsaveis', JSON.stringify(responsaveisAtualizados))
            console.log('💾 Senha temporária atualizada no localStorage')
          } catch (error) {
            console.error('❌ Erro ao atualizar localStorage:', error)
          }
        }
        
        setRecoveryStep('sent')
        console.log('✅ Email de recuperação enviado com sucesso')
      } else {
        setRecoveryError(result.message || 'Erro ao enviar email de recuperação. Tente novamente ou entre em contato com AG Assessoria.')
      }
      
    } catch (error) {
      console.error('❌ Erro na recuperação:', error)
      setRecoveryError('Erro interno. Entre em contato com AG Assessoria pelo telefone (16) 3987-3829.')
    } finally {
      setIsLoading(false)
    }
  }

  // Seleção de empresa
  const handleEmpresaSelection = (empresa: ClientePortal) => {
    console.log('Empresa selecionada:', empresa.razaoSocial)
    
    // Garantir que as datas sejam objetos Date
    const empresaProcessada = {
      ...empresa,
      dataVinculacao: empresa.dataVinculacao instanceof Date ? empresa.dataVinculacao : new Date(empresa.dataVinculacao)
    }
    
    console.log('📋 Dados da empresa processada:', {
      id: empresaProcessada.id,
      razaoSocial: empresaProcessada.razaoSocial,
      cnpj: empresaProcessada.cnpj
    })
    
    // Atualizar estados
    setCurrentCliente(empresaProcessada)
    setIsAuthenticated(true)
    setShowEmpresaSelection(false)
    
    // Salvar no localStorage
    localStorage.setItem('portal_client_auth', JSON.stringify(empresaProcessada))
    console.log('💾 Dados da empresa selecionada salvos no localStorage')
    
    console.log('✅ Empresa selecionada e autenticação completa!')
  }

  // Voltar para seleção de empresas
  const handleVoltarEmpresaSelection = () => {
    setCurrentCliente(null)
    setIsAuthenticated(false)
    setShowEmpresaSelection(true)
  }

  // Função para limpar dados do portal
  const clearPortalData = async () => {
    try {
      console.log('🧹 Limpando todos os dados do portal...')
      
      // Limpar localStorage
      const itemsToRemove = [
        'portal_responsaveis',
        'portal_responsavel_auth', 
        'portal_client_auth',
        'portal_current_responsavel',
        'portal_current_cliente'
      ]
      
      itemsToRemove.forEach(item => {
        localStorage.removeItem(item)
        console.log(`🗑️ ${item} removido`)
      })
      
      // Resetar estados
      setCurrentResponsavel(null)
      setCurrentCliente(null)
      setIsAuthenticated(false)
      setShowEmpresaSelection(false)
      setCpf('')
      setSenha('')
      setPasswordChangeData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
      setRecoveryData({ email: '' })
      
      console.log('✅ Portal limpo com sucesso!')
      
      // Opcional: Chamar API para limpeza no servidor
      await fetch('/api/clear-portal-data', { method: 'POST' })
      
    } catch (error) {
      console.error('❌ Erro ao limpar portal:', error)
    }
  }

  // Verificar autenticação salva com melhor persistência
  useEffect(() => {
    console.log('🔐 Verificando autenticação salva...')
    
    const savedResponsavel = localStorage.getItem('portal_responsavel_auth')
    const savedClient = localStorage.getItem('portal_client_auth')
    
    console.log('💾 Dados salvos encontrados:', {
      responsavel: !!savedResponsavel,
      cliente: !!savedClient
    })
    
    if (savedResponsavel && savedClient) {
      try {
        const responsavel = JSON.parse(savedResponsavel)
        const cliente = JSON.parse(savedClient)
        
        console.log('👤 Restaurando autenticação:', {
          responsavel: responsavel.nome,
          cliente: cliente.razaoSocial
        })
        
        // Converter datas para objetos Date
        const responsavelProcessado = {
          ...responsavel,
          dataCriacao: responsavel.dataCriacao ? new Date(responsavel.dataCriacao) : new Date(),
          ultimoAcesso: responsavel.ultimoAcesso ? new Date(responsavel.ultimoAcesso) : undefined,
          empresas: responsavel.empresas ? responsavel.empresas.map((empresa: any) => ({
            ...empresa,
            dataVinculacao: empresa.dataVinculacao ? new Date(empresa.dataVinculacao) : new Date()
          })) : []
        }
        
        const clienteProcessado = {
          ...cliente,
          dataVinculacao: cliente.dataVinculacao ? new Date(cliente.dataVinculacao) : new Date()
        }
        
        setCurrentResponsavel(responsavelProcessado)
        setCurrentCliente(clienteProcessado)
        setIsAuthenticated(true)
        
        console.log('✅ Autenticação restaurada com sucesso!')
        
      } catch (error) {
        console.error('❌ Erro ao restaurar autenticação:', error)
        // Limpar dados corrompidos
        localStorage.removeItem('portal_responsavel_auth')
        localStorage.removeItem('portal_client_auth')
      }
    } else {
      console.log('ℹ️ Nenhuma autenticação salva encontrada')
    }
  }, []) // Executar apenas uma vez na inicialização

  // Carregar documentos reais do localStorage
  useEffect(() => {
    if (isAuthenticated && currentCliente) {
      console.log('🔍 Carregando documentos para cliente:', {
        id: currentCliente.id,
        cnpj: currentCliente.cnpj,
        razaoSocial: currentCliente.razaoSocial
      })
      
      const savedDocumentos = localStorage.getItem('documentos_sistema')
      const savedClientes = localStorage.getItem('clientes_documentos')
      
      console.log('📊 Status dos dados no localStorage:', {
        documentos: !!savedDocumentos,
        clientes: !!savedClientes,
        documentosCount: savedDocumentos ? JSON.parse(savedDocumentos).length : 0,
        clientesCount: savedClientes ? JSON.parse(savedClientes).length : 0
      })
      
      if (savedDocumentos && savedClientes) {
        try {
          const parsedDocumentos = JSON.parse(savedDocumentos)
          const parsedClientes = JSON.parse(savedClientes)
          
          console.log('📄 Documentos disponíveis:', parsedDocumentos.length)
          console.log('👥 Clientes disponíveis:', parsedClientes.map((c: any) => ({ 
            id: c.id, 
            cnpj: c.cnpj, 
            razaoSocial: c.razaoSocial 
          })))
          
          // Normalizar CNPJ para comparação (remove formatação)
          const cnpjNormalizado = currentCliente.cnpj.replace(/\D/g, '')
          console.log('🔢 CNPJ normalizado para busca:', cnpjNormalizado)
          
          // Buscar cliente correspondente
          const clienteEncontrado = parsedClientes.find((c: any) => 
            c.cnpj.replace(/\D/g, '') === cnpjNormalizado
          )
          
          console.log('👤 Cliente encontrado:', clienteEncontrado ? {
            id: clienteEncontrado.id,
            cnpj: clienteEncontrado.cnpj,
            razaoSocial: clienteEncontrado.razaoSocial
          } : null)
          
          if (clienteEncontrado) {
            // Filtrar documentos deste cliente
            const documentosDoCliente = parsedDocumentos
              .filter((doc: any) => doc.clienteId === clienteEncontrado.id)
              .map((doc: any) => ({
                ...doc,
                dataUpload: new Date(doc.dataUpload),
                dataVencimento: doc.dataVencimento ? new Date(doc.dataVencimento) : undefined,
                tamanho: typeof doc.tamanho === 'number' ? `${(doc.tamanho / 1024 / 1024).toFixed(1)} MB` : doc.tamanho
              }))
            
            console.log('📋 Documentos filtrados para este cliente:', {
              total: documentosDoCliente.length,
              documentos: documentosDoCliente.map((d: any) => ({
                id: d.id,
                nome: d.nome,
                categoria: d.categoria
              }))
            })
            
            setDocumentos(documentosDoCliente)
          } else {
            console.log('❌ Cliente não encontrado na base de documentos')
            setDocumentos([])
          }
        } catch (error) {
          console.error('❌ Erro ao processar documentos:', error)
          setDocumentos([])
        }
      } else {
        console.log('⚠️ Dados de documentos ou clientes não encontrados no localStorage')
        setDocumentos([])
      }
    }
  }, [isAuthenticated, currentCliente])

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentResponsavel(null)
    setCurrentCliente(null)
    setShowEmpresaSelection(false)
    setShowPasswordChange(false)
    setShowPasswordRecovery(false)
    setCpf('')
    setSenha('')
    setPasswordChangeData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
    setRecoveryData({ email: '' })
    localStorage.removeItem('portal_responsavel_auth')
    localStorage.removeItem('portal_client_auth')
    console.log('Logout realizado')
  }

  // Filtrar documentos
  const filteredDocumentos = documentos.filter(doc => {
    if (!currentCliente || doc.clienteId !== currentCliente.id) return false
    
    const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.descricao && doc.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (doc.tags && doc.tags.some(tag => tag && tag.toLowerCase().includes(searchTerm.toLowerCase())))
    const matchesCategory = categoriaFilter === 'all' || doc.categoria === categoriaFilter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Estatísticas
  const getStats = () => {
    if (!currentCliente) return { 
      totalDocumentos: 0, 
      documentosRecentes: 0, 
      obrigacoesPendentes: 0, 
      notificacoesNaoLidas: 0 
    }
    
    const clienteDocs = documentos.filter(d => d.clienteId === currentCliente.id)
    const clienteObrigacoes = obrigacoes.filter(o => o.clienteId === currentCliente.id)
    const clienteNotificacoes = notificacoes.filter(n => n.clienteId === currentCliente.id)
    
    const recentes = clienteDocs.filter(d => {
      const diffDays = Math.abs(new Date().getTime() - d.dataUpload.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays <= 7
    }).length
    
    return {
      totalDocumentos: clienteDocs.length,
      documentosRecentes: recentes,
      obrigacoesPendentes: clienteObrigacoes.filter(o => o.status === 'pendente').length,
      notificacoesNaoLidas: clienteNotificacoes.filter(n => !n.lida).length
    }
  }

  // Download documento
  const handleDownload = (documento: DocumentoCliente) => {
    console.log('Download:', documento.nome)
    // Simular download
    const blob = new Blob(['Conteúdo do documento'], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = documento.arquivo?.name || documento.nome
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Marcar notificação como lida
  const markAsRead = (notificacaoId: string) => {
    setNotificacoes(prev => prev.map(n => 
      n.id === notificacaoId ? { ...n, lida: true, dataLeitura: new Date() } : n
    ))
  }

  // Iniciar edição da empresa
  const handleStartEditEmpresa = () => {
    if (currentCliente) {
      setEmpresaEditForm({
        razaoSocial: currentCliente.razaoSocial,
        nomeFantasia: currentCliente.nomeFantasia || '',
        email: currentCliente.email,
        telefone: currentCliente.telefone,
        endereco: currentCliente.endereco
      })
      setIsEditingEmpresa(true)
    }
  }

  // Cancelar edição
  const handleCancelEdit = () => {
    setIsEditingEmpresa(false)
    setEmpresaEditForm({
      razaoSocial: '',
      nomeFantasia: '',
      email: '',
      telefone: '',
      endereco: ''
    })
  }

  // Salvar alterações da empresa
  const handleSaveEmpresa = () => {
    console.log('Salvando alterações da empresa:', empresaEditForm)
    
    if (currentCliente && currentResponsavel) {
      // Atualizar os dados da empresa atual
      const empresaAtualizada = {
        ...currentCliente,
        razaoSocial: empresaEditForm.razaoSocial,
        nomeFantasia: empresaEditForm.nomeFantasia,
        email: empresaEditForm.email,
        telefone: empresaEditForm.telefone,
        endereco: empresaEditForm.endereco
      }

      // Atualizar no responsável também
      const responsavelAtualizado = {
        ...currentResponsavel,
        empresas: currentResponsavel.empresas.map(emp => 
          emp.id === currentCliente.id ? empresaAtualizada : emp
        )
      }

      setCurrentCliente(empresaAtualizada)
      setCurrentResponsavel(responsavelAtualizado)
      
      // Atualizar localStorage
      localStorage.setItem('portal_client_auth', JSON.stringify(empresaAtualizada))
      localStorage.setItem('portal_responsavel_auth', JSON.stringify(responsavelAtualizado))
      
      setIsEditingEmpresa(false)
      
      // Simular notificação de sucesso
      const novaNotificacao: NotificacaoCliente = {
        id: Date.now().toString(),
        clienteId: currentCliente.id,
        titulo: 'Dados atualizados com sucesso',
        mensagem: 'As informações da empresa foram atualizadas com sucesso.',
        tipo: 'success',
        dataEnvio: new Date(),
        lida: false
      }
      
      setNotificacoes(prev => [novaNotificacao, ...prev])
    }
  }

  // Excluir empresa
  const handleDeleteEmpresa = () => {
    console.log('Excluindo empresa:', currentCliente?.razaoSocial)
    
    if (currentCliente && currentResponsavel) {
      // Remover empresa da lista do responsável
      const empresasRestantes = currentResponsavel.empresas.filter(emp => emp.id !== currentCliente.id)
      
      if (empresasRestantes.length === 0) {
        // Se não restam empresas, fazer logout
        handleLogout()
        alert('Empresa removida com sucesso. Você foi deslogado pois não há mais empresas vinculadas.')
      } else {
        // Se restam empresas, atualizar responsável e voltar para seleção
        const responsavelAtualizado = {
          ...currentResponsavel,
          empresas: empresasRestantes
        }
        
        setCurrentResponsavel(responsavelAtualizado)
        localStorage.setItem('portal_responsavel_auth', JSON.stringify(responsavelAtualizado))
        
        // Voltar para seleção de empresas
        setCurrentCliente(null)
        setIsAuthenticated(false)
        setShowEmpresaSelection(true)
        
        alert('Empresa removida com sucesso.')
      }
      
      setShowDeleteDialog(false)
    }
  }

  const stats = getStats()

  // Tela de Login
  if (!isAuthenticated && !showEmpresaSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative z-10 max-w-md w-full">
          <Card className="shadow-2xl bg-white/95 backdrop-blur-sm border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center">
              <div className="bg-white p-3 rounded-xl shadow-lg inline-block mb-4">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                  alt="AG Assessoria Logo" 
                  className="h-12 w-auto object-contain"
                  data-macaly="portal-cliente-logo"
                />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Portal do Cliente</h1>
              <p className="text-blue-100 text-sm">AG Assessoria Contábil</p>
            </div>
            
            <CardContent className="p-8 space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Acesso Simplificado</h2>
                <p className="text-gray-600 text-sm">
                  Entre com seu CPF e senha para acessar suas empresas
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Acesso via CPF - Simples e Seguro</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">
                    CPF do Responsável
                  </Label>
                  <Input
                    id="cpf"
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="mt-1 h-12 text-lg"
                    maxLength={14}
                  />
                </div>
                
                <div>
                  <Label htmlFor="senha" className="text-sm font-medium text-gray-700">
                    Senha de Acesso
                  </Label>
                  <Input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    className="mt-1 h-12 text-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin()
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Use a senha fornecida pelo escritório contábil
                  </p>
                </div>
              </div>
              
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Erro:</strong> {error}
                  </AlertDescription>
                </Alert>
              )}
              
              {debugInfo && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Debug:</strong> {debugInfo}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                onClick={handleLogin}
                disabled={isLoading || !cpf || !senha}
                className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Entrar no Portal
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Primeiro acesso? Entre em contato com:
                </p>
                <div className="flex items-center justify-center space-x-2 text-blue-600 font-medium">
                  <Phone className="w-4 h-4" />
                  <span>AG Assessoria • (16) 3987-3829</span>
                </div>
              </div>

              
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPasswordRecovery(true)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  🔑 Esqueci minha senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de Seleção de Empresa
  if (showEmpresaSelection && currentResponsavel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <Card className="shadow-2xl bg-white/95 backdrop-blur-sm border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center text-white">
              <div className="bg-white p-3 rounded-xl shadow-lg inline-block mb-4">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                  alt="AG Assessoria Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold mb-2">Selecione a Empresa</h1>
              <p className="text-blue-100">
                Olá, <strong>{currentResponsavel.nome}</strong>! Escolha qual empresa deseja acessar:
              </p>
            </div>
            
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {/* Filtrar apenas empresas que o usuário tem acesso */}
                {currentResponsavel?.empresas
                  .filter(empresa => currentResponsavel.empresasIds.includes(empresa.id))
                  .map((empresa) => (
                  <Card 
                    key={empresa.id} 
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-blue-300 bg-gradient-to-br from-white to-blue-50/30"
                    onClick={() => handleEmpresaSelection(empresa)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100">
                            <Building className="w-6 h-6 text-blue-600" />
                          </div>
                          <Badge className={planoConfig[empresa.plano || 'basico'].color}>
                            <Star className="w-3 h-3 mr-1" />
                            {planoConfig[empresa.plano || 'basico'].label}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {/* Status indicators removed for production */}
                        </div>
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                        {empresa.nomeFantasia || empresa.razaoSocial}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        CNPJ: {empresa.cnpj}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Portal Autenticado
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                    alt="AG Assessoria Logo" 
                    className="h-6 w-auto object-contain invert"
                    data-macaly="portal-header-logo"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Portal do Cliente</h1>
                  <p className="text-xs text-gray-600">AG Assessoria Contábil</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 text-right">
                <div>
                  <p className="text-sm font-medium text-gray-800">{currentCliente?.razaoSocial}</p>
                  <p className="text-xs text-gray-600">{currentCliente?.cnpj}</p>
                  <p className="text-xs text-blue-600">👤 {currentResponsavel?.nome} • CPF: {currentResponsavel?.cpf ? formatCPF(currentResponsavel.cpf) : 'N/A'}</p>
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {currentCliente?.razaoSocial.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <Badge className={planoConfig[currentCliente?.plano || 'basico'].color}>
                <Star className="w-3 h-3 mr-1" />
                {planoConfig[currentCliente?.plano || 'basico'].label}
              </Badge>
              
              {/* Trocar empresa se tiver múltiplas */}
              {currentResponsavel && currentResponsavel.empresas.length > 1 && (
                <Button 
                  onClick={handleVoltarEmpresaSelection}
                  variant="outline" 
                  size="sm" 
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                >
                  <Building className="w-4 h-4 mr-1" />
                  Trocar Empresa
                </Button>
              )}
              
              <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Documentos</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalDocumentos}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Novos esta Semana</p>
                  <p className="text-3xl font-bold text-green-600">{stats.documentosRecentes}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Notificações</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.notificacoesNaoLidas}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Info - Mostrar apenas se houver problemas */}
        {(stats.totalDocumentos === 0 && process.env.NODE_ENV === 'development') && (
          <Card className="mb-8 bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Settings className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug - Nenhum documento encontrado</h3>
                  <p className="text-gray-500">Tente ajustar os filtros ou aguarde novos documentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="documentos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
            <TabsTrigger value="documentos" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notificações</span>
              {stats.notificacoesNaoLidas > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0.5">
                  {stats.notificacoesNaoLidas}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="perfil" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Perfil</span>
            </TabsTrigger>
          </TabsList>

          {/* Documentos Tab */}
          <TabsContent value="documentos" className="space-y-6">
            {/* Header Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Documentos - {currentCliente?.nomeFantasia || currentCliente?.razaoSocial}
              </h1>
              <p className="text-gray-600">
                Selecione uma categoria para visualizar os documentos
              </p>
            </div>

            {/* Document Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {Object.entries(categoriaConfig).map(([categoriaKey, config]) => {
                const Icon = config.icon
                const documentosCategoria = filteredDocumentos.filter(doc => doc.categoria === categoriaKey)
                const count = documentosCategoria.length
                
                // Cores específicas para cada categoria (como na imagem)
                const getCategoryStyles = (categoria: string) => {
                  switch (categoria) {
                    case 'abertura_alteracao':
                      return {
                        bgColor: 'bg-blue-50 hover:bg-blue-100',
                        borderColor: 'border-l-blue-500',
                        iconColor: 'text-blue-600',
                        countColor: 'text-blue-600',
                        countBg: 'bg-blue-100'
                      }
                    case 'fiscal':
                      return {
                        bgColor: 'bg-green-50 hover:bg-green-100',
                        borderColor: 'border-l-green-500',
                        iconColor: 'text-green-600',
                        countColor: 'text-green-600',
                        countBg: 'bg-green-100'
                      }
                    case 'contabil':
                      return {
                        bgColor: 'bg-purple-50 hover:bg-purple-100',
                        borderColor: 'border-l-purple-500',
                        iconColor: 'text-purple-600',
                        countColor: 'text-purple-600',
                        countBg: 'bg-purple-100'
                      }
                    case 'trabalhista':
                      return {
                        bgColor: 'bg-orange-50 hover:bg-orange-100',
                        borderColor: 'border-l-orange-500',
                        iconColor: 'text-orange-600',
                        countColor: 'text-orange-600',
                        countBg: 'bg-orange-100'
                      }
                    case 'societario':
                      return {
                        bgColor: 'bg-red-50 hover:bg-red-100',
                        borderColor: 'border-l-red-500',
                        iconColor: 'text-red-600',
                        countColor: 'text-red-600',
                        countBg: 'bg-red-100'
                      }
                    case 'juridico':
                      return {
                        bgColor: 'bg-indigo-50 hover:bg-indigo-100',
                        borderColor: 'border-l-indigo-500',
                        iconColor: 'text-indigo-600',
                        countColor: 'text-indigo-600',
                        countBg: 'bg-indigo-100'
                      }
                    case 'outros':
                      return {
                        bgColor: 'bg-gray-50 hover:bg-gray-100',
                        borderColor: 'border-l-gray-500',
                        iconColor: 'text-gray-600',
                        countColor: 'text-gray-600',
                        countBg: 'bg-gray-100'
                      }
                    default:
                      return {
                        bgColor: 'bg-gray-50 hover:bg-gray-100',
                        borderColor: 'border-l-gray-500',
                        iconColor: 'text-gray-600',
                        countColor: 'text-gray-600',
                        countBg: 'bg-gray-100'
                      }
                  }
                }

                const styles = getCategoryStyles(categoriaKey)

                return (
                  <Card 
                    key={categoriaKey}
                    className={`cursor-pointer transition-all duration-300 border-0 border-l-4 ${styles.borderColor} ${styles.bgColor} shadow-md hover:shadow-lg`}
                    onClick={() => setCategoriaFilter(categoriaKey)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${styles.countBg}`}>
                          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {config.label}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {categoriaKey === 'abertura_alteracao' && 'Documentos de abertura e alteração empresarial'}
                            {categoriaKey === 'fiscal' && 'Documentos fiscais e tributários'}
                            {categoriaKey === 'contabil' && 'Documentos contábeis e financeiros'}
                            {categoriaKey === 'trabalhista' && 'Documentos trabalhistas e RH'}
                            {categoriaKey === 'societario' && 'Atas, contratos e documentos societários'}
                            {categoriaKey === 'juridico' && 'Procurações e documentos jurídicos'}
                            {categoriaKey === 'outros' && 'Outros documentos diversos'}
                          </p>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles.countBg} ${styles.countColor}`}>
                            {count} documento{count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Upload Section */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-1">Enviar Documentos</h3>
                      <p className="text-blue-700 text-sm">
                        Envie múltiplos documentos de uma vez com organização automática
                      </p>
                    </div>
                  </div>
                  <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Múltiplo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Upload Inteligente de Documentos</DialogTitle>
                        <DialogDescription>
                          Envie vários documentos para {currentCliente?.nomeFantasia || currentCliente?.razaoSocial}
                        </DialogDescription>
                      </DialogHeader>
                      <MultipleUploadManager />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Mostrar documentos filtrados apenas quando uma categoria específica for selecionada */}
            {categoriaFilter !== 'all' && (
              <>
                {/* Voltar para categorias */}
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="outline"
                    onClick={() => setCategoriaFilter('all')}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar às Categorias
                  </Button>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {categoriaConfig[categoriaFilter as keyof typeof categoriaConfig]?.label} ({filteredDocumentos.length})
                  </h2>
                </div>
                
                {/* Filters Card - apenas quando categoria específica está selecionada */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Buscar documentos, tags ou descrições..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full lg:w-48">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os status</SelectItem>
                          <SelectItem value="disponivel">Disponível</SelectItem>
                          <SelectItem value="processando">Processando</SelectItem>
                          <SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="vencido">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents List - Formato igual ao portal do escritório */}
                <div className="space-y-4">
                  {filteredDocumentos.map((documento) => {
                    const categoriaInfo = categoriaConfig[documento.categoria]
                    const CategoriaIcon = categoriaInfo.icon
                    
                    // Função para obter ícone do arquivo baseado no tipo
                    const getFileIcon = (tipo: string) => {
                      if (tipo.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
                      if (tipo.includes('image')) return <FileText className="w-5 h-5 text-blue-500" />
                      if (tipo.includes('excel') || tipo.includes('spreadsheet')) return <FileText className="w-5 h-5 text-green-500" />
                      if (tipo.includes('word') || tipo.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />
                      return <FileText className="w-5 h-5 text-gray-500" />
                    }
                    
                    return (
                      <Card key={documento.id} className="bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="bg-slate-100 p-2 rounded-lg">
                                {getFileIcon(documento.tipo)}
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-800">{documento.nome}</h3>
                                <p className="text-sm text-slate-600">{documento.nomeOriginal}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <p className="text-xs text-slate-500">
                                    Enviado em {documento.dataUpload.toLocaleDateString('pt-BR')} às {documento.dataUpload.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {documento.tamanho}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Por {documento.uploadPor}
                                  </p>
                                  <Badge className={categoriaInfo.color} variant="secondary">
                                    {categoriaInfo.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                                    title="Visualizar documento"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Visualizar Documento</DialogTitle>
                                    <DialogDescription>
                                      Detalhes do documento selecionado
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-slate-700 font-medium">Nome</Label>
                                        <p className="text-slate-900 font-semibold">{documento.nome}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-700 font-medium">Nome Original</Label>
                                        <p className="text-slate-900">{documento.nomeOriginal}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-slate-700 font-medium">Categoria</Label>
                                        <p className="text-slate-900">{categoriaInfo.label}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-700 font-medium">Tamanho</Label>
                                        <p className="text-slate-900">{documento.tamanho}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label className="text-slate-700 font-medium">Data de Upload</Label>
                                        <p className="text-slate-900">{documento.dataUpload.toLocaleDateString('pt-BR')} às {documento.dataUpload.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-700 font-medium">Enviado por</Label>
                                        <p className="text-slate-900">{documento.uploadPor}</p>
                                      </div>
                                    </div>
                                    
                                    {documento.descricao && (
                                      <div>
                                        <Label className="text-slate-700 font-medium">Descrição</Label>
                                        <p className="text-slate-900 bg-slate-50 p-3 rounded-md">{documento.descricao}</p>
                                      </div>
                                    )}
                                    
                                    {documento.tags && documento.tags.length > 0 && (
                                      <div>
                                        <Label className="text-slate-700 font-medium">Tags</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {documento.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="mt-3">
                                      <Badge 
                                        variant={documento.status === 'enviado' ? 'secondary' : 
                                                documento.status === 'processando' ? 'outline' : 'destructive'}
                                        className="text-xs"
                                      >
                                        Status: {documento.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-green-600 border-green-300 hover:bg-green-50 hover:border-green-500 transition-colors duration-200"
                                onClick={() => handleDownload(documento)}
                                title="Baixar documento"
                                disabled={documento.status === 'processando'}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {documento.descricao && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-md">
                              <p className="text-sm text-slate-700">{documento.descricao}</p>
                            </div>
                          )}
                          
                          {documento.tags && documento.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {documento.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {documento.status && (
                            <div className="mt-3">
                              <Badge 
                                variant={documento.status === 'enviado' ? 'secondary' : 
                                        documento.status === 'processando' ? 'outline' : 'destructive'}
                                className="text-xs"
                              >
                                Status: {documento.status}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {filteredDocumentos.length === 0 && categoriaFilter !== 'all' && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Folder className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento encontrado nesta categoria</h3>
                      <p className="text-gray-500">Tente ajustar os filtros ou aguarde novos documentos</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notificacoes" className="space-y-6">
            <div className="space-y-4">
              {notificacoes.filter(n => n.clienteId === currentCliente?.id).map((notificacao) => (
                <Card key={notificacao.id} className={`bg-white ${!notificacao.lida ? 'border-blue-200 bg-blue-50/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{notificacao.titulo}</h4>
                          {!notificacao.lida && (
                            <Badge className="bg-blue-100 text-blue-800">Nova</Badge>
                          )}
                          <Badge 
                            variant={notificacao.tipo === 'success' ? 'default' : 
                                    notificacao.tipo === 'warning' ? 'secondary' : 
                                    notificacao.tipo === 'error' ? 'destructive' : 'outline'}
                          >
                            {notificacao.tipo}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{notificacao.mensagem}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">
                            {notificacao.dataEnvio.toLocaleDateString('pt-BR')} às {notificacao.dataEnvio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {notificacao.acao && (
                            <Button variant="outline" size="sm">
                              {notificacao.acao.label}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notificacao.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Perfil Tab */}
          <TabsContent value="perfil" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informações do Responsável */}
              <Card>
                <CardHeader>
                  <CardTitle>Responsável (Pessoa Física)</CardTitle>
                  <CardDescription>Dados do responsável pelas empresas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Nome Completo</Label>
                    <p className="text-gray-900">{currentResponsavel?.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">CPF</Label>
                    <p className="text-gray-900">{currentResponsavel?.cpf ? formatCPF(currentResponsavel.cpf) : 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-gray-900">{currentResponsavel?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                    <p className="text-gray-900">{currentResponsavel?.telefone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Empresas Vinculadas</Label>
                    <p className="text-gray-900">{currentResponsavel?.empresas.length || 0} empresa{(currentResponsavel?.empresas.length || 0) !== 1 ? 's' : ''}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Informações da Empresa */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Informações da Empresa</CardTitle>
                      <CardDescription>Dados cadastrais e de contato</CardDescription>
                    </div>
                    {!isEditingEmpresa && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleStartEditEmpresa}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteDialog(true)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingEmpresa ? (
                    // Formulário de edição
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Razão Social</Label>
                        <Input
                          value={empresaEditForm.razaoSocial}
                          onChange={(e) => setEmpresaEditForm(prev => ({ ...prev, razaoSocial: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Nome Fantasia</Label>
                        <Input
                          value={empresaEditForm.nomeFantasia}
                          onChange={(e) => setEmpresaEditForm(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                          placeholder="Opcional"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          type="email"
                          value={empresaEditForm.email}
                          onChange={(e) => setEmpresaEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                        <Input
                          value={empresaEditForm.telefone}
                          onChange={(e) => setEmpresaEditForm(prev => ({ ...prev, telefone: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Endereço</Label>
                        <Textarea
                          value={empresaEditForm.endereco}
                          onChange={(e) => setEmpresaEditForm(prev => ({ ...prev, endereco: e.target.value }))}
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                      <div className="flex space-x-3 pt-4">
                        <Button
                          onClick={handleSaveEmpresa}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Alterações
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Visualização normal
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Razão Social</Label>
                        <p className="text-gray-900">{currentCliente?.razaoSocial}</p>
                      </div>
                      {currentCliente?.nomeFantasia && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Nome Fantasia</Label>
                          <p className="text-gray-900">{currentCliente?.nomeFantasia}</p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">CNPJ</Label>
                        <p className="text-gray-900">{currentCliente?.cnpj ? formatCNPJ(currentCliente.cnpj) : 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <p className="text-gray-900">{currentCliente?.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                        <p className="text-gray-900">{currentCliente?.telefone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Endereço</Label>
                        <p className="text-gray-900">{currentCliente?.endereco}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Informações da Conta */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações da Conta</CardTitle>
                  <CardDescription>Status e configurações do portal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Responsável Contábil</Label>
                    <p className="text-gray-900">{currentCliente?.responsavelContabil}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Data de Vinculação</Label>
                    <p className="text-gray-900">{currentCliente?.dataVinculacao.toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status da Conta</Label>
                    <Badge 
                      variant={currentCliente?.status === 'ativo' ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {currentCliente?.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Plano Atual</Label>
                    <Badge className={planoConfig[currentCliente?.plano || 'basico'].color}>
                      <Star className="w-3 h-3 mr-1" />
                      {planoConfig[currentCliente?.plano || 'basico'].label}
                    </Badge>
                  </div>
                  <div className="pt-4 space-y-2">
                    {currentResponsavel && currentResponsavel.empresas.length > 1 && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={handleVoltarEmpresaSelection}
                      >
                        <Building className="w-4 h-4 mr-2" />
                        Trocar Empresa
                      </Button>
                    )}
                    <Button variant="outline" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações da Conta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Informações de Contato da AG Assessoria */}
        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                    alt="AG Assessoria Logo" 
                    className="h-12 w-auto object-contain"
                    data-macaly="footer-logo"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3">AG ASSESSORIA CONTÁBIL</h3>
              <p className="text-blue-100 mb-4">
                Sua parceira em gestão contábil e empresarial
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="w-5 h-5" />
                  <span className="font-medium">(16) 3987-3829</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span className="font-medium">agassessoriacontrole@gmail.com</span>
                </div>
              </div>
              <p className="text-blue-200 text-sm mt-4">
                Precisa de suporte? Entre em contato conosco!
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Não recebeu? Aguarde alguns minutos e tente novamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Confirmar Exclusão da Empresa</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Esta ação é irreversível e removerá permanentemente a empresa do seu portal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Atenção:</strong> Ao excluir esta empresa, você perderá acesso a todos os documentos, 
                obrigações e histórico associados. Esta ação não pode ser desfeita.
              </AlertDescription>
            </Alert>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Empresa a ser excluída:</strong>
              </p>
              <p className="text-gray-900 font-medium">{currentCliente?.razaoSocial || 'N/A'}</p>
              <p className="text-gray-600 text-sm">{currentCliente?.cnpj || 'N/A'}</p>
            </div>
          </div>
          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEmpresa}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Empresa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Troca de Senha Inicial */}
      <Dialog open={showPasswordChange} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-orange-600">
              <Lock className="w-5 h-5" />
              <span>Primeira Vez no Portal</span>
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Para sua segurança, você deve criar uma nova senha personalizada.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="bg-orange-50 border-orange-200">
              <Shield className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Segurança:</strong> Sua senha deve ter pelo menos 6 caracteres e ser única.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova Senha *</Label>
              <Input
                id="nova-senha"
                type="password"
                value={passwordChangeData.novaSenha}
                onChange={(e) => setPasswordChangeData(prev => ({ ...prev, novaSenha: e.target.value }))}
                placeholder="Digite sua nova senha"
                minLength={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar Nova Senha *</Label>
              <Input
                id="confirmar-senha"
                type="password"
                value={passwordChangeData.confirmarSenha}
                onChange={(e) => setPasswordChangeData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                placeholder="Digite novamente sua nova senha"
                minLength={6}
              />
            </div>
            
            {passwordChangeError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">{passwordChangeError}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handlePasswordChange}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              disabled={!passwordChangeData.novaSenha || !passwordChangeData.confirmarSenha}
            >
              <Lock className="w-4 h-4 mr-2" />
              Alterar Senha e Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Recuperação de Senha */}
      <Dialog open={showPasswordRecovery} onOpenChange={setShowPasswordRecovery}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-blue-600" />
              <span>Recuperar Senha</span>
            </DialogTitle>
            <DialogDescription>
              {recoveryStep === 'input' && 'Digite seu email para receber uma nova senha temporária'}
              {recoveryStep === 'sent' && 'Instruções enviadas para seu email'}
            </DialogDescription>
          </DialogHeader>
          
          {recoveryStep === 'input' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="recovery-email" className="text-sm font-medium text-gray-700">
                  Email cadastrado
                </Label>
                <Input
                  id="recovery-email"
                  type="email"
                  value={recoveryData.email}
                  onChange={(e) => setRecoveryData({ email: e.target.value.toLowerCase().trim() })}
                  placeholder="seu.email@exemplo.com"
                  className="mt-1"
                  autoComplete="email"
                />
              </div>
              
              {recoveryError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {recoveryError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordRecovery(false)
                    setRecoveryError('')
                    setRecoveryStep('input')
                    setRecoveryData({ email: '' })
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePasswordRecovery}
                  disabled={!recoveryData.email || isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Nova Senha'
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {recoveryStep === 'sent' && (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium mb-1">Email enviado com sucesso!</p>
                <p className="text-green-700 text-sm">
                  Verifique sua caixa de entrada e siga as instruções para acessar com a nova senha temporária.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">📧 Não recebeu o email?</p>
                  <p>Verifique a pasta de spam ou entre em contato conosco:</p>
                  <p className="font-medium">📞 (16) 3987-3829</p>
                </div>
              </div>
              
              <Button
                onClick={() => {
                  setShowPasswordRecovery(false)
                  setRecoveryError('')
                  setRecoveryStep('input')
                  setRecoveryData({ email: '' })
                }}
                className="w-full"
              >
                Voltar ao Login
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}