# Configuração do Supabase para Sistema de Alvarás

## 1. Criando o Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados:
   - **Name**: AG Assessoria Alvaras
   - **Database Password**: Crie uma senha segura
   - **Region**: Escolha a região mais próxima
5. Clique em "Create new project"

## 2. Configurando o Banco de Dados

1. No painel do Supabase, vá para "SQL Editor"
2. Clique em "New Query"
3. Copie e cole o conteúdo do arquivo `supabase_schema.sql`
4. Clique em "Run" para executar

## 3. Configurando as Variáveis de Ambiente

1. No painel do Supabase, vá para "Settings" > "API"
2. Copie os valores:
   - **Project URL**: `https://your-project.supabase.co`
   - **API Key (anon/public)**: `your-anon-key`

3. Crie um arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Configurando Autenticação (Opcional)

Para usar autenticação do Supabase em vez do hardcoded:

1. No painel do Supabase, vá para "Authentication" > "Users"
2. Clique em "Add User"
3. Adicione o usuário:
   - **Email**: agassessoriacontrole@gmail.com
   - **Password**: Fx21701313@@##
4. Confirme o email se necessário

## 5. Estrutura da Tabela

A tabela `alvaras` terá os seguintes campos:
- `id` (UUID, Primary Key)
- `empresa` (TEXT)
- `cnpj` (TEXT)
- `tipo` (TEXT - vigilancia_sanitaria, bombeiro, municipal)
- `numero_protocolo` (TEXT)
- `data_emissao` (DATE)
- `data_vencimento` (DATE)
- `observacoes` (TEXT, opcional)
- `responsavel` (TEXT)
- `contato` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## 6. Políticas de Segurança

O sistema está configurado com Row Level Security (RLS):
- Apenas usuários autenticados podem acessar os dados
- Todas as operações (SELECT, INSERT, UPDATE, DELETE) são permitidas para usuários autenticados

## 7. Testando a Conexão

Após configurar:
1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Faça login no sistema
3. Tente adicionar um novo alvará
4. Verifique se os dados aparecem no painel do Supabase

## 8. Migração de Dados Existentes

Se você já tem dados no localStorage:
1. Exporte os dados usando a função de exportação
2. Os dados serão automaticamente migrados para o Supabase na próxima execução

## Troubleshooting

**Erro de conexão:**
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto do Supabase está ativo

**Erro de autenticação:**
- Verifique se o usuário foi criado no Supabase
- Confirme se o email está verificado

**Erro de permissão:**
- Verifique se as políticas RLS estão configuradas corretamente
- Confirme se o usuário está autenticado

## Monitoramento

Para monitorar o uso:
1. Acesse "Settings" > "Usage" no painel do Supabase
2. Monitore as métricas de banco de dados
3. Configure alertas se necessário