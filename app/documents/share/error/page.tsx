"use client"

import { XCircle, Home, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SharedDocumentErrorPage() {
  const handleContactWhatsApp = () => {
    const message = `Olá! Estou tentando acessar um documento compartilhado, mas o link não está funcionando. Podem me ajudar?`
    const whatsappUrl = `https://wa.me/5516991098966?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg shadow-md">
                <img 
                  src="https://assets.macaly-user-data.dev/vu6uteof0g2skav7mwkttz9h/mk2of4l6b3c7h8aflcpq3h6w/ra4c-kVU0_Z0Hdr1uDggb/logo-ag-2025.png" 
                  alt="AG Assessoria Logo" 
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800">AG ASSESSORIA</h1>
                <p className="text-xs text-slate-600">DOCUMENTO COMPARTILHADO</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="w-full max-w-md mx-4 border-red-200 mt-16">
        <CardContent className="p-8 text-center">
          <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
          
          <h2 className="text-2xl font-bold text-red-800 mb-4">
            Documento não encontrado
          </h2>
          
          <div className="space-y-4 text-left mb-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-2">Possíveis causas:</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• O link pode ter expirado</li>
                <li>• O documento foi removido</li>
                <li>• O link está incorreto ou incompleto</li>
                <li>• Problemas temporários no sistema</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleContactWhatsApp}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Entrar em contato via WhatsApp
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full text-slate-600 border-slate-300 hover:bg-slate-50"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              📞 <strong>(16) 99109-8966</strong> | 📧 <strong>contato@ag-assessoria.com</strong>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              AG Assessoria Contábil - Suporte técnico
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}