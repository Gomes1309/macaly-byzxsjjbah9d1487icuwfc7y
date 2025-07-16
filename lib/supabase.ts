import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para o banco de dados
export interface DatabaseAlvara {
  id: string
  empresa: string
  cnpj: string
  tipo: 'vigilancia_sanitaria' | 'bombeiro' | 'municipal'
  numero_protocolo: string
  data_emissao: string
  data_vencimento: string
  observacoes?: string
  responsavel: string
  contato: string
  created_at?: string
  updated_at?: string
}

// Serviços para interagir com o banco
export class AlvaraService {
  static async getAll(): Promise<DatabaseAlvara[]> {
    const { data, error } = await supabase
      .from('alvaras')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erro ao buscar alvarás:', error)
      throw error
    }
    
    return data || []
  }

  static async create(alvara: Omit<DatabaseAlvara, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseAlvara> {
    const { data, error } = await supabase
      .from('alvaras')
      .insert([alvara])
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar alvará:', error)
      throw error
    }
    
    return data
  }

  static async update(id: string, alvara: Partial<DatabaseAlvara>): Promise<DatabaseAlvara> {
    const { data, error } = await supabase
      .from('alvaras')
      .update({ ...alvara, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar alvará:', error)
      throw error
    }
    
    return data
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('alvaras')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Erro ao deletar alvará:', error)
      throw error
    }
  }
}

// Autenticação
export class AuthService {
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Erro no login:', error)
      throw error
    }
    
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Erro no logout:', error)
      throw error
    }
  }

  static async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erro ao obter sessão:', error)
      throw error
    }
    
    return session
  }
}