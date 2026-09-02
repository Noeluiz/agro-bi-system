from app.main import MAX_ITENS_COMPRA


def test_purchase_item_limit_is_50():
    assert MAX_ITENS_COMPRA == 50
