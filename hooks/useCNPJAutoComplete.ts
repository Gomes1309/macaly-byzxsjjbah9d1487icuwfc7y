"use client"

import { useState, useCallback } from 'react'
import { cleanCNPJ, isValidCNPJ, fetchCNPJData, formatCompanyDataForForm } from '@/lib/cnpj-utils'
import { toast } from 'sonner'

export interface CNPJFormData {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  email: string
  telefone: string
  cep: string
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  atividadePrincipal: string
  codigoAtividade: string
  situacao: string
  abertura: string
  porte: string
  naturezaJuridica: string
  regimeTributario: string
  capitalSocial: string
}

export function useCNPJAutoComplete() {
  const [isLoading, setIsLoading] = useState(false)
  const [cnpjData, setCnpjData] = useState<CNPJFormData | null>(null)

  const searchCNPJ = useCallback(async (cnpj: string) => {
    const cleaned = cleanCNPJ(cnpj)
    
    console.log('useCNPJAutoComplete: Starting search for:', cleaned)
    
    if (cleaned.length !== 14) {
      console.log('useCNPJAutoComplete: Invalid CNPJ length:', cleaned.length)
      toast.error("CNPJ deve ter 14 dígitos")
      return null
    }

    if (!isValidCNPJ(cleaned)) {
      console.log('useCNPJAutoComplete: Invalid CNPJ format')
      toast.error("CNPJ inválido - O CNPJ informado não é válido.")
      return null
    }

    setIsLoading(true)
    
    try {
      console.log(`useCNPJAutoComplete: Searching CNPJ: ${cleaned}`)
      
      const data = await fetchCNPJData(cleaned)
      console.log('useCNPJAutoComplete: Raw data from API:', data)
      
      if (!data) {
        console.log('useCNPJAutoComplete: No data returned from API')
        toast.error("Dados não encontrados - Não foi possível buscar os dados do CNPJ. Verifique se o número está correto.")
        return null
      }

      if (data.situacao === 'BAIXADA') {
        console.log('useCNPJAutoComplete: Company is BAIXADA')
        toast.error("Empresa Baixada - Esta empresa está com situação 'BAIXADA' na Receita Federal.")
      }

      const formattedData = formatCompanyDataForForm(data)
      console.log('useCNPJAutoComplete: Formatted data:', formattedData)
      
      setCnpjData(formattedData)
      
      toast.success(`Dados encontrados! ${formattedData.razaoSocial} - Dados preenchidos automaticamente.`)
      
      console.log('useCNPJAutoComplete: Search completed successfully')
      
      return formattedData
    } catch (error) {
      console.error('useCNPJAutoComplete: Error during search:', error)
      
      toast.error(error instanceof Error ? error.message : "Erro ao buscar dados do CNPJ")
      
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearData = useCallback(() => {
    setCnpjData(null)
  }, [])

  return {
    searchCNPJ,
    isLoading,
    cnpjData,
    clearData
  }
}