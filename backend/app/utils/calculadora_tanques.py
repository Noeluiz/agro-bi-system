from decimal import Decimal, ROUND_FLOOR, ROUND_UP
from typing import Iterable


def calcular_tanques(area_total, vazao, capacidade_tanque, produtos: Iterable[dict]):
    """Calcula a divisão da calda em tanques cheios e no tanque parcial."""
    area_total = Decimal(str(area_total))
    vazao = Decimal(str(vazao))
    capacidade_tanque = Decimal(str(capacidade_tanque))
    if area_total <= 0 or vazao <= 0 or capacidade_tanque <= 0:
        raise ValueError("Área, vazão e capacidade do tanque devem ser positivas")

    ha_por_tanque = capacidade_tanque / vazao
    tanques = (area_total / ha_por_tanque).to_integral_value(rounding=ROUND_UP)
    total_tanques_cheios = int((area_total / ha_por_tanque).to_integral_value(rounding=ROUND_FLOOR))
    area_parcial = area_total - (Decimal(total_tanques_cheios) * ha_por_tanque)
    volume_tanque_parcial = area_parcial * vazao

    itens = []
    for produto in produtos:
        dose_ha = Decimal(str(produto["dose_ha"]))
        itens.append({
            "produto_id": produto.get("produto_id"),
            "dose_por_tanque_cheio": dose_ha * ha_por_tanque,
            "dose_por_tanque_parcial": dose_ha * area_parcial,
        })

    return {
        "ha_por_tanque": ha_por_tanque,
        "total_tanques": int(tanques),
        "total_tanques_cheios": total_tanques_cheios,
        "area_tanque_parcial": area_parcial,
        "volume_tanque_parcial": volume_tanque_parcial,
        "produtos": itens,
    }