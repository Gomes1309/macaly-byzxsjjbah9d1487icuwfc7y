"use client"

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

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
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import { CNPJSearch } from '@/components/CNPJSearch'
import { formatCNPJ } from '@/lib/cnpj-utils'
import { 
  Building2,
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Upload,
  Download,
  LogOut,
  User,
  Home,
  Calendar,
  TrendingUp,
  Users,
  Target,
  ClipboardList,
  Zap,
  RefreshCw,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  FileCheck,
  Timer,
  AlertTriangle,
  Star,
  Bookmark
} from 'lucide-react'
import jsPDF from 'jspdf'

interface Socio {
  id: string
  nome: string
  cpf: string
  rg: string
  dataExpedicaoRg: string
  estadoCivil: 'solteiro' | 'casado' | 'divorciado' | 'viuvo'
  cnh?: string
  dataEmissaoCnh?: string
  endereco: {
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
  }
  participacao: number
  administrador: boolean
  quotas: number
}

interface CNAE {
  id: string
  codigo: string
  descricao: string
  principal: boolean
}

interface ProcessoAbertura {
  id: string
  nomeEmpresa: string
  razaoSocial: string
  cnpj: string
  tipoEmpresa: 'mei' | 'individual' | 'unipessoal' | 'ltda'
  atividade: string
  cnaes: CNAE[]
  capitalSocial: number
  endereco: {
    cep: string
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    cidade: string
    uf: string
  }
  socios: Socio[]
  responsavel: string
  contato: {
    email: string
    telefone: string
    celular: string
  }
  quantidadeFuncionarios: number
  dataInicio: Date
  prazoEstimado: Date
  status: 'iniciado' | 'documentacao' | 'protocolado' | 'em_analise' | 'deferido' | 'indeferido' | 'cancelado' | 'baixado'
  etapas: {
    id: string
    nome: string
    descricao: string
    status: 'pendente' | 'em_andamento' | 'concluida' | 'bloqueada'
    dataInicio?: Date
    dataConclusao?: Date
    documentos: string[]
    observacoes?: string
  }[]
  documentosEnviados: {
    id: string
    nome: string
    tipo: string
    dataEnvio: Date
    status: 'enviado' | 'aprovado' | 'rejeitado'
    observacoes?: string
  }[]
  observacoes: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  valorHonorarios: number
  valorTaxas: number
  valorTotal: number
  dataBaixa?: Date
  motivoBaixa?: string
  dadosBaixa?: {
    tipo: string
    dataProtocolo: string
    numeroProtocolo: string
    observacoes: string
    valorTaxas: number
    responsavel: string
    processoPrefeitura: string
    numeroProtocoloPrefeitura: string
    dataProtocoloPrefeitura: string
    processoVigilanciaSanitaria: string
    numeroProtocoloVigilanciaSanitaria: string
    dataProtocoloVigilanciaSanitaria: string
  }
}

const VALID_CREDENTIALS = {
  email: 'agassessoriacontrole@gmail.com',
  password: 'Fx21701313@@##'
}

const ETAPAS_PADRAO = [
  {
    id: 'consulta_viabilidade',
    nome: 'Consulta de Viabilidade',
    descricao: 'Verificação da viabilidade do nome e endereço',
    documentos: ['Consulta de nome', 'Consulta de endereço']
  },
  {
    id: 'documentacao',
    nome: 'Documentação',
    descricao: 'Coleta e preparação de documentos',
    documentos: ['RG/CPF sócios', 'Comprovante de endereço', 'Contrato social']
  },
  {
    id: 'protocolo_junta',
    nome: 'Protocolo na Junta',
    descricao: 'Protocolo na Junta Comercial',
    documentos: ['Ficha de cadastro', 'Documentos autenticados']
  },
  {
    id: 'obtencao_cnpj',
    nome: 'Obtenção do CNPJ',
    descricao: 'Solicitação do CNPJ na Receita Federal',
    documentos: ['Cartão CNPJ', 'Certificado digital']
  },
  {
    id: 'inscricao_estadual',
    nome: 'Inscrição Estadual',
    descricao: 'Inscrição na Secretaria da Fazenda',
    documentos: ['Inscrição estadual', 'Senha do portal']
  },
  {
    id: 'inscricao_municipal',
    nome: 'Inscrição Municipal',
    descricao: 'Inscrição na Prefeitura',
    documentos: ['Inscrição municipal', 'Alvará provisório']
  },
  {
    id: 'finalizacao',
    nome: 'Finalização',
    descricao: 'Entrega de documentos e orientações',
    documentos: ['Pasta completa', 'Manual do empresário']
  }
]

