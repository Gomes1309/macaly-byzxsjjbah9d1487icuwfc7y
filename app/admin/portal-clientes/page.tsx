'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { useClientes, Cliente } from '@/hooks/useClientes'

// Ícones
import { 
  User, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  Building2,
  Mail,
  Phone,
  Calendar,
  Users,
  Database,
  X,
  Building,
  ChevronDown,
  CheckCircle,
  Key,
  MoreVertical,
  RefreshCw
} from 'lucide-react'

// Tipos
interface ResponsavelPF {
  id: string
  nome: string
  cpf: string
  email: string
  telefone: string
  status: 'ativo' | 'inativo'
  senha: string
  senhaInicial: boolean
  empresasIds: string[]
  empresas: EmpresaCliente[]
  dataCriacao: Date
  ultimoAcesso?: Date
}

interface EmpresaCliente {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  status: 'ativa' | 'inativa'
  responsavelContabil: string
}

// Função para converter Cliente para EmpresaCliente
const clienteToEmpresa = (cliente: Cliente): EmpresaCliente => ({
  id: cliente.id,
  cnpj: cliente.cpfCnpj,
  razaoSocial: cliente.nome,
  nomeFantasia: cliente.nome, // Assumindo que nome é a razão social/nome fantasia
  status: cliente.status === 'ativo' ? 'ativa' : 'inativa',
  responsavelContabil: 'Contador Responsável' // Valor padrão
})

// Mock Data - Empresas sempre disponíveis
const mockEmpresas: EmpresaCliente[] = [
  {
    id: '1',
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'Tech Solutions Ltda',
    nomeFantasia: 'TechSol',
    status: 'ativa',
    responsavelContabil: 'Maria Silva'
  },
  {
    id: '2',
    cnpj: '98.765.432/0001-10',
    razaoSocial: 'Comércio ABC ME',
    nomeFantasia: 'ABC Store',
    status: 'ativa',
    responsavelContabil: 'João Santos'
  },
  {
    id: '3',
    cnpj: '11.222.333/0001-44',
    razaoSocial: 'Consultoria XYZ Eireli',
    nomeFantasia: 'XYZ Consultoria',
    status: 'ativa',
    responsavelContabil: 'Carlos Lima'
  },
  {
    id: '4',
    cnpj: '44.555.666/0001-77',
    razaoSocial: 'Indústria Moderna Ltda',
    nomeFantasia: 'ModernInd',
    status: 'ativa',
    responsavelContabil: 'Ana Costa'
  },
  {
    id: '5',
    cnpj: '77.888.999/0001-88',
    razaoSocial: 'Serviços Gerais SA',
    nomeFantasia: 'ServGer',
    status: 'ativa',
    responsavelContabil: 'Pedro Souza'
  },
  {
    id: '6',
    cnpj: '33.444.555/0001-99',
    razaoSocial: 'Comércio Varejista ME',
    nomeFantasia: 'VarejoMax',
    status: 'inativa',
    responsavelContabil: 'Lucia Santos'
  }
]

