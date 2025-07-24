'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function TestEmailPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testEmailSystem = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Erro ao conectar com o servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setIsLoading(false)
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
                🧪 Teste do Sistema de Email
              </h1>
              <p className="text-gray-600">
                Verifique se o sistema de email está configurado corretamente na produção
              </p>
            </div>
            
            <Link href="/admin/portal-clientes">
              <Button variant="outline">
                ← Voltar ao Admin
              </Button>
            </Link>
          </div>

          <Alert className="bg-blue-50 border-blue-200 mb-6">
            <Mail className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Importante:</strong> Este teste enviará um email real para agassessoriacontrole@gmail.com se o sistema estiver configurado corretamente.
            </AlertDescription>
          </Alert>
        </div>

        {/* Teste */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Teste de Envio de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Button
                onClick={testEmailSystem}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando Sistema...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Testar Envio de Email
                  </>
                )}
              </Button>
            </div>

            {/* Resultado */}
            {result && (
              <div className="space-y-4">
                <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                    <strong>{result.success ? "✅ Sucesso:" : "❌ Erro:"}</strong> {result.message}
                  </AlertDescription>
                </Alert>

                {/* Detalhes do Ambiente */}
                {result.environment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detalhes do Ambiente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-gray-600">NODE_ENV:</span>
                          <div>
                            <Badge variant={result.environment.NODE_ENV === 'production' ? 'default' : 'secondary'}>
                              {result.environment.NODE_ENV || 'undefined'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">VERCEL_ENV:</span>
                          <div>
                            <Badge variant={result.environment.VERCEL_ENV === 'production' ? 'default' : 'secondary'}>
                              {result.environment.VERCEL_ENV || 'undefined'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">VERCEL:</span>
                          <div>
                            <Badge variant={result.environment.VERCEL === '1' ? 'default' : 'secondary'}>
                              {result.environment.VERCEL || 'undefined'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Produção:</span>
                          <div>
                            <Badge variant={result.environment.isProductionEnvironment ? 'default' : 'destructive'}>
                              {result.environment.isProductionEnvironment ? 'SIM' : 'NÃO'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Sistema Completo:</span>
                          <div>
                            <Badge variant={result.environment.isFullyProduction ? 'default' : 'destructive'}>
                              {result.environment.isFullyProduction ? 'ATIVO' : 'INATIVO'}
                            </Badge>
                          </div>
                        </div>
                        {result.environment.hasResendKey !== undefined && (
                          <div>
                            <span className="text-sm font-medium text-gray-600">RESEND_API_KEY:</span>
                            <div>
                              <Badge variant={result.environment.hasResendKey ? 'default' : 'destructive'}>
                                {result.environment.hasResendKey ? 'CONFIGURADA' : 'AUSENTE'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Dados do Email (se enviado com sucesso) */}
                {result.success && result.emailData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-700">Email Enviado com Sucesso!</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-800">
                          📧 Email enviado para: <strong>agassessoriacontrole@gmail.com</strong>
                        </p>
                        <p className="text-sm text-green-800 mt-1">
                          ID: <code className="bg-green-100 px-2 py-1 rounded text-xs">{result.emailData.id}</code>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Erro detalhado */}
                {!result.success && result.error && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-700">Detalhes do Erro</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-800 font-mono">
                          {result.error}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Instruções */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Instruções para Configurar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <p><strong>1.</strong> Acesse o painel da Vercel</p>
                  <p><strong>2.</strong> Vá em Settings → Environment Variables</p>
                  <p><strong>3.</strong> Configure:</p>
                  <ul className="ml-4 space-y-1">
                    <li>• <code>NODE_ENV</code> = <code>production</code></li>
                    <li>• <code>RESEND_API_KEY</code> = <code>re_eD...</code> (sua chave)</li>
                  </ul>
                  <p><strong>4.</strong> Faça um redeploy do projeto</p>
                  <p><strong>5.</strong> Teste novamente aqui</p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}