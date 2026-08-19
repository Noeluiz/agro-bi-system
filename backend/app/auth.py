import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Usuario

# ---------------------------------------------------------------------
# Configuração de Segurança
# ---------------------------------------------------------------------

# SECRET_KEY é OBRIGATÓRIA via variável de ambiente.
# Não há fallback hardcoded — se não for definida, o servidor falha ao subir.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "Variável de ambiente SECRET_KEY não definida. "
        "Defina uma chave forte (ex.: `openssl rand -hex 32`) antes de iniciar o servidor."
    )

ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "agro_bi_token")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "strict")

# Contexto de hash de senha usando bcrypt via passlib
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Esquema OAuth2 para leitura do header: Authorization: Bearer <TOKEN>
# (auto_error=False para permitir autenticação também via cookie)
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False,
)


# ---------------------------------------------------------------------
# Hash de senhas
# ---------------------------------------------------------------------

def hash_senha(senha: str) -> str:
    """Gera o hash bcrypt de uma senha."""
    return pwd_context.hash(senha)


def verificar_senha(senha_plano: str, senha_hash: str) -> bool:
    """Verifica se a senha em texto plano corresponde ao hash armazenado."""
    try:
        return pwd_context.verify(senha_plano, senha_hash)
    except Exception:
        return False


# ---------------------------------------------------------------------
# Geração e validação de JWT
# ---------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Cria um JWT assinado cobrindo e-mail e role."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """Decodifica e valida o JWT. Levanta exceção se inválido/expirado."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


def _extrair_token(request: Request) -> Optional[str]:
    """
    Extrai o token JWT do cabeçalho 'Authorization: Bearer <TOKEN>' ou do
    cookie HttpOnly. Retorna None se não houver token.
    """
    # 1) Tenta o header Authorization: Bearer <TOKEN>
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1].strip()

    # 2) Tenta o cookie HttpOnly
    token = request.cookies.get(COOKIE_NAME)
    if token:
        return token.strip()

    return None


# ---------------------------------------------------------------------
# Dependências de segurança (FastAPI)
# ---------------------------------------------------------------------

def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Lê o token JWT do header 'Authorization: Bearer <TOKEN>' ou do cookie
    HttpOnly, decodifica e valida o e-mail. Retorna o usuário autenticado
    ou levanta HTTP 401.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # O token pode vir do header (via oauth2_scheme) ou do cookie.
    token_final = token or _extrair_token(request)
    if not token_final:
        raise credentials_exception

    try:
        payload = decode_access_token(token_final)
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = db.query(Usuario).filter(Usuario.email == email).first()
    if user is None or not user.ativo:
        raise credentials_exception
    return user


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    """
    Dependência de nível de acesso: exige role 'ADMIN'.
    Se o usuário for 'GERENTE' (ou outro), retorna HTTP 403 Forbidden.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Apenas administradores podem acessar este recurso.",
        )
    return current_user
