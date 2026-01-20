from fastapi import FastAPI, HTTPException, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi import Header
from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime, timedelta
import sqlite3
import bcrypt
from typing import List, Optional
from fastapi.exceptions import ResponseValidationError
from fastapi.responses import PlainTextResponse
import jwt
from config import (
    DB_NAME, SECRET_KEY, ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES, CORS_ORIGINS,
    #ENABLE_GOOGLE_DRIVE_SYNC, SYNC_INTERVAL_SECONDS
)

# CONFIGURAÇÃO PRINCIPAL
app = FastAPI(
    title='API de Gestão de Atendimentos',
    description='Para gerenciar Clientes, Atendimentos e Agendamentos com segurança.',
    version='2.0.0  '
)

# MIDDLEARE E DEBUG
# IMPORTANTE: Quando vender para clientes, você vai mudar isso para: allow_origins=["https://seu-dominio.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
 )

@app.exception_handler(ResponseValidationError)
async def response_validation_exception_handler(request, exc):
    print(f'ERRO DE VALIDAÇÃO DA RESPOSTA para a requisição: {request.url}\nDetalhes: {exc}')
    return PlainTextResponse(str(exc), status_code=500)

# SEGURANÇA HTTP
security = HTTPBearer()

# MODELOS DE 

# MODELO DE USUARIO - P CADASTRO 
class UsuarioCadastro(BaseModel):
    username: str # = Field(..., min_length=3, max_length=50)
    nome: str # = Field(..., min_length=3, max_length=150)
    senha: str # = Field(..., min_length=6)
    pergunta_seguranca: str # = Field(..., min_length=5)
    resposta_seguranca: str # = Field(..., min_length=2)

    @field_validator('username')
    @classmethod
    def validar_username(cls, v):
        if not v.replace('_','').replace('-','').isalnum():
            raise ValueError('Username pode conter apenas letras, números, _ e -')
        return v.lower()
    
# MODELO DE USUÁRIO - PARA LOGIN
class UsuarioLogin(BaseModel):
    username: str
    senha: str

# MODELO PARA RECUPERAÇÃO DE SENHA
class RecuperacaoSenha(BaseModel):
    username: str
    resposta_seguranca: str
    nova_senha: str = Field(..., min_length=6)

class UsuarioResponse(BaseModel):
    id: int
    username: str
    nome: str
    data_criacao: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str 
    usuario: UsuarioResponse

# MODELO DE CLIENTE
class Cliente(BaseModel):
    nome_completo: str # = Field(..., min_length=3, max_length=150)
    email: str
    telefone: str #  = Field(..., min_length=10, max_length=20)
    data_nascimento: date
    endereco: Optional[str] = None

    @field_validator('data_nascimento')
    @classmethod
    def validar_data_nascimento(cls, v: date):
        if v > date.today():
            raise ValueError('A data de nascimento não pode ser no futuro.')
        return v
    
class ClienteResponse(Cliente):
    id: int
    codigo_cliente: str
    status: str

# MODELO DE ATENDIMENTO
class Atendimento(BaseModel):
    data_atendimento: date
    conteudo: str = Field(..., min_length=5, max_length=5000)
    duracao_minutos: int = Field(..., ge=15, le=480)

class AtendimentoResponse(Atendimento):
    id: int
    cliente_id: int
    data_registro: datetime

class SessaoResponse(BaseModel):
    id: int
    cliente_id: int
    data_sessao: date
    conteudo: str
    duracao_minutos: int


# FUNÇÕES AUXILIARES

# DB_NAME = 'atendimentos.db'
# mudar isso depois para suportar múltiplos bancos (um por cliente):
#  DB_NAME = f'{profissional_id}_atendimentos.db'

