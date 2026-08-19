"""Comando manual para garantir os dados de demonstração do Agro-BI."""

from app.database import init_db
from app.main import criar_categorias_iniciais, criar_dados_demonstracao, criar_usuarios_iniciais


def main():
    init_db()
    criar_categorias_iniciais()
    criar_usuarios_iniciais()
    criar_dados_demonstracao()
    print("Dados de demonstração verificados/criados com sucesso.")


if __name__ == "__main__":
    main()