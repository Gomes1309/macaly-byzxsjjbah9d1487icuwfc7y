'use client'

import { useState, useEffect } from 'react'
import { 
  Building,
  FileText,
  Download,
  Eye,
  LogOut,
  Phone,
  Shield,
  LogIn,
  Loader2,
  ArrowLeft,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

// Interfaces simplificadas
interface ClientePortal {
  id: string
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
  email: string
  telefone: string
  responsavelCpf: string
}

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
  empresas?: any[] // Array de empresas completas
  empresasIds?: string[] // Array de IDs das empresas
  dataCriacao: Date
  ultimoAcesso?: Date
}

interface DocumentoCliente {
  id: string
  clienteId: string
  categoria: 'abertura_alteracao' | 'fiscal' | 'contabil' | 'trabalhista' | 'societario' | 'juridico' | 'outros'
  nome: string
  nomeOriginal: string
  tipo: string
  tamanho: string
  dataUpload: Date
  uploadPor: string
  status: 'disponivel' | 'processando' | 'enviado'
}

// Funções auxiliares
const formatCPF = (value: string) => {
  // Remover caracteres não numéricos
  const numericValue = value.replace(/\D/g, '')
  
  // Aplicar máscara de CPF (000.000.000-00)
  let formattedCpf = numericValue
  if (numericValue.length > 3) {
    formattedCpf = numericValue.substring(0, 3) + '.' + numericValue.substring(3)
  }
  if (numericValue.length > 6) {
    formattedCpf = numericValue.substring(0, 3) + '.' + 
                  numericValue.substring(3, 6) + '.' + 
                  numericValue.substring(6)
  }
  if (numericValue.length > 9) {
    formattedCpf = numericValue.substring(0, 3) + '.' + 
                  numericValue.substring(3, 6) + '.' + 
                  numericValue.substring(6, 9) + '-' + 
                  numericValue.substring(9, 11)
  }
  
  return formattedCpf
}

