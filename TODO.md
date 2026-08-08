# Implementação de Autenticação JWT + RBAC ✅

## Backend ✅
- [x] 1. Adicionar dependências `passlib[bcrypt]` e `pyjwt` em requirements.txt (+ pin bcrypt 4.0.1)
- [x] 2. Criar modelo `Usuario` em models.py
- [x] 3. Adicionar schemas de autenticação em schemas.py
- [x] 4. Criar auth.py (JWT + dependências de segurança)
- [x] 5. Atualizar main.py (login, seed users, proteção de rotas)
- [x] 6. Adicionar tabela `usuarios` ao init-db.sql (seed via startup do backend p/ hashes bcrypt corretos)

## Frontend ✅
- [x] 7. Criar auth.js (helpers de token/logout)
- [x] 8. Criar Login.jsx (tela de login Agro Clean)
- [x] 9. Atualizar App.jsx (proteção + RBAC condicional)
- [x] 10. Atualizar Sidebar.jsx (nav por role + botão Sair)

## Infra ✅
- [x] 11. Rodar `docker compose up --build -d`
  - Login admin@agro.com ✅
  - Login gerente@agro.com ✅
  - GERENTE → /api/bi/metricas = 403 ✅
  - GERENTE → /api/produtos = 200 ✅
  - ADMIN → /api/bi/metricas = 200 ✅
  - ADMIN → /api/funcionarios = 200 ✅
  - Sem token → /api/produtos = 401 ✅
  - Frontend HTTP 200 ✅

## Responsividade (Mobile/Tablet/Desktop) ✅
- [x] 12. Sidebar fixa no desktop (`hidden md:flex`), drawer/menu hambúrguer no mobile
- [x] 13. Botão de menu flutuante (hambúrguer) no header mobile
- [x] 14. Cards superiores com grid adaptável `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- [x] 15. Gráficos Recharts com `width="100%"` e `height={300}`, container empilha no mobile (`flex flex-col lg:flex-row`)
- [x] 16. Tabelas com `overflow-x-auto` para arrastar no mobile
- [x] 17. Rebuild do frontend e verificação (HTTP 200, vite compilou sem erros)