# FUNÇÕES AUXILIARES
def criar_tabelas():
    """CRIA TABELAS DE DATABASE - BANCO DE DADOS"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # TABELA DE USUÁRIOS
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL,
            senha_hash TEXT NOT NULL,
            pergunta_seguranca TEXT NOT NULL,
            resposta_seguranca_hash TEXT NOT NULL,
            data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ''') 
    # TABELA DE CLIENTES
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS clientes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            codigo_cliente TEXT NOT NULL UNIQUE,
            nome_completo TEXT NOT NULL,
            email TEXT UNIQUE,
            telefone TEXT,
            data_nascimento DATE NOT NULL,
            endereco TEXT,
            status TEXT NOT NULL DEFAULT 'ativo',
            data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        );
    ''')
    # TABELA DE ATENDIMENTOS
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS atendimentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            cliente_id INTEGER NOT NULL,
            data_atendimento DATE NOT NULL,
            conteudo TEXT NOT NULL,
            duracao_minutos INTEGER NOT NULL,
            data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
            FOREIGN KEY (cliente_id) REFERENCES clientes (id)
        );
    ''')

    # ============================================
    # CRIAR ÍNDICES PARA PERFORMANCE
    # ============================================
    
    # Índice para buscar clientes por usuário
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_clientes_usuario ON clientes(usuario_id)")
    
    # Índice para buscar atendimentos por usuário
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_atendimentos_usuario ON atendimentos(usuario_id)")
    
    # Índice para buscar atendimentos por cliente
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_atendimentos_cliente ON atendimentos(cliente_id)")
    
    # Índice composto para buscas mais rápidas
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_atendimentos_usuario_cliente ON atendimentos(usuario_id, cliente_id)")
    
    # Índice para ordenação por data
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_atendimentos_data ON atendimentos(data_atendimento DESC)")
    
    # Índice para buscar clientes por status
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(status)")

    conn.commit()
    conn.close()

def obter_conexao():
    """ABRE CONEXÃO COM O BANDO DE DADOS"""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def hash_senha(senha: str) -> str: #CRIPTOGRAFA COM BCRYPT
    return bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verificar_senha(senha: str, senha_hash: str) -> bool: # VERIFICA DE A SENHA CORRESPONDE AO HASH
    return bcrypt.checkpw(senha.encode('utf-8'), senha_hash.encode('utf-8'))

def criar_token_jwt(usuario_id: int, username: str) -> str:# CRIA UM TOKEN JWT PARA AUTENTICAÇÃO
    payload = {
        'usuario_id': usuario_id,
        'username': username,
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token

def verificar_token_jwt(token: str) -> dict: #VERIFICA E CODIFICA O TOKEN JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='Token expirado.')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='Token inválido.')

def obter_usuario_atual(authorization: str = Header(None)) -> dict: # DEPENDENCY PARA OBTER O USUÁRIO AUTENTICADO
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail='Token não fornecido.')
    token = authorization.split(" ")[1]  # Assume Bearer token
    return verificar_token_jwt(token)

def formatar_cliente(row) -> ClienteResponse: # FORMATA DADOS DO CLIENTE PARA RESPOSTA
    return ClienteResponse(
        id=row['id'],
        codigo_cliente=row['codigo_cliente'],
        nome_completo=row['nome_completo'],
        email=row['email'],
        telefone=row['telefone'],
        data_nascimento=row['data_nascimento'],
        endereco=row['endereco'],
        status=row['status']
    )

def formatar_atendimento(row) -> AtendimentoResponse: # FORMATA DADOS DO ATENDIMENTO PARA RESPOSTA
    return AtendimentoResponse(
        id=row['id'],
        cliente_id=row['cliente_id'],
        data_atendimento=row['data_atendimento'],
        conteudo=row['conteudo'],
        duracao_minutos=row['duracao_minutos'],
        data_registro=row['data_registro']
    )

# ROTAS DE AUTENTICACAO
router = APIRouter()

@router.post("/auth/cadastro", response_model=TokenResponse, status_code=201)
def cadastrar_usuario(usuario: UsuarioCadastro):
    """CADASTRA UM NOVO USUÁRIO"""
    conn = obter_conexao()
    cursor = conn.cursor()

    # VERIFICA SE O USERNAME JÁ ESTÁ CADASTRADO
    cursor.execute("SELECT id FROM usuarios WHERE username = ?", (usuario.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username já cadastrado.")

    # CRIPTOGRAFA A SENHA E RESPOSTA DE SEGURANÇA
    senha_hash = hash_senha(usuario.senha)
    resposta_hash = hash_senha(usuario.resposta_seguranca.lower())

    # INSERE O NOVO USUÁRIO
    try:
        cursor.execute(
            """INSERT INTO usuarios (username, nome, senha_hash, pergunta_seguranca, resposta_seguranca_hash, data_criacao) 
            VALUES (?, ?, ?, ?, ?, ?)""",
            (usuario.username, usuario.nome, senha_hash, usuario.pergunta_seguranca, resposta_hash, datetime.now().isoformat())
        )
        conn.commit()
        usuario_id = cursor.lastrowid
    except sqlite3.Error as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao cadastrar usuário: {str(e)}")
    finally:
        conn.close()

    #  CRIA TOKEN JWT
    token = criar_token_jwt(usuario_id, usuario.username)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        usuario=UsuarioResponse(
            id=usuario_id,
            username=usuario.username,
            nome=usuario.nome,
            data_criacao=datetime.now()
        )
    )

@router.post("/auth/login", response_model=TokenResponse)
def fazer_login(usuario: UsuarioLogin):
    """FAZ LOGIN DO USUÁRIO"""
    conn = obter_conexao()
    cursor = conn.cursor()

    # BUSCA USUARIO POR USERNAME
    cursor.execute("SELECT id, username, nome, senha_hash FROM usuarios WHERE username = ?", (usuario.username,))
    usuario_db = cursor.fetchone()
    conn.close()

    if not usuario_db:
        raise HTTPException(status_code=401, detail="Username ou senha incorretos")
    
    # VERIFICA SENHA
    if not verificar_senha(usuario.senha, usuario_db['senha_hash']):
        raise HTTPException(status_code=401, detail="Username ou senha incorretos")

    # CRIA TOKEN JWT
    token = criar_token_jwt(usuario_db['id'], usuario_db['username'])

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        usuario=UsuarioResponse(
            id=usuario_db['id'],
            username=usuario_db['username'],
            nome=usuario_db['nome'],
            data_criacao=datetime.now()
        )
    )

@router.post("/auth/recuperar-senha")
def recuperar_senha(recuperacao: RecuperacaoSenha):
    """RECUPERAÇÃO DE SENHA DO USUÁRIO USANDO A PERGUNTA DE SEGURANÇA"""
    conn = obter_conexao()
    cursor = conn.cursor()

    # BUSCA USUÁRIO
    cursor.execute(
        "SELECT id, resposta_seguranca_hash FROM usuarios WHERE username = ?", 
        (recuperacao.username,)
    )
    usuario_db = cursor.fetchone()

    if not usuario_db:
        conn.close()
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # VERIFICA RESPOSTA DE SEGURANÇA
    if not verificar_senha(recuperacao.resposta_seguranca.lower(), usuario_db['resposta_seguranca_hash']):
        conn.close()
        raise HTTPException(status_code=401, detail="Resposta de segurança incorreta")

    # ATUALIZA A SENHA
    nova_senha_hash = hash_senha(recuperacao.nova_senha)
    try:
        cursor.execute(
            "UPDATE usuarios SET senha_hash = ? WHERE id = ?",
            (nova_senha_hash, usuario_db['id'])
        )
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao atualizar senha: {str(e)}")
    finally:
        conn.close()

    return {"detail": "Senha atualizada com sucesso."}
    
# ROTAS DE CLIENTES

@router.get("/clientes/", response_model=List[ClienteResponse])
def listar_clientes(usuario_atual: dict = Depends(obter_usuario_atual)):
    """Lista todos os clientes do usuário autenticado"""
    conn = obter_conexao()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM clientes WHERE usuario_id = ? AND status = 'ativo' ORDER BY nome_completo", (usuario_atual['usuario_id'],))
    clientes = cursor.fetchall()
    conn.close()
    
    return [formatar_cliente(cliente) for cliente in clientes]



@router.get("/clientes/aniversariantes-proximos-30-dias/", response_model=List[ClienteResponse])
def listar_aniversariantes(usuario_atual: dict = Depends(obter_usuario_atual)):
    """Lista clientes com aniversário nos próximos 30 dias"""
    conn = obter_conexao()
    cursor = conn.cursor()
    
    hoje = date.today()
    daqui_30_dias = hoje + timedelta(days=30)
    
    # Busca todos os clientes ativos
    cursor.execute("""
        SELECT * FROM clientes 
        WHERE usuario_id = ? AND status = 'ativo'
        ORDER BY strftime('%m-%d', data_nascimento)
    """, (usuario_atual['usuario_id'],))
    
    clientes = cursor.fetchall()
    conn.close()
    
    # Filtra apenas aniversariantes dos próximos 30 dias
    aniversariantes = []
    for cliente in clientes:
        try:
            data_nasc = datetime.strptime(cliente['data_nascimento'], '%Y-%m-%d').date()
            # Próximo aniversário deste ano
            proximo_aniv = data_nasc.replace(year=hoje.year)
            
            # Se já passou este ano, próximo é no ano que vem
            if proximo_aniv < hoje:
                proximo_aniv = proximo_aniv.replace(year=hoje.year + 1)
            
            # Se está nos próximos 30 dias, inclui
            if hoje <= proximo_aniv <= daqui_30_dias:
                aniversariantes.append(formatar_cliente(cliente))
        except Exception as e:
            print(f"Erro ao processar cliente {cliente['id']}: {e}")
            continue
    
    return aniversariantes

@router.post("/clientes/", response_model=ClienteResponse, status_code=201)
def cadastrar_cliente(cliente: Cliente, usuario_atual: dict = Depends(obter_usuario_atual)):
    """Cadastra um novo Cliente"""
    conn = obter_conexao()
    cursor = conn.cursor()

    # GERA CÓDIGO ÚNICO PARA O CLIENTE
    ano_atual = date.today().year
    cursor.execute(
        "SELECT COUNT(*) as total FROM clientes WHERE usuario_id = ? AND codigo_cliente LIKE ?",
        (usuario_atual['usuario_id'], f"{ano_atual}/%")
    )
    total_no_ano = cursor.fetchone()['total']
    novo_codigo = f"{ano_atual}/{total_no_ano + 1:04d}"

    try:
        cursor.execute(
            """INSERT INTO clientes
            (usuario_id, codigo_cliente, nome_completo, email, telefone, data_nascimento, endereco, data_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (usuario_atual['usuario_id'], novo_codigo, cliente.nome_completo, cliente.email, 
            cliente.telefone, cliente.data_nascimento, cliente.endereco, datetime.now().isoformat())
        )
        conn.commit()
        novo_id = cursor.lastrowid
    except sqlite3.IntegrityError as e:
        conn.close()
        if 'email' in str(e):
            raise HTTPException(status_code=400, detail=f"Email '{cliente.email}' já cadastrado")
        raise HTTPException(status_code=400, detail="Erro ao cadastrar cliente")
    finally:
        conn.close()

    dados_criados = cliente.model_dump()
    dados_criados.update({'id': novo_id, 'codigo_cliente': novo_codigo, 'status': 'ativo'})
    return dados_criados

