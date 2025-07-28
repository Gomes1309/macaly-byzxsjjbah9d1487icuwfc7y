import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
// import { useSyncManager } from './useSyncManager'

export interface Usuario {
  id: string
  nome: string
  email: string
  cargo?: string  // Para compatibilidade com o front-end
  departamento?: string  // Para compatibilidade com o front-end
  permissoes: Record<string, boolean>
  status: 'ativo' | 'inativo' | 'suspenso'
  ultimoAcesso?: Date
}

export interface DatabaseUsuario {
  id: string
  nome: string
  email: string
  senha_hash?: string  // Campo real do banco
  tipo_usuario?: string  // Campo real do banco
  ativo?: boolean  // Campo real do banco
  created_at: string
  updated_at: string
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)  
  const [error, setError] = useState<string | null>(null)

  console.log('🏁 Hook useUsuarios iniciado - renderização', Date.now(), { loading, usuariosCount: usuarios.length })
  
  // TESTE COM useEffect
  useEffect(() => {
    console.log('🚀 useEffect EXECUTADO!')
    console.log('Estado no useEffect:', { loading, usuariosCount: usuarios.length })
    
    const loadData = async () => {
      try {
        console.log('📋 Iniciando carregamento...')
        
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .order('created_at', { ascending: false })
        
        console.log('📊 Resposta Supabase:', { success: !error, dataCount: data?.length || 0 })
        
        if (error) {
          console.error('❌ Erro Supabase:', error.message)
          throw error
        }
        
        const testUsers: Usuario[] = [
          {
            id: 'test-1',
            nome: 'Admin Sistema',
            email: 'admin@agassessoria.com',
            cargo: 'Administrador',
            departamento: 'TI',
            permissoes: { dashboard: true, usuarios: true },
            status: 'ativo',
            ultimoAcesso: new Date()
          },
          ...(data || []).map((dbUser, index) => ({
            id: dbUser.id,
            nome: dbUser.nome,
            email: dbUser.email,
            cargo: dbUser.tipo_usuario || 'Operador',
            departamento: 'Geral',
            permissoes: {},
            status: (dbUser.ativo === false ? 'inativo' : 'ativo') as 'ativo' | 'inativo' | 'suspenso',
            ultimoAcesso: undefined
          }))
        ]
        
        console.log('✅ Dados processados:', testUsers.length, 'usuarios')
        console.log('🔄 Atualizando estado...')
        
        setUsuarios(testUsers)
        setLoading(false)
        
        console.log('🎉 Estado atualizado com sucesso!')
        
      } catch (err) {
        console.error('💥 Erro no carregamento:', err)
        setError(`Erro: ${err}`)
        setLoading(false)
      }
    }
    
    loadData()
  }, []) // Dependências vazias

  // Converter dados do banco para formato da aplicação
  const databaseToUsuario = useCallback((dbUsuario: DatabaseUsuario): Usuario => {
    console.log('🔄 Convertendo usuário do banco:', { 
      id: dbUsuario.id, 
      nome: dbUsuario.nome, 
      email: dbUsuario.email,
      tipo_usuario: dbUsuario.tipo_usuario,
      ativo: dbUsuario.ativo 
    })
    
    try {
      const converted: Usuario = {
        id: dbUsuario.id,
        nome: dbUsuario.nome,
        email: dbUsuario.email,
        cargo: dbUsuario.tipo_usuario || 'Operador', // Mapear tipo_usuario para cargo
        departamento: 'Geral', // Default já que não existe no banco
        permissoes: {}, // Default vazio
        status: (dbUsuario.ativo === false ? 'inativo' : 'ativo') as 'ativo' | 'inativo' | 'suspenso', // Mapear ativo para status
        ultimoAcesso: undefined // Campo não existe no banco atual
      }
      
      console.log('✅ Usuário convertido:', { id: converted.id, nome: converted.nome, status: converted.status })
      return converted
    } catch (err) {
      console.error('❌ Erro na conversão do usuário:', err)
      throw err
    }
  }, [])

  // Converter dados da aplicação para formato do banco
  const usuarioToDatabase = useCallback((usuario: Omit<Usuario, 'id'>): Partial<Omit<DatabaseUsuario, 'id' | 'created_at' | 'updated_at'>> => {
    const dbData: Partial<Omit<DatabaseUsuario, 'id' | 'created_at' | 'updated_at'>> = {
      nome: usuario.nome,
      email: usuario.email,
      senha_hash: 'senha_temporaria_123', // Senha padrão temporária
      tipo_usuario: usuario.cargo || 'admin',
      ativo: usuario.status === 'ativo'
    }
    
    return dbData
  }, [])

  // Carregar usuários do banco
  const loadUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Iniciando carregamento de usuários...')
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
      
      console.log('📊 Resposta do Supabase:', { dataLength: data?.length || 0, error: error?.message || 'none' })
      
      if (error) {
        console.error('❌ Erro na query do Supabase:', error)
        throw error
      }
      
      // Tratar tanto dados vazios quanto nulos como casos válidos
      const usuariosData = data || []
      console.log('📝 Dados brutos recebidos:', usuariosData.length > 0 ? 'Dados encontrados' : 'Nenhum dado')
      
      console.log('🔄 Iniciando conversão de dados...')
      const formattedUsuarios = usuariosData.map((dbUser, index) => {
        console.log(`📝 Convertendo usuário ${index + 1}:`, { id: dbUser.id, nome: dbUser.nome })
        try {
          return databaseToUsuario(dbUser)
        } catch (conversionError) {
          console.error(`❌ Erro ao converter usuário ${index + 1}:`, conversionError)
          throw conversionError
        }
      })
      
      console.log('✅ Conversão concluída. Usuários formatados:', formattedUsuarios.length)
      setUsuarios(formattedUsuarios)
      console.log(`🎉 ${formattedUsuarios.length} usuários carregados e definidos no estado`)
    } catch (err) {
      console.error('💥 Erro geral no carregamento:', err)
      setError(`Erro ao carregar usuários: ${err}`)
      // Definir lista vazia em caso de erro
      setUsuarios([])
    } finally {
      console.log('🏁 Finalizando carregamento (setLoading false)')
      setLoading(false)
    }
  }, [databaseToUsuario])

  // Recarregar usuários
  const refreshUsuarios = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const usuarios = (data || []).map(databaseToUsuario)
      setUsuarios(usuarios)
      
      console.log('Usuários recarregados:', usuarios.length)
      
    } catch (err) {
      console.error('Erro ao recarregar usuários:', err)
      setError('Erro ao carregar usuários')
      throw err
    } finally {
      setLoading(false)
    }
  }, [databaseToUsuario])

  // Adicionar novo usuário
  const addUsuario = useCallback(async (usuarioData: Omit<Usuario, 'id'>, options?: { 
    createAccount?: boolean 
    notifyUser?: boolean 
  }) => {
    try {
      setError(null)
      
      console.log('Iniciando criação de usuário:', usuarioData, options)
      
      // Gerar senha temporária aleatória
      const senhaTemporaria = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
      
      // Hash da senha de forma segura
      const saltRounds = 10
      const senhaHash = await bcrypt.hash(senhaTemporaria, saltRounds)
      
      // Usar a estrutura real do banco (sem senha_hash que não existe)
      const dbData = {
        nome: usuarioData.nome,
        email: usuarioData.email,
        departamento: `${usuarioData.departamento || 'Geral'}_temp_${senhaTemporaria}`, // Workaround: salvar senha temporária no departamento
        status: usuarioData.status || 'ativo',
        permissoes: usuarioData.permissoes || {}
      }
      
      console.log('Dados para inserção no banco:', { ...dbData, senha_hash: '[REDACTED]' })
      
      const { data, error } = await supabase
        .from('usuarios')
        .insert([dbData])
        .select()
        .single()
      
      if (error) {
        console.error('Erro na inserção no banco:', error)
        throw error
      }
      
      const newUsuario = databaseToUsuario(data)
      setUsuarios(prev => [newUsuario, ...prev])
      
      console.log('Usuário criado:', newUsuario)
      
      // Preparar resultado
      const result: any = {
        usuario: newUsuario,
        account: options?.createAccount ? { 
          created: true,
          senhaTemporaria: senhaTemporaria
        } : null,
        message: 'Usuário criado com sucesso!'
      }
      
      // Enviar email de boas-vindas se solicitado
      if (options?.notifyUser && options?.createAccount) {
        try {
          console.log('📧 Enviando email de boas-vindas para:', usuarioData.email)
          
          const emailResponse = await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              nome: usuarioData.nome,
              email: usuarioData.email,
              senha: senhaTemporaria,
              empresas: ['Todas as empresas do sistema'] // Lista padrão
            })
          })
          
          const emailResult = await emailResponse.json()
          console.log('📧 Resultado do envio de email:', emailResult)
          
          result.email = emailResult
        } catch (emailError) {
          console.error('❌ Erro ao enviar email de boas-vindas:', emailError)
          result.email = {
            success: false,
            message: 'Erro ao enviar email de boas-vindas',
            error: emailError instanceof Error ? emailError.message : 'Erro desconhecido'
          }
        }
      }
      
      return result
      
    } catch (err) {
      console.error('Erro ao adicionar usuário:', err)
      setError('Erro ao adicionar usuário')
      throw err
    }
  }, [databaseToUsuario])

  // Atualizar usuário existente
  const updateUsuario = useCallback(async (id: string, usuarioData: Partial<Omit<Usuario, 'id'>>) => {
    try {
      setError(null)
      
      const updateData: Partial<DatabaseUsuario> = {}
      
      if (usuarioData.nome) updateData.nome = usuarioData.nome
      if (usuarioData.email) updateData.email = usuarioData.email
      if (usuarioData.cargo) updateData.tipo_usuario = usuarioData.cargo
      if (usuarioData.status) updateData.ativo = usuarioData.status === 'ativo'
      
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedUsuario = databaseToUsuario(data)
      setUsuarios(prev => prev.map(usuario => usuario.id === id ? updatedUsuario : usuario))
      
      // Emit sync event - TEMPORARIAMENTE REMOVIDO
      // emitSync({
      //   type: 'usuarios_updated',
      //   action: 'update',
      //   data: updatedUsuario
      // })
      
      return updatedUsuario
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      setError('Erro ao atualizar usuário')
      throw err
    }
  }, [databaseToUsuario])

  // Deletar usuário
  const deleteUsuario = useCallback(async (id: string) => {
    try {
      setError(null)
      
      console.log('🗑️ Deletando usuário:', id)
      
      // Buscar usuário antes de deletar
      const usuarioToDelete = usuarios.find(u => u.id === id)
      
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Atualizar estado local
      setUsuarios(prev => prev.filter(usuario => usuario.id !== id))
      
      // Emit sync event - TEMPORARIAMENTE REMOVIDO
      // emitSync({
      //   type: 'usuarios_updated',
      //   action: 'delete',
      //   data: { id, usuario: usuarioToDelete }
      // })
      
      // Limpar cache local
      localStorage.removeItem('usuarios_backup')
      
      console.log('✅ Usuário deletado com sucesso')
      
    } catch (err) {
      console.error('Erro ao deletar usuário:', err)
      setError('Erro ao deletar usuário')
      throw err
    }
  }, [usuarios])

  // Resetar senha do usuário
  const resetUsuarioPassword = useCallback(async (id: string) => {
    try {
      setError(null)
      
      // Gerar nova senha temporária
      const novaSenhaTemporaria = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
      
      // Hash da nova senha
      const saltRounds = 10
      const novoHash = await bcrypt.hash(novaSenhaTemporaria, saltRounds)
      
      const { data, error } = await supabase
        .from('usuarios')
        .update({ senha_hash: novoHash })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      const updatedUsuario = databaseToUsuario(data)
      setUsuarios(prev => prev.map(usuario => usuario.id === id ? updatedUsuario : usuario))
      
      console.log('Senha resetada para usuário:', updatedUsuario.nome)
      
      return {
        usuario: updatedUsuario,
        novaSenhaTemporaria: novaSenhaTemporaria
      }
      
    } catch (err) {
      console.error('Erro ao resetar senha:', err)
      setError('Erro ao resetar senha')
      throw err
    }
  }, [databaseToUsuario])

  return {
    usuarios,
    loading,
    error,
    refreshUsuarios,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    resetUsuarioPassword
  }
}