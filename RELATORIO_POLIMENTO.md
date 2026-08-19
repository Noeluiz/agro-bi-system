# Relatório de Polimento do Sistema

Data: 19/08/2026

## CRUD e integridade

- Adicionada a rota administrativa `DELETE /api/produtos/{produto_id}`.
- Produtos com compras, aplicações, ordens ou alertas vinculados não são excluídos, preservando o histórico.
- Adicionada a rota administrativa `DELETE /api/fluxo-caixa/{fluxo_id}`, usada pela tela Financeiro.
- Adicionada a rota administrativa `DELETE /api/safras/{safra_id}`; safras com aplicações vinculadas são protegidas.
- Adicionada a rota administrativa `DELETE /api/ordens-aplicacao/{ordem_id}`.
- Ao excluir uma ordem, as quantidades consumidas são devolvidas ao estoque na mesma transação.
- Estoque, Safras e Ordens de Aplicação receberam botões de lixeira condicionados ao papel ADMIN, com confirmação e tratamento de erro.

## PDF de aplicação

- Cabeçalho com identidade Agro-BI e verde escuro `#047857`.
- Espaçamento, hierarquia tipográfica e tabelas com linhas alternadas melhorados.
- Rodapé com data, identificação da ordem e número da página.
- Textos inseridos em parágrafos ReportLab são escapados para evitar interpretação indevida de marcação.

## Onboarding

- O tour agora indica visualmente o alvo de cada passo com seta e destaque.
- Ações levam diretamente a Estoque, Safras, Ordens de Aplicação e Movimentações.
- Textos orientam o fluxo de uso com mais contexto.
- Adicionado `Pular tutorial`, mantendo o controle por usuário no `localStorage`.

## Validação

- Backend validado com `py_compile`.
- Frontend validado com `npm run build`.
- Diagnósticos estáticos executados nos arquivos alterados.