import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Carregar variáveis de ambiente do .env
from dotenv import load_dotenv
load_dotenv()

# Importar os modelos explicitamente
from src.db.models.usuario_model import Usuario
from src.db.models.noticia_model import Noticia
from src.db.models.fonte_model import Fonte
from src.db.models.curtir_model import Curtir
from src.db.models.refresh_tokens_model import RefreshToken

# Importar o metadata da Base para usar nas migrações
from src.db.database import Base
target_metadata = Base.metadata

# Carregar as variáveis de ambiente
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

# Construir a URL de conexão com o PostgreSQL
DATABASE_URL = f"postgresql+psycopg2://{USER}:{PASSWORD}@{HOST}:{PORT}/{DBNAME}?sslmode=require"

# Objeto de configuração do Alembic
config = context.config

# Substituir a URL definida no alembic.ini pela que foi montada dinamicamente
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Configurar logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Função para executar as migrações em modo offline
def run_migrations_offline() -> None:
    """
    Executa as migrações no modo 'offline'.
    Esse modo não precisa de uma conexão real com o banco de dados.
    Apenas gera os scripts SQL.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

# Função para executar as migrações no modo online
def run_migrations_online() -> None:
    """
    Executa as migrações no modo 'online'.
    Neste modo, uma conexão real com o banco de dados é criada.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

# Verifica se o modo atual é offline ou online
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
