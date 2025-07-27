'use client'

import MultipleUploadManager from '@/components/MultipleUploadManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Upload, TestTube } from 'lucide-react'

export default function TestUploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Início
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <TestTube className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                Página de Teste
              </span>
            </div>
          </div>
          
          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Upload className="w-6 h-6" />
                Teste de Upload de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-yellow-600 mt-0.5">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">Página de Teste</h3>
                    <p className="text-sm text-yellow-700">
                      Esta é uma página temporária para testar o sistema de upload sem autenticação. 
                      Use para verificar se os documentos são salvos corretamente.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-600">📤</span>
                    <span className="text-blue-800">Upload real para Supabase Storage</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <span className="text-green-600">🏢</span>
                    <span className="text-green-800">Detecção automática de empresas</span>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-600">🔄</span>
                    <span className="text-purple-800">Sincronização com portal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sistema de Upload */}
        <MultipleUploadManager />
        
        {/* Botões de Teste */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">🔍 Verificar Resultados</h3>
              <p className="text-sm text-gray-600 mb-3">
                Após fazer upload, verifique se os documentos aparecem no portal do cliente
              </p>
              <Link href="/portal-cliente">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Abrir Portal do Cliente
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">🗄️ Ver Todos os Documentos</h3>
              <p className="text-sm text-gray-600 mb-3">
                Acesse a API de sincronização para ver todos os documentos salvos
              </p>
              <Link href="/api/sync-documentos-portal" target="_blank">
                <Button variant="outline" className="w-full">
                  Ver API de Documentos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Instruções */}
        <Card className="mt-8 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">📋 Como Testar</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Selecione arquivos:</strong> Clique em "Selecionar Arquivos" e escolha um ou mais documentos</li>
              <li><strong>Detecção automática:</strong> O sistema tentará detectar a empresa pelo nome do arquivo ou CNPJ</li>
              <li><strong>Seleção manual:</strong> Se não detectar, clique em "Buscar Empresa" para selecionar manualmente</li>
              <li><strong>Upload:</strong> Clique em "Enviar Todos" para fazer o upload real para o Supabase</li>
              <li><strong>Verificação:</strong> Vá ao "Portal do Cliente" para verificar se os documentos aparecem</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Dica:</strong> Para testar a detecção automática, nomeie os arquivos com o CNPJ da empresa 
                (ex: "documento_27970191000170.pdf" ou "LEG_COMERCIO_contrato.pdf")
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}