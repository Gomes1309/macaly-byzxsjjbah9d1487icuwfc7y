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
const formatCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
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
  
  // Estados dos documentos
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([])

  console.log('Portal do Cliente carregado')

  // Função de login
  const handleLogin = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      if (!cpf || !senha) {
        throw new Error('Por favor, preencha CPF e senha.')
      }
      
      const cpfNumeros = cpf.replace(/\D/g, '')
      if (cpfNumeros.length !== 11) {
        throw new Error('CPF deve ter 11 dígitos.')
      }
      
      // Buscar dados do localStorage
      const storedData = localStorage.getItem('portal_responsaveis')
      let responsaveis: ResponsavelPortal[] = []
      
      if (storedData) {
        responsaveis = JSON.parse(storedData)
      }
      
      // Se não há dados, criar dados de demonstração
      if (responsaveis.length === 0) {
        const fallbackData: ResponsavelPortal = {
          id: 'eduardo-gomes-demo',
          nome: 'Eduardo Aparecido Gomes',
          cpf: '218.680.918-48',
          email: 'gomes1309@gmail.com',
          telefone: '16992714270',
          status: 'ativo',
          senha: '22HHgYhJ',
          senhaInicial: false,
          empresaId: 'leg-comercio-001',
          empresaNome: 'LEG - COMERCIO E SERVICOS LTDA',
          empresaCnpj: '14.200.166/0001-11',
          dataCriacao: new Date('2024-01-15'),
          ultimoAcesso: new Date()
        }
        responsaveis = [fallbackData]
        localStorage.setItem('portal_responsaveis', JSON.stringify(responsaveis))
      }
      
      // Buscar responsável por CPF
      const responsavel = responsaveis.find((r: ResponsavelPortal) => 
        r.cpf.replace(/\D/g, '') === cpfNumeros
      )
      
      if (!responsavel) {
        throw new Error('CPF não encontrado. Entre em contato com AG Assessoria.')
      }
      
      // Verificar senha
      if (responsavel.senha !== senha) {
        throw new Error('Senha incorreta.')
      }
      
      // Login bem-sucedido
      const cliente: ClientePortal = {
        id: responsavel.empresaId,
        cnpj: responsavel.empresaCnpj,
        razaoSocial: responsavel.empresaNome,
        nomeFantasia: responsavel.empresaNome.replace(' LTDA', ''),
        email: responsavel.email,
        telefone: responsavel.telefone,
        responsavelCpf: responsavel.cpf
      }
      
      setCurrentResponsavel(responsavel)
      setCurrentCliente(cliente)
      setIsAuthenticated(true)
      
      // Salvar autenticação
      localStorage.setItem('portal_responsavel_auth', JSON.stringify(responsavel))
      localStorage.setItem('portal_client_auth', JSON.stringify(cliente))
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro no login.')
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar documentos
  useEffect(() => {
    if (isAuthenticated && currentCliente) {
      const savedDocumentos = localStorage.getItem('documentos_sistema')
      const savedClientes = localStorage.getItem('clientes_documentos')
      
      if (savedDocumentos && savedClientes) {
        try {
          const parsedDocumentos = JSON.parse(savedDocumentos)
          const parsedClientes = JSON.parse(savedClientes)
          
          const cnpjNormalizado = currentCliente.cnpj.replace(/\D/g, '')
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
            
            setDocumentos(documentosDoCliente)
          }
        } catch (error) {
          console.error('Erro ao carregar documentos:', error)
        }
      }
    }
  }, [isAuthenticated, currentCliente])

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
                <p className="text-sm text-gray-600 mb-2">
                  Primeiro acesso? Entre em contato:
                </p>
                <div className="flex items-center justify-center space-x-2 text-blue-600 font-medium">
                  <Phone className="w-4 h-4" />
                  <span>AG Assessoria • (16) 3987-3829</span>
                </div>
              </div>
              
              {/* Debug apenas em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">🛠️ Dados de Teste</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>CPF:</strong> 218.680.918-48</p>
                    <p><strong>Senha:</strong> 22HHgYhJ</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCpf('218.680.918-48')
                        setSenha('22HHgYhJ')
                      }}
                      className="mt-2 text-xs"
                    >
                      Preencher Teste
                    </Button>
                  </div>
                </div>
              )}
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