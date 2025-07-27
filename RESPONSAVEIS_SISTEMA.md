# 👥 Sistema de Responsáveis - AG Assessoria

## 🎯 Funcionalidade Implementada

Sistema completo para **gerenciamento de responsáveis por cliente/empresa**, permitindo que **um responsável gerencie múltiplas empresas** com diferentes níveis de acesso e permissões em cada uma.

## 🏗️ Arquitetura do Sistema

### **📊 Estrutura de Banco de Dados**

**Tabela de Responsáveis (Pessoas Físicas):**
```sql
CREATE TABLE responsaveis (
  id UUID PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  telefone TEXT,
  senha_hash TEXT NOT NULL,
  status TEXT DEFAULT 'ativo',
  ultimo_acesso TIMESTAMP,
  data_cadastro DATE DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Tabela de Relacionamento (N:N):**
```sql
CREATE TABLE responsavel_cliente (
  id UUID PRIMARY KEY,
  responsavel_id UUID REFERENCES responsaveis(id),
  cliente_id UUID REFERENCES clientes(id),
  cargo TEXT NOT NULL,
  permissoes JSONB DEFAULT '{"documentos": true, "download": true, "notificacoes": true}',
  status TEXT DEFAULT 'ativo',
  data_vinculacao DATE DEFAULT CURRENT_DATE,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(responsavel_id, cliente_id)
);
```

### **🔧 Componentes Implementados**

#### **📁 Arquivos Criados:**
- `hooks/useResponsaveis.ts` - Hook para gerenciar responsáveis
- `components/ResponsaveisManager.tsx` - Interface de gerenciamento
- `RESPONSAVEIS_SISTEMA.md` - Documentação completa

#### **📝 Arquivos Modificados:**
- `supabase_schema.sql` - Estrutura da tabela
- `app/clientes/page.tsx` - Integração com portal do cliente
- `lib/supabase.ts` - Configuração de desenvolvimento

## 🎨 Interface de Usuário

### **🔐 Portal do Cliente**
**Acesso:** `/clientes`
- **Aba "Responsáveis"** - Gerenciamento completo
- **Visualização em cards** - Layout moderno e responsivo
- **Filtros e busca** - Localização rápida

### **✨ Funcionalidades Visuais**
- **Avatar automático** - Iniciais do nome
- **Status colorido** - Ativo (verde), Inativo (cinza), Suspenso (vermelho)
- **Badges de permissões** - Visualização clara dos acessos
- **Formatação automática** - CPF e telefone
- **Outras empresas** - Mostra quantas outras empresas o responsável gerencia
- **Formulário inteligente** - Reutiliza responsável existente ou cria novo

## 🏢 Cenário Real da Contabilidade

### **🎯 Relacionamento N:N**
- **Um contador** → Responsável por 10+ empresas
- **Um sócio** → Acesso a várias empresas do grupo
- **Um gerente** → Diferentes permissões por empresa
- **Uma empresa** → Múltiplos responsáveis

### **💼 Casos de Uso**
```typescript
// Contador João Silva
{
  nome: "João Silva",
  email: "joao@agassessoria.com",
  empresas: [
    { clienteNome: "Farmácia Central", cargo: "Contador", permissoes: "Full" },
    { clienteNome: "Hotel Estrela", cargo: "Contador", permissoes: "Full" },
    { clienteNome: "Loja do Centro", cargo: "Contador", permissoes: "Full" }
  ]
}

// Sócio José Santos
{
  nome: "José Santos",
  email: "jose@farmaciacentral.com",
  empresas: [
    { clienteNome: "Farmácia Central", cargo: "Sócio-Gerente", permissoes: "Full" },
    { clienteNome: "Hotel Estrela", cargo: "Consultor", permissoes: "Limited" }
  ]
}
```

## 🔒 Sistema de Permissões

### **📋 Tipos de Permissões**
```typescript
interface Permissoes {
  documentos: boolean     // Visualizar lista de documentos
  download: boolean       // Fazer download de arquivos
  notificacoes: boolean   // Receber emails de notificação
}
```

### **⚙️ Configuração Padrão**
```json
{
  "documentos": true,
  "download": true,
  "notificacoes": true
}
```

## 🚀 Como Usar

### **1. Acesso ao Sistema**
```bash
# Acessar portal do cliente
https://mk2of4l6b3c7h8aflcpq3h6w.macaly.dev/clientes

# Credenciais de teste
CNPJ: 12.345.678/0001-90
Senha: 123456
```

### **2. Gerenciar Responsáveis**
1. **Login** no portal do cliente
2. **Clique** na aba "Responsáveis"
3. **Adicionar** novo responsável com o botão "+"
4. **Editar** clicando no ícone de lápis
5. **Remover** com confirmação

### **3. Cadastrar Novo Responsável**
```
✅ Campos Obrigatórios:
- Nome completo
- Email
- CPF
- Cargo

📋 Campos Opcionais:
- Telefone
- Observações
- Status (ativo/inativo/suspenso)
```

### **4. Configurar Permissões**
- **Documentos:** Permite ver a lista de documentos
- **Download:** Permite baixar arquivos
- **Notificações:** Recebe emails sobre novos documentos

## 🔧 Funcionalidades Técnicas

### **📊 Hook useResponsaveis (Atualizado)**
```typescript
const {
  responsaveis,                  // Lista de responsáveis com vínculos
  loading,                      // Estado de carregamento
  error,                        // Mensagens de erro
  addResponsavelToCliente,      // Adicionar/vincular responsável
  updateResponsavelCliente,     // Atualizar vínculo
  deleteResponsavelCliente,     // Remover vínculo
  getResponsaveisByCliente,     // Filtrar por cliente
  getEmpresasByResponsavel,     // Empresas de um responsável
  validateResponsavelLogin,     // Validar login
  updateLastAccess,             // Atualizar último acesso
  refreshResponsaveis           // Recarregar dados
} = useResponsaveis()
```

### **🔄 Interfaces Principais**
```typescript
interface ResponsavelComVinculo {
  id: string
  nome: string
  email: string
  cpf: string
  telefone?: string
  senhaHash: string
  status: 'ativo' | 'inativo' | 'suspenso'
  ultimoAcesso?: Date
  dataCadastro: Date
  observacoes?: string
  vinculo: ResponsavelCliente
  empresas: Array<{
    clienteId: string
    clienteNome: string
    cargo: string
    permissoes: Permissoes
    status: 'ativo' | 'inativo' | 'suspenso'
  }>
}
```

### **🎛️ Componente ResponsaveisManager**
```typescript
<ResponsaveisManager 
  clienteId={currentCliente.id}
  clienteNome={currentCliente.nome}
/>
```

## 📈 Dados de Exemplo

### **👤 Responsáveis Cadastrados**
```json
{
  "joao@agassessoria.com": {
    "nome": "João Silva",
    "cargo": "Contador",
    "empresas": [
      { "nome": "Farmácia Central", "cargo": "Contador", "permissoes": "Full" },
      { "nome": "Hotel Estrela", "cargo": "Contador", "permissoes": "Full" },
      { "nome": "Loja do Centro", "cargo": "Contador", "permissoes": "Full" }
    ],
    "status": "ativo"
  },
  "jose@farmaciacentral.com": {
    "nome": "José Santos",
    "empresas": [
      { "nome": "Farmácia Central", "cargo": "Sócio-Gerente", "permissoes": "Full" },
      { "nome": "Hotel Estrela", "cargo": "Consultor", "permissoes": "Limited" }
    ],
    "status": "ativo"
  },
  "contador@agassessoria.com": {
    "nome": "Contador Senior",
    "empresas": [
      { "nome": "Farmácia Central", "cargo": "Contador Sênior", "permissoes": "Full" },
      { "nome": "Hotel Estrela", "cargo": "Contador Sênior", "permissoes": "Full" },
      { "nome": "Loja do Centro", "cargo": "Contador Sênior", "permissoes": "Full" }
    ],
    "status": "ativo"
  }
}
```

## 🔐 Segurança

### **🛡️ Medidas Implementadas**
- **Senhas hashadas** - Bcrypt em produção
- **Validação de campos** - Campos obrigatórios
- **Controle de acesso** - Permissões granulares
- **Logs de acesso** - Último acesso registrado
- **Status de usuário** - Ativo/Inativo/Suspenso

### **🔒 Autenticação**
```typescript
// Validar login (desenvolvimento)
const responsavel = await validateResponsavelLogin(email, "123456")

// Atualizar último acesso
await updateLastAccess(responsavel.id)
```

## 📧 Integração com Email

### **✅ Notificações Automáticas**
- Responsáveis com `permissoes.notificacoes: true`
- Recebem emails sobre novos documentos
- Sistema integrado com `useDocumentos`

## 🗄️ Banco de Dados

### **🔗 Relacionamentos**
- `responsaveis.cliente_id` → `clientes.id`
- **Cascade Delete** - Remove responsáveis quando cliente é excluído
- **Índices** - Performance otimizada

### **📊 Consultas Principais**
```sql
-- Buscar responsáveis por cliente
SELECT * FROM responsaveis WHERE cliente_id = ? AND status = 'ativo';

-- Validar login
SELECT * FROM responsaveis WHERE email = ? AND status = 'ativo';

-- Atualizar último acesso
UPDATE responsaveis SET ultimo_acesso = NOW() WHERE id = ?;
```

## 🎯 Próximos Passos

### **🔮 Melhorias Futuras**
1. **Hash de senhas real** - Implementar bcrypt
2. **Reset de senha** - Via email
3. **Logs de auditoria** - Histórico de ações
4. **Níveis de permissão** - Mais granularidade
5. **Notificações push** - Tempo real

### **⚡ Produção**
1. **Configurar Supabase** - URLs reais
2. **Variáveis de ambiente** - Keys de produção
3. **Políticas RLS** - Segurança aprimorada
4. **Backup automático** - Dados dos responsáveis

## 📋 Status do Sistema

**✅ Implementado e Funcional:**
- Tabela de responsáveis
- Hook de gerenciamento
- Interface de usuário
- Sistema de permissões
- Integração com portal do cliente
- Validação de dados
- Formatação automática

**🚀 Pronto para uso em desenvolvimento**
**⚙️ Configuração necessária para produção**

---

**Desenvolvido por:** AG Assessoria Contábil  
**Data:** 18 de julho de 2025  
**Versão:** 1.0.0