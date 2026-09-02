import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Request, Response, status
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
CSRF_COOKIE_NAME = os.getenv("CSRF_COOKIE_NAME", "agro_bi_csrf")
CSRF_HEADER_NAME = os.getenv("CSRF_HEADER_NAME", "X-CSRF-Token")
IS_PRODUCTION = (
    os.getenv("ENVIRONMENT", "").lower() == "production"
    or bool(os.getenv("RAILWAY_ENVIRONMENT_NAME"))
    or bool(os.getenv("RAILWAY_SERVICE_NAME"))
)
COOKIE_SECURE = True if IS_PRODUCTION else os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "none" if IS_PRODUCTION else "lax").lower()
if COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    COOKIE_SAMESITE = "lax" if not IS_PRODUCTION else "none"
if COOKIE_SAMESITE == "none":
    COOKIE_SECURE = True
REVOKED_TOKENS = set()

if len(SECRET_KEY.encode("utf-8")) < 32:
    raise RuntimeError(
        "SECRET_KEY muito curta. Use pelo menos 32 bytes (ex.: `openssl rand -hex 32`)."
    )

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
    to_encode["jti"] = secrets.token_urlsafe(32)
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def revoke_token(token: str) -> bool:
    """Adiciona um token à blacklist para invalidá-lo imediatamente."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
    except jwt.PyJWTError:
        return False

    jti = payload.get("jti")
    if not jti:
        return False

    REVOKED_TOKENS.add(jti)
    return True


def decode_access_token(token: str) -> dict:
    """Decodifica e valida o JWT. Levanta exceção se inválido/expirado ou revogado."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    if payload.get("jti") in REVOKED_TOKENS:
        raise jwt.InvalidTokenError("Token revogado")
    return payload


def generate_csrf_token() -> str:
    """Gera um token CSRF para proteger login/logout."""
    return secrets.token_urlsafe(32)


def validate_csrf_token(request: Request) -> None:
    """Exige a presença de um token CSRF válido para ações sensíveis."""
    sent = request.headers.get(CSRF_HEADER_NAME, "")
    cookie_value = request.cookies.get(CSRF_COOKIE_NAME, "")
    if not sent or not cookie_value or sent != cookie_value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token CSRF inválido ou ausente.",
        )


def set_csrf_cookie(response: Response, token: Optional[str] = None) -> str:
    """Define o cookie CSRF no cliente e retorna o valor usado."""
    csrf_token = token or generate_csrf_token()
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=60 * 30,
        path="/",
    )
    return csrf_token


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
