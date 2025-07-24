# 🎯 Instruções Finais - Scripts SQL

## 📋 4 Opções Disponíveis

### 🚀 **Opção 1: Script Forçado (PARA ERROS DE DEPENDÊNCIA)**
**Arquivo:** `supabase_schema_force_clean.sql`
- ✅ **Resolve erro "cannot drop table because other objects depend on it"**
- ✅ **Remove TODAS as dependências forçadamente (CASCADE)**
- ✅ **Recria tudo completamente do zero**
- ✅ **Garante limpeza total mesmo com conflitos**
- 🎯 **Use quando:** Há erros de dependência, foreign keys, ou tabelas orfãs

### 🔄 **Opção 2: Script Completo (RECOMENDADO GERAL)**
**Arquivo:** `supabase_schema_final.sql`
- ✅ Resolve erro de "trigger already exists"
- ✅ Cria todas as tabelas e estruturas
- ✅ Sistema zerado sem dados
- 🎯 **Use quando:** Primeira execução ou quando há erros de duplicação

### 🧹 **Opção 3: Apenas Limpar Dados**
**Arquivo:** `limpar_dados_apenas.sql`
- ✅ Mantém estrutura das tabelas
- ✅ Remove apenas os dados
- ✅ Rápido e seguro
- 🎯 **Use quando:** Tabelas já existem, só quer limpar dados

### 📊 **Opção 4: Script Original Limpo**
**Arquivo:** `supabase_schema_clean.sql`
- ✅ Versão completa sem dados de exemplo
- ✅ Inclui todos os recursos
- 🎯 **Use quando:** Não há conflitos de triggers

## 🚀 Como Executar

### Passo 1: Acesse o Supabase
1. Entre no seu projeto Supabase
2. Vá em **SQL Editor**
3. Crie uma nova query

### Passo 2: Escolha e Execute

**🚨 Para erro de dependência (PRIORIDADE 1):**
```sql
-- Cole TODO o conteúdo do arquivo supabase_schema_force_clean.sql
-- Clique em "Run" 
```

**Para resolver erro de trigger:**
```sql
-- Cole TODO o conteúdo do arquivo supabase_schema_final.sql
-- Clique em "Run" 
```

**Para apenas limpar dados:**
```sql
-- Cole o conteúdo do arquivo limpar_dados_apenas.sql
-- Clique em "Run"
```

### Passo 3: Verificar Sucesso
Após executar, você deve ver:
- ✅ "Success. No rows returned" 
- ✅ Tabelas criadas na lateral esquerda
- ✅ Sistema funcionando sem dados

## 🔧 Solução de Problemas

### 🚨 Erro: "cannot drop table because other objects depend on it"
➡️ **Solução:** Use `supabase_schema_force_clean.sql` (FORÇA limpeza total)

### 🚨 Erro: "client_users" ou tabelas orfãs
➡️ **Solução:** Use `supabase_schema_force_clean.sql` (Remove dependências)

### Erro: "trigger already exists"
➡️ **Solução:** Use `supabase_schema_final.sql`

### Erro: "relation does not exist"
➡️ **Solução:** Use `supabase_schema_final.sql` (criar estrutura completa)

### Erro: "permission denied"
➡️ **Solução:** Verifique se você é owner do projeto Supabase

### Tabelas existem, mas com dados
➡️ **Solução:** Use `limpar_dados_apenas.sql`

## ✅ Verificação Final

Após executar qualquer script:

1. **Verifique as tabelas:**
   - alvaras ✅
   - clientes ✅
   - responsaveis ✅
   - usuarios ✅
   - empresas ✅
   - documentos ✅
   - obrigacoes ✅
   - responsavel_cliente ✅

2. **Teste o sistema:**
   - Vá para `/admin/clientes`
   - Deve mostrar "0 clientes"
   - Teste cadastro de CNPJ

3. **Teste CNPJ automático:**
   - Digite: 27.970.191/0001-70
   - Deve preencher dados automaticamente

## 🚨 ERRO ATUAL: Dependências

### ⚡ **SOLUÇÃO IMEDIATA**
Você está com erro: `"cannot drop table client_users because other objects depend on it"`

**🎯 EXECUTE AGORA:**
1. Abra Supabase SQL Editor
2. Cole **TODO** o conteúdo do arquivo: `supabase_schema_force_clean.sql`
3. Clique em "Run"
4. ✅ **Pronto! Erro resolvido**

**Por que funciona:**
- Remove TODAS as dependências primeiro (CASCADE)
- Força limpeza completa mesmo com conflitos
- Recria tudo do zero sem erros

---

## 🎯 Resultado Final

✅ **Sistema completamente funcional**  
✅ **Banco de dados zerado**  
✅ **CNPJ automático funcionando**  
✅ **Pronto para cadastros reais**