from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
import os
import logging

logger = logging.getLogger(__name__)

# DATABASE_URL é OBRIGATÓRIA via variável de ambiente.
# Não há fallback hardcoded com senhas em produção.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "Variável de ambiente DATABASE_URL não definida. "
        "Defina a URL de conexão do PostgreSQL (EXEMPLO: "
        "postgresql+pg8000://usuario:senha@host:5432/banco) antes de iniciar o servidor."
    )


def _forcar_ssl_postgres(url: str) -> str:
    """Exige SSL/TLS em conexões PostgreSQL para evitar interceptação em trânsito."""
    if url.startswith(("postgresql://", "postgresql+psycopg2://", "postgresql+pg8000://", "postgresql+asyncpg://")):
        if "sslmode=" not in url:
            separator = "&" if "?" in url else "?"
            return f"{url}{separator}sslmode=require"
    return url


DATABASE_URL = _forcar_ssl_postgres(DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables and apply additive compatibility migrations."""
    Base.metadata.create_all(bind=engine)
    _aplicar_migracoes_aditivas()


def _aplicar_migracoes_aditivas():
    """Mantém instalações existentes compatíveis sem remover ou reescrever dados."""
    inspector = inspect(engine)
    colunas_safra = {coluna["name"] for coluna in inspector.get_columns("safras")}
    colunas_usuario = {coluna["name"] for coluna in inspector.get_columns("usuarios")}

    with engine.begin() as connection:
        if "producao_total" not in colunas_safra:
            connection.execute(text("ALTER TABLE safras ADD COLUMN producao_total NUMERIC(12, 2)"))
        if "custo_total" not in colunas_safra:
            connection.execute(text("ALTER TABLE safras ADD COLUMN custo_total NUMERIC(12, 2)"))
        if "ativo" not in colunas_usuario:
            connection.execute(text("ALTER TABLE usuarios ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE"))
        if "falhas_login" not in colunas_usuario:
            connection.execute(text("ALTER TABLE usuarios ADD COLUMN falhas_login INTEGER NOT NULL DEFAULT 0"))
        if "bloqueado_ate" not in colunas_usuario:
            connection.execute(text("ALTER TABLE usuarios ADD COLUMN bloqueado_ate TIMESTAMP NULL"))

        connection.execute(text("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS ck_usuarios_role"))
        connection.execute(text(
            "ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_role "
            "CHECK (role IN ('ADMIN', 'GERENTE', 'OPERADOR'))"
        ))

        restricoes_unicas = inspector.get_unique_constraints("fornecedores")
        indices = inspector.get_indexes("fornecedores")
        nome_ja_unico = any("nome" in (item.get("column_names") or []) for item in restricoes_unicas)
        nome_ja_unico = nome_ja_unico or any(
            item.get("unique") and "nome" in (item.get("column_names") or []) for item in indices
        )
        if not nome_ja_unico:
            duplicata = connection.execute(
                text("SELECT nome FROM fornecedores GROUP BY nome HAVING COUNT(*) > 1 LIMIT 1")
            ).first()
            if duplicata:
                logger.warning("Índice único de fornecedores não criado: nome duplicado '%s'", duplicata[0])
            else:
                connection.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS uq_fornecedores_nome ON fornecedores (nome)"))
