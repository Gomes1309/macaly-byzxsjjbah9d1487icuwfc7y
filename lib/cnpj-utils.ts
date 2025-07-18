// Utilities for CNPJ validation and data fetching
export interface CNPJData {
  cnpj: string
  nome: string
  fantasia: string
  porte: string
  abertura: string
  natureza_juridica: string
  uf: string
  municipio: string
  bairro: string
  logradouro: string
  numero: string
  cep: string
  email: string
  telefone: string
  efr: string
  situacao: string
  data_situacao: string
  motivo_situacao: string
  situacao_especial: string
  data_situacao_especial: string
  atividade_principal: Array<{
    code: string
    text: string
  }>
  atividades_secundarias: Array<{
    code: string
    text: string
  }>
  qsa: Array<{
    nome: string
    qual: string
    pais_origem: string
    nome_rep_legal: string
    qual_rep_legal: string
  }>
  capital_social: string
  extra?: {
    has_cert_digital?: boolean
    simples_nacional?: boolean
    mei?: boolean
  }
}

/**
 * Formats CNPJ string with mask
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  
  if (cleaned.length === 11) {
    // CPF format: 000.000.000-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  } else if (cleaned.length === 14) {
    // CNPJ format: 00.000.000/0000-00
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  
  return cnpj
}

/**
 * Removes CNPJ formatting
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

/**
 * Validates CNPJ format
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cleanCNPJ(cnpj)
  
  if (cleaned.length !== 14) return false
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleaned)) return false
  
  // Calculate check digits
  let sum = 0
  let weight = 2
  
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleaned[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  
  const remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  
  if (parseInt(cleaned[12]) !== digit1) return false
  
  sum = 0
  weight = 2
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleaned[i]) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  
  const remainder2 = sum % 11
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2
  
  return parseInt(cleaned[13]) === digit2
}

/**
 * Validates CPF format
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cleanCNPJ(cpf) // Same cleaning function
  
  if (cleaned.length !== 11) return false
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cleaned)) return false
  
  // Calculate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i)
  }
  
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  
  if (parseInt(cleaned[9]) !== digit1) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i)
  }
  
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  
  return parseInt(cleaned[10]) === digit2
}

/**
 * Fetches CNPJ data from ReceitaWS API
 */
export async function fetchCNPJData(cnpj: string): Promise<CNPJData | null> {
  try {
    const cleaned = cleanCNPJ(cnpj)
    
    if (!isValidCNPJ(cleaned)) {
      throw new Error('CNPJ inválido')
    }
    
    console.log(`Fetching CNPJ data for: ${cleaned}`)
    
    // Use a proxy to avoid CORS issues
    const response = await fetch(`/api/cnpj/${cleaned}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      // Fallback to direct API call if proxy fails
      console.log('Proxy failed, trying direct API call...')
      const directResponse = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleaned}`)
      
      if (!directResponse.ok) {
        throw new Error(`HTTP error! status: ${directResponse.status}`)
      }
      
      const data = await directResponse.json()
      
      if (data.status === 'ERROR') {
        throw new Error(data.message || 'Erro ao buscar dados do CNPJ')
      }
      
      console.log('CNPJ data fetched successfully (direct):', data)
      return data
    }
    
    const data = await response.json()
    
    if (data.status === 'ERROR') {
      throw new Error(data.message || 'Erro ao buscar dados do CNPJ')
    }
    
    console.log('CNPJ data fetched successfully:', data)
    
    return data
  } catch (error) {
    console.error('Error fetching CNPJ data:', error)
    
    // Try direct API call as last resort
    try {
      console.log('Trying direct API call as fallback...')
      const cleaned = cleanCNPJ(cnpj)
      const directResponse = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleaned}`)
      
      if (directResponse.ok) {
        const data = await directResponse.json()
        if (data.status !== 'ERROR') {
          console.log('Direct API call successful:', data)
          return data
        }
      }
    } catch (directError) {
      console.error('Direct API call also failed:', directError)
    }
    
    return null
  }
}

/**
 * Determines company type based on CNPJ data
 */
export function getCompanyType(data: CNPJData): string {
  if (data.porte === 'MICRO EMPRESA') return 'MEI'
  if (data.porte === 'EMPRESA DE PEQUENO PORTE') return 'Simples Nacional'
  if (data.capital_social && parseFloat(data.capital_social.replace(/[^\d]/g, '')) > 78000000) {
    return 'Lucro Real'
  }
  return 'Lucro Presumido'
}

/**
 * Formats company data for form filling
 */
export function formatCompanyDataForForm(data: CNPJData) {
  return {
    cnpj: formatCNPJ(data.cnpj),
    razaoSocial: data.nome || '',
    nomeFantasia: data.fantasia || data.nome || '',
    email: data.email || '',
    telefone: data.telefone || '',
    cep: data.cep || '',
    logradouro: data.logradouro || '',
    numero: data.numero || '',
    bairro: data.bairro || '',
    cidade: data.municipio || '',
    uf: data.uf || '',
    atividadePrincipal: data.atividade_principal?.[0]?.text || '',
    codigoAtividade: data.atividade_principal?.[0]?.code || '',
    situacao: data.situacao || '',
    abertura: data.abertura || '',
    porte: data.porte || '',
    naturezaJuridica: data.natureza_juridica || '',
    regimeTributario: getCompanyType(data),
    capitalSocial: data.capital_social || ''
  }
}

/**
 * Hook for CNPJ search functionality
 */
export function useCNPJSearch() {
  const searchCNPJ = async (cnpj: string) => {
    if (!cnpj) return null
    
    const cleaned = cleanCNPJ(cnpj)
    
    if (cleaned.length !== 14) {
      throw new Error('CNPJ deve ter 14 dígitos')
    }
    
    if (!isValidCNPJ(cleaned)) {
      throw new Error('CNPJ inválido')
    }
    
    const data = await fetchCNPJData(cleaned)
    
    if (!data) {
      throw new Error('Não foi possível buscar os dados do CNPJ')
    }
    
    return formatCompanyDataForForm(data)
  }
  
  return { searchCNPJ }
}