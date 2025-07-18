"use client"

import { useState, useCallback } from 'react'
import { cleanCNPJ, isValidCNPJ, fetchCNPJData, formatCompanyDataForForm } from '@/lib/cnpj-utils'
import { useToast } from '@/hooks/use-toast'

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
  const { toast } = useToast()

  const searchCNPJ = useCallback(async (cnpj: string): Promise<CNPJFormData | null> => {
    if (!cnpj) return null

    const cleaned = cleanCNPJ(cnpj)
    
    if (cleaned.length < 14) {
      return null // Don't search until we have full CNPJ
    }

    if (!isValidCNPJ(cleaned)) {
      toast({
        title: "CNPJ Inválido",
        description: "O CNPJ informado não é válido.",
        variant: "destructive"
      })
      return null
    }

    setIsLoading(true)
    
    try {
      console.log(`Searching CNPJ: ${cleaned}`)
      
      const data = await fetchCNPJData(cleaned)
      
      if (!data) {
        toast({
          title: "Dados não encontrados",
          description: "Não foi possível buscar os dados do CNPJ. Verifique se o número está correto.",
          variant: "destructive"
        })
        return null
      }

      if (data.situacao === 'BAIXADA') {
        toast({
          title: "Empresa Baixada",
          description: "Esta empresa está com situação 'BAIXADA' na Receita Federal.",
          variant: "destructive"
        })
      }

      const formattedData = formatCompanyDataForForm(data)
      setCnpjData(formattedData)
      
      toast({
        title: "Dados encontrados!",
        description: `${formattedData.razaoSocial} - Dados preenchidos automaticamente.`,
        variant: "default"
      })
      
      console.log('CNPJ search completed successfully:', formattedData)
      
      return formattedData
    } catch (error) {
      console.error('Error searching CNPJ:', error)
      
      toast({
        title: "Erro na busca",
        description: error instanceof Error ? error.message : "Erro ao buscar dados do CNPJ",
        variant: "destructive"
      })
      
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

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