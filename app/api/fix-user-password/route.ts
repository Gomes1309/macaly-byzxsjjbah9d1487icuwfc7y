import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, senhaTemporaria } = await request.json()

    console.log('🔧 Corrigindo senha do usuário:', email)

    // Buscar o usuário
    const { data: usuario, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (selectError || !usuario) {
      console.error('❌ Usuário não encontrado:', selectError?.message)
      return NextResponse.json({
        success: false,
        message: 'Usuário não encontrado'
      }, { status: 404 })
    }

    // Criar hash da senha temporária
    const saltRounds = 12
    const senhaHash = await bcrypt.hash(senhaTemporaria, saltRounds)

    console.log('🔐 Hash gerado para a senha temporária')

    // Verificar se já existe uma coluna senha_hash
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Tentar adicionar a coluna senha_hash se não existir
    try {
      updateData.senha_hash = senhaHash
      
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', usuario.id)
        .select()

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error)
        return NextResponse.json({
          success: false,
          message: 'Erro ao atualizar senha no banco',
          error: error.message
        }, { status: 500 })
      }

      console.log('✅ Senha atualizada com sucesso para:', usuario.nome)

      return NextResponse.json({
        success: true,
        message: 'Senha atualizada com sucesso',
        user: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      })

    } catch (updateError) {
      console.error('❌ Erro na atualização:', updateError)
      return NextResponse.json({
        success: false,
        message: 'Erro ao processar atualização da senha',
        error: updateError instanceof Error ? updateError.message : 'Erro desconhecido'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('💥 Erro interno:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}