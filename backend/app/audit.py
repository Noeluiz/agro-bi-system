"""Registro simples de auditoria das operações administrativas."""

import logging
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Log, LogAcesso

logger = logging.getLogger(__name__)


def registrar_log(usuario_id: int, acao: str, detalhes: Optional[str] = None) -> None:
    """Persiste um evento de auditoria sem interromper a operação principal."""
    db = SessionLocal()
    try:
        db.add(Log(usuario_id=usuario_id, acao=acao, detalhes=detalhes))
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Erro ao registrar log de auditoria: %s", exc)
    finally:
        db.close()


def registrar_log_acesso(email_usuario: str, acao: str, ip_origem: str, detalhes: Optional[str] = None, user_agent: Optional[str] = None) -> None:
    """Registra acesso, logout e tentativas falhas para monitoramento e conformidade."""
    db = SessionLocal()
    try:
        db.add(
            LogAcesso(
                email_usuario=email_usuario or "unknown",
                acao=acao,
                ip_origem=ip_origem or "unknown",
                detalhes=detalhes,
                user_agent=user_agent,
            )
        )
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Erro ao registrar log de acesso: %s", exc)
    finally:
        db.close()


def limpar_logs_antigos_90_dias(db: Session, dias: int = 90) -> int:
    """LGPD: logs de acesso antigos devem ser removidos ou arquivados após 90 dias."""
    limite = datetime.utcnow() - timedelta(days=dias)
    removidos = db.query(LogAcesso).filter(LogAcesso.data_hora < limite).delete(synchronize_session=False)
    db.commit()
    return removidos
