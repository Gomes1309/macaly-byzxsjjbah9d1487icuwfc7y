'use client'

import { useState } from 'react'
import { ArrowLeft, User, Users, Key, Mail, CheckCircle, AlertCircle, Copy } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { createResponsavelAccount, createUsuarioAccount, generateTemporaryPassword } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'

export default function DemoAccountsPage() {
  const [isCreating, setIsCreating] = useState(false)
  const [results, setResults] = useState<any[]>([])
  
  const [clienteData, setClienteData] = useState({
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    cpfCnpj: '123.456.789-00',
    telefone: '(11) 99999-9999',
    clienteId: 'demo-cliente-id',
    cargo: 'Proprietário'
  })
  
  const [usuarioData, setUsuarioData] = useState({
    nome: 'Maria Santos',
    email: 'maria@agassessoria.com',
    cargo: 'Contador',
    departamento: 'Contabilidade'
  })

  const handleCreateResponsavelAccount = async () => {
    try {
      setIsCreating(true)
      const result = await createResponsavelAccount(clienteData)
      setResults(prev => [...prev, { type: 'responsavel', data: result }])
      toast.success('Conta de responsável criada com sucesso!')
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateUsuarioAccount = async () => {
    try {
      setIsCreating(true)
      const result = await createUsuarioAccount(usuarioData)
      setResults(prev => [...prev, { type: 'usuario', data: result }])
      toast.success('Conta de usuário criada com sucesso!')
    } catch (error) {
      console.error('Erro:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar conta')
    } finally {
      setIsCreating(false)
    }
  }

  const handleGeneratePassword = () => {
    const password = generateTemporaryPassword()
    toast.success(`Senha gerada: ${password}`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Demo - Criação Automática de Contas
              </h1>
              <p className="text-gray-600">
                Demonstração das funcionalidades de criação automática de contas no Supabase
              </p>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Contas de Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Criação automática de contas de responsável quando um cliente é cadastrado
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Hash seguro com bcrypt</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Validação de CPF/CNPJ</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Vínculo automático</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Contas de Usuário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Criação automática de contas de usuário interno com permissões por cargo
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Permissões por cargo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Senhas temporárias</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Validação de duplicação</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-600" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Recursos de segurança implementados no sistema
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Bcrypt (12 rounds)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Senhas complexas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Validação de dados</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cliente" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cliente">Conta de Cliente</TabsTrigger>
            <TabsTrigger value="usuario">Conta de Usuário</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="cliente" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Criar Conta de Responsável</CardTitle>
                <CardDescription>
                  Simula a criação automática de uma conta de responsável para um cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={clienteData.nome}
                      onChange={(e) => setClienteData(prev => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={clienteData.email}
                      onChange={(e) => setClienteData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                    <Input
                      id="cpfCnpj"
                      value={clienteData.cpfCnpj}
                      onChange={(e) => setClienteData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={clienteData.telefone}
                      onChange={(e) => setClienteData(prev => ({ ...prev, telefone: e.target.value }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateResponsavelAccount}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? 'Criando...' : 'Criar Conta de Responsável'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuario" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Criar Conta de Usuário</CardTitle>
                <CardDescription>
                  Simula a criação automática de uma conta de usuário interno
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomeUsuario">Nome</Label>
                    <Input
                      id="nomeUsuario"
                      value={usuarioData.nome}
                      onChange={(e) => setUsuarioData(prev => ({ ...prev, nome: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailUsuario">Email</Label>
                    <Input
                      id="emailUsuario"
                      value={usuarioData.email}
                      onChange={(e) => setUsuarioData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={usuarioData.cargo}
                      onChange={(e) => setUsuarioData(prev => ({ ...prev, cargo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      value={usuarioData.departamento}
                      onChange={(e) => setUsuarioData(prev => ({ ...prev, departamento: e.target.value }))}
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleCreateUsuarioAccount}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? 'Criando...' : 'Criar Conta de Usuário'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Testes</CardTitle>
                <CardDescription>
                  Contas criadas durante os testes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma conta criada ainda. Use as abas acima para testar.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {results.map((result, index) => (
                      <Card key={index} className="border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="outline" className="bg-green-50">
                              {result.type === 'responsavel' ? 'Responsável' : 'Usuário'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date().toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {result.type === 'responsavel' && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Nome:</span>
                                  <span className="text-sm">{result.data.responsavel.nome}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Email:</span>
                                  <span className="text-sm">{result.data.responsavel.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">CPF:</span>
                                  <span className="text-sm">{result.data.responsavel.cpf}</span>
                                </div>
                              </>
                            )}
                            
                            {result.type === 'usuario' && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Nome:</span>
                                  <span className="text-sm">{result.data.usuario.nome}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Email:</span>
                                  <span className="text-sm">{result.data.usuario.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Cargo:</span>
                                  <span className="text-sm">{result.data.usuario.cargo}</span>
                                </div>
                              </>
                            )}
                            
                            <div className="flex items-center justify-between bg-yellow-50 p-2 rounded">
                              <span className="text-sm font-medium">Senha Temporária:</span>
                              <div className="flex items-center gap-2">
                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                  {result.data.senhaTemporaria}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(result.data.senhaTemporaria)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
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
        </Tabs>

        {/* Utility Functions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Funções Utilitárias</CardTitle>
            <CardDescription>
              Teste das funções auxiliares do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGeneratePassword} variant="outline">
              <Key className="w-4 h-4 mr-2" />
              Gerar Senha Temporária
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert className="mt-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>Importante:</strong> Esta é uma página de demonstração. Em produção, 
            as contas são criadas automaticamente quando você cadastra clientes ou usuários 
            através dos formulários principais do sistema.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}