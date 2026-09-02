from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import main, schemas
from app.auth import hash_senha
from app.database import Base, get_db
from app.models import Usuario


CSRF_TOKEN = "test-csrf-token"


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    admin = Usuario(
        nome="Administrador de Teste",
        email="admin@test.local",
        senha_hash=hash_senha("senha-incorreta-de-teste"),
        role="ADMIN",
        created_at=datetime.utcnow(),
    )
    session.add(admin)
    session.commit()
    session.close()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app = main.app
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[main.require_admin] = lambda: admin
    storage = app.state.limiter._storage
    storage.reset()

    test_client = TestClient(app)
    yield test_client
    test_client.close()

    storage.reset()
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


def _login(client, password="senha-errada"):
    client.cookies.set("agro_bi_csrf", CSRF_TOKEN)
    return client.post(
        "/api/auth/login",
        data={"username": "admin@test.local", "password": password},
        headers={"X-CSRF-Token": CSRF_TOKEN},
    )


def test_login_lockout_after_five_failed_attempts(client):
    responses = [_login(client) for _ in range(5)]

    assert [response.status_code for response in responses] == [401, 401, 401, 401, 429]
    assert "bloqueada" in responses[-1].json()["detail"]
    blocked_response = _login(client, password="senha-incorreta-de-teste")
    assert blocked_response.status_code == 429


@pytest.mark.parametrize("value", ["-1", "NaN", "Infinity"])
def test_product_validation_rejects_negative_nan_and_infinity(value):
    payload = {
        "nome": "Produto de teste",
        "categoria_id": 1,
        "fornecedor_id": 1,
        "estoque_atual": "1",
        "estoque_minimo": "1",
        "preco_custo": value,
        "preco_venda": "2",
        "unidade_medida": "kg",
    }

    with pytest.raises(ValidationError):
        schemas.ProdutoBase(**payload)


def test_csrf_is_required_for_login_and_logout(client):
    login_without_csrf = client.post(
        "/api/auth/login",
        data={"username": "admin@test.local", "password": "senha-errada"},
    )
    logout_without_csrf = client.post("/api/auth/logout")

    assert login_without_csrf.status_code == 403
    assert logout_without_csrf.status_code == 403


def test_creation_route_returns_429_after_rate_limit(client):
    responses = [
        client.post("/api/categorias", json={"nome": f"Categoria de teste {index}"})
        for index in range(21)
    ]

    assert all(response.status_code == 200 for response in responses[:20])
    assert responses[-1].status_code == 429