// Função para gerar senha aleatória
const generateRandomPassword = (length: number = 8): string => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// Componente de Seleção de Empresas com Pesquisa
interface EmpresaSelectorProps {
  empresas: EmpresaCliente[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
}

const EmpresaSelector = ({ empresas, selectedIds, onSelectionChange }: EmpresaSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filtrar empresas com base na pesquisa
  const filteredEmpresas = empresas.filter(empresa =>
    empresa.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.cnpj.includes(searchTerm)
  )

  const toggleEmpresa = (empresaId: string) => {
    if (selectedIds.includes(empresaId)) {
      onSelectionChange(selectedIds.filter(id => id !== empresaId))
    } else {
      onSelectionChange([...selectedIds, empresaId])
    }
  }

  const removeEmpresa = (empresaId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== empresaId))
  }

  const selectedEmpresas = empresas.filter(e => selectedIds.includes(e.id))

  return (
    <div className="space-y-3">
      {/* Empresas Selecionadas */}
      {selectedEmpresas.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            Empresas Selecionadas ({selectedEmpresas.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedEmpresas.map((empresa) => (
              <Badge 
                key={empresa.id} 
                variant="secondary" 
                className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1"
              >
                <Building2 className="w-3 h-3 mr-1" />
                {empresa.nomeFantasia}
                <button
                  onClick={() => removeEmpresa(empresa.id)}
                  className="ml-2 hover:bg-blue-300 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown para Selecionar Empresas */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between h-10"
        >
          <span className="flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            Selecionar Empresas
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            {/* Campo de Pesquisa */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por razão social, nome fantasia ou CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Lista de Empresas */}
            <ScrollArea className="max-h-60">
              <div className="p-2">
                {filteredEmpresas.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Building className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">
                      {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa disponível'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredEmpresas.map((empresa) => {
                      const isSelected = selectedIds.includes(empresa.id)
                      return (
                        <div
                          key={empresa.id}
                          className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
                            isSelected ? 'bg-blue-50 border border-blue-200' : 'border border-transparent'
                          }`}
                          onClick={() => toggleEmpresa(empresa.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}} // Controlled by parent click
                            className="mr-3"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {empresa.nomeFantasia}
                              </p>
                              {isSelected && (
                                <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {empresa.razaoSocial}
                            </p>
                            <p className="text-xs text-gray-400">
                              CNPJ: {empresa.cnpj}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer com ações */}
            <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {selectedIds.length} de {empresas.length} selecionadas
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function GestaoPortalClientesPage() {
  // Hook para carregar clientes/empresas reais
  const { clientes, loading: loadingClientes } = useClientes()
  
  // Estados
  const [responsaveis, setResponsaveis] = useState<ResponsavelPF[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedResponsavel, setSelectedResponsavel] = useState<ResponsavelPF | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [senhaGeradaExibir, setSenhaGeradaExibir] = useState<string | null>(null)
  
  // Estado para status do sistema de email
  const [emailSystemStatus, setEmailSystemStatus] = useState<{
    isProduction: boolean
    hasResendKey: boolean
    status: 'active' | 'simulation' | 'error'
  }>({
    isProduction: false,
    hasResendKey: false,
    status: 'simulation'
  })

  // Verificar status do sistema de email no carregamento
  useEffect(() => {
    const checkEmailSystem = async () => {
      try {
        // Buscar status real do backend
        const response = await fetch('/api/debug-env')
        const envData = await response.json()
        
        const isProduction = envData.NEW_PRODUCTION_CHECK
        const hasResendKey = envData.RESEND_API_KEY_EXISTS
        const isFullyProduction = envData.IS_FULLY_PRODUCTION
        
        let status: 'active' | 'simulation' | 'error' = 'simulation'
        if (isFullyProduction) {
          status = 'active'
        } else if (!isProduction) {
          status = 'simulation'
        } else {
          status = 'error'
        }
        
        setEmailSystemStatus({
          isProduction,
          hasResendKey,
          status
        })
        
        console.log('📧 Status do sistema de email (backend):', {
          isProduction,
          hasResendKey,
          status,
          envData
        })
      } catch (error) {
        console.error('❌ Erro ao verificar status do email:', error)
        // Fallback para verificação local (menos confiável)
        const hasResendKey = !!process.env.RESEND_API_KEY
        setEmailSystemStatus({
          isProduction: false,
          hasResendKey,
          status: 'simulation'
        })
      }
    }
    
    checkEmailSystem()
  }, [])
  
  // Converter clientes para empresas (apenas pessoa jurídica)
  const empresasDisponiveis = clientes
    .filter(cliente => cliente.tipoCliente === 'pessoa_juridica' && cliente.status === 'ativo')
    .map(clienteToEmpresa)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    status: 'ativo' as 'ativo' | 'inativo',
    empresasIds: [] as string[]
  })

  // Carregar dados do localStorage no início
  useEffect(() => {
    const savedResponsaveis = localStorage.getItem('portal_responsaveis')
    if (savedResponsaveis) {
      try {
        const data = JSON.parse(savedResponsaveis)
        // Converter datas de string para Date e garantir que empresas é sempre um array
        const responsaveisWithDates = data.map((r: any) => ({
          ...r,
          dataCriacao: new Date(r.dataCriacao),
          ultimoAcesso: r.ultimoAcesso ? new Date(r.ultimoAcesso) : undefined,
          empresas: r.empresas || [], // Garantir que empresas é sempre um array
          empresasIds: r.empresasIds || [] // Garantir que empresasIds é sempre um array
        }))
        setResponsaveis(responsaveisWithDates)
        console.log('Responsáveis carregados do localStorage:', responsaveisWithDates.length)
      } catch (error) {
        console.error('Erro ao carregar responsáveis do localStorage:', error)
        setResponsaveis([])
      }
    } else {
      // Inicializar com array vazio - sem dados de exemplo para produção
      console.log('Nenhum responsável encontrado - iniciando com lista vazia')
      setResponsaveis([])
    }
  }, [])

  // Salvar no localStorage sempre que responsáveis mudarem
  useEffect(() => {
    if (responsaveis.length > 0) {
      localStorage.setItem('portal_responsaveis', JSON.stringify(responsaveis))
      console.log('Responsáveis salvos no localStorage:', responsaveis.length)
    }
  }, [responsaveis])

  // Filtrar responsáveis
  const filteredResponsaveis = responsaveis.filter(responsavel => {
    const matchesSearch = responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         responsavel.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         responsavel.cpf.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || responsavel.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Função para limpar todos os dados de exemplo/teste
  const handleClearAllData = () => {
    localStorage.removeItem('portal_responsaveis')
    localStorage.removeItem('portal_responsavel_auth')
    localStorage.removeItem('portal_client_auth')
    setResponsaveis([])
    console.log('Todos os dados de exemplo foram limpos')
    toast.success('Todos os dados de exemplo foram removidos')
  }

  // Criar responsável
  const handleCreateResponsavel = async () => {
    console.log('Criando responsável:', formData)
    
    if (!formData.nome || !formData.cpf || !formData.email || !formData.telefone) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.empresasIds.length === 0) {
      toast.error('Selecione pelo menos uma empresa')
      return
    }

    setIsSubmitting(true)

    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Verificar se CPF ou email já existe
      const cpfExists = responsaveis.some(r => r.cpf === formData.cpf)
      const emailExists = responsaveis.some(r => r.email === formData.email)

      if (cpfExists) {
        toast.error('CPF já cadastrado')
        return
      }

      if (emailExists) {
        toast.error('Email já cadastrado')
        return
      }

      // Gerar senha aleatória
      const senhaGerada = generateRandomPassword()

      // Obter empresas selecionadas
      const empresasSelecionadas = empresasDisponiveis.filter(e => formData.empresasIds.includes(e.id))

      const novoResponsavel: ResponsavelPF = {
        id: Date.now().toString(),
        nome: formData.nome,
        cpf: formData.cpf,
        email: formData.email,
        telefone: formData.telefone,
        status: formData.status,
        senha: senhaGerada,
        senhaInicial: true, // Primeira vez logando
        empresasIds: formData.empresasIds,
        empresas: empresasSelecionadas,
        dataCriacao: new Date()
      }

      setResponsaveis(prev => [...prev, novoResponsavel])
      
      // Salvar senha para exibir no dialog de sucesso
      setSenhaGeradaExibir(senhaGerada)
      
      // 🔥 NOVO: Enviar email de boas-vindas automaticamente
      try {
        console.log('📧 Enviando email de boas-vindas para:', formData.email)
        
        const emailData = {
          nome: formData.nome,
          email: formData.email,
          senha: senhaGerada,
          empresas: empresasSelecionadas.map(e => e.nomeFantasia)
        }

        const emailResponse = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        })

        const emailResult = await emailResponse.json()
        
        if (emailResult.success) {
          console.log('✅ Email de boas-vindas enviado com sucesso!')
          toast.success(
            <div className="flex flex-col">
              <span className="font-medium">🎉 Responsável criado e email enviado!</span>
              <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                <span className="text-sm text-green-800">
                  📧 Email de boas-vindas enviado para: <strong>{formData.email}</strong>
                </span>
              </div>
              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                <span className="text-sm text-yellow-800">
                  <strong>Senha inicial:</strong> <span className="font-mono font-bold">{senhaGerada}</span>
                </span>
              </div>
              <span className="text-xs text-gray-600 mt-1">
                O cliente recebeu as credenciais por email e deve alterar a senha no primeiro acesso
              </span>
            </div>,
            { duration: 15000 } // 15 segundos para que seja bem visível
          )
        } else {
          console.warn('⚠️ Responsável criado, mas houve problema no envio do email:', emailResult.message)
          toast.warning(
            <div className="flex flex-col">
              <span className="font-medium">⚠️ Responsável criado, mas email não foi enviado</span>
              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                <span className="text-sm text-yellow-800">
                  <strong>Senha inicial:</strong> <span className="font-mono font-bold">{senhaGerada}</span>
                </span>
              </div>
              <span className="text-xs text-gray-600 mt-1">
                Informe as credenciais manualmente ao cliente. Verifique as configurações de email.
              </span>
            </div>,
            { duration: 12000 }
          )
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de boas-vindas:', emailError)
        toast.error(
          <div className="flex flex-col">
            <span className="font-medium">❌ Responsável criado, mas email falhou</span>
            <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
              <span className="text-sm text-yellow-800">
                <strong>Senha inicial:</strong> <span className="font-mono font-bold">{senhaGerada}</span>
              </span>
            </div>
            <span className="text-xs text-gray-600 mt-1">
              Informe as credenciais manualmente ao cliente
            </span>
          </div>,
          { duration: 10000 }
        )
      }
      
      // Reset form
      setFormData({
        nome: '',
        cpf: '',
        email: '',
        telefone: '',
        status: 'ativo',
        empresasIds: []
      })
      
      setIsCreateDialogOpen(false)
      console.log('Responsável criado:', novoResponsavel)
      
    } catch (error) {
      console.error('Erro ao criar responsável:', error)
      toast.error('Erro ao criar responsável')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Editar responsável
  const handleEditResponsavel = (id: string) => {
    const responsavel = responsaveis.find(r => r.id === id)
    if (responsavel) {
      setSelectedResponsavel(responsavel)
      setFormData({
        nome: responsavel.nome,
        cpf: responsavel.cpf,
        email: responsavel.email,
        telefone: responsavel.telefone,
        status: responsavel.status,
        empresasIds: responsavel.empresasIds
      })
      setIsEditDialogOpen(true)
    }
  }

  // Deletar responsável
  const handleDeleteResponsavel = (id: string, nome: string) => {
    console.log('Excluindo responsável:', nome)
    setResponsaveis(prev => {
      const updated = prev.filter(r => r.id !== id)
      if (updated.length === 0) {
        localStorage.removeItem('portal_responsaveis')
      }
      return updated
    })
    toast.success(`Responsável "${nome}" excluído com sucesso`)
  }

  // Resetar senha
  const handleResetPassword = async (responsavel: ResponsavelPF) => {
    try {
      // Usar senha fixa para Eduardo, aleatória para outros
      const novaSenha = responsavel.nome === 'Eduardo Aparecido Gomes' && responsavel.cpf === '218.680.918-48'
        ? 'TeQ91SUV'
        : generateRandomPassword()
      
      // Atualizar senha no estado
      setResponsaveis(prev => prev.map(r => 
        r.id === responsavel.id 
          ? { ...r, senha: novaSenha, senhaInicial: true }
          : r
      ))
      
      setSenhaGeradaExibir(novaSenha)
      
      // 🔥 NOVO: Enviar email de reset de senha automaticamente
      try {
        console.log('📧 Enviando email de reset de senha para:', responsavel.email)
        
        const emailData = {
          nome: responsavel.nome,
          email: responsavel.email,
          novaSenha: novaSenha
        }

        const emailResponse = await fetch('/api/send-password-reset-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailData)
        })

        const emailResult = await emailResponse.json()
        
        if (emailResult.success) {
          console.log('✅ Email de reset de senha enviado com sucesso!')
          toast.success(
            <div className="flex flex-col">
              <span className="font-medium">🔐 Nova senha gerada e email enviado!</span>
              <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                <span className="text-sm text-green-800">
                  📧 Email enviado para: <strong>{responsavel.email}</strong>
                </span>
              </div>
              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                <span className="text-sm text-yellow-800">
                  <strong>Nova senha:</strong> <span className="font-mono font-bold">{novaSenha}</span>
                </span>
              </div>
              <span className="text-xs text-gray-600 mt-1">
                O cliente recebeu a nova senha por email
              </span>
            </div>,
            { duration: 12000 }
          )
        } else {
          console.warn('⚠️ Senha resetada, mas houve problema no envio do email:', emailResult.message)
          toast.warning(
            <div className="flex flex-col">
              <span className="font-medium">⚠️ Senha resetada, mas email não foi enviado</span>
              <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
                <span className="text-sm text-yellow-800">
                  <strong>Nova senha:</strong> <span className="font-mono font-bold">{novaSenha}</span>
                </span>
              </div>
              <span className="text-xs text-gray-600 mt-1">
                Informe a nova senha manualmente ao cliente
              </span>
            </div>,
            { duration: 10000 }
          )
        }
      } catch (emailError) {
        console.error('❌ Erro ao enviar email de reset:', emailError)
        toast.error(
          <div className="flex flex-col">
            <span className="font-medium">❌ Senha resetada, mas email falhou</span>
            <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-300">
              <span className="text-sm text-yellow-800">
                <strong>Nova senha:</strong> <span className="font-mono font-bold">{novaSenha}</span>
              </span>
            </div>
            <span className="text-xs text-gray-600 mt-1">
              Informe a nova senha manualmente ao cliente
            </span>
          </div>,
          { duration: 8000 }
        )
      }
      
    } catch (error) {
      console.error('❌ Erro ao resetar senha:', error)
      toast.error('Erro ao resetar senha. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Portal do Cliente - Administração
              </h1>
              <p className="text-gray-600">
                Gerencie os responsáveis que terão acesso ao portal do cliente
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Cadastrar Responsável
              </Button>

              {responsaveis.length > 0 && (
                <Button 
                  onClick={handleClearAllData}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Limpar Dados
                </Button>
              )}
            </div>
          </div>

          {/* Status do Sistema de Email */}
          <div className="mb-6">
            {emailSystemStatus.status === 'active' ? (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <div className="mr-3">✅</div>
                  <div>
                    <strong>📧 Sistema de Email Ativo:</strong> Os emails de boas-vindas e reset de senha estão sendo enviados automaticamente via Resend para os clientes.
                  </div>
                </div>
              </div>
            ) : emailSystemStatus.status === 'simulation' ? (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <div className="mr-3">ℹ️</div>
                  <div>
                    <strong>📧 Modo Desenvolvimento:</strong> Os emails estão sendo simulados no console. Os clientes NÃO estão recebendo emails reais. Para ativar o envio real, configure a variável RESEND_API_KEY em produção.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <div className="mr-3">❌</div>
                  <div>
                    <strong>Sistema de Email Inativo:</strong> Você está em produção mas não configurou a RESEND_API_KEY. Os clientes NÃO estão recebendo emails. Configure a variável de ambiente para ativar o envio.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Responsáveis List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Responsáveis ({filteredResponsaveis.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredResponsaveis.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum responsável cadastrado
                </h3>
                <p className="text-gray-500 mb-6">
                  Comece cadastrando o primeiro responsável que terá acesso ao portal do cliente.
                </p>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Responsável
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResponsaveis.map((responsavel) => (
                  <div key={responsavel.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {responsavel.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{responsavel.nome}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {responsavel.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {responsavel.telefone}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={responsavel.status === 'ativo' ? 'default' : 'secondary'}>
                          {responsavel.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {responsavel.senhaInicial && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            <Key className="w-3 h-3 mr-1" />
                            Senha Inicial
                          </Badge>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditResponsavel(responsavel.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar Dados
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(responsavel)}>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Gerar Nova Senha
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteResponsavel(responsavel.id, responsavel.nome)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {/* Empresas com Acesso */}
                    <div className="mt-3">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Empresas com Acesso ({responsavel.empresas?.length || 0})
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {(responsavel.empresas || []).map((empresa) => (
                          <Badge key={empresa.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Building2 className="w-3 h-3 mr-1" />
                            {empresa.nomeFantasia}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog - Criar Responsável */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Cadastrar Novo Responsável
              </DialogTitle>
              <DialogDescription>
                Crie um novo responsável que terá acesso ao portal do cliente.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Alerta sobre Senha Automática */}
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Senha Automática:</strong> Uma senha de 8 caracteres será gerada automaticamente e mostrada após o cadastro. O responsável deverá alterar esta senha no primeiro acesso.
                </AlertDescription>
              </Alert>

              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Dados Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({...prev, nome: e.target.value}))}
                      placeholder="Digite o nome completo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData(prev => ({...prev, cpf: e.target.value}))}
                      placeholder="000.000.000-00"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      placeholder="usuario@empresa.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({...prev, telefone: e.target.value}))}
                      placeholder="(11) 99999-9999"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({...prev, status: value}))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Seleção de Empresas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Empresas com Acesso *
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Selecione quais empresas este responsável poderá acessar no portal do cliente.
                </p>
                
                <EmpresaSelector
                  empresas={empresasDisponiveis}
                  selectedIds={formData.empresasIds}
                  onSelectionChange={(ids) => setFormData(prev => ({...prev, empresasIds: ids}))}
                />
              </div>

              {/* Alertas e Estados */}
              {loadingClientes && (
                <Alert>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <AlertDescription>
                    Carregando empresas cadastradas...
                  </AlertDescription>
                </Alert>
              )}
              
              {!loadingClientes && empresasDisponiveis.length === 0 && (
                <Alert>
                  <Building2 className="w-4 h-4" />
                  <AlertDescription>
                    Nenhuma empresa (pessoa jurídica) ativa encontrada. Cadastre empresas primeiro na seção de clientes.
                  </AlertDescription>
                </Alert>
              )}

              {!loadingClientes && empresasDisponiveis.length > 0 && formData.empresasIds.length === 0 && (
                <Alert>
                  <Building2 className="w-4 h-4" />
                  <AlertDescription>
                    Selecione pelo menos uma empresa para continuar.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateResponsavel}
                disabled={isSubmitting || formData.empresasIds.length === 0 || loadingClientes || empresasDisponiveis.length === 0}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Responsável
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog - Senha Criada com Sucesso */}
        <Dialog open={!!senhaGeradaExibir} onOpenChange={() => setSenhaGeradaExibir(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Responsável Criado!
              </DialogTitle>
              <DialogDescription>
                O responsável foi cadastrado com sucesso. Anote a senha inicial abaixo:
              </DialogDescription>
            </DialogHeader>

            <div className="py-6">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Key className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Senha Inicial</span>
                </div>
                <div className="bg-white border border-yellow-200 rounded px-4 py-3 mb-3">
                  <span className="font-mono text-2xl font-bold text-gray-900 tracking-wider select-all">
                    {senhaGeradaExibir}
                  </span>
                </div>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>• Clique na senha para selecioná-la toda</p>
                  <p>• O responsável deve alterar esta senha no primeiro acesso</p>
                  <p>• Guarde esta informação em local seguro</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={() => setSenhaGeradaExibir(null)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Senha Anotada - Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}