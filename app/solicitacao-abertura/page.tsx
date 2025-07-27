"use client"

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { 
  Building2, 
  Send, 
  Phone, 
  MapPin, 
  Users, 
  DollarSign,
  FileText,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Mail,
  Plus,
  Trash2,
  Home,
  Briefcase
} from 'lucide-react'

interface Socio {
  id: string
  nome: string
  cpf: string
  rg: string
  estadoCivil: string
  telefone: string
  email: string
  endereco: {
    cep: string
    logradouro: string
    numero: string
    bairro: string
    cidade: string
    uf: string
  }
  participacao: number
}

export default function SolicitacaoAbertura() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    // Dados da Empresa
    razaoSocial: '',
    nomeFantasia: '',
    atividades: '',
    capitalSocial: '',
    regimeTributario: '',
    
    // Endereço Comercial
    enderecoComercial: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: ''
    },
    
    // Dados do Solicitante
    nomeContato: '',
    telefoneContato: '',
    emailContato: '',
    
    // Endereço Residencial do Solicitante
    enderecoResidencial: {
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: ''
    },
    
    // Observações
    observacoes: '',
    
    // Preferências
    urgente: false,
    possuiContador: false,
    jaTemCNPJ: false
  })

  const [socios, setSocios] = useState<Socio[]>([
    {
      id: '1',
      nome: '',
      cpf: '',
      rg: '',
      estadoCivil: 'solteiro',
      telefone: '',
      email: '',
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: ''
      },
      participacao: 100
    }
  ])

  // Add socio
  const addSocio = () => {
    const newSocio: Socio = {
      id: Date.now().toString(),
      nome: '',
      cpf: '',
      rg: '',
      estadoCivil: 'solteiro',
      telefone: '',
      email: '',
      endereco: {
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidade: '',
        uf: ''
      },
      participacao: 0
    }
    setSocios([...socios, newSocio])
  }

  // Remove socio
  const removeSocio = (id: string) => {
    setSocios(socios.filter(s => s.id !== id))
  }

  // Update socio
  const updateSocio = (id: string, field: string, value: any) => {
    setSocios(socios.map(socio => 
      socio.id === id ? { ...socio, [field]: value } : socio
    ))
  }

  // Update socio address
  const updateSocioEndereco = (id: string, field: string, value: string) => {
    setSocios(socios.map(socio => 
      socio.id === id ? { 
        ...socio, 
        endereco: { ...socio.endereco, [field]: value }
      } : socio
    ))
  }

  // Format currency
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    const amount = parseFloat(numbers) / 100
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  // Handle currency input
  const handleCurrencyInput = (value: string) => {
    const formatted = formatCurrency(value)
    setFormData(prev => ({ ...prev, capitalSocial: formatted }))
  }

  // Validate form
  const validateForm = () => {
    if (!formData.razaoSocial.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Razão Social é obrigatória",
        variant: "destructive",
      })
      return false
    }
    
    if (!formData.atividades.trim()) {
      toast({
        title: "Campo obrigatório", 
        description: "Atividades pretendidas são obrigatórias",
        variant: "destructive",
      })
      return false
    }
    
    if (!formData.nomeContato.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome do contato é obrigatório",
        variant: "destructive",
      })
      return false
    }
    
    if (!formData.telefoneContato.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Telefone do contato é obrigatório", 
        variant: "destructive",
      })
      return false
    }
    
    if (socios.some(s => !s.nome.trim())) {
      toast({
        title: "Dados incompletos",
        description: "Todos os sócios devem ter nome preenchido",
        variant: "destructive",
      })
      return false
    }
    
    return true
  }

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    const message = `🏢 *SOLICITAÇÃO DE ABERTURA DE EMPRESA*\n\n` +
      `📋 *DADOS DA EMPRESA:*\n` +
      `• Razão Social: ${formData.razaoSocial}\n` +
      `• Nome Fantasia: ${formData.nomeFantasia || 'Não informado'}\n` +
      `• Atividades: ${formData.atividades}\n` +
      `• Capital Social: ${formData.capitalSocial || 'Não informado'}\n` +
      `• Regime Tributário: ${formData.regimeTributario || 'Não informado'}\n\n` +
      
      `📍 *ENDEREÇO COMERCIAL:*\n` +
      `${formData.enderecoComercial.logradouro ? 
        `${formData.enderecoComercial.logradouro}, ${formData.enderecoComercial.numero}\n` +
        `${formData.enderecoComercial.bairro} - ${formData.enderecoComercial.cidade}/${formData.enderecoComercial.uf}\n` +
        `CEP: ${formData.enderecoComercial.cep}\n` 
        : 'Não informado'}\n` +
      
      `👤 *CONTATO:*\n` +
      `• Nome: ${formData.nomeContato}\n` +
      `• Telefone: ${formData.telefoneContato}\n` +
      `• Email: ${formData.emailContato || 'Não informado'}\n\n` +
      
      `👥 *SÓCIOS (${socios.length}):*\n` +
      socios.map((socio, i) => 
        `${i + 1}. ${socio.nome || 'Nome não informado'} - ${socio.participacao}%${socio.cpf ? `\n   CPF: ${socio.cpf}` : ''}`
      ).join('\n') + '\n\n' +
      
      `${formData.observacoes ? `📝 *OBSERVAÇÕES:*\n${formData.observacoes}\n\n` : ''}` +
      
      `${formData.urgente ? '🚨 *SOLICITAÇÃO URGENTE*\n\n' : ''}` +
      
      `📅 *Data da Solicitação:* ${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n` +
      
      `✅ Solicitação enviada através do site da AG Assessoria`
      
    return message
  }

  // Submit form
  const handleSubmit = () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const message = generateWhatsAppMessage()
      const whatsappUrl = `https://wa.me/5516991098966?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      
      toast({
        title: "Solicitação enviada!",
        description: "Sua solicitação foi enviada via WhatsApp. Entraremos em contato em breve.",
      })
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          razaoSocial: '',
          nomeFantasia: '',
          atividades: '',
          capitalSocial: '',
          regimeTributario: '',
          enderecoComercial: {
            cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: ''
          },
          nomeContato: '',
          telefoneContato: '',
          emailContato: '',
          enderecoResidencial: {
            cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: ''
          },
          observacoes: '',
          urgente: false,
          possuiContador: false,
          jaTemCNPJ: false
        })
        setSocios([{
          id: '1', nome: '', cpf: '', rg: '', estadoCivil: 'solteiro', telefone: '', email: '',
          endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', uf: '' },
          participacao: 100
        }])
      }, 2000)
      
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro. Tente novamente ou entre em contato diretamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-xl shadow-lg">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/o-h2__8-krHhyceVQM4UJ/image.png" 
                  alt="AG Assessoria Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">AG ASSESSORIA</h1>
                <p className="text-sm text-slate-600 font-medium">SOLICITAÇÃO DE ABERTURA</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Solicite a Abertura da Sua Empresa</h2>
              <p className="text-emerald-100 text-lg mb-6">
                Preencha o formulário abaixo e nossa equipe entrará em contato para iniciar o processo
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  <span className="text-sm">Atendimento Especializado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-teal-300" />
                  <span className="text-sm">Resposta Rápida</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-emerald-300" />
                  <span className="text-sm">Documentação Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* Dados da Empresa */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-6 h-6" />
                <span>Dados da Empresa</span>
              </CardTitle>
              <CardDescription className="text-emerald-100">
                Informações básicas sobre a empresa que deseja abrir
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="razaoSocial" className="text-slate-700 font-medium">
                    Razão Social *
                  </Label>
                  <Input
                    id="razaoSocial"
                    placeholder="Ex: Silva & Santos Ltda"
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData(prev => ({ ...prev, razaoSocial: e.target.value }))}
                    className="border-slate-300 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nomeFantasia" className="text-slate-700 font-medium">
                    Nome Fantasia
                  </Label>
                  <Input
                    id="nomeFantasia"
                    placeholder="Ex: Loja do Silva"
                    value={formData.nomeFantasia}
                    onChange={(e) => setFormData(prev => ({ ...prev, nomeFantasia: e.target.value }))}
                    className="border-slate-300 focus:border-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="atividades" className="text-slate-700 font-medium">
                  Atividades Pretendidas *
                </Label>
                <Textarea
                  id="atividades"
                  placeholder="Descreva as principais atividades que a empresa irá exercer..."
                  value={formData.atividades}
                  onChange={(e) => setFormData(prev => ({ ...prev, atividades: e.target.value }))}
                  className="border-slate-300 focus:border-emerald-500 min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="capitalSocial" className="text-slate-700 font-medium">
                    Capital Social
                  </Label>
                  <Input
                    id="capitalSocial"
                    placeholder="R$ 0,00"
                    value={formData.capitalSocial}
                    onChange={(e) => handleCurrencyInput(e.target.value)}
                    className="border-slate-300 focus:border-emerald-500"
                  />
                </div>
                
                <div>
                  <Label htmlFor="regimeTributario" className="text-slate-700 font-medium">
                    Regime Tributário Pretendido
                  </Label>
                  <Select 
                    value={formData.regimeTributario} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, regimeTributario: value }))}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="Selecione o regime" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mei">MEI (Microempreendedor Individual)</SelectItem>
                      <SelectItem value="simples">Simples Nacional</SelectItem>
                      <SelectItem value="presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="real">Lucro Real</SelectItem>
                      <SelectItem value="nao_sei">Não sei / Preciso de orientação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço Comercial */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-6 h-6" />
                <span>Endereço Comercial</span>
              </CardTitle>
              <CardDescription className="text-blue-100">
                Local onde a empresa irá funcionar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">CEP</Label>
                  <Input
                    placeholder="00000-000"
                    value={formData.enderecoComercial.cep}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enderecoComercial: { ...prev.enderecoComercial, cep: e.target.value }
                    }))}
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label className="text-slate-700 font-medium">Logradouro</Label>
                  <Input
                    placeholder="Rua, Avenida, etc."
                    value={formData.enderecoComercial.logradouro}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enderecoComercial: { ...prev.enderecoComercial, logradouro: e.target.value }
                    }))}
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-slate-700 font-medium">Número</Label>
                  <Input
                    placeholder="123"
                    value={formData.enderecoComercial.numero}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enderecoComercial: { ...prev.enderecoComercial, numero: e.target.value }
                    }))}
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 font-medium">Bairro</Label>
                  <Input
                    placeholder="Centro"
                    value={formData.enderecoComercial.bairro}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enderecoComercial: { ...prev.enderecoComercial, bairro: e.target.value }
                    }))}
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 font-medium">Cidade</Label>
                  <Input
                    placeholder="São Paulo"
                    value={formData.enderecoComercial.cidade}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      enderecoComercial: { ...prev.enderecoComercial, cidade: e.target.value }
                    }))}
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 font-medium">UF</Label>
                  <Select 
                    value={formData.enderecoComercial.uf}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      enderecoComercial: { ...prev.enderecoComercial, uf: value }
                    }))}
                  >
                    <SelectTrigger className="border-slate-300">
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SP">SP</SelectItem>
                      <SelectItem value="RJ">RJ</SelectItem>
                      <SelectItem value="MG">MG</SelectItem>
                      <SelectItem value="RS">RS</SelectItem>
                      <SelectItem value="PR">PR</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      {/* Add more states as needed */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do Contato */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <Phone className="w-6 h-6" />
                <span>Dados de Contato</span>
              </CardTitle>
              <CardDescription className="text-purple-100">
                Informações para entrarmos em contato com você
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-slate-700 font-medium">Nome Completo *</Label>
                  <Input
                    placeholder="Seu nome completo"
                    value={formData.nomeContato}
                    onChange={(e) => setFormData(prev => ({ ...prev, nomeContato: e.target.value }))}
                    className="border-slate-300 focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-700 font-medium">WhatsApp/Telefone *</Label>
                  <Input
                    placeholder="(16) 99999-9999"
                    value={formData.telefoneContato}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefoneContato: e.target.value }))}
                    className="border-slate-300 focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-slate-700 font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.emailContato}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailContato: e.target.value }))}
                  className="border-slate-300 focus:border-purple-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sócios */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6" />
                  <span>Sócios da Empresa</span>
                </div>
                <Button
                  onClick={addSocio}
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Sócio
                </Button>
              </CardTitle>
              <CardDescription className="text-orange-100">
                Informações dos sócios que farão parte da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {socios.map((socio, index) => (
                <div key={socio.id} className="border border-slate-200 rounded-lg p-6 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800">Sócio {index + 1}</h4>
                    {socios.length > 1 && (
                      <Button
                        onClick={() => removeSocio(socio.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Nome Completo</Label>
                      <Input
                        placeholder="Nome do sócio"
                        value={socio.nome}
                        onChange={(e) => updateSocio(socio.id, 'nome', e.target.value)}
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-slate-700 font-medium">CPF</Label>
                      <Input
                        placeholder="000.000.000-00"
                        value={socio.cpf}
                        onChange={(e) => updateSocio(socio.id, 'cpf', e.target.value)}
                        className="border-slate-300"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-slate-700 font-medium">Participação (%)</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={socio.participacao}
                        onChange={(e) => updateSocio(socio.id, 'participacao', parseInt(e.target.value) || 0)}
                        className="border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Observações e Preferências */}
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-6 h-6" />
                <span>Informações Adicionais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-slate-700 font-medium">Observações</Label>
                <Textarea
                  placeholder="Informações adicionais, dúvidas ou solicitações especiais..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="border-slate-300 focus:border-teal-500 min-h-[100px]"
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="urgente"
                    checked={formData.urgente}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, urgente: !!checked }))}
                  />
                  <Label htmlFor="urgente" className="text-slate-700">
                    Solicitação urgente (prazo reduzido)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="possuiContador"
                    checked={formData.possuiContador}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, possuiContador: !!checked }))}
                  />
                  <Label htmlFor="possuiContador" className="text-slate-700">
                    Já possui contador
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="jaTemCNPJ"
                    checked={formData.jaTemCNPJ}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, jaTemCNPJ: !!checked }))}
                  />
                  <Label htmlFor="jaTemCNPJ" className="text-slate-700">
                    Já possui CNPJ (alteração de dados)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-12 py-6 text-lg rounded-xl shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <ArrowRight className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Enviar Solicitação
                </>
              )}
            </Button>
          </div>

          {/* Contact Info */}
          <Card className="shadow-xl border-0 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Precisa de Ajuda?</h3>
              <p className="text-slate-300 mb-6">
                Nossa equipe está pronta para esclarecer suas dúvidas
              </p>
              <div className="flex justify-center items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <span className="font-medium">(16) 99109-8966</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="font-medium">contato@agassessoria.com</span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}