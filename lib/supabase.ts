import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Configuração do Supabase com validação
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ecztnsabsugsgoffrqgn.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjenRuc2Fic3Vnc2dvZmZycWduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NDg0NzYsImV4cCI6MjA2ODQyNDQ3Nn0.rM6l8ds8KTYJ93PpSmG4gf76gBD6-X6xOtoJrpAUf2c'

// Validação das variáveis
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente administrativo para operações que requerem privilégios elevados
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjenRuc2Fic3Vnc2dvZmZycWduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg0ODQ3NiwiZXhwIjoyMDY4NDI0NDc2fQ.FcdJfEb8jksh4IJa9ZB5f9TK7dX-T2Kia_nPJHTBBW4'

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Função para gerar senha temporária segura
export function generateTemporaryPassword(length: number = 12): string {
  const upperCase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowerCase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%&*'
  const allChars = upperCase + lowerCase + numbers + symbols
  
  let password = ''
  
  // Garantir pelo menos um caractere de cada tipo
  password += upperCase[Math.floor(Math.random() * upperCase.length)]
  password += lowerCase[Math.floor(Math.random() * lowerCase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Completar com caracteres aleatórios
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Embaralhar a senha
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

// Função para criar hash de senha usando bcrypt
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Função para verificar senha
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// Função para validar CPF/CNPJ
export function validateCpfCnpj(cpfCnpj: string): { valid: boolean; type: 'cpf' | 'cnpj' | null } {
  const numbers = cpfCnpj.replace(/\D/g, '')
  
  if (numbers.length === 11) {
    // Validação CPF
    if (numbers === '00000000000') return { valid: false, type: null }
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10) remainder = 0
    if (remainder !== parseInt(numbers[9])) return { valid: false, type: null }
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10) remainder = 0
    if (remainder !== parseInt(numbers[10])) return { valid: false, type: null }
    
    return { valid: true, type: 'cpf' }
  } else if (numbers.length === 14) {
    // Validação CNPJ
    if (numbers === '00000000000000') return { valid: false, type: null }
    
    let sum = 0
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for (let i = 0; i < 12; i++) {
      sum += parseInt(numbers[i]) * weights1[i]
    }
    let remainder = sum % 11
    if (remainder < 2) remainder = 0
    else remainder = 11 - remainder
    if (remainder !== parseInt(numbers[12])) return { valid: false, type: null }
    
    sum = 0
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for (let i = 0; i < 13; i++) {
      sum += parseInt(numbers[i]) * weights2[i]
    }
    remainder = sum % 11
    if (remainder < 2) remainder = 0
    else remainder = 11 - remainder
    if (remainder !== parseInt(numbers[13])) return { valid: false, type: null }
    
    return { valid: true, type: 'cnpj' }
  }
  
  return { valid: false, type: null }
}

// Função para criar conta de responsável automaticamente
export async function createResponsavelAccount(clienteData: {
  nome: string
  email: string
  cpfCnpj: string
  telefone?: string
  clienteId: string
  cargo?: string
}) {
  try {
    console.log('Iniciando criação de conta de responsável:', clienteData)
    
    // Validar CPF/CNPJ
    const validation = validateCpfCnpj(clienteData.cpfCnpj)
    if (!validation.valid) {
      throw new Error('CPF/CNPJ inválido')
    }
    
    // Gerar senha temporária
    const senhaTemporaria = generateTemporaryPassword()
    const senhaHash = await hashPassword(senhaTemporaria)
    
    // Extrair CPF (se for pessoa física) ou usar os primeiros 11 dígitos do CNPJ
    const numbers = clienteData.cpfCnpj.replace(/\D/g, '')
    const cpf = validation.type === 'cpf' ? numbers : numbers.substring(0, 11)
    
    // Verificar se responsável já existe
    const { data: existingResponsavel } = await supabase
      .from('responsaveis')
      .select('id')
      .eq('email', clienteData.email)
      .single()
    
    if (existingResponsavel) {
      throw new Error('Já existe um responsável cadastrado com este email')
    }
    
    // Criar responsável
    const responsavelData = {
      nome: clienteData.nome,
      email: clienteData.email,
      cpf: cpf,
      telefone: clienteData.telefone,
      senha_hash: senhaHash,
      status: 'ativo',
      data_cadastro: new Date().toISOString().split('T')[0],
      observacoes: 'Conta criada automaticamente pelo sistema'
    }
    
    console.log('Dados do responsável:', { ...responsavelData, senha_hash: '[HASH_OCULTO]' })
    
    const { data: responsavel, error: responsavelError } = await supabase
      .from('responsaveis')
      .insert([responsavelData])
      .select()
      .single()
    
    if (responsavelError) {
      console.error('Erro ao criar responsável:', responsavelError)
      throw new Error(`Erro ao criar responsável: ${responsavelError.message}`)
    }
    
    console.log('Responsável criado:', responsavel)
    
    // Criar vínculo responsável-cliente
    const vinculoData = {
      responsavel_id: responsavel.id,
      cliente_id: clienteData.clienteId,
      cargo: clienteData.cargo || 'Proprietário',
      permissoes: {
        documentos: true,
        download: true,
        notificacoes: true
      },
      status: 'ativo',
      data_vinculacao: new Date().toISOString().split('T')[0],
      observacoes: 'Vínculo criado automaticamente'
    }
    
    console.log('Dados do vínculo:', vinculoData)
    
    const { data: vinculo, error: vinculoError } = await supabase
      .from('responsavel_cliente')
      .insert([vinculoData])
      .select()
      .single()
    
    if (vinculoError) {
      console.error('Erro ao criar vínculo:', vinculoError)
      throw new Error(`Erro ao criar vínculo: ${vinculoError.message}`)
    }
    
    console.log('Vínculo criado:', vinculo)
    
    return {
      responsavel,
      vinculo,
      senhaTemporaria,
      message: `Conta criada com sucesso! Senha temporária: ${senhaTemporaria}`
    }
    
  } catch (error) {
    console.error('Erro ao criar conta de responsável:', error)
    throw error
  }
}

// Função para criar conta de usuário interno automaticamente
export async function createUsuarioAccount(usuarioData: {
  nome: string
  email: string
  cargo: string
  departamento: string
  permissoes?: Record<string, boolean>
}) {
  try {
    console.log('Iniciando criação de conta de usuário:', usuarioData)
    
    // Verificar se usuário já existe
    const { data: existingUsuario } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', usuarioData.email)
      .single()
    
    if (existingUsuario) {
      throw new Error('Já existe um usuário cadastrado com este email')
    }
    
    // Gerar senha temporária
    const senhaTemporaria = generateTemporaryPassword()
    
    // Permissões padrão baseadas no cargo
    const permissoesPadrao = getPermissoesPorCargo(usuarioData.cargo)
    
    // Criar usuário
    const userData = {
      nome: usuarioData.nome,
      email: usuarioData.email,
      cargo: usuarioData.cargo,
      departamento: usuarioData.departamento,
      permissoes: { ...permissoesPadrao, ...usuarioData.permissoes },
      status: 'ativo',
      ultimo_acesso: new Date().toISOString()
    }
    
    console.log('Dados do usuário:', userData)
    
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .insert([userData])
      .select()
      .single()
    
    if (usuarioError) {
      console.error('Erro ao criar usuário:', usuarioError)
      throw new Error(`Erro ao criar usuário: ${usuarioError.message}`)
    }
    
    console.log('Usuário criado:', usuario)
    
    return {
      usuario,
      senhaTemporaria,
      message: `Usuário criado com sucesso! Senha temporária: ${senhaTemporaria}`
    }
    
  } catch (error) {
    console.error('Erro ao criar conta de usuário:', error)
    throw error
  }
}

// Função para obter permissões padrão por cargo
function getPermissoesPorCargo(cargo: string): Record<string, boolean> {
  const permissoes: Record<string, Record<string, boolean>> = {
    'Administrador': {
      dashboard: true,
      documentos: true,
      alvaras: true,
      abertura: true,
      obrigacoes: true,
      usuarios: true,
      relatorios: true
    },
    'Supervisor': {
      dashboard: true,
      documentos: true,
      alvaras: true,
      abertura: true,
      obrigacoes: true,
      relatorios: true
    },
    'Contador': {
      dashboard: true,
      documentos: true,
      alvaras: true,
      obrigacoes: true,
      relatorios: true
    },
    'Assistente': {
      dashboard: true,
      documentos: true,
      obrigacoes: true
    },
    'Estagiário': {
      dashboard: true,
      documentos: true
    }
  }
  
  return permissoes[cargo] || { dashboard: true }
}

// Função para notificar usuário sobre nova conta (placeholder para integração com email)
export async function notifyNewAccount(email: string, senhaTemporaria: string, tipo: 'cliente' | 'usuario') {
  console.log('Notificação de nova conta:', {
    email,
    senhaTemporaria,
    tipo,
    message: `Nova conta criada para ${email}. Senha temporária: ${senhaTemporaria}`
  })
  
  // Aqui você pode integrar com um serviço de email como SendGrid, Mailgun, etc.
  // Por enquanto, apenas logamos as informações
  
  // Simular envio de email (remover em produção)
  const emailContent = `
    Olá!
    
    Sua conta foi criada no sistema AG Assessoria.
    
    Email: ${email}
    Senha temporária: ${senhaTemporaria}
    
    Por favor, faça login e altere sua senha no primeiro acesso.
    
    Atenciosamente,
    Equipe AG Assessoria
  `
  
  console.log('Conteúdo do email:', emailContent)
  
  return {
    success: true,
    message: 'Notificação enviada com sucesso (simulada)',
    emailContent
  }
}