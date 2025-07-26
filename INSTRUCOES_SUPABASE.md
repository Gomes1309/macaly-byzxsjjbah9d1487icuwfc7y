# 🚀 Instruções para Executar no Supabase

## 📋 Resolução do Erro "trigger already exists"

O erro que você está vendo é comum quando tentamos executar o script SQL mais de uma vez. Criamos 3 opções para resolver isso:

---

## 📁 Opções de Scripts

### 1. **supabase_schema_fixed.sql** (RECOMENDADO)
- ✅ **Corrige o erro dos triggers**
- ✅ **Pode ser executado múltiplas vezes**
- ✅ **Remove e recria triggers/políticas**
- ✅ **Inclui dados de exemplo**

### 2. **supabase_schema_only_structure.sql**
- ✅ **Apenas cria estrutura**
- ✅ **Não inclui dados de exemplo**
- ✅ **Seguro para bancos com dados**
- ✅ **Verifica se existe antes de criar**

### 3. **supabase_schema.sql** (ORIGINAL)
- ❌ **Pode dar erro se executado novamente**
- ✅ **Funciona na primeira execução**

---

## 🛠️ Como Executar

### Opção 1: Script Completo Corrigido (RECOMENDADO)

```sql
-- Copie e cole todo o conteúdo do arquivo: supabase_schema_fixed.sql
```

### Opção 2: Apenas Estrutura (sem dados de exemplo)

```sql
-- Copie e cole todo o conteúdo do arquivo: supabase_schema_only_structure.sql
```

---

## 📝 Passo a Passo

1. **Acesse seu projeto no Supabase**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login e selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral esquerdo, clique em "SQL Editor"
   - Ou vá para a seção "Database" → "SQL Editor"

3. **Execute o Script**
   - Copie todo o conteúdo do arquivo escolhido
   - Cole no SQL Editor
   - Clique em "Run" ou use Ctrl+Enter

4. **Verifique os Resultados**
   - Vá para "Database" → "Tables" para ver as tabelas criadas
   - Verifique se todas as tabelas estão listadas:
     - alvaras
     - clientes
     - responsaveis
     - responsavel_cliente
     - usuarios
     - empresas
     - documentos
     - obrigacoes

---

## 🔧 Principais Correções

### ❌ Problema Original
```sql
CREATE TRIGGER update_alvaras_updated_at...
-- ERROR: trigger "update_alvaras_updated_at" already exists
```

### ✅ Solução Aplicada
```sql
DROP TRIGGER IF EXISTS update_alvaras_updated_at ON alvaras;
CREATE TRIGGER update_alvaras_updated_at...
-- Funciona sempre!
```

---

## 📊 Tabelas Criadas

- **alvaras** - Alvarás de funcionamento
- **clientes** - Clientes da contabilidade
- **responsaveis** - Pessoas físicas responsáveis
- **responsavel_cliente** - Relacionamento entre responsáveis e clientes
- **usuarios** - Usuários do sistema (funcionários)
- **empresas** - Empresas para abertura
- **documentos** - Arquivos e documentos
- **obrigacoes** - Obrigações fiscais e contábeis

---

## 🎯 Dados de Exemplo

O script **supabase_schema_fixed.sql** inclui dados de exemplo para:
- 4 alvarás com diferentes status
- 4 clientes (pessoas físicas e jurídicas)
- 4 usuários do sistema
- 7 responsáveis
- 12 relacionamentos responsável-cliente

---

## 🔒 Segurança

- **RLS (Row Level Security)** habilitado em todas as tabelas
- **Políticas de segurança** para usuários autenticados
- **Triggers automáticos** para atualizar campos updated_at
- **Índices** para melhorar performance

---

## 📞 Suporte

Se encontrar algum erro:
1. Verifique se copiou todo o script
2. Confirme que está no SQL Editor correto
3. Tente executar o script **supabase_schema_fixed.sql**
4. Se o problema persistir, me avise qual erro específico está aparecendo

---

## ✅ Verificação Final

Após executar o script, verifique:
- [ ] Todas as 8 tabelas foram criadas
- [ ] Não há erros no console
- [ ] Dados de exemplo estão visíveis (se usando script completo)
- [ ] Sistema está funcionando corretamente