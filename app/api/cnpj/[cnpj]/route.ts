import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { cnpj: string } }
) {
  try {
    const { cnpj } = params
    
    if (!cnpj) {
      return NextResponse.json({ error: 'CNPJ é obrigatório' }, { status: 400 })
    }

    console.log(`API: Fetching CNPJ data for: ${cnpj}`)

    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.receitaws.com.br',
        'Referer': 'https://www.receitaws.com.br/',
      },
    })

    if (!response.ok) {
      console.error(`API: Error response from ReceitaWS: ${response.status}`)
      return NextResponse.json({ error: `Erro na API: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    
    console.log('API: CNPJ data fetched successfully:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API: Error fetching CNPJ data:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}