"""Registro simples de auditoria das operações administrativas."""

import logging
from typing import Optional

from app.database import SessionLocal
from app.models import Log

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
