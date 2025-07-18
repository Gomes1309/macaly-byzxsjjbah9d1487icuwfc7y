"use client"

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2, Building, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { formatCNPJ, cleanCNPJ, isValidCNPJ } from '@/lib/cnpj-utils'
import { useCNPJAutoComplete, CNPJFormData } from '@/hooks/useCNPJAutoComplete'

interface CNPJSearchProps {
  onDataFound?: (data: CNPJFormData) => void
  onClear?: () => void
  initialCNPJ?: string
  className?: string
  autoSearch?: boolean
  showDetails?: boolean
}

export function CNPJSearch({ 
  onDataFound, 
  onClear, 
  initialCNPJ = '', 
  className = '',
  autoSearch = true,
  showDetails = true
}: CNPJSearchProps) {
  const [cnpjInput, setCnpjInput] = useState(initialCNPJ)
  const { searchCNPJ, isLoading, cnpjData, clearData } = useCNPJAutoComplete()

  useEffect(() => {
    if (initialCNPJ) {
      setCnpjInput(formatCNPJ(initialCNPJ))
    }
  }, [initialCNPJ])

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Remove non-numeric characters and apply formatting
    const cleaned = cleanCNPJ(value)
    const formatted = formatCNPJ(cleaned)
    
    setCnpjInput(formatted)
    
    // Auto-search when CNPJ is complete
    if (autoSearch && cleaned.length === 14 && isValidCNPJ(cleaned)) {
      handleSearch(cleaned)
    }
  }

  const handleSearch = async (cnpj?: string) => {
    const searchCNPJ_value = cnpj || cleanCNPJ(cnpjInput)
    
    if (!searchCNPJ_value) return
    
    const data = await searchCNPJ(searchCNPJ_value)
    
    if (data && onDataFound) {
      onDataFound(data)
    }
  }

  const handleClear = () => {
    setCnpjInput('')
    clearData()
    if (onClear) {
      onClear()
    }
  }

  const getSituationColor = (situacao: string) => {
    switch (situacao?.toUpperCase()) {
      case 'ATIVA':
        return 'bg-green-100 text-green-800'
      case 'BAIXADA':
        return 'bg-red-100 text-red-800'
      case 'SUSPENSA':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSituationIcon = (situacao: string) => {
    switch (situacao?.toUpperCase()) {
      case 'ATIVA':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'BAIXADA':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'SUSPENSA':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return <Building className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="cnpj-search" className="text-slate-700 font-medium">
          CNPJ da Empresa
        </Label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              id="cnpj-search"
              type="text"
              placeholder="00.000.000/0000-00"
              value={cnpjInput}
              onChange={handleCNPJChange}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              maxLength={18}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSearch()}
            disabled={isLoading || !cnpjInput}
            className="text-blue-600 border-blue-300 hover:bg-blue-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
          {cnpjData && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showDetails && cnpjData && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Dados da Empresa</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Informações obtidas automaticamente da Receita Federal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-800">Razão Social</p>
                <p className="text-sm text-green-700">{cnpjData.razaoSocial}</p>
              </div>
              {cnpjData.nomeFantasia && cnpjData.nomeFantasia !== cnpjData.razaoSocial && (
                <div>
                  <p className="text-sm font-medium text-green-800">Nome Fantasia</p>
                  <p className="text-sm text-green-700">{cnpjData.nomeFantasia}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-green-800">CNPJ</p>
                <p className="text-sm text-green-700">{cnpjData.cnpj}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Situação</p>
                <div className="flex items-center space-x-2">
                  {getSituationIcon(cnpjData.situacao)}
                  <Badge className={getSituationColor(cnpjData.situacao)}>
                    {cnpjData.situacao}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Porte</p>
                <p className="text-sm text-green-700">{cnpjData.porte}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Regime Tributário</p>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {cnpjData.regimeTributario}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-green-800">Atividade Principal</p>
                <p className="text-sm text-green-700">{cnpjData.atividadePrincipal}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-green-800">Endereço</p>
                <p className="text-sm text-green-700">
                  {cnpjData.logradouro}, {cnpjData.numero} - {cnpjData.bairro}
                  <br />
                  {cnpjData.cidade} - {cnpjData.uf} - CEP: {cnpjData.cep}
                </p>
              </div>
              {cnpjData.email && (
                <div>
                  <p className="text-sm font-medium text-green-800">Email</p>
                  <p className="text-sm text-green-700">{cnpjData.email}</p>
                </div>
              )}
              {cnpjData.telefone && (
                <div>
                  <p className="text-sm font-medium text-green-800">Telefone</p>
                  <p className="text-sm text-green-700">{cnpjData.telefone}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 pt-2 border-t border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">
                Dados preenchidos automaticamente
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}