export default function DashboardAbertura() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [processos, setProcessos] = useState<ProcessoAbertura[]>([])
  const [filteredProcessos, setFilteredProcessos] = useState<ProcessoAbertura[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [priorityFilter, setPriorityFilter] = useState<string>('todas')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [showChecklistDialog, setShowChecklistDialog] = useState(false)
  const [showBaixaDialog, setShowBaixaDialog] = useState(false)
  const [showSelecionarProcessoBaixaDialog, setShowSelecionarProcessoBaixaDialog] = useState(false)
  const [selectedProcesso, setSelectedProcesso] = useState<ProcessoAbertura | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showCNPJSearch, setShowCNPJSearch] = useState(false)
  const [baixaFormData, setBaixaFormData] = useState({
    tipoBaixa: 'voluntaria',
    motivo: '',
    dataProtocolo: '',
    numeroProtocolo: '',
    observacoes: '',
    valorTaxas: '',
    responsavel: '',
    processoPrefeitura: '',
    numeroProtocoloPrefeitura: '',
    dataProtocoloPrefeitura: '',
    processoVigilanciaSanitaria: '',
    numeroProtocoloVigilanciaSanitaria: '',
    dataProtocoloVigilanciaSanitaria: ''
  })
  const { toast } = useToast()

  // Login state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    razaoSocial: '',
    cnpj: '',
    tipoEmpresa: 'ltda',
    atividade: '',
    cnaes: [{ id: '1', codigo: '', descricao: '', principal: true }],
    capitalSocial: '0',
    endereco: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: ''
    },
    socios: [{
      id: '1',
      nome: '',
      cpf: '',
      rg: '',
      dataExpedicaoRg: '',
      estadoCivil: 'solteiro',
      cnh: '',
      dataEmissaoCnh: '',
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: ''
      },
      participacao: 100,
      administrador: true,
      quotas: 0
    }],
    responsavel: '',
    contato: {
      email: '',
      telefone: '',
      celular: ''
    },
    quantidadeFuncionarios: '0',
    prazoEstimado: '',
    observacoes: '',
    prioridade: 'media',
    valorHonorarios: '',
    valorTaxas: ''
  })

  // Add CNAE field
  const addCNAE = () => {
    setFormData(prev => ({
      ...prev,
      cnaes: [...prev.cnaes, { id: Date.now().toString(), codigo: '', descricao: '', principal: false }]
    }))
  }

  // Remove CNAE field
  const removeCNAE = (id: string) => {
    setFormData(prev => ({
      ...prev,
      cnaes: prev.cnaes.filter(cnae => cnae.id !== id)
    }))
  }

  // Add Socio
  const addSocio = () => {
    setFormData(prev => ({
      ...prev,
      socios: [...prev.socios, {
        id: Date.now().toString(),
        nome: '',
        cpf: '',
        rg: '',
        dataExpedicaoRg: '',
        estadoCivil: 'solteiro',
        cnh: '',
        dataEmissaoCnh: '',
        endereco: {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          uf: ''
        },
        participacao: 0,
        administrador: false,
        quotas: 0
      }]
    }))
  }

  // Remove Socio
  const removeSocio = (id: string) => {
    setFormData(prev => ({
      ...prev,
      socios: prev.socios.filter(socio => socio.id !== id)
    }))
  }

  // Update CNAE
  const updateCNAE = (id: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      cnaes: prev.cnaes.map(cnae => 
        cnae.id === id ? { ...cnae, [field]: value } : cnae
      )
    }))
  }

  // Update Socio
  const updateSocio = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      socios: prev.socios.map(socio => 
        socio.id === id ? { ...socio, [field]: value } : socio
      )
    }))
  }

  // Update Socio Address
  const updateSocioEndereco = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socios: prev.socios.map(socio => 
        socio.id === id ? { 
          ...socio, 
          endereco: { ...socio.endereco, [field]: value }
        } : socio
      )
    }))
  }

  // Handle CNPJ data found
  const handleCNPJDataFound = (data: any) => {
    console.log('CNPJ data found:', data)
    setFormData(prev => ({
      ...prev,
      cnpj: data.cnpj,
      razaoSocial: data.razaoSocial,
      nomeEmpresa: data.nomeFantasia || data.razaoSocial,
      endereco: {
        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: '',
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf
      },
      contato: {
        email: data.email,
        telefone: data.telefone,
        celular: ''
      },
      tipoEmpresa: data.regimeTributario === 'MEI' ? 'mei' : 'ltda',
      capitalSocial: data.capitalSocial ? data.capitalSocial.replace(/[^\d]/g, '') : '0',
      atividade: data.atividadePrincipal
    }))
    setShowCNPJSearch(false)
    
    toast({
      title: "Dados preenchidos!",
      description: "Informações da empresa foram preenchidas automaticamente com dados da Receita Federal.",
    })
  }

  // Handle CNPJ input change
  const handleCNPJInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setFormData(prev => ({
      ...prev,
      cnpj: formatted
    }))
  }

  // Calculate quotas based on capital social and participation
  const calculateQuotas = () => {
    const capitalSocial = parseFloat(formData.capitalSocial) || 0
    const totalParticipacao = formData.socios.reduce((sum, socio) => sum + socio.participacao, 0)
    
    if (totalParticipacao > 0) {
      setFormData(prev => ({
        ...prev,
        socios: prev.socios.map(socio => ({
          ...socio,
          quotas: Math.round((capitalSocial * socio.participacao / totalParticipacao) * 100) / 100
        }))
      }))
    }
  }

  // Generate PDF Report
  const generatePDFReport = async (title: string, data: ProcessoAbertura[], tipo: string) => {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Header with logo
    pdf.setFillColor(5, 150, 105) // emerald-600
    pdf.rect(0, 0, pageWidth, 30, 'F')
    
    // Logo (simulated - you can add actual logo here)
    pdf.setFontSize(20)
    pdf.setTextColor(255, 255, 255)
    pdf.text('AG ASSESSORIA', 20, 20)
    
    pdf.setFontSize(12)
    pdf.text('CONTABILIDADE E ASSESSORIA EMPRESARIAL', 20, 26)
    
    // Title
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.text(title, 20, 50)
    
    // Date
    pdf.setFontSize(10)
    pdf.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 60)
    
    // Summary
    let yPosition = 80
    pdf.setFontSize(12)
    pdf.text('RESUMO:', 20, yPosition)
    yPosition += 10
    
    pdf.setFontSize(10)
    pdf.text(`Total de Processos: ${data.length}`, 20, yPosition)
    yPosition += 6
    
    const faturamentoTotal = data.reduce((acc, p) => acc + p.valorTotal, 0)
    pdf.text(`Faturamento Total: R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`, 20, yPosition)
    yPosition += 6
    
    if (tipo === 'geral') {
      const emAndamento = data.filter(p => ['iniciado', 'documentacao', 'protocolado', 'em_analise'].includes(p.status)).length
      const deferidos = data.filter(p => p.status === 'deferido').length
      const baixados = data.filter(p => p.status === 'baixado').length
      
      pdf.text(`Em Andamento: ${emAndamento}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Deferidos: ${deferidos}`, 20, yPosition)
      yPosition += 6
      pdf.text(`Baixados: ${baixados}`, 20, yPosition)
      yPosition += 6
    }
    
    // Separator
    yPosition += 10
    pdf.setLineWidth(0.5)
    pdf.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 15
    
    // Process details
    pdf.setFontSize(12)
    pdf.text('PROCESSOS DETALHADOS:', 20, yPosition)
    yPosition += 15
    
    data.forEach((processo, index) => {
      // Check if need new page
      if (yPosition > pageHeight - 60) {
        pdf.addPage()
        yPosition = 30
      }
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${index + 1}. ${processo.nomeEmpresa}`, 20, yPosition)
      yPosition += 8
      
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Razão Social: ${processo.razaoSocial}`, 30, yPosition)
      yPosition += 6
      pdf.text(`Tipo: ${getTipoEmpresaLabel(processo.tipoEmpresa)}`, 30, yPosition)
      yPosition += 6
      pdf.text(`Status: ${getStatusLabel(processo.status)}`, 30, yPosition)
      yPosition += 6
      pdf.text(`Valor Total: R$ ${processo.valorTotal.toFixed(2).replace('.', ',')}`, 30, yPosition)
      yPosition += 6
      pdf.text(`Data Início: ${format(processo.dataInicio, 'dd/MM/yyyy')}`, 30, yPosition)
      yPosition += 6
      pdf.text(`Prazo Estimado: ${format(processo.prazoEstimado, 'dd/MM/yyyy')}`, 30, yPosition)
      yPosition += 6
      pdf.text(`Responsável: ${processo.responsavel}`, 30, yPosition)
      yPosition += 6
      
      const progress = getProgress(processo.etapas)
      pdf.text(`Progresso: ${Math.round(progress)}%`, 30, yPosition)
      yPosition += 6
      
      if (processo.status === 'baixado' && processo.dataBaixa) {
        pdf.text(`Data Baixa: ${format(processo.dataBaixa, 'dd/MM/yyyy')}`, 30, yPosition)
        yPosition += 6
        if (processo.motivoBaixa) {
          pdf.text(`Motivo Baixa: ${processo.motivoBaixa}`, 30, yPosition)
          yPosition += 6
        }
      }
      
      yPosition += 10
    })
    
    // Footer
    const totalPages = pdf.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(128, 128, 128)
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 40, pageHeight - 10)
      pdf.text('AG Assessoria - Contabilidade e Assessoria Empresarial', 20, pageHeight - 10)
    }
    
    // Save PDF
    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'dd-MM-yyyy')}.pdf`
    pdf.save(fileName)
    
    toast({
      title: "Relatório PDF gerado!",
      description: "O relatório foi baixado com sucesso.",
    })
  }

  // Handle relatórios
  const handleShowRelatorios = () => {
    generatePDFReport('Relatório Geral de Processos', processos, 'geral')
  }

  // Handle checklist
  const handleShowChecklist = () => {
    const checklistItems = [
      'RG e CPF dos sócios',
      'Comprovante de endereço comercial',
      'Comprovante de endereço residencial dos sócios',
      'Contrato social ou requerimento de empresário',
      'Consulta prévia de viabilidade',
      'Ficha de cadastro nacional (FCN)',
      'Documento de arrecadação (DAS)',
      'Alvará de funcionamento',
      'Inscrição estadual (se aplicável)',
      'Inscrição municipal'
    ]
    
    alert('Documentos necessários:\n\n' + checklistItems.map((item, index) => `${index + 1}. ${item}`).join('\n'))
  }

  // Handle baixa empresa
  const handleBaixaEmpresa = useCallback((id: string) => {
    console.log('Clicou no botão de baixa para ID:', id)
    
    try {
      const processo = processos.find(p => p.id === id)
      console.log('Processo encontrado:', processo)
      
      if (processo) {
        setSelectedProcesso(processo)
        setShowBaixaDialog(true)
        console.log('Diálogo de baixa aberto com sucesso')
      } else {
        console.error('Processo não encontrado para ID:', id)
        toast({
          title: "Erro",
          description: "Processo não encontrado. Tente recarregar a página.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao abrir diálogo de baixa:', error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao abrir o diálogo de baixa. Tente novamente.",
        variant: "destructive",
      })
    }
  }, [processos, toast])

  // Authentication check
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth_token')
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Confirm baixa empresa
  const confirmBaixaEmpresa = useCallback(() => {
    if (selectedProcesso) {
      console.log('Confirmando baixa da empresa:', selectedProcesso.nomeEmpresa)
      console.log('Dados da baixa:', baixaFormData)
      
      const dadosBaixaCompletos = {
        tipo: baixaFormData.tipoBaixa,
        dataProtocolo: baixaFormData.dataProtocolo,
        numeroProtocolo: baixaFormData.numeroProtocolo,
        observacoes: baixaFormData.observacoes,
        valorTaxas: parseFloat(baixaFormData.valorTaxas) || 0,
        responsavel: baixaFormData.responsavel,
        processoPrefeitura: baixaFormData.processoPrefeitura,
        numeroProtocoloPrefeitura: baixaFormData.numeroProtocoloPrefeitura,
        dataProtocoloPrefeitura: baixaFormData.dataProtocoloPrefeitura,
        processoVigilanciaSanitaria: baixaFormData.processoVigilanciaSanitaria,
        numeroProtocoloVigilanciaSanitaria: baixaFormData.numeroProtocoloVigilanciaSanitaria,
        dataProtocoloVigilanciaSanitaria: baixaFormData.dataProtocoloVigilanciaSanitaria
      }
      
      const processosAtualizados = processos.map(p => 
        p.id === selectedProcesso.id ? { 
          ...p, 
          status: 'baixado' as const,
          dataBaixa: new Date(),
          motivoBaixa: baixaFormData.motivo,
          dadosBaixa: dadosBaixaCompletos
        } : p
      )
      
      console.log('Processos atualizados:', processosAtualizados)
      
      setProcessos(processosAtualizados)
      setShowBaixaDialog(false)
      setSelectedProcesso(null)
      
      // Reset form
      setBaixaFormData({
        tipoBaixa: 'voluntaria',
        motivo: '',
        dataProtocolo: '',
        numeroProtocolo: '',
        observacoes: '',
        valorTaxas: '',
        responsavel: '',
        processoPrefeitura: '',
        numeroProtocoloPrefeitura: '',
        dataProtocoloPrefeitura: '',
        processoVigilanciaSanitaria: '',
        numeroProtocoloVigilanciaSanitaria: '',
        dataProtocoloVigilanciaSanitaria: ''
      })
      
      // Force re-render and refresh filtered processes
      setTimeout(() => {
        setActiveTab('processos')
      }, 100)
      
      toast({
        title: "Empresa baixada com sucesso!",
        description: `Processo de baixa da ${selectedProcesso.nomeEmpresa} foi registrado.`,
      })
    }
  }, [selectedProcesso, baixaFormData, processos, toast])

  // Load processos
  useEffect(() => {
    if (isAuthenticated) {
      loadProcessos()
    }
  }, [isAuthenticated])

  // Filter processos
  useEffect(() => {
    let filtered = processos

    if (searchTerm) {
      filtered = filtered.filter(processo =>
        processo.nomeEmpresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        processo.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        processo.cnpj.includes(searchTerm) ||
        processo.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'todos') {
      filtered = filtered.filter(processo => processo.status === statusFilter)
    }

    if (priorityFilter !== 'todas') {
      filtered = filtered.filter(processo => processo.prioridade === priorityFilter)
    }

    setFilteredProcessos(filtered)
  }, [processos, searchTerm, statusFilter, priorityFilter])

  const loadProcessos = useCallback(() => {
    console.log('Loading processos de abertura...')
    setIsLoading(true)
    
    const saved = localStorage.getItem('processos_abertura')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((processo: any) => ({
          ...processo,
          dataInicio: new Date(processo.dataInicio),
          prazoEstimado: new Date(processo.prazoEstimado),
          dataBaixa: processo.dataBaixa ? new Date(processo.dataBaixa) : undefined,
          etapas: processo.etapas.map((etapa: any) => ({
            ...etapa,
            dataInicio: etapa.dataInicio ? new Date(etapa.dataInicio) : undefined,
            dataConclusao: etapa.dataConclusao ? new Date(etapa.dataConclusao) : undefined
          })),
          documentosEnviados: processo.documentosEnviados.map((doc: any) => ({
            ...doc,
            dataEnvio: new Date(doc.dataEnvio)
          }))
        }))
        setProcessos(parsed)
        console.log('Processos carregados do localStorage:', parsed)
      } catch (error) {
        console.error('Error loading processos:', error)
      }
    } else {
      // Sample data
      const sampleProcessos: ProcessoAbertura[] = [
        {
          id: '1',
          nomeEmpresa: 'Tech Solutions Ltda',
          razaoSocial: 'Tech Solutions Tecnologia e Inovação Ltda',
          cnpj: '12.345.678/0001-90',
          tipoEmpresa: 'ltda',
          atividade: 'Desenvolvimento de software',
          cnaes: [
            { id: '1', codigo: '6201-5/00', descricao: 'Desenvolvimento de software', principal: true }
          ],
          capitalSocial: 100000,
          endereco: {
            cep: '01310-100',
            logradouro: 'Av. Paulista',
            numero: '1000',
            complemento: 'Sala 101',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            uf: 'SP'
          },
          socios: [
            { 
              id: '1',
              nome: 'João Silva',
              cpf: '123.456.789-00',
              rg: '123.456.789-00',
              dataExpedicaoRg: '2020-01-01',
              estadoCivil: 'casado',
              cnh: '123.456.789-00',
              dataEmissaoCnh: '2020-01-01',
              endereco: {
                cep: '01310-100',
                logradouro: 'Av. Paulista',
                numero: '1000',
                complemento: 'Sala 101',
                bairro: 'Bela Vista',
                cidade: 'São Paulo',
                uf: 'SP'
              },
              participacao: 60,
              administrador: true,
              quotas: 0.6
            },
            { 
              id: '2',
              nome: 'Maria Santos',
              cpf: '987.654.321-00',
              rg: '987.654.321-00',
              dataExpedicaoRg: '2020-01-01',
              estadoCivil: 'solteiro',
              cnh: '',
              dataEmissaoCnh: '',
              endereco: {
                cep: '01310-100',
                logradouro: 'Av. Paulista',
                numero: '1000',
                complemento: 'Sala 101',
                bairro: 'Bela Vista',
                cidade: 'São Paulo',
                uf: 'SP'
              },
              participacao: 40,
              administrador: false,
              quotas: 0.4
            }
          ],
          responsavel: 'Carlos Assessor',
          contato: {
            email: 'contato@techsolutions.com',
            telefone: '(11) 3333-4444',
            celular: '(11) 99999-8888'
          },
          quantidadeFuncionarios: 5,
          dataInicio: new Date('2024-01-15'),
          prazoEstimado: new Date('2024-02-15'),
          status: 'em_analise',
          etapas: ETAPAS_PADRAO.map((etapa, index) => ({
            id: etapa.id,
            nome: etapa.nome,
            descricao: etapa.descricao,
            status: index < 3 ? 'concluida' : index === 3 ? 'em_andamento' : 'pendente',
            dataInicio: index < 4 ? new Date(2024, 0, 15 + index * 3) : undefined,
            dataConclusao: index < 3 ? new Date(2024, 0, 17 + index * 3) : undefined,
            documentos: etapa.documentos,
            observacoes: index === 3 ? 'Aguardando retorno da Receita Federal' : undefined
          })),
          documentosEnviados: [
            { id: '1', nome: 'RG João Silva', tipo: 'PDF', dataEnvio: new Date('2024-01-16'), status: 'aprovado' },
            { id: '2', nome: 'CPF Maria Santos', tipo: 'PDF', dataEnvio: new Date('2024-01-16'), status: 'aprovado' },
            { id: '3', nome: 'Contrato Social', tipo: 'PDF', dataEnvio: new Date('2024-01-18'), status: 'enviado' }
          ],
          observacoes: 'Processo normal, sem intercorrências',
          prioridade: 'media',
          valorHonorarios: 1500.00,
          valorTaxas: 800.00,
          valorTotal: 2300.00
        },
        {
          id: '2',
          nomeEmpresa: 'Bella Estética MEI',
          razaoSocial: 'Maria Aparecida dos Santos',
          cnpj: '98.765.432/0001-10',
          tipoEmpresa: 'mei',
          atividade: 'Serviços de estética',
          cnaes: [
            { id: '1', codigo: '9602-5/01', descricao: 'Serviços de estética', principal: true }
          ],
          capitalSocial: 0,
          endereco: {
            cep: '04567-890',
            logradouro: 'Rua das Flores',
            numero: '123',
            bairro: 'Vila Madalena',
            cidade: 'São Paulo',
            uf: 'SP'
          },
          socios: [
            { 
              id: '1',
              nome: 'Maria Aparecida dos Santos',
              cpf: '111.222.333-44',
              rg: '111.222.333-44',
              dataExpedicaoRg: '2020-01-01',
              estadoCivil: 'solteiro',
              cnh: '',
              dataEmissaoCnh: '',
              endereco: {
                cep: '04567-890',
                logradouro: 'Rua das Flores',
                numero: '123',
                bairro: 'Vila Madalena',
                cidade: 'São Paulo',
                uf: 'SP'
              },
              participacao: 100,
              administrador: true,
              quotas: 1
            }
          ],
          responsavel: 'Ana Assessora',
          contato: {
            email: 'contato@bellaestetica.com',
            telefone: '(11) 2222-3333',
            celular: '(11) 88888-7777'
          },
          quantidadeFuncionarios: 0,
          dataInicio: new Date('2024-02-01'),
          prazoEstimado: new Date('2024-02-10'),
          status: 'deferido',
          etapas: ETAPAS_PADRAO.slice(0, 4).map((etapa, index) => ({
            id: etapa.id,
            nome: etapa.nome,
            descricao: etapa.descricao,
            status: 'concluida',
            dataInicio: new Date(2024, 1, 1 + index * 2),
            dataConclusao: new Date(2024, 1, 2 + index * 2),
            documentos: etapa.documentos
          })),
          documentosEnviados: [
            { id: '1', nome: 'RG Maria', tipo: 'PDF', dataEnvio: new Date('2024-02-02'), status: 'aprovado' },
            { id: '2', nome: 'CPF Maria', tipo: 'PDF', dataEnvio: new Date('2024-02-02'), status: 'aprovado' }
          ],
          observacoes: 'MEI aprovado com sucesso',
          prioridade: 'baixa',
          valorHonorarios: 300.00,
          valorTaxas: 0.00,
          valorTotal: 300.00
        }
      ]
      setProcessos(sampleProcessos)
    }
    
    setIsLoading(false)
  }, [])

  // Save processos
  useEffect(() => {
    if (processos.length > 0 && isAuthenticated) {
      localStorage.setItem('processos_abertura', JSON.stringify(processos))
    }
  }, [processos, isAuthenticated])

  // Login handler
  const handleLogin = useCallback(() => {
    console.log('Login attempt:', loginData)
    setLoginError('')
    
    if (loginData.email === VALID_CREDENTIALS.email && loginData.password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true)
      localStorage.setItem('auth_token', 'authenticated')
      
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao sistema de abertura de empresas.",
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

  // Add processo handler
  const handleAddProcesso = useCallback(() => {
    console.log('Adding processo:', formData)
    
    const novoProcesso: ProcessoAbertura = {
      id: Date.now().toString(),
      nomeEmpresa: formData.nomeEmpresa,
      razaoSocial: formData.razaoSocial,
      cnpj: formData.cnpj,
      tipoEmpresa: formData.tipoEmpresa as ProcessoAbertura['tipoEmpresa'],
      atividade: formData.cnaes.find(c => c.principal)?.descricao || formData.cnaes[0]?.descricao || '',
      cnaes: formData.cnaes.map(cnae => ({
        id: cnae.id,
        codigo: cnae.codigo,
        descricao: cnae.descricao,
        principal: cnae.principal
      })),
      capitalSocial: parseFloat(formData.capitalSocial) || 0,
      endereco: formData.endereco,
      socios: formData.socios.map(socio => ({
        id: socio.id,
        nome: socio.nome,
        cpf: socio.cpf,
        rg: socio.rg,
        dataExpedicaoRg: socio.dataExpedicaoRg,
        estadoCivil: socio.estadoCivil as 'solteiro' | 'casado' | 'divorciado' | 'viuvo',
        cnh: socio.cnh,
        dataEmissaoCnh: socio.dataEmissaoCnh,
        endereco: socio.endereco,
        participacao: socio.participacao,
        administrador: socio.administrador,
        quotas: socio.quotas
      })),
      responsavel: formData.responsavel,
      contato: formData.contato,
      quantidadeFuncionarios: parseInt(formData.quantidadeFuncionarios) || 0,
      dataInicio: new Date(),
      prazoEstimado: new Date(formData.prazoEstimado),
      status: 'iniciado',
      etapas: ETAPAS_PADRAO.map(etapa => ({
        id: etapa.id,
        nome: etapa.nome,
        descricao: etapa.descricao,
        status: 'pendente',
        documentos: etapa.documentos
      })),
      documentosEnviados: [],
      observacoes: formData.observacoes,
      prioridade: formData.prioridade as ProcessoAbertura['prioridade'],
      valorHonorarios: parseFloat(formData.valorHonorarios) || 0,
      valorTaxas: parseFloat(formData.valorTaxas) || 0,
      valorTotal: (parseFloat(formData.valorHonorarios) || 0) + (parseFloat(formData.valorTaxas) || 0)
    }
    
    setProcessos(prev => [...prev, novoProcesso])
    setShowAddDialog(false)
    
    // Reset form
    setFormData({
      nomeEmpresa: '',
      razaoSocial: '',
      cnpj: '',
      tipoEmpresa: 'ltda',
      atividade: '',
      cnaes: [{ id: '1', codigo: '', descricao: '', principal: true }],
      capitalSocial: '0',
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: ''
      },
      socios: [{
        id: '1',
        nome: '',
        cpf: '',
        rg: '',
        dataExpedicaoRg: '',
        estadoCivil: 'solteiro',
        cnh: '',
        dataEmissaoCnh: '',
        endereco: {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          uf: ''
        },
        participacao: 100,
        administrador: true,
        quotas: 0
      }],
      responsavel: '',
      contato: {
        email: '',
        telefone: '',
        celular: ''
      },
      quantidadeFuncionarios: '0',
      prazoEstimado: '',
      observacoes: '',
      prioridade: 'media',
      valorHonorarios: '',
      valorTaxas: ''
    })
    
    toast({
      title: "Processo adicionado com sucesso!",
      description: `Processo de abertura da ${novoProcesso.nomeEmpresa} foi criado.`,
    })
  }, [formData, toast])

  // View processo handler
  const handleViewProcesso = useCallback((processo: ProcessoAbertura) => {
    setSelectedProcesso(processo)
    setShowViewDialog(true)
  }, [])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'iniciado': return 'bg-blue-100 text-blue-800'
      case 'documentacao': return 'bg-yellow-100 text-yellow-800'
      case 'protocolado': return 'bg-purple-100 text-purple-800'
      case 'em_analise': return 'bg-orange-100 text-orange-800'
      case 'deferido': return 'bg-green-100 text-green-800'
      case 'indeferido': return 'bg-red-100 text-red-800'
      case 'cancelado': return 'bg-gray-100 text-gray-800'
      case 'baixado': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get priority color
  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-green-100 text-green-800'
      case 'media': return 'bg-yellow-100 text-yellow-800'
      case 'alta': return 'bg-orange-100 text-orange-800'
      case 'urgente': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'iniciado': return 'Iniciado'
      case 'documentacao': return 'Documentação'
      case 'protocolado': return 'Protocolado'
      case 'em_analise': return 'Em Análise'
      case 'deferido': return 'Deferido'
      case 'indeferido': return 'Indeferido'
      case 'cancelado': return 'Cancelado'
      case 'baixado': return 'Baixado'
      default: return 'Desconhecido'
    }
  }

  // Get priority label
  const getPriorityLabel = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'Baixa'
      case 'media': return 'Média'
      case 'alta': return 'Alta'
      case 'urgente': return 'Urgente'
      default: return 'Desconhecida'
    }
  }

  // Calculate progress
  const getProgress = (etapas: ProcessoAbertura['etapas']) => {
    const total = etapas.length
    const concluidas = etapas.filter(e => e.status === 'concluida').length
    return (concluidas / total) * 100
  }

  // Get empresa type label
  const getTipoEmpresaLabel = (tipo: string) => {
    switch (tipo) {
      case 'mei': return 'MEI'
      case 'individual': return 'Individual'
      case 'unipessoal': return 'Unipessoal'
      case 'ltda': return 'LTDA'
      default: return 'Não especificado'
    }
  }

  // Calculate stats
  const stats = {
    total: processos.length,
    emAndamento: processos.filter(p => ['iniciado', 'documentacao', 'protocolado', 'em_analise'].includes(p.status)).length,
    deferidos: processos.filter(p => p.status === 'deferido').length,
    urgentes: processos.filter(p => p.prioridade === 'urgente').length,
    faturamentoTotal: processos.reduce((acc, p) => acc + p.valorTotal, 0),
    tempoMedio: 25 // dias médios para conclusão
  }

  // Check if authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <img 
              src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/byzxsjjbah9d1487icuwfc7y/sTuQmgVPSl8WwCSW-LJke/image.png" 
              alt="AG Assessoria Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 text-center mb-6">AG ASSESSORIA</h1>
          
          <div className="mb-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-800 font-medium">Credenciais de teste:</p>
            <p className="text-sm text-emerald-700">Email: admin@agassessoria.com</p>
            <p className="text-sm text-emerald-700">Senha: admin123</p>
          </div>
          
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={loginData.email}
              onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
              className="border-slate-300"
            />
            
            <Input
              type="password"
              placeholder="Senha"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              className="border-slate-300"
            />
            
            {loginError && (
              <p className="text-red-600 text-sm">{loginError}</p>
            )}
            
            <Button 
              onClick={handleLogin}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Entrar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
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
                  <p className="text-sm text-slate-600 font-medium">DASHBOARD DE ABERTURA</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Abertura
              </Button>
              
              <Button 
                onClick={() => setShowChecklistDialog(true)}
                variant="outline"
                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Checklist
              </Button>
              
              <Button 
                onClick={() => {
                  console.log('Clicou no botão Processo de Baixa no header')
                  console.log('Processos disponíveis:', processos)
                  
                  if (processos.length === 0) {
                    toast({
                      title: "Nenhum processo disponível",
                      description: "Não há processos cadastrados. Adicione um processo primeiro.",
                      variant: "destructive",
                    })
                    return
                  }
                  
                  const processosDisponiveis = processos.filter(p => p.status !== 'baixado')
                  
                  if (processosDisponiveis.length === 0) {
                    toast({
                      title: "Nenhum processo disponível",
                      description: "Todos os processos já foram baixados.",
                      variant: "destructive",
                    })
                    return
                  }
                  
                  setShowSelecionarProcessoBaixaDialog(true)
                }}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Processo de Baixa
              </Button>
              
              <Button 
                onClick={loadProcessos}
                variant="outline"
                className="text-teal-600 border-teal-300 hover:bg-teal-50 hover:border-teal-500 font-medium px-4 py-2 rounded-lg transition-colors duration-200"
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
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Dashboard de Abertura de Empresas</h2>
              <p className="text-emerald-100 text-lg">
                Acompanhe todos os processos de abertura e alteração de empresas
              </p>
              <div className="mt-6 flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span className="text-sm">Processos Automatizados</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="w-5 h-5 text-teal-300" />
                  <span className="text-sm">Controle de Prazos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-emerald-300" />
                  <span className="text-sm">Documentação Completa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-emerald-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Total de Processos</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-full">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Em Andamento</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.emAndamento}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Deferidos</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.deferidos}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Urgentes</p>
                  <p className="text-3xl font-bold text-slate-800">{stats.urgentes}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Faturamento</p>
                  <p className="text-2xl font-bold text-slate-800">R$ {stats.faturamentoTotal.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-lg border-0 border-l-4 border-l-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">Tempo Médio</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.tempoMedio} dias</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="processos">Processos</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="text-emerald-700 font-bold text-lg">Ações Rápidas</CardTitle>
                <CardDescription className="text-slate-600">
                  Acesse rapidamente as principais funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <Plus className="w-8 h-8" />
                    <span className="text-lg font-medium">Nova Abertura</span>
                    <span className="text-sm opacity-90">Iniciar novo processo</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setShowChecklistDialog(true)}
                    variant="outline"
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                    <span className="text-lg font-medium">Checklist</span>
                    <span className="text-sm opacity-90">Documentos necessários</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setShowSelecionarProcessoBaixaDialog(true)}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <ArrowRight className="w-8 h-8" />
                    <span className="text-lg font-medium">Processo de Baixa</span>
                    <span className="text-sm opacity-90">Encerrar empresa</span>
                  </Button>
                  
                  <Button 
                    onClick={handleShowRelatorios}
                    variant="outline"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <FileText className="w-8 h-8" />
                    <span className="text-lg font-medium">Relatórios</span>
                    <span className="text-sm opacity-90">Gerar relatórios PDF</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Processes */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="text-emerald-700 font-bold text-lg">Processos Recentes</CardTitle>
                <CardDescription className="text-slate-600">
                  Últimos processos adicionados ou atualizados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {processos.slice(0, 3).map((processo) => (
                  <div key={processo.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg mb-4 hover:bg-slate-100 transition-colors">
                    <div className="bg-emerald-100 p-3 rounded-full">
                      <Building2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-800">{processo.nomeEmpresa}</h3>
                        <Badge className={getStatusColor(processo.status)}>
                          {getStatusLabel(processo.status)}
                        </Badge>
                        <Badge className={getPriorityColor(processo.prioridade)}>
                          {getPriorityLabel(processo.prioridade)}
                        </Badge>
                        {processo.status === 'baixado' && (
                          <Badge className="bg-red-100 text-red-800">
                            Encerrado
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 mb-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-500">
                            Iniciado em {format(processo.dataInicio, 'dd/MM/yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Timer className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-500">
                            Prazo: {format(processo.prazoEstimado, 'dd/MM/yyyy')}
                          </span>
                        </div>
                        {processo.status === 'baixado' && processo.dataBaixa && (
                          <div className="flex items-center space-x-2">
                            <ArrowRight className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-500">
                              Baixado em {format(processo.dataBaixa, 'dd/MM/yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-slate-600 mb-1">Progresso</div>
                        <div className="w-24">
                          <Progress value={getProgress(processo.etapas)} className="h-2" />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {Math.round(getProgress(processo.etapas))}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="processos" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="text-emerald-700 font-bold text-lg">Filtros e Pesquisa</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search" className="text-slate-700 font-medium">Pesquisar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Empresa, CNPJ ou responsável..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
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
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        <SelectItem value="iniciado">Iniciado</SelectItem>
                        <SelectItem value="documentacao">Documentação</SelectItem>
                        <SelectItem value="protocolado">Protocolado</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="deferido">Deferido</SelectItem>
                        <SelectItem value="indeferido">Indeferido</SelectItem>
                        <SelectItem value="baixado">Baixado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority-filter" className="text-slate-700 font-medium">Prioridade</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as Prioridades</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      className="w-full text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 font-medium rounded-lg transition-colors duration-200"
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('todos')
                        setPriorityFilter('todas')
                      }}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processes List */}
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="text-emerald-700 font-bold text-lg">Processos de Abertura ({filteredProcessos.length})</CardTitle>
                <CardDescription className="text-slate-600">
                  Gerencie todos os processos de abertura de empresas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {filteredProcessos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-slate-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg">Nenhum processo encontrado</p>
                    <p className="text-slate-400 text-sm mt-2">
                      {searchTerm || statusFilter !== 'todos' || priorityFilter !== 'todas'
                        ? 'Tente ajustar os filtros de pesquisa'
                        : 'Clique em "Nova Abertura" para começar'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProcessos.map((processo) => (
                      <Card key={processo.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="bg-emerald-100 p-3 rounded-lg">
                                <Building2 className="w-6 h-6 text-emerald-600" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-bold text-lg text-slate-800">{processo.nomeEmpresa}</h3>
                                  <Badge className={getStatusColor(processo.status)}>
                                    {getStatusLabel(processo.status)}
                                  </Badge>
                                  <Badge className={getPriorityColor(processo.prioridade)}>
                                    {getPriorityLabel(processo.prioridade)}
                                  </Badge>
                                  {processo.status === 'baixado' && (
                                    <Badge className="bg-red-100 text-red-800">
                                      Encerrado
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
                                  <div>
                                    <p><strong>Razão Social:</strong> {processo.razaoSocial}</p>
                                    <p><strong>CNPJ:</strong> {processo.cnpj}</p>
                                    <p><strong>Tipo:</strong> {getTipoEmpresaLabel(processo.tipoEmpresa)}</p>
                                  </div>
                                  <div>
                                    <p><strong>Atividade:</strong> {processo.atividade}</p>
                                    <p><strong>Responsável:</strong> {processo.responsavel}</p>
                                    <p><strong>Valor Total:</strong> R$ {processo.valorTotal.toFixed(2)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-6 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-500">
                                      Iniciado em {format(processo.dataInicio, 'dd/MM/yyyy')}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Timer className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-500">
                                      Prazo: {format(processo.prazoEstimado, 'dd/MM/yyyy')}
                                    </span>
                                  </div>
                                  {processo.status === 'baixado' && processo.dataBaixa && (
                                    <div className="flex items-center space-x-2">
                                      <ArrowRight className="w-4 h-4 text-red-500" />
                                      <span className="text-sm text-red-500">
                                        Baixado em {format(processo.dataBaixa, 'dd/MM/yyyy')}
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
                                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 transition-colors duration-200"
                                onClick={() => handleViewProcesso(processo)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:border-blue-500 transition-colors duration-200"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {processo.status !== 'baixado' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:border-orange-500 transition-colors duration-200"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('Clicando no botão de baixa para processo:', processo.id)
                                    handleBaixaEmpresa(processo.id)
                                  }}
                                  title="Baixar Empresa"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              )}
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="relatorios" className="space-y-6">
            <Card className="bg-white shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-emerald-50 rounded-t-lg">
                <CardTitle className="text-emerald-700 font-bold text-lg">Relatórios em PDF</CardTitle>
                <CardDescription className="text-slate-600">
                  Gere relatórios detalhados personalizados em PDF
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={handleShowRelatorios}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <FileText className="w-8 h-8" />
                    <span className="text-lg font-medium">Relatório Geral</span>
                    <span className="text-sm opacity-90">Todos os processos</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const processosDeferidos = processos.filter(p => p.status === 'deferido')
                      generatePDFReport('Relatório de Processos Deferidos', processosDeferidos, 'deferidos')
                    }}
                    variant="outline"
                    className="text-green-600 border-green-300 hover:bg-green-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <CheckCircle2 className="w-8 h-8" />
                    <span className="text-lg font-medium">Processos Deferidos</span>
                    <span className="text-sm opacity-90">Empresas aprovadas</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const processosAndamento = processos.filter(p => ['iniciado', 'documentacao', 'protocolado', 'em_analise'].includes(p.status))
                      generatePDFReport('Relatório de Processos em Andamento', processosAndamento, 'andamento')
                    }}
                    variant="outline"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <Clock className="w-8 h-8" />
                    <span className="text-lg font-medium">Em Andamento</span>
                    <span className="text-sm opacity-90">Processos ativos</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const processosBaixados = processos.filter(p => p.status === 'baixado')
                      generatePDFReport('Relatório de Empresas Baixadas', processosBaixados, 'baixados')
                    }}
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <ArrowRight className="w-8 h-8" />
                    <span className="text-lg font-medium">Empresas Baixadas</span>
                    <span className="text-sm opacity-90">Processos encerrados</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const processosUrgentes = processos.filter(p => p.prioridade === 'urgente')
                      generatePDFReport('Relatório de Processos Urgentes', processosUrgentes, 'urgentes')
                    }}
                    variant="outline"
                    className="text-orange-600 border-orange-300 hover:bg-orange-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <AlertCircle className="w-8 h-8" />
                    <span className="text-lg font-medium">Processos Urgentes</span>
                    <span className="text-sm opacity-90">Alta prioridade</span>
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      const processosPorTipo = processos.reduce((acc, p) => {
                        acc[p.tipoEmpresa] = (acc[p.tipoEmpresa] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                      
                      generatePDFReport('Relatório por Tipo de Empresa', processos, 'tipos')
                    }}
                    variant="outline"
                    className="text-purple-600 border-purple-300 hover:bg-purple-50 p-6 h-auto flex flex-col items-center space-y-2"
                  >
                    <Building2 className="w-8 h-8" />
                    <span className="text-lg font-medium">Por Tipo</span>
                    <span className="text-sm opacity-90">MEI, LTDA, etc.</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Process Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Abertura de Empresa</DialogTitle>
            <DialogDescription>
              Preencha os dados para iniciar um novo processo de abertura
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="empresa" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="empresa">Empresa</TabsTrigger>
              <TabsTrigger value="socios">Sócios</TabsTrigger>
              <TabsTrigger value="cnaes">CNAEs</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
            </TabsList>
            
            <TabsContent value="empresa" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ (se já tiver)</Label>
                  {!showCNPJSearch ? (
                    <div className="flex space-x-2">
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={handleCNPJInputChange}
                        placeholder="000.000.000/0000-00"
                        className="border-slate-300"
                        maxLength={18}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCNPJSearch(true)}
                        className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      >
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <CNPJSearch
                      onDataFound={handleCNPJDataFound}
                      onClear={() => setShowCNPJSearch(false)}
                      initialCNPJ={formData.cnpj}
                      autoSearch={true}
                      showDetails={true}
                    />
                  )}
                  <p className="text-xs text-emerald-600 mt-1 font-medium">
                    ⚡ Clique no ícone de busca para preenchimento automático
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="tipoEmpresa">Tipo de Empresa *</Label>
                  <Select 
                    value={formData.tipoEmpresa} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tipoEmpresa: value }))}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mei">MEI</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="unipessoal">Unipessoal</SelectItem>
                      <SelectItem value="ltda">LTDA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                  <Input
                    id="nomeEmpresa"
                    value={formData.nomeEmpresa}
                    onChange={(e) => setFormData(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                    placeholder="Nome fantasia da empresa"
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="razaoSocial">Razão Social *</Label>
                  <Input
                    id="razaoSocial"
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                    placeholder="Razão social completa"
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="capitalSocial">Capital Social *</Label>
                  <Input
                    id="capitalSocial"
                    type="number"
                    step="0.01"
                    value={formData.capitalSocial}
                    onChange={(e) => setFormData(prev => ({ ...prev, capitalSocial: e.target.value }))}
                    placeholder="0,00"
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantidadeFuncionarios">Quantidade de Funcionários *</Label>
                  <Input
                    id="quantidadeFuncionarios"
                    type="number"
                    value={formData.quantidadeFuncionarios}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidadeFuncionarios: e.target.value }))}
                    placeholder="0"
                    className="border-slate-300"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-lg font-semibold mb-4 block">Endereço da Empresa</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      value={formData.endereco.cep}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endereco: { ...prev.endereco, cep: e.target.value }
                      }))}
                      placeholder="00000-000"
                      className="border-slate-300"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="logradouro">Logradouro *</Label>
                    <Input
                      id="logradouro"
                      value={formData.endereco.logradouro}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endereco: { ...prev.endereco, logradouro: e.target.value }
                      }))}
                      placeholder="Nome da rua"
                      className="border-slate-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="numero">Número *</Label>
                    <Input
                      id="numero"
                      value={formData.endereco.numero}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endereco: { ...prev.endereco, numero: e.target.value }
                      }))}
                      placeholder="Número"
                      className="border-slate-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      value={formData.endereco.complemento}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endereco: { ...prev.endereco, complemento: e.target.value }
                      }))}
                      placeholder="Complemento"
                      className="border-slate-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bairro">Bairro *</Label>
                    <Input
                      id="bairro"
                      value={formData.endereco.bairro}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endereco: { ...prev.endereco, bairro: e.target.value }
                      }))}
                      placeholder="Bairro"
                      className="border-slate-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={formData.endereco.cidade}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endereco: { ...prev.endereco, cidade: e.target.value }
                      }))}
                      placeholder="Cidade"
                      className="border-slate-300"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="uf">UF *</Label>
                    <Input
                      id="uf"
                      value={formData.endereco.uf}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        endereco: { ...prev.endereco, uf: e.target.value }
                      }))}
                      placeholder="UF"
                      className="border-slate-300"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="socios" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Sócios da Empresa</Label>
                <Button 
                  type="button" 
                  onClick={addSocio}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Sócio
                </Button>
              </div>
              
              {formData.socios.map((socio, index) => (
                <Card key={socio.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Sócio {index + 1}</h4>
                    {formData.socios.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSocio(socio.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome Completo *</Label>
                      <Input
                        value={socio.nome}
                        onChange={(e) => updateSocio(socio.id, 'nome', e.target.value)}
                        placeholder="Nome completo"
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label>CPF *</Label>
                      <Input
                        value={socio.cpf}
                        onChange={(e) => updateSocio(socio.id, 'cpf', e.target.value)}
                        placeholder="000.000.000-00"
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label>RG *</Label>
                      <Input
                        value={socio.rg}
                        onChange={(e) => updateSocio(socio.id, 'rg', e.target.value)}
                        placeholder="00.000.000-0"
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label>Data Expedição RG *</Label>
                      <Input
                        type="date"
                        value={socio.dataExpedicaoRg}
                        onChange={(e) => updateSocio(socio.id, 'dataExpedicaoRg', e.target.value)}
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label>Estado Civil *</Label>
                      <Select 
                        value={socio.estadoCivil} 
                        onValueChange={(value) => updateSocio(socio.id, 'estadoCivil', value)}
                      >
                        <SelectTrigger className="border-slate-300">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>CNH</Label>
                      <Input
                        value={socio.cnh}
                        onChange={(e) => updateSocio(socio.id, 'cnh', e.target.value)}
                        placeholder="Número da CNH"
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label>Data Emissão CNH</Label>
                      <Input
                        type="date"
                        value={socio.dataEmissaoCnh}
                        onChange={(e) => updateSocio(socio.id, 'dataEmissaoCnh', e.target.value)}
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label>Participação % *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={socio.participacao}
                        onChange={(e) => updateSocio(socio.id, 'participacao', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label>Valor das Quotas</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={socio.quotas}
                        onChange={(e) => updateSocio(socio.id, 'quotas', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`admin-${socio.id}`}
                          checked={socio.administrador}
                          onChange={(e) => updateSocio(socio.id, 'administrador', e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <Label htmlFor={`admin-${socio.id}`}>Administrador</Label>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <Label className="font-semibold mb-2 block">Endereço do Sócio</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>CEP *</Label>
                        <Input
                          value={socio.endereco.cep}
                          onChange={(e) => updateSocioEndereco(socio.id, 'cep', e.target.value)}
                          placeholder="00000-000"
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label>Logradouro *</Label>
                        <Input
                          value={socio.endereco.logradouro}
                          onChange={(e) => updateSocioEndereco(socio.id, 'logradouro', e.target.value)}
                          placeholder="Nome da rua"
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div>
                        <Label>Número *</Label>
                        <Input
                          value={socio.endereco.numero}
                          onChange={(e) => updateSocioEndereco(socio.id, 'numero', e.target.value)}
                          placeholder="Número"
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div>
                        <Label>Complemento</Label>
                        <Input
                          value={socio.endereco.complemento}
                          onChange={(e) => updateSocioEndereco(socio.id, 'complemento', e.target.value)}
                          placeholder="Complemento"
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div>
                        <Label>Bairro *</Label>
                        <Input
                          value={socio.endereco.bairro}
                          onChange={(e) => updateSocioEndereco(socio.id, 'bairro', e.target.value)}
                          placeholder="Bairro"
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div>
                        <Label>Cidade *</Label>
                        <Input
                          value={socio.endereco.cidade}
                          onChange={(e) => updateSocioEndereco(socio.id, 'cidade', e.target.value)}
                          placeholder="Cidade"
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div>
                        <Label>UF *</Label>
                        <Input
                          value={socio.endereco.uf}
                          onChange={(e) => updateSocioEndereco(socio.id, 'uf', e.target.value)}
                          placeholder="UF"
                          className="border-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  onClick={calculateQuotas}
                  variant="outline"
                >
                  Calcular Quotas
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="cnaes" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">CNAEs da Empresa</Label>
                <Button 
                  type="button" 
                  onClick={addCNAE}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar CNAE
                </Button>
              </div>
              
              {formData.cnaes.map((cnae, index) => (
                <Card key={cnae.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">CNAE {index + 1}</h4>
                    {formData.cnaes.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCNAE(cnae.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Código CNAE *</Label>
                      <Input
                        value={cnae.codigo}
                        onChange={(e) => updateCNAE(cnae.id, 'codigo', e.target.value)}
                        placeholder="0000-0/00"
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label>Descrição *</Label>
                      <Input
                        value={cnae.descricao}
                        onChange={(e) => updateCNAE(cnae.id, 'descricao', e.target.value)}
                        placeholder="Descrição da atividade"
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`principal-${cnae.id}`}
                          checked={cnae.principal}
                          onChange={(e) => updateCNAE(cnae.id, 'principal', e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        <Label htmlFor={`principal-${cnae.id}`}>Atividade Principal</Label>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            
            <TabsContent value="contato" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email da Empresa *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contato.email}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contato: { ...prev.contato, email: e.target.value }
                    }))}
                    placeholder="contato@empresa.com"
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="telefone">Telefone da Empresa *</Label>
                  <Input
                    id="telefone"
                    value={formData.contato.telefone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contato: { ...prev.contato, telefone: e.target.value }
                    }))}
                    placeholder="(11) 0000-0000"
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="celular">Celular da Empresa</Label>
                  <Input
                    id="celular"
                    value={formData.contato.celular}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contato: { ...prev.contato, celular: e.target.value }
                    }))}
                    placeholder="(11) 90000-0000"
                    className="border-slate-300"
                  />
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
                  <Label htmlFor="prazoEstimado">Prazo Estimado *</Label>
                  <Input
                    id="prazoEstimado"
                    type="date"
                    value={formData.prazoEstimado}
                    onChange={(e) => setFormData(prev => ({ ...prev, prazoEstimado: e.target.value }))}
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
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="valorHonorarios">Valor Honorários</Label>
                  <Input
                    id="valorHonorarios"
                    type="number"
                    step="0.01"
                    value={formData.valorHonorarios}
                    onChange={(e) => setFormData(prev => ({ ...prev, valorHonorarios: e.target.value }))}
                    placeholder="0,00"
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="valorTaxas">Valor Taxas</Label>
                  <Input
                    id="valorTaxas"
                    type="number"
                    step="0.01"
                    value={formData.valorTaxas}
                    onChange={(e) => setFormData(prev => ({ ...prev, valorTaxas: e.target.value }))}
                    placeholder="0,00"
                    className="border-slate-300"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações sobre o processo"
                    className="border-slate-300"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddProcesso}
              disabled={!formData.nomeEmpresa || !formData.razaoSocial || !formData.responsavel || !formData.prazoEstimado}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Iniciar Processo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Process Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Processo</DialogTitle>
            <DialogDescription>
              Visualize todas as informações do processo de abertura
            </DialogDescription>
          </DialogHeader>
          {selectedProcesso && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Nome da Empresa</Label>
                      <p className="text-slate-900 font-semibold">{selectedProcesso.nomeEmpresa}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Razão Social</Label>
                      <p className="text-slate-900">{selectedProcesso.razaoSocial}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Tipo</Label>
                      <p className="text-slate-900">{getTipoEmpresaLabel(selectedProcesso.tipoEmpresa)}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">CNPJ</Label>
                      <p className="text-slate-900">{selectedProcesso.cnpj || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Capital Social</Label>
                      <p className="text-slate-900">R$ {selectedProcesso.capitalSocial.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Quantidade de Funcionários</Label>
                      <p className="text-slate-900">{selectedProcesso.quantidadeFuncionarios}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progresso do Processo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-700 font-medium">Progresso Geral</span>
                      <span className="text-slate-500">{Math.round(getProgress(selectedProcesso.etapas))}%</span>
                    </div>
                    <Progress value={getProgress(selectedProcesso.etapas)} className="h-3" />
                  </div>
                  
                  <div className="space-y-3">
                    {selectedProcesso.etapas.map((etapa, index) => (
                      <div key={etapa.id} className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          etapa.status === 'concluida' ? 'bg-green-100 text-green-800' :
                          etapa.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {etapa.status === 'concluida' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{etapa.nome}</p>
                          <p className="text-sm text-slate-600">{etapa.descricao}</p>
                        </div>
                        <Badge className={
                          etapa.status === 'concluida' ? 'bg-green-100 text-green-800' :
                           etapa.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {etapa.status === 'concluida' ? 'Concluída' :
                           etapa.status === 'em_andamento' ? 'Em Andamento' : 'Pendente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Email</Label>
                      <p className="text-slate-900">{selectedProcesso.contato.email}</p>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Telefone</Label>
                      <p className="text-slate-900">{selectedProcesso.contato.telefone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Baixa Info */}
              {selectedProcesso.status === 'baixado' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-red-600">Dados da Baixa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-700 font-medium">Data da Baixa</Label>
                        <p className="text-slate-900">{format(selectedProcesso.dataBaixa!, 'dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <Label className="text-slate-700 font-medium">Motivo</Label>
                        <p className="text-slate-900">{selectedProcesso.motivoBaixa || 'Não informado'}</p>
                      </div>
                      {selectedProcesso.dadosBaixa && (
                        <>
                          <div>
                            <Label className="text-slate-700 font-medium">Tipo de Baixa</Label>
                            <p className="text-slate-900">{selectedProcesso.dadosBaixa.tipo || 'Não informado'}</p>
                          </div>
                          <div>
                            <Label className="text-slate-700 font-medium">Responsável</Label>
                            <p className="text-slate-900">{selectedProcesso.dadosBaixa.responsavel || 'Não informado'}</p>
                          </div>
                          {selectedProcesso.dadosBaixa.numeroProtocolo && (
                            <div>
                              <Label className="text-slate-700 font-medium">Número do Protocolo</Label>
                              <p className="text-slate-900">{selectedProcesso.dadosBaixa.numeroProtocolo}</p>
                            </div>
                          )}
                          {selectedProcesso.dadosBaixa.valorTaxas && (
                            <div>
                              <Label className="text-slate-700 font-medium">Valor das Taxas</Label>
                              <p className="text-slate-900">R$ {selectedProcesso.dadosBaixa.valorTaxas.toFixed(2)}</p>
                            </div>
                          )}
                          
                          {/* Dados da Prefeitura */}
                          {selectedProcesso.dadosBaixa.processoPrefeitura === 'sim' && (
                            <>
                              <div className="md:col-span-2">
                                <Label className="text-slate-700 font-medium text-blue-600">Processo na Prefeitura</Label>
                                <p className="text-slate-900">Sim</p>
                              </div>
                              {selectedProcesso.dadosBaixa.numeroProtocoloPrefeitura && (
                                <div>
                                  <Label className="text-slate-700 font-medium">Protocolo Prefeitura</Label>
                                  <p className="text-slate-900">{selectedProcesso.dadosBaixa.numeroProtocoloPrefeitura}</p>
                                </div>
                              )}
                              {selectedProcesso.dadosBaixa.dataProtocoloPrefeitura && (
                                <div>
                                  <Label className="text-slate-700 font-medium">Data Protocolo Prefeitura</Label>
                                  <p className="text-slate-900">{format(new Date(selectedProcesso.dadosBaixa.dataProtocoloPrefeitura), 'dd/MM/yyyy')}</p>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Dados da Vigilância Sanitária */}
                          {selectedProcesso.dadosBaixa.processoVigilanciaSanitaria === 'sim' && (
                            <>
                              <div className="md:col-span-2">
                                <Label className="text-slate-700 font-medium text-purple-600">Processo na Vigilância Sanitária</Label>
                                <p className="text-slate-900">Sim</p>
                              </div>
                              {selectedProcesso.dadosBaixa.numeroProtocoloVigilanciaSanitaria && (
                                <div>
                                  <Label className="text-slate-700 font-medium">Protocolo Vigilância Sanitária</Label>
                                  <p className="text-slate-900">{selectedProcesso.dadosBaixa.numeroProtocoloVigilanciaSanitaria}</p>
                                </div>
                              )}
                              {selectedProcesso.dadosBaixa.dataProtocoloVigilanciaSanitaria && (
                                <div>
                                  <Label className="text-slate-700 font-medium">Data Protocolo Vigilância Sanitária</Label>
                                  <p className="text-slate-900">{format(new Date(selectedProcesso.dadosBaixa.dataProtocoloVigilanciaSanitaria), 'dd/MM/yyyy')}</p>
                                </div>
                              )}
                            </>
                          )}
                          
                          {selectedProcesso.dadosBaixa.observacoes && (
                            <div className="md:col-span-2">
                              <Label className="text-slate-700 font-medium">Observações</Label>
                              <p className="text-slate-900">{selectedProcesso.dadosBaixa.observacoes}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
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

      {/* Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-emerald-600">Checklist - Documentos Necessários</DialogTitle>
            <DialogDescription>
              Lista completa de documentos necessários para abertura de empresa
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h4 className="font-semibold text-emerald-800 mb-3">Documentos Obrigatórios</h4>
              <div className="space-y-2">
                {[
                  'RG e CPF dos sócios',
                  'Comprovante de endereço comercial',
                  'Comprovante de endereço residencial dos sócios',
                  'Contrato social ou requerimento de empresário',
                  'Consulta prévia de viabilidade',
                  'Ficha de cadastro nacional (FCN)',
                  'Documento de arrecadação (DAS)',
                  'Alvará de funcionamento',
                  'Inscrição estadual (se aplicável)',
                  'Inscrição municipal'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-3">Documentos Adicionais (se aplicável)</h4>
              <div className="space-y-2">
                {[
                  'Licença ambiental',
                  'Certificado de condições sanitárias',
                  'Laudo de vistoria do corpo de bombeiros',
                  'Termo de responsabilidade técnica',
                  'Certidão negativa de débitos'
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowChecklistDialog(false)}
              className="text-slate-600"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Baixa Empresa Dialog */}
      <Dialog open={showBaixaDialog} onOpenChange={setShowBaixaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Baixa/Encerramento de Empresa</DialogTitle>
            <DialogDescription>
              Preencha os dados para realizar a baixa da empresa
            </DialogDescription>
          </DialogHeader>
          
          {selectedProcesso && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-2">Dados da Empresa</h4>
                <p><strong>Nome:</strong> {selectedProcesso.nomeEmpresa}</p>
                <p><strong>Razão Social:</strong> {selectedProcesso.razaoSocial}</p>
                <p><strong>CNPJ:</strong> {selectedProcesso.cnpj}</p>
                <p><strong>Tipo:</strong> {getTipoEmpresaLabel(selectedProcesso.tipoEmpresa)}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipoBaixa">Tipo de Baixa *</Label>
                  <Select 
                    value={baixaFormData.tipoBaixa} 
                    onValueChange={(value) => setBaixaFormData(prev => ({ ...prev, tipoBaixa: value }))}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="voluntaria">Baixa Voluntária</SelectItem>
                      <SelectItem value="obrigatoria">Baixa Obrigatória</SelectItem>
                      <SelectItem value="transferencia">Transferência</SelectItem>
                      <SelectItem value="incorporacao">Incorporação</SelectItem>
                      <SelectItem value="fusao">Fusão</SelectItem>
                      <SelectItem value="cisao">Cisão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dataProtocolo">Data do Protocolo *</Label>
                  <Input
                    id="dataProtocolo"
                    type="date"
                    value={baixaFormData.dataProtocolo}
                    onChange={(e) => setBaixaFormData(prev => ({ ...prev, dataProtocolo: e.target.value }))}
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="numeroProtocolo">Número do Protocolo</Label>
                  <Input
                    id="numeroProtocolo"
                    value={baixaFormData.numeroProtocolo}
                    onChange={(e) => setBaixaFormData(prev => ({ ...prev, numeroProtocolo: e.target.value }))}
                    placeholder="Número do protocolo"
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="valorTaxasBaixa">Valor das Taxas</Label>
                  <Input
                    id="valorTaxasBaixa"
                    type="number"
                    step="0.01"
                    value={baixaFormData.valorTaxas}
                    onChange={(e) => setBaixaFormData(prev => ({ ...prev, valorTaxas: e.target.value }))}
                    placeholder="0,00"
                    className="border-slate-300"
                  />
                </div>
                
                <div>
                  <Label htmlFor="responsavelBaixa">Responsável pela Baixa *</Label>
                  <Input
                    id="responsavelBaixa"
                    value={baixaFormData.responsavel}
                    onChange={(e) => setBaixaFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                    placeholder="Nome do responsável"
                    className="border-slate-300"
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Processo na Prefeitura */}
              <div>
                <Label className="text-lg font-semibold mb-4 block text-blue-600">Processo na Prefeitura</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="processoPrefeitura">Possui Processo na Prefeitura?</Label>
                    <Select 
                      value={baixaFormData.processoPrefeitura} 
                      onValueChange={(value) => setBaixaFormData(prev => ({ ...prev, processoPrefeitura: value }))}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {baixaFormData.processoPrefeitura === 'sim' && (
                    <>
                      <div>
                        <Label htmlFor="numeroProtocoloPrefeitura">Número do Protocolo</Label>
                        <Input
                          id="numeroProtocoloPrefeitura"
                          value={baixaFormData.numeroProtocoloPrefeitura}
                          onChange={(e) => setBaixaFormData(prev => ({ ...prev, numeroProtocoloPrefeitura: e.target.value }))}
                          placeholder="Número do protocolo na prefeitura"
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dataProtocoloPrefeitura">Data do Protocolo</Label>
                        <Input
                          id="dataProtocoloPrefeitura"
                          type="date"
                          value={baixaFormData.dataProtocoloPrefeitura}
                          onChange={(e) => setBaixaFormData(prev => ({ ...prev, dataProtocoloPrefeitura: e.target.value }))}
                          className="border-slate-300"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Processo na Vigilância Sanitária */}
              <div>
                <Label className="text-lg font-semibold mb-4 block text-purple-600">Processo na Vigilância Sanitária</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="processoVigilanciaSanitaria">Possui Processo na Vigilância Sanitária?</Label>
                    <Select 
                      value={baixaFormData.processoVigilanciaSanitaria} 
                      onValueChange={(value) => setBaixaFormData(prev => ({ ...prev, processoVigilanciaSanitaria: value }))}
                    >
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="sim">Sim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {baixaFormData.processoVigilanciaSanitaria === 'sim' && (
                    <>
                      <div>
                        <Label htmlFor="numeroProtocoloVigilanciaSanitaria">Número do Protocolo</Label>
                        <Input
                          id="numeroProtocoloVigilanciaSanitaria"
                          value={baixaFormData.numeroProtocoloVigilanciaSanitaria}
                          onChange={(e) => setBaixaFormData(prev => ({ ...prev, numeroProtocoloVigilanciaSanitaria: e.target.value }))}
                          placeholder="Número do protocolo na vigilância sanitária"
                          className="border-slate-300"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dataProtocoloVigilanciaSanitaria">Data do Protocolo</Label>
                        <Input
                          id="dataProtocoloVigilanciaSanitaria"
                          type="date"
                          value={baixaFormData.dataProtocoloVigilanciaSanitaria}
                          onChange={(e) => setBaixaFormData(prev => ({ ...prev, dataProtocoloVigilanciaSanitaria: e.target.value }))}
                          className="border-slate-300"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="motivoBaixa">Motivo da Baixa *</Label>
                <Textarea
                  id="motivoBaixa"
                  value={baixaFormData.motivo}
                  onChange={(e) => setBaixaFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  placeholder="Descreva o motivo da baixa..."
                  className="border-slate-300"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="observacoesBaixa">Observações</Label>
                <Textarea
                  id="observacoesBaixa"
                  value={baixaFormData.observacoes}
                  onChange={(e) => setBaixaFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais..."
                  className="border-slate-300"
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBaixaDialog(false)}
              className="text-slate-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmBaixaEmpresa}
              disabled={!baixaFormData.motivo || !baixaFormData.dataProtocolo || !baixaFormData.responsavel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar Baixa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Selecionar Processo para Baixa Dialog */}
      <Dialog open={showSelecionarProcessoBaixaDialog} onOpenChange={setShowSelecionarProcessoBaixaDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-red-600">Selecionar Processo para Baixa</DialogTitle>
            <DialogDescription>
              Selecione qual processo deseja baixar/encerrar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {processos.filter(p => p.status !== 'baixado').length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Nenhum processo disponível para baixa</p>
                <p className="text-slate-400 text-sm mt-2">Todos os processos já foram baixados ou não há processos cadastrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {processos.filter(p => p.status !== 'baixado').map((processo) => (
                  <Card key={processo.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          try {
                            console.log('Selecionando processo para baixa:', processo.id)
                            setSelectedProcesso(processo)
                            setShowSelecionarProcessoBaixaDialog(false)
                            setShowBaixaDialog(true)
                            console.log('Processo selecionado e diálogo aberto')
                          } catch (error) {
                            console.error('Erro ao selecionar processo para baixa:', error)
                            toast({
                              title: "Erro",
                              description: "Erro ao selecionar processo. Tente novamente.",
                              variant: "destructive",
                            })
                          }
                        }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800">{processo.nomeEmpresa}</h3>
                            <p className="text-sm text-slate-600">{processo.razaoSocial}</p>
                            <p className="text-sm text-slate-500">{processo.cnpj}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(processo.status)}>
                            {getStatusLabel(processo.status)}
                          </Badge>
                          <p className="text-sm text-slate-500 mt-1">{getTipoEmpresaLabel(processo.tipoEmpresa)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSelecionarProcessoBaixaDialog(false)}
              className="text-slate-600"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}