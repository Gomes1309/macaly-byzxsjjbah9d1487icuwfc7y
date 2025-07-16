# 🚀 Sistema de Alvarás - Configuração Completa Supabase

## 📋 IMPORTANTE: EXECUTE O SCRIPT SQL PRIMEIRO!

### 1. Acesse o Painel do Supabase
🔗 **Link direto**: https://supabase.com/dashboard/project/sctlaitmqghnoxiqmbiw/sql

### 2. Execute o Script SQL
Copie todo o conteúdo do arquivo `supabase_schema.sql` e execute no SQL Editor do Supabase.

### 3. Credenciais Configuradas
```
Email: agassessoriacontrole@gmail.com
Senha: Fx21701313@@##
```

### 4. Variáveis de Ambiente (Já Configuradas)
```env
NEXT_PUBLIC_SUPABASE_URL=https://sctlaitmqghnoxiqmbiw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🎯 Funcionalidades Implementadas

### ✅ Gerenciamento Completo
- **Cadastro**: Novos alvarás com validação
- **Edição**: Modificar dados existentes
- **Visualização**: Detalhes completos
- **Exclusão**: Remover alvarás
- **Busca**: Por empresa, CNPJ, protocolo
- **Filtros**: Por tipo e status
- **Exportação**: PDF completo

### ✅ Dashboard Inteligente
- **Estatísticas**: Contadores em tempo real
- **Alertas**: Vencimentos próximos
- **Status Automático**: 
  - 🟢 Em Dia (>30 dias)
  - 🟡 Vencendo (≤30 dias)
  - 🔴 Vencido (atrasado)

### ✅ Tipos de Alvará
- 🛡️ Vigilância Sanitária
- 🔥 Corpo de Bombeiros
- 🏛️ Municipal

## 🗄️ Estrutura do Banco (Supabase)

### Tabela: `alvaras`
```sql
id                UUID (PK)
empresa           TEXT
cnpj              TEXT
tipo              TEXT (enum)
numero_protocolo  TEXT
data_emissao      DATE
data_vencimento   DATE
status            TEXT (auto-calculado)
observacoes       TEXT
responsavel       TEXT
contato           TEXT
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

## 🔧 Arquivos Principais

### Backend (Supabase)
- `lib/supabase.ts` - Cliente configurado
- `hooks/useAlvaras.ts` - CRUD operations
- `supabase_schema.sql` - Script de criação

### Frontend
- `app/page.tsx` - Interface principal
- `components/AlvaraWithSupabase.tsx` - Componente especializado

## 🚀 Como Usar

### 1. Primeira Vez
1. Execute o script SQL no Supabase
2. Faça login com as credenciais
3. Sistema carregará dados automaticamente

### 2. Operações Diárias
- **Novo Alvará**: Botão "Novo Alvará"
- **Buscar**: Campo de pesquisa
- **Filtrar**: Dropdowns de tipo/status
- **Exportar**: Botão "Exportar PDF"

### 3. Monitoramento
- Cards no topo mostram estatísticas
- Cores indicam urgência
- Clique nos cards para filtrar

## 🎨 Design Implementado

### Visual
- **Logo**: AG Assessoria integrado
- **Cores**: Azul profissional + Verde/Amarelo/Vermelho para status
- **Layout**: Responsivo e moderno
- **Tipografia**: Hierarquia clara

### UX
- **Navegação**: Intuitiva e rápida
- **Feedback**: Toasts informativos
- **Loading**: Indicadores visuais
- **Errors**: Mensagens claras

## 🔒 Segurança

### Supabase RLS
- Row Level Security habilitado
- Políticas configuradas
- Acesso controlado

### Autenticação
- Login obrigatório
- Sessão persistente
- Logout seguro

## 📊 Relatórios

### Exportação PDF
- **Dados**: Todos os alvarás filtrados
- **Formato**: Tabela organizada
- **Informações**: Completas e legíveis
- **Marca**: AG Assessoria

## 🆘 Troubleshooting

### Se aparecer erro de tabela não encontrada:
1. Verifique se executou o script SQL
2. Confirme no Supabase se a tabela existe
3. Clique "Tentar Novamente" na tela de erro

### Se não carregar dados:
1. Verifique conexão com internet
2. Veja console para erros
3. Confirme credenciais do Supabase

## 🎯 Pronto para Uso!

O sistema está completamente configurado e pronto para uso em produção. Todos os dados são salvos no Supabase e sincronizados em tempo real.

---

**Desenvolvimento por AG ASSESSORIA CONTÁBIL** 🏢✨