'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Database, User, Settings } from 'lucide-react'

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  console.log('TestSupabasePage: Componente iniciado')

  const testConnection = async () => {
    console.log('TestSupabasePage: Iniciando teste de conexão...')
    setConnectionStatus('loading')
    setError(null)

    try {
      // Teste 1: Verificar se o Supabase está configurado
      console.log('TestSupabasePage: Verificando configuração do Supabase...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('TestSupabasePage: Erro ao obter sessão:', sessionError)
        throw sessionError
      }

      console.log('TestSupabasePage: Sessão obtida com sucesso:', session)

      // Teste 2: Verificar se as tabelas existem
      console.log('TestSupabasePage: Verificando se as tabelas existem...')
      const { data: tablesData, error: tablesError } = await supabase
        .from('clientes')
        .select('count', { count: 'exact', head: true })

      if (tablesError) {
        console.error('TestSupabasePage: Erro ao verificar tabelas:', tablesError)
        if (tablesError.message.includes('relation "public.clientes" does not exist')) {
          setTableExists(false)
          setError('Tabelas não encontradas. Execute o schema SQL no Supabase.')
        } else {
          throw tablesError
        }
      } else {
        console.log('TestSupabasePage: Tabelas encontradas:', tablesData)
        setTableExists(true)
      }

      setConnectionStatus('success')
    } catch (err: any) {
      console.error('TestSupabasePage: Erro no teste de conexão:', err)
      setError(err.message || 'Erro desconhecido')
      setConnectionStatus('error')
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            🧪 Teste de Conexão Supabase
          </h1>
          <p className="text-slate-600">
            Verificando se a configuração do banco de dados está funcionando
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Status da Conexão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Status da Conexão
              </CardTitle>
              <CardDescription>
                Verifica se o Supabase está respondendo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {connectionStatus === 'loading' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-blue-600">Testando...</span>
                  </>
                )}
                {connectionStatus === 'success' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Conectado
                    </Badge>
                  </>
                )}
                {connectionStatus === 'error' && (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <Badge variant="destructive">Erro</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status das Tabelas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Status das Tabelas
              </CardTitle>
              <CardDescription>
                Verifica se o schema foi executado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {tableExists === null && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-blue-600">Verificando...</span>
                  </>
                )}
                {tableExists === true && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Tabelas OK
                    </Badge>
                  </>
                )}
                {tableExists === false && (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <Badge variant="destructive">Tabelas não encontradas</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Erro */}
        {error && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-red-600">Erro Detectado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 bg-red-50 p-3 rounded-lg font-mono text-sm">
                {error}
              </p>
              
              {tableExists === false && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    ⚠️ Ação Necessária:
                  </h4>
                  <p className="text-yellow-700 mb-3">
                    As tabelas não foram encontradas. Você precisa executar o schema SQL no Supabase.
                  </p>
                  <ol className="list-decimal list-inside text-yellow-700 space-y-1">
                    <li>Acesse o Supabase Dashboard</li>
                    <li>Vá para "SQL Editor"</li>
                    <li>Execute o arquivo <code className="bg-yellow-200 px-1 rounded">supabase_schema.sql</code></li>
                    <li>Clique em "Testar Novamente"</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Configurações Atuais */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configurações Atuais</CardTitle>
            <CardDescription>
              Variáveis de ambiente detectadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">SUPABASE_URL:</span>
                <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ Não configurado'}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">SUPABASE_ANON_KEY:</span>
                <code className="bg-slate-100 px-2 py-1 rounded text-sm">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Não configurado'}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Teste */}
        <div className="text-center">
          <Button 
            onClick={testConnection} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={connectionStatus === 'loading'}
          >
            {connectionStatus === 'loading' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Testando...
              </>
            ) : (
              'Testar Novamente'
            )}
          </Button>
        </div>

        {/* Instruções de Sucesso */}
        {connectionStatus === 'success' && tableExists === true && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  🎉 Configuração Bem-Sucedida!
                </h3>
                <p className="text-green-700 mb-4">
                  O Supabase está configurado corretamente e pronto para uso.
                </p>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Ir para o Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}