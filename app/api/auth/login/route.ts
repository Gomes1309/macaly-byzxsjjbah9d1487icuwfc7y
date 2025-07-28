import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface LoginRequest {
  email: string
  password: string
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json() as LoginRequest

    console.log('🔐 API Login: Tentativa de login para:', email)

    // Lista de usuários autorizados hardcoded (prioridade máxima)
    const authorizedUsers = [
      {
        id: '1',
        nome: 'Administrador Principal',
        email: 'agassessoriacontrole@gmail.com',
        password: 'Fx21701313@@##',
        departamento: 'Administração',
        role: 'admin'
      }
    ]

    // PASSO 1: Verificar usuários principais (hardcoded)
    const foundMainUser = authorizedUsers.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (foundMainUser) {
      const userData = {
        id: foundMainUser.id,
        nome: foundMainUser.nome,
        email: foundMainUser.email,
        departamento: foundMainUser.departamento,
        role: foundMainUser.role
      }
      
      console.log('✅ API Login: Login principal bem-sucedido:', userData.nome)
      
      return NextResponse.json({
        success: true,
        user: userData,
        source: 'hardcoded'
      })
    }

    // PASSO 2: Verificar usuários do Supabase
    console.log('🔍 API Login: Verificando usuários do banco Supabase...')
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('status', 'ativo')
      .single()

    if (error) {
      console.log('ℹ️ API Login: Usuário não encontrado no banco:', error.message)
      return NextResponse.json({
        success: false,
        message: 'Email ou senha incorretos'
      }, { status: 401 })
    }

    if (data) {
      console.log('👤 API Login: Usuário encontrado no banco:', data.nome)
      
      let isPasswordValid = false
      
      // VERIFICAR SENHA HASHEADA (PRIORIDADE)
      if (data.senha_hash) {
        console.log('🔐 API Login: Verificando senha hasheada com bcrypt...')
        try {
          isPasswordValid = await bcrypt.compare(password, data.senha_hash)
          console.log('🔐 API Login: Resultado bcrypt:', isPasswordValid ? 'VÁLIDA' : 'INVÁLIDA')
        } catch (bcryptError) {
          console.error('❌ API Login: Erro no bcrypt:', bcryptError)
        }
      }
      
      // SENHAS PADRÃO (FALLBACK)
      if (!isPasswordValid) {
        console.log('🔐 API Login: Testando senhas padrão e temporárias...')
        
        // Extrair senha temporária do campo departamento se existir
        let senhaTemporariaExtraida = null
        if (data.departamento && data.departamento.includes('_temp_')) {
          const parts = data.departamento.split('_temp_')
          if (parts.length === 2) {
            senhaTemporariaExtraida = parts[1]
            console.log('🔐 API Login: Senha temporária extraída do departamento')
          }
        }
        
        const validPasswords = [
          'senha123',           // Senha padrão
          'agassessoria123',    // Senha da empresa
          'tw2fXSQP',          // Senha temporária atual conhecida (fallback)
          senhaTemporariaExtraida, // Senha temporária salva no campo departamento
          password === data.senha ? data.senha : null, // Senha personalizada se existir
          data.email.split('@')[0] + '123' // Email + 123
        ].filter(Boolean)

        isPasswordValid = validPasswords.includes(password)
        console.log('🔐 API Login: Senhas testadas:', validPasswords.length, 'Resultado:', isPasswordValid ? 'VÁLIDA' : 'INVÁLIDA')
      }

      if (isPasswordValid) {
        // Limpar departamento se contiver senha temporária
        let departamentoLimpo = data.departamento || 'Geral'
        if (departamentoLimpo.includes('_temp_')) {
          departamentoLimpo = departamentoLimpo.split('_temp_')[0] || 'Geral'
        }
        
        const userData = {
          id: data.id,
          nome: data.nome,
          email: data.email,
          departamento: departamentoLimpo,
          role: data.status === 'admin' ? 'admin' : 'operador'
        }
        
        console.log('✅ API Login: Login do banco bem-sucedido:', userData.nome)
        
        // Atualizar último acesso
        await supabase
          .from('usuarios')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', data.id)
        
        return NextResponse.json({
          success: true,
          user: userData,
          source: 'database'
        })
      }
    }

    console.log('❌ API Login: Credenciais inválidas')
    return NextResponse.json({
      success: false,
      message: 'Email ou senha incorretos'
    }, { status: 401 })

  } catch (error) {
    console.error('💥 API Login: Erro interno:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor'
    }, { status: 500 })
  }
}