@router.get("/clientes/{cliente_id}/", response_model=ClienteResponse)
def buscar_cliente(cliente_id: int, usuario_atual: dict = Depends(obter_usuario_atual)):
    """Busca um Cliente específico"""
    conn = obter_conexao()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM clientes WHERE id = ? AND usuario_id = ?",
        (cliente_id, usuario_atual['usuario_id'])
    )
    cliente = cursor.fetchone()
    conn.close()

    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    return formatar_cliente(cliente)

# ROTAS DE ATENDIMENTOS
@router.get("/clientes/{cliente_id}/atendimentos/", response_model=List[AtendimentoResponse])
def listar_atendimentos(cliente_id: int, usuario_atual: dict = Depends(obter_usuario_atual)):
    """Lista de atendimentos de um cliente"""
    conn = obter_conexao()
    cursor = conn.cursor()

    # VERIFICA SE O CLIENTE PERTENCE AO USUARIO
    cursor.execute(
        "SELECT id FROM clientes WHERE id = ? AND usuario_id = ?",
        (cliente_id, usuario_atual['usuario_id'])
    )
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    cursor.execute(
        "SELECT * FROM atendimentos WHERE cliente_id=? AND usuario_id = ? ORDER BY data_atendimento DESC",
        (cliente_id, usuario_atual['usuario_id'])
    )
    atendimentos = cursor.fetchall()
    conn.close()

    return [formatar_atendimento(atendimento) for atendimento in atendimentos]