const formatCNPJ = (cnpj: string) => {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Configuração de categorias
const categoriaConfig = {
  abertura_alteracao: { label: 'Abertura/Alteração', color: 'bg-blue-100 text-blue-800' },
  fiscal: { label: 'Fiscal', color: 'bg-green-100 text-green-800' },
  contabil: { label: 'Contábil', color: 'bg-purple-100 text-purple-800' },
  trabalhista: { label: 'Trabalhista', color: 'bg-orange-100 text-orange-800' },
  societario: { label: 'Societário', color: 'bg-red-100 text-red-800' },
  juridico: { label: 'Jurídico', color: 'bg-indigo-100 text-indigo-800' },
  outros: { label: 'Outros', color: 'bg-gray-100 text-gray-800' }
}

export default function PortalClientePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentCliente, setCurrentCliente] = useState<ClientePortal | null>(null)
  const [currentResponsavel, setCurrentResponsavel] = useState<ResponsavelPortal | null>(null)
  
  // Estados do login
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Estados da seleção de empresa
  const [needsEmpresaSelection, setNeedsEmpresaSelection] = useState(false)
  const [availableEmpresas, setAvailableEmpresas] = useState<any[]>([])
  const [selectedEmpresaId, setSelectedEmpresaId] = useState('')
  const [isSelectingEmpresa, setIsSelectingEmpresa] = useState(false)
  
  // Estados da troca de senha obrigatória
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  // Estados dos documentos
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([])

  console.log('Portal do Cliente carregado')

  // Função de login
  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      console.log('🔐 Iniciando processo de login...')
      console.log('📊 Dados de entrada:', { cpf, senha: '***' })
      
      if (!cpf || !senha) {
        throw new Error('Por favor, preencha CPF e senha.')
      }
      
      const cpfNumeros = cpf.replace(/\D/g, '')
      console.log('🔢 CPF numérico:', cpfNumeros)
      
      if (cpfNumeros.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos.')
      }
      
      // Buscar dados do localStorage
      const storedData = localStorage.getItem('portal_responsaveis')
      console.log('💾 Dados encontrados no localStorage:', !!storedData)
      
      let responsaveis: ResponsavelPortal[] = []
      
      if (storedData) {
        responsaveis = JSON.parse(storedData)
        console.log('👥 Total de responsáveis carregados:', responsaveis.length)
        console.log('📋 Lista de CPFs disponíveis:', responsaveis.map(r => ({
          nome: r.nome,
          cpf: r.cpf,
          cpfNumeros: r.cpf.replace(/\D/g, ''),
          senha: r.senha,
          empresaNome: r.empresaNome || 'N/A'
        })))
      }
      
      // Se não há dados, mostrar mensagem apropriada
      if (responsaveis.length === 0) {
        console.log('❌ Nenhum responsável encontrado no sistema')
        throw new Error('Nenhum responsável cadastrado. Entre em contato com AG Assessoria.')
      }
      
      // Buscar responsável por CPF
      console.log('🔍 Buscando responsável com CPF:', cpfNumeros)
      const responsavel = responsaveis.find((r: ResponsavelPortal) => {
        const rCpfNumeros = r.cpf.replace(/\D/g, '')
        console.log('🔍 Comparando:', rCpfNumeros, '===', cpfNumeros, '→', rCpfNumeros === cpfNumeros)
        return rCpfNumeros === cpfNumeros
      })
      
      if (!responsavel) {
        console.log('❌ CPF não encontrado na base de dados')
        throw new Error('CPF não encontrado. Entre em contato com AG Assessoria.')
      }
      
      console.log('✅ Responsável encontrado:', {
        nome: responsavel.nome,
        email: responsavel.email,
        senhaArmazenada: responsavel.senha,
        senhaDigitada: senha,
        tipoSenhaArmazenada: typeof responsavel.senha,
        tipoSenhaDigitada: typeof senha,
        comprimentoSenhaArmazenada: responsavel.senha?.length,
        comprimentoSenhaDigitada: senha?.length,
        senhasSaoIguais: responsavel.senha === senha
      })
      
      // Verificar senha - comparação simples e direta
      console.log('🔍 Comparação de senhas:')
      console.log('   Armazenada: "' + responsavel.senha + '"')
      console.log('   Digitada:   "' + senha + '"')
      console.log('   São iguais: ', responsavel.senha === senha)
      
      if (responsavel.senha !== senha) {
        console.log('❌ Senha incorreta')
        console.log('🔑 Esperada: "' + responsavel.senha + '"')
        console.log('🔑 Recebida: "' + senha + '"')
        throw new Error('Senha incorreta. Verifique se digitou corretamente.')
      }
      
      console.log('✅ Senha correta! Verificando empresas disponíveis...')
      
      // Verificar se é a primeira vez que está fazendo login (senha inicial)
      if (responsavel.senhaInicial) {
        console.log('🔐 PRIMEIRA VEZ: Usuário deve trocar a senha')
        setMustChangePassword(true)
        setCurrentResponsavel(responsavel)
        
        // Preparar dados da primeira empresa para a tela de troca de senha
        const firstEmpresa = responsavel.empresas?.[0] || {
          id: responsavel.empresaId,
          razaoSocial: responsavel.empresaNome,
          cnpj: responsavel.empresaCnpj
        }
        
        const cliente: ClientePortal = {
          id: firstEmpresa.id,
          cnpj: firstEmpresa.cnpj,
          razaoSocial: firstEmpresa.razaoSocial,
          nomeFantasia: firstEmpresa.razaoSocial.replace(' LTDA', ''),
          email: responsavel.email,
          telefone: responsavel.telefone,
          responsavelCpf: responsavel.cpf
        }
        
        setCurrentCliente(cliente)
        return
      }
      
      // Verificar quantas empresas o responsável tem acesso
      const empresasDoResponsavel = responsavel.empresas || []
      console.log('🏢 Empresas disponíveis:', empresasDoResponsavel.length)
      
      if (empresasDoResponsavel.length === 0) {
        // Usar dados de compatibilidade (formato antigo)
        const cliente: ClientePortal = {
          id: responsavel.empresaId,
          cnpj: responsavel.empresaCnpj,
          razaoSocial: responsavel.empresaNome,
          nomeFantasia: responsavel.empresaNome.replace(' LTDA', ''),
          email: responsavel.email,
          telefone: responsavel.telefone,
          responsavelCpf: responsavel.cpf
        }
        
        console.log('🏢 Usando dados de compatibilidade (empresa única)')
        setCurrentResponsavel(responsavel)
        setCurrentCliente(cliente)
        setIsAuthenticated(true)
        
        // Salvar autenticação
        localStorage.setItem('portal_responsavel_auth', JSON.stringify(responsavel))
        localStorage.setItem('portal_client_auth', JSON.stringify(cliente))
        
        console.log('🎉 Login realizado com sucesso!')
      } else if (empresasDoResponsavel.length === 1) {
        // Uma empresa apenas - login direto
        const empresa = empresasDoResponsavel[0]
        const cliente: ClientePortal = {
          id: empresa.id,
          cnpj: empresa.cnpj,
          razaoSocial: empresa.razaoSocial,
          nomeFantasia: empresa.nomeFantasia || empresa.razaoSocial.replace(' LTDA', ''),
          email: empresa.email || responsavel.email,
          telefone: empresa.telefone || responsavel.telefone,
          responsavelCpf: responsavel.cpf
        }
        
        console.log('🏢 Login direto - empresa única:', empresa.razaoSocial)
        setCurrentResponsavel(responsavel)
        setCurrentCliente(cliente)
        setIsAuthenticated(true)
        
        // Salvar autenticação
        localStorage.setItem('portal_responsavel_auth', JSON.stringify(responsavel))
        localStorage.setItem('portal_client_auth', JSON.stringify(cliente))
        
        console.log('🎉 Login realizado com sucesso!')
      } else {
        // Múltiplas empresas - mostrar seleção
        console.log('🏢 Múltiplas empresas - mostrando seleção:', empresasDoResponsavel.length)
        setCurrentResponsavel(responsavel)
        setAvailableEmpresas(empresasDoResponsavel)
        setNeedsEmpresaSelection(true)
      }
      
    } catch (error) {
      console.error('❌ Erro no login:', error)
      setError(error instanceof Error ? error.message : 'Erro no login.')
    } finally {
      setIsLoading(false)
    }
  }

  // Função de troca de senha obrigatória
  const handlePasswordChange = async () => {
    try {
      setIsChangingPassword(true)
      setPasswordError('')
      
      console.log('🔐 Iniciando troca de senha obrigatória...')
      
      if (!newPassword || !confirmPassword) {
        throw new Error('Por favor, preencha todos os campos.')
      }
      
      if (newPassword.length < 6) {
        throw new Error('A nova senha deve ter pelo menos 6 caracteres.')
      }
      
      if (newPassword !== confirmPassword) {
        throw new Error('As senhas não conferem. Digite novamente.')
      }
      
      if (!currentResponsavel) {
        throw new Error('Erro interno. Tente fazer login novamente.')
      }
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Atualizar senha no localStorage
      const storedData = localStorage.getItem('portal_responsaveis')
      if (storedData) {
        const responsaveis = JSON.parse(storedData)
        const updatedResponsaveis = responsaveis.map((r: ResponsavelPortal) => {
          if (r.cpf.replace(/\D/g, '') === currentResponsavel.cpf.replace(/\D/g, '')) {
            return {
              ...r,
              senha: newPassword,
              senhaInicial: false,
              ultimoAcesso: new Date()
            }
          }
          return r
        })
        
        localStorage.setItem('portal_responsaveis', JSON.stringify(updatedResponsaveis))
        console.log('✅ Senha atualizada no sistema')
      }
      
      // Atualizar dados do responsável atual
      const updatedResponsavel = {
        ...currentResponsavel,
        senha: newPassword,
        senhaInicial: false,
        ultimoAcesso: new Date()
      }
      
      setCurrentResponsavel(updatedResponsavel)
      
      // Agora sim, definir como autenticado
      setIsAuthenticated(true)
      setMustChangePassword(false)
      
      // Salvar autenticação
      localStorage.setItem('portal_responsavel_auth', JSON.stringify(updatedResponsavel))
      localStorage.setItem('portal_client_auth', JSON.stringify(currentCliente))
      
      console.log('🎉 Senha alterada com sucesso e login concluído!')
      
    } catch (error) {
      console.error('❌ Erro na troca de senha:', error)
      setPasswordError(error instanceof Error ? error.message : 'Erro na troca de senha.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  // Função de seleção de empresa
  const handleEmpresaSelection = async () => {
    try {
      setIsSelectingEmpresa(true)
      setError('')
      
      console.log('🏢 Selecionando empresa:', selectedEmpresaId)
      
      if (!selectedEmpresaId) {
        throw new Error('Por favor, selecione uma empresa.')
      }
      
      if (!currentResponsavel) {
        throw new Error('Erro interno. Tente fazer login novamente.')
      }
      
      // Encontrar a empresa selecionada
      const empresaSelecionada = availableEmpresas.find(emp => emp.id === selectedEmpresaId)
      
      if (!empresaSelecionada) {
        throw new Error('Empresa não encontrada.')
      }
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Criar dados do cliente com a empresa selecionada
      const cliente: ClientePortal = {
        id: empresaSelecionada.id,
        cnpj: empresaSelecionada.cnpj,
        razaoSocial: empresaSelecionada.razaoSocial,
        nomeFantasia: empresaSelecionada.nomeFantasia || empresaSelecionada.razaoSocial.replace(' LTDA', ''),
        email: empresaSelecionada.email || currentResponsavel.email,
        telefone: empresaSelecionada.telefone || currentResponsavel.telefone,
        responsavelCpf: currentResponsavel.cpf
      }
      
      console.log('🏢 Empresa selecionada:', empresaSelecionada.razaoSocial)
      
      setCurrentCliente(cliente)
      setIsAuthenticated(true)
      setNeedsEmpresaSelection(false)
      
      // Salvar autenticação
      localStorage.setItem('portal_responsavel_auth', JSON.stringify(currentResponsavel))
      localStorage.setItem('portal_client_auth', JSON.stringify(cliente))
      
      console.log('🎉 Acesso autorizado para:', empresaSelecionada.razaoSocial)
      
    } catch (error) {
      console.error('❌ Erro na seleção de empresa:', error)
      setError(error instanceof Error ? error.message : 'Erro na seleção de empresa.')
    } finally {
      setIsSelectingEmpresa(false)
    }
  }

  // Carregar documentos
  useEffect(() => {
    if (isAuthenticated && currentCliente) {
      loadDocumentosFromSupabase()
    }
  }, [isAuthenticated, currentCliente])

  // Nova função para carregar documentos do Supabase
  const loadDocumentosFromSupabase = async () => {
    try {
      console.log('🔄 Carregando documentos do Supabase para o portal...')
      
      // Sincronizar dados com Supabase
      const response = await fetch('/api/sync-documentos-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('📡 Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Resposta não OK:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('📥 Dados recebidos:', result)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao sincronizar dados')
      }

      console.log('📊 Dados sincronizados:', result.data.stats)

      // Salvar no localStorage (para compatibilidade)
      localStorage.setItem('documentos_sistema', JSON.stringify(result.data.documentos))
      localStorage.setItem('clientes_documentos', JSON.stringify(result.data.clientes))

      // Filtrar documentos do cliente atual
      if (!currentCliente) {
        console.log('⚠️ Cliente atual não definido')
        setDocumentos([])
        return
      }
      
      const cnpjNormalizado = currentCliente.cnpj.replace(/\D/g, '')
      console.log('🔍 Procurando cliente com CNPJ:', cnpjNormalizado)
      
      const clienteEncontrado = result.data.clientes.find((c: any) => 
        c.cnpj.replace(/\D/g, '') === cnpjNormalizado
      )
      
      console.log('👤 Cliente encontrado:', clienteEncontrado ? 'Sim' : 'Não')
      
      if (clienteEncontrado) {
        const documentosDoCliente = result.data.documentos
          .filter((doc: any) => doc.clienteId === clienteEncontrado.id)
          .map((doc: any) => ({
            ...doc,
            dataUpload: new Date(doc.dataUpload),
            tamanho: typeof doc.tamanho === 'string' ? doc.tamanho : `${(doc.tamanho / 1024 / 1024).toFixed(1)} MB`
          }))
        
        console.log(`📄 Documentos encontrados para o cliente: ${documentosDoCliente.length}`)
        console.log('📋 Lista de documentos:', documentosDoCliente.map(d => ({ nome: d.nome, categoria: d.categoria })))
        
        setDocumentos(documentosDoCliente)
      } else {
        console.log('⚠️ Cliente não encontrado na base de dados')
        setDocumentos([])
        
        // Tentar buscar por fallback no localStorage (compatibilidade)
        loadDocumentosFromLocalStorage()
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar documentos do Supabase:', error)
      console.error('🔍 Tipo do erro:', error?.constructor?.name)
      console.error('📄 Stack trace:', error instanceof Error ? error.stack : 'N/A')
      
      // Fallback para localStorage
      loadDocumentosFromLocalStorage()
    }
  }

  // Função de fallback para localStorage
  const loadDocumentosFromLocalStorage = () => {
    try {
      console.log('📂 Tentando carregar documentos do localStorage (fallback)...')
      
      const savedDocumentos = localStorage.getItem('documentos_sistema')
      const savedClientes = localStorage.getItem('clientes_documentos')
      
      if (savedDocumentos && savedClientes) {
        const parsedDocumentos = JSON.parse(savedDocumentos)
        const parsedClientes = JSON.parse(savedClientes)
        
        const cnpjNormalizado = currentCliente?.cnpj.replace(/\D/g, '')
        const clienteEncontrado = parsedClientes.find((c: any) => 
          c.cnpj.replace(/\D/g, '') === cnpjNormalizado
        )
        
        if (clienteEncontrado) {
          const documentosDoCliente = parsedDocumentos
            .filter((doc: any) => doc.clienteId === clienteEncontrado.id)
            .map((doc: any) => ({
              ...doc,
              dataUpload: new Date(doc.dataUpload),
              tamanho: typeof doc.tamanho === 'number' ? `${(doc.tamanho / 1024 / 1024).toFixed(1)} MB` : doc.tamanho
            }))
          
          console.log(`📄 Documentos carregados do localStorage: ${documentosDoCliente.length}`)
          setDocumentos(documentosDoCliente)
        } else {
          console.log('❌ Cliente não encontrado no localStorage')
          setDocumentos([])
        }
      } else {
        console.log('📂 Nenhum documento encontrado no localStorage')
        setDocumentos([])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar documentos do localStorage:', error)
      setDocumentos([])
    }
  }

  // Verificar autenticação salva
  useEffect(() => {
    const savedResponsavel = localStorage.getItem('portal_responsavel_auth')
    const savedClient = localStorage.getItem('portal_client_auth')
    
    if (savedResponsavel && savedClient) {
      try {
        const responsavel = JSON.parse(savedResponsavel)
        const cliente = JSON.parse(savedClient)
        
        setCurrentResponsavel(responsavel)
        setCurrentCliente(cliente)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem('portal_responsavel_auth')
        localStorage.removeItem('portal_client_auth')
      }
    }
  }, [])

  // Logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setCurrentResponsavel(null)
    setCurrentCliente(null)
    setCpf('')
    setSenha('')
    localStorage.removeItem('portal_responsavel_auth')
    localStorage.removeItem('portal_client_auth')
  }

  // Download documento
  const handleDownload = (documento: DocumentoCliente) => {
    console.log('Download:', documento.nome)
    // Simular download
    const blob = new Blob(['Conteúdo do documento'], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = documento.nome
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Tela de Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8">
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="bg-white p-4 rounded-lg shadow-md inline-block mb-4">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/3u_JQXRJxk6byofZFcE0X/logo-instagram-03.png" 
                  alt="AG Assessoria Logo" 
                  className="h-12 w-auto mx-auto"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Portal do Cliente</h1>
              <p className="text-sm text-gray-600">AG Assessoria Contábil</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2 text-blue-800">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Acesso Seguro via CPF</span>
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
                    className="mt-1"
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
                    className="mt-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLogin()
                      }
                    }}
                  />
                </div>
              </div>
              
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar no Portal
                  </>
                )}
              </Button>
              
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Esqueceu sua senha?
                </p>
                <Button
                  variant="link"
                  className="text-blue-600 hover:text-blue-700 text-sm p-0 h-auto"
                  onClick={() => {
                    // Implementar reset de senha futuramente
                    alert('Entre em contato com AG Assessoria para recuperar sua senha:\n(16) 3987-3829')
                  }}
                >
                  Recuperar senha
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de Seleção de Empresa
  if (needsEmpresaSelection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8">
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="bg-white p-4 rounded-lg shadow-md inline-block mb-4">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/3u_JQXRJxk6byofZFcE0X/logo-instagram-03.png" 
                  alt="AG Assessoria Logo" 
                  className="h-12 w-auto mx-auto"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Selecionar Empresa</h1>
              <p className="text-sm text-gray-600">Escolha qual empresa deseja acessar</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">Olá, {currentResponsavel?.nome}</span>
                </div>
                <p className="text-xs text-blue-700">
                  Você tem acesso a {availableEmpresas.length} empresa{availableEmpresas.length > 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Empresas Disponíveis
                </Label>
                
                {availableEmpresas.map((empresa) => (
                  <div 
                    key={empresa.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedEmpresaId === empresa.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                    }`}
                    onClick={() => setSelectedEmpresaId(empresa.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="empresa"
                        value={empresa.id}
                        checked={selectedEmpresaId === empresa.id}
                        onChange={() => setSelectedEmpresaId(empresa.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {empresa.razaoSocial}
                        </h3>
                        <p className="text-xs text-gray-600">
                          CNPJ: {formatCNPJ(empresa.cnpj)}
                        </p>
                        {empresa.nomeFantasia && empresa.nomeFantasia !== empresa.razaoSocial && (
                          <p className="text-xs text-gray-500">
                            {empresa.nomeFantasia}
                          </p>
                        )}
                      </div>
                      <Building className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setNeedsEmpresaSelection(false)
                    setCurrentResponsavel(null)
                    setAvailableEmpresas([])
                    setSelectedEmpresaId('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                
                <Button
                  onClick={handleEmpresaSelection}
                  disabled={isSelectingEmpresa || !selectedEmpresaId}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSelectingEmpresa ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Acessando...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Acessar Portal
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Tela de Troca de Senha Obrigatória
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8">
          <Card className="bg-white shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="bg-white p-4 rounded-lg shadow-md inline-block mb-4">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/3u_JQXRJxk6byofZFcE0X/logo-instagram-03.png" 
                  alt="AG Assessoria Logo" 
                  className="h-12 w-auto mx-auto"
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Primeira Vez?</h1>
              <p className="text-sm text-gray-600">Crie sua senha personalizada</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-center space-x-2 text-yellow-800 mb-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Primeiro Acesso</span>
                </div>
                <p className="text-xs text-yellow-700">
                  Por segurança, você deve criar uma senha personalizada para continuar.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    Nova Senha
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmar Nova Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="mt-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handlePasswordChange()
                      }
                    }}
                  />
                </div>
              </div>
              
              {passwordError && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {passwordError}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Alterando Senha...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Definir Nova Senha
                  </>
                )}
              </Button>
              
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Olá, <strong>{currentResponsavel?.nome}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Empresa: {currentCliente?.razaoSocial}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Portal Autenticado
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <img 
                    src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/3u_JQXRJxk6byofZFcE0X/logo-instagram-03.png" 
                    alt="AG Assessoria Logo" 
                    className="h-6 w-auto"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Portal do Cliente</h1>
                  <p className="text-xs text-gray-600">AG Assessoria Contábil</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{currentCliente?.razaoSocial}</p>
                <p className="text-xs text-gray-600">{currentCliente?.cnpj}</p>
                <p className="text-xs text-blue-600">👤 {currentResponsavel?.nome}</p>
              </div>
              
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
        
        {/* Informações da Empresa */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Informações da Empresa</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-700">Razão Social</Label>
                <p className="text-gray-900 font-semibold">{currentCliente?.razaoSocial}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">CNPJ</Label>
                <p className="text-gray-900">{currentCliente?.cnpj}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <p className="text-gray-900">{currentCliente?.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                <p className="text-gray-900">{currentCliente?.telefone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Segurança */}
        <Card className="mb-8 bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-1">Seus Dados Estão Seguros</h3>
                <p className="text-green-700 text-sm">
                  A AG Assessoria realiza backups automáticos diários de todos os seus documentos. 
                  Sua informação está protegida e sempre disponível.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Documentos ({documentos.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentos.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum documento encontrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documentos.map((documento) => {
                  const categoriaInfo = categoriaConfig[documento.categoria]
                  
                  return (
                    <div key={documento.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{documento.nome}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span>{documento.dataUpload.toLocaleDateString('pt-BR')}</span>
                            <span>{documento.tamanho}</span>
                            <Badge className={categoriaInfo.color} variant="secondary">
                              {categoriaInfo.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownload(documento)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  )
}