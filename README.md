# Prontuário Local

Sistema de prontuário eletrônico desktop para profissionais de saúde e outras áreas, desenvolvido com foco em segurança, privacidade e facilidade de uso.

## 🎯 Visão Geral

**Prontuário Local** é uma solução completa para gerenciar clientes e registrar atendimentos de forma segura e organizada. Desenvolvido para profissionais que valorizam a privacidade e segurança dos dados.

### Características Principais

- ✅ **Totalmente Local** - Dados armazenados no seu computador, sem dependência de internet
- ✅ **Segurança em Primeiro Lugar** - Autenticação por username + pergunta de segurança
- ✅ **Senhas Criptografadas** - Usando bcrypt (padrão de segurança)
- ✅ **Banco de Dados Estruturado** - SQLite com relacionamentos
- ✅ **Interface Intuitiva** - Fácil de usar, sem necessidade de treinamento
- ✅ **Abrangente** - Funciona para psicólogos, terapeutas, manicures, salões, etc.
- ✅ **Backup Opcional** - Sincronização com Google Drive (em desenvolvimento)

---

## 📋 Requisitos

- **Python 3.8+**
- **Windows, macOS ou Linux**
- **Espaço em disco:** ~100MB

---

## 🚀 Instalação

### 1. Clonar o Repositório

```bash
git clone https://github.com/aura-sistemas-inteligentes/prontuario-local.git
cd prontuario-local
```

### 2. Criar Ambiente Virtual

```bash
python -m venv venv
```

**Windows:**
```bash
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Instalar Dependências

```bash
pip install -r backend/requirements.txt
```

### 4. Rodar a API

```bash
cd backend
python -m uvicorn main:app --reload
```

A API estará disponível em: `http://127.0.0.1:8000`

---

## 📚 Documentação da API

Após rodar a API, acesse a documentação interativa:

```
http://127.0.0.1:8000/docs
```

Aqui você pode testar todas as rotas disponíveis.

---

## 🔐 Autenticação

### Cadastro de Novo Usuário

**Endpoint:** `POST /auth/cadastro`

```json
{
  "username": "michelle_consultorio",
  "nome": "Michelle",
  "senha": "senha_segura_123",
  "pergunta_seguranca": "Qual é o nome do seu pet?",
  "resposta_seguranca": "Fluffy"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "usuario": {
    "id": 1,
    "username": "michelle_consultorio",
    "nome": "Michelle",
    "data_criacao": "2026-01-17T10:30:00"
  }
}
```

### Login

**Endpoint:** `POST /auth/login`

```json
{
  "username": "michelle_consultorio",
  "senha": "senha_segura_123"
}
```

### Recuperação de Senha

**Endpoint:** `POST /auth/recuperar-senha`

```json
{
  "username": "michelle_consultorio",
  "resposta_seguranca": "Fluffy",
  "nova_senha": "nova_senha_456"
}
```

---

## 👥 Gerenciamento de Clientes

### Listar Clientes

**Endpoint:** `GET /clientes/`

**Header:**
```
Authorization: Bearer {seu_token_jwt}
```

### Cadastrar Cliente

**Endpoint:** `POST /clientes/`

```json
{
  "nome_completo": "João Silva",
  "email": "joao@example.com",
  "telefone": "11987654321",
  "data_nascimento": "1990-05-15",
  "endereco": "Rua das Flores, 123"
}
```

### Buscar Cliente Específico

**Endpoint:** `GET /clientes/{cliente_id}/`

---

## 📝 Gerenciamento de Atendimentos

### Listar Atendimentos de um Cliente

**Endpoint:** `GET /clientes/{cliente_id}/atendimentos/`

### Registrar Novo Atendimento

**Endpoint:** `POST /clientes/{cliente_id}/atendimentos/`

```json
{
  "data_atendimento": "2026-01-17T14:30:00",
  "conteudo": "Sessão focada em ansiedade. Cliente apresentou melhora significativa.",
  "duracao_minutos": 50
}
```

---

## 🗂️ Estrutura do Projeto

```
prontuario-local/
├── backend/
│   ├── main.py              # API FastAPI
│   ├── config.py            # Configurações
│   ├── requirements.txt      # Dependências
│   ├── atendimentos.db       # Banco de dados (criado automaticamente)
│   └── venv/                # Ambiente virtual
├── frontend/
│   ├── login.html           # Tela de login
│   ├── index.html           # Dashboard
│   ├── script.js            # Lógica JavaScript
│   └── style.css            # Estilos
├── .gitignore               # Arquivos ignorados pelo Git
└── README.md                # Este arquivo
```

---

## 🔒 Segurança

### Práticas Implementadas

1. **Senhas Criptografadas** - Usando bcrypt com salt
2. **Tokens JWT** - Autenticação stateless
3. **Validação de Entrada** - Pydantic valida todos os dados
4. **Banco de Dados Local** - Nenhum dado é enviado para servidores
5. **HTTPS Pronto** - Código preparado para HTTPS em produção

### Recomendações

- ✅ Use senhas fortes (mínimo 6 caracteres)
- ✅ Guarde sua pergunta de segurança em local seguro
- ✅ Faça backup regularmente
- ✅ Não compartilhe seu computador com outras pessoas

---

## 📦 Dependências

| Pacote | Versão | Função |
|--------|--------|--------|
| FastAPI | 0.104.1 | Framework web |
| Uvicorn | 0.24.0 | Servidor ASGI |
| Pydantic | 2.5.0 | Validação de dados |
| Bcrypt | 4.0.1+ | Criptografia de senhas |
| PyJWT | 2.8.0 | Tokens JWT |

---

## 🚧 Roadmap

### ✅ Versão 1.0 (Atual)
- [x] Autenticação com username
- [x] Gerenciamento de clientes
- [x] Registro de atendimentos
- [x] Banco de dados local

### 🔄 Versão 1.1 (Em Desenvolvimento)
- [ ] Frontend (HTML/CSS/JS)
- [ ] Sincronização Google Drive
- [ ] Dashboard visual

### 📋 Versão 2.0 (Planejado)
- [ ] Versão Online (SaaS)
- [ ] Aplicativo Mobile
- [ ] Relatórios automáticos
- [ ] Integração com calendário

---

## 🤝 Contribuindo

Este é um projeto pessoal. Se encontrar bugs ou tiver sugestões, abra uma issue no GitHub.

---

## 📄 Licença

Propriedade de **Aura Intelligent Systems**

---

## 👨‍💻 Desenvolvedor

**Michelle Vieira de Oliveira (miPsyDev)**
- GitHub: [@miPsyDev](https://github.com/miPsyDev)
- Organização: [Aura Intelligent Systems](https://github.com/aura-sistemas-inteligentes)

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação da API em `/docs`
2. Abra uma issue no GitHub
3. Consulte o arquivo de configuração `config.py`

---

## 🎓 Aprendizados

Este projeto foi desenvolvido como parte de uma jornada de aprendizado em:
- FastAPI e desenvolvimento backend
- Autenticação e segurança
- Versionamento com Git
- Desenvolvimento Full Stack

---

**Versão:** 1.0.0  
**Última atualização:** 17 de janeiro de 2026  
**Status:** Em desenvolvimento ativo

## ⚖️ Licença

Este projeto é proprietário de **Aura Sistemas Inteligentes**.

Você pode:
- ✅ Estudar o código
- ✅ Fazer fork para aprender
- ✅ Contribuir com melhorias

Você NÃO pode:
- ❌ Vender o código
- ❌ Usar comercialmente sem permissão
- ❌ Remover atribuição