@router.post("/clientes/{cliente_id}/atendimentos/", response_model=AtendimentoResponse, status_code=201)
def criar_atendimento(cliente_id: int, atendimento: Atendimento, usuario_atual: dict = Depends(obter_usuario_atual)):
    """Criar um novo atendimento"""
    conn = obter_conexao()
    cursor = conn.cursor()

    # VERIFICA SE CLIENTE PERTENCE AO USUARIO
    cursor.execute(
        "SELECT id FROM clientes WHERE id = ? AND usuario_id = ?",
        (cliente_id, usuario_atual['usuario_id'])
    )
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    try:
        cursor.execute(
            """INSERT INTO atendimentos
                (usuario_id, cliente_id, data_atendimento, conteudo, duracao_minutos, data_registro)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (usuario_atual['usuario_id'], cliente_id, atendimento.data_atendimento,
                atendimento.conteudo, atendimento.duracao_minutos, datetime.now().isoformat())
        )
        conn.commit()
        novo_id = cursor.lastrowid
    except sqlite3.Error as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao criar atendimento: {str(e)}")
    finally:
        conn.close()

    dados_criados = atendimento.model_dump()
    dados_criados.update({'id': novo_id, 'cliente_id': cliente_id, 'data_registro': datetime.now().isoformat()})
    return dados_criados

@router.get("/clientes/{cliente_id}/sessoes/", response_model=List[AtendimentoResponse])
def listar_sessoes_cliente(cliente_id: int, usuario_atual: dict = Depends(obter_usuario_atual)):
    """Lista todas as sessões de um cliente"""
    conn = obter_conexao()
    cursor = conn.cursor()
    
    # VERIFICA SE O CLIENTE PERTENCE AO USUARIO
    cursor.execute(
        "SELECT id FROM clientes WHERE id = ? AND usuario_id = ?",
        (cliente_id, usuario_atual['usuario_id'])
    )
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    cursor.execute("SELECT * FROM atendimentos WHERE cliente_id = ? AND usuario_id = ? ORDER BY data_atendimento DESC", (cliente_id, usuario_atual['usuario_id']))
    sessoes = cursor.fetchall()
    conn.close()
    
    return [formatar_atendimento(sessao) for sessao in sessoes]


@router.post("/clientes/{cliente_id}/sessoes/", response_model=AtendimentoResponse, status_code=201)
def criar_sessao_cliente(cliente_id: int, sessao: Atendimento, usuario_atual: dict = Depends(obter_usuario_atual)):
    """Cria uma nova sessão para um cliente"""
    conn = obter_conexao()
    cursor = conn.cursor()
    
    # VERIFICA SE O CLIENTE PERTENCE AO USUARIO
    cursor.execute(
        "SELECT id FROM clientes WHERE id = ? AND usuario_id = ?",
        (cliente_id, usuario_atual['usuario_id'])
    )
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    
    try:
        cursor.execute(
            """INSERT INTO atendimentos (usuario_id, cliente_id, data_atendimento, conteudo, duracao_minutos, data_registro)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (usuario_atual['usuario_id'], cliente_id, sessao.data_atendimento, sessao.conteudo, sessao.duracao_minutos, datetime.now().isoformat())
        )
        conn.commit()
        sessao_id = cursor.lastrowid
    except sqlite3.Error as e:
        conn.close()
        raise HTTPException(status_code=400, detail=f"Erro ao criar sessão: {str(e)}")
    finally:
        conn.close()
    
    dados_criados = sessao.model_dump()
    dados_criados.update({'id': sessao_id, 'cliente_id': cliente_id, 'data_registro': datetime.now().isoformat()})
    return dados_criados


# INICIALIZAÇÃO  -- Para rodar: uvicorn main:app --reload
app.include_router(router)
criar_tabelas()


