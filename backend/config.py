import os
from datetime import timedelta

# Bando de Dados
DB_NAME = 'atendimentos.db'
#DB_PATH = os.path.join(os.dirname(__file__), DB_NAME)

# Segurança - JWT (autenticação)
SECRET_KEY = "sua_chave_secreta_aqui-mude"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# CRIPTOGRAFIA DO DB
CIPTHER_SUITE_PASSWORD = "senha-padrao-criptografada" #será substituída pela senha do usuário

# CORS
CORS_ORIGINS = ["*"] # EM PRODUÇÃO, MUDE PARA DOMÍNIOS ESPECÍFICOS

# SINCRONIZAÇÃO DO GOOGLE DRIVE
SYNC_INTERVAL_SECONDS = 300  # 5 minutos
ENABLE_GOOGLE_DRIVE_SYNC = False  # Defina como True para ativar a sincronização
