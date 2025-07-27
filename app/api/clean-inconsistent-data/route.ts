import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  console.log('🧹 Iniciando limpeza de dados inconsistentes...')
  
  try {
    const results = {
      alvarasRemovidos: 0,
      empresasRemovidas: 0,
      clientesRemovidos: 0,
      detalhes: [] as string[]
    }

    // 1. Verificar e remover alvarás da "Tech Solutions"
    console.log('🔍 Verificando alvarás de "Tech Solutions"...')
    
    const { data: alvarasTechSolutions, error: alvarasError } = await supabase
      .from('alvaras')
      .select('*')
      .or('empresa.ilike.%tech solutions%,empresa.ilike.%tech%')

    if (alvarasError) {
      console.error('Erro ao buscar alvarás Tech Solutions:', alvarasError)
    } else if (alvarasTechSolutions && alvarasTechSolutions.length > 0) {
      console.log(`📋 Encontrados ${alvarasTechSolutions.length} alvarás de Tech Solutions`)
      
      for (const alvara of alvarasTechSolutions) {
        const { error: deleteError } = await supabase
          .from('alvaras')
          .delete()
          .eq('id', alvara.id)
        
        if (!deleteError) {
          results.alvarasRemovidos++
          results.detalhes.push(`Alvará removido: ${alvara.empresa} - Protocolo: ${alvara.numero_protocolo}`)
          console.log(`✅ Alvará removido: ${alvara.empresa} - ${alvara.numero_protocolo}`)
        }
      }
    }

    // 2. Verificar e remover empresas "Tech Solutions" 
    console.log('🔍 Verificando empresas "Tech Solutions"...')
    
    const { data: empresasTech, error: empresasError } = await supabase
      .from('empresas')
      .select('*')
      .or('razao_social.ilike.%tech solutions%,nome_fantasia.ilike.%tech solutions%')

    if (empresasError) {
      console.error('Erro ao buscar empresas Tech Solutions:', empresasError)
    } else if (empresasTech && empresasTech.length > 0) {
      console.log(`🏢 Encontradas ${empresasTech.length} empresas Tech Solutions`)
      
      for (const empresa of empresasTech) {
        const { error: deleteError } = await supabase
          .from('empresas')
          .delete()
          .eq('id', empresa.id)
        
        if (!deleteError) {
          results.empresasRemovidas++
          results.detalhes.push(`Empresa removida: ${empresa.razao_social || empresa.nome_fantasia}`)
          console.log(`✅ Empresa removida: ${empresa.razao_social || empresa.nome_fantasia}`)
        }
      }
    }

    // 3. Verificar e remover clientes "Tech Solutions"
    console.log('🔍 Verificando clientes "Tech Solutions"...')
    
    const { data: clientesTech, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .ilike('nome', '%tech solutions%')

    if (clientesError) {
      console.error('Erro ao buscar clientes Tech Solutions:', clientesError)
    } else if (clientesTech && clientesTech.length > 0) {
      console.log(`👤 Encontrados ${clientesTech.length} clientes Tech Solutions`)
      
      for (const cliente of clientesTech) {
        const { error: deleteError } = await supabase
          .from('clientes')
          .delete()
          .eq('id', cliente.id)
        
        if (!deleteError) {
          results.clientesRemovidos++
          results.detalhes.push(`Cliente removido: ${cliente.nome}`)
          console.log(`✅ Cliente removido: ${cliente.nome}`)
        }
      }
    }

    // 4. Verificar alvarás órfãos (sem empresa correspondente)
    console.log('🔍 Verificando alvarás órfãos...')
    
    const { data: todosAlvaras, error: alvarasOrfaosError } = await supabase
      .from('alvaras')
      .select('*')

    if (!alvarasOrfaosError && todosAlvaras) {
      for (const alvara of todosAlvaras) {
        // Se tem cliente_id, verificar se cliente existe
        if (alvara.cliente_id) {
          const { data: clienteExiste } = await supabase
            .from('clientes')
            .select('id')
            .eq('id', alvara.cliente_id)
            .single()
          
          if (!clienteExiste) {
            // Cliente não existe, remover alvará órfão
            const { error: deleteError } = await supabase
              .from('alvaras')
              .delete()
              .eq('id', alvara.id)
            
            if (!deleteError) {
              results.alvarasRemovidos++
              results.detalhes.push(`Alvará órfão removido: ${alvara.empresa} (cliente inexistente)`)
              console.log(`✅ Alvará órfão removido: ${alvara.empresa}`)
            }
          }
        }
      }
    }

    // 5. Remover dados de teste comuns
    console.log('🔍 Removendo outros dados de teste conhecidos...')
    
    const testCompanies = [
      'Empresa Teste',
      'Test Company',
      'Exemplo Ltda',
      'Sample Corp',
      'Demo Company'
    ]

    for (const testName of testCompanies) {
      // Remover alvarás
      const { data: testAlvaras } = await supabase
        .from('alvaras')
        .select('*')
        .ilike('empresa', `%${testName}%`)
      
      if (testAlvaras && testAlvaras.length > 0) {
        for (const alvara of testAlvaras) {
          await supabase.from('alvaras').delete().eq('id', alvara.id)
          results.alvarasRemovidos++
          results.detalhes.push(`Alvará de teste removido: ${alvara.empresa}`)
        }
      }

      // Remover empresas
      const { data: testEmpresas } = await supabase
        .from('empresas')
        .select('*')
        .or(`razao_social.ilike.%${testName}%,nome_fantasia.ilike.%${testName}%`)
      
      if (testEmpresas && testEmpresas.length > 0) {
        for (const empresa of testEmpresas) {
          await supabase.from('empresas').delete().eq('id', empresa.id)
          results.empresasRemovidas++
        }
      }

      // Remover clientes
      const { data: testClientes } = await supabase
        .from('clientes')
        .select('*')
        .ilike('nome', `%${testName}%`)
      
      if (testClientes && testClientes.length > 0) {
        for (const cliente of testClientes) {
          await supabase.from('clientes').delete().eq('id', cliente.id)
          results.clientesRemovidos++
        }
      }
    }

    console.log('✅ Limpeza concluída:', results)

    return NextResponse.json({ 
      success: true, 
      message: 'Limpeza de dados inconsistentes concluída',
      results
    })

  } catch (error) {
    console.error('❌ Erro na limpeza de dados:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}

export async function GET() {
  console.log('🔍 Verificando dados inconsistentes...')
  
  try {
    const report = {
      alvarasTechSolutions: 0,
      empresasTechSolutions: 0,
      clientesTechSolutions: 0,
      alvarasOrfaos: 0,
      detalhes: [] as string[]
    }

    // Verificar alvarás Tech Solutions
    const { data: alvarasTech } = await supabase
      .from('alvaras')
      .select('*')
      .or('empresa.ilike.%tech solutions%,empresa.ilike.%tech%')

    if (alvarasTech && alvarasTech.length > 0) {
      report.alvarasTechSolutions = alvarasTech.length
      alvarasTech.forEach(alvara => {
        report.detalhes.push(`Alvará encontrado: ${alvara.empresa} - Protocolo: ${alvara.numero_protocolo} - Vencimento: ${alvara.data_vencimento}`)
      })
    }

    // Verificar empresas Tech Solutions
    const { data: empresasTech } = await supabase
      .from('empresas')
      .select('*')
      .or('razao_social.ilike.%tech solutions%,nome_fantasia.ilike.%tech solutions%')

    if (empresasTech && empresasTech.length > 0) {
      report.empresasTechSolutions = empresasTech.length
      empresasTech.forEach(empresa => {
        report.detalhes.push(`Empresa encontrada: ${empresa.razao_social || empresa.nome_fantasia}`)
      })
    }

    // Verificar clientes Tech Solutions
    const { data: clientesTech } = await supabase
      .from('clientes')
      .select('*')
      .ilike('nome', '%tech solutions%')

    if (clientesTech && clientesTech.length > 0) {
      report.clientesTechSolutions = clientesTech.length
      clientesTech.forEach(cliente => {
        report.detalhes.push(`Cliente encontrado: ${cliente.nome}`)
      })
    }

    // Verificar alvarás órfãos
    const { data: todosAlvaras } = await supabase
      .from('alvaras')
      .select('*')

    if (todosAlvaras) {
      for (const alvara of todosAlvaras) {
        if (alvara.cliente_id) {
          const { data: clienteExiste } = await supabase
            .from('clientes')
            .select('id')
            .eq('id', alvara.cliente_id)
            .single()
          
          if (!clienteExiste) {
            report.alvarasOrfaos++
            report.detalhes.push(`Alvará órfão: ${alvara.empresa} (cliente ${alvara.cliente_id} não existe)`)
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      report,
      message: `Verificação concluída. Encontrados: ${report.alvarasTechSolutions} alvarás Tech Solutions, ${report.empresasTechSolutions} empresas Tech Solutions, ${report.clientesTechSolutions} clientes Tech Solutions, ${report.alvarasOrfaos} alvarás órfãos`
    })

  } catch (error) {
    console.error('❌ Erro na verificação:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { status: 500 })
  }
}