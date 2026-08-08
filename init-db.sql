-- Seed data for Agro-Tech BI System
-- Creates tables and populates with realistic agricultural data

CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(100),
    telefone VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    categoria_id INTEGER NOT NULL REFERENCES categorias(id),
    fornecedor_id INTEGER NOT NULL REFERENCES fornecedores(id),
    estoque_atual DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estoque_minimo DECIMAL(10, 2) NOT NULL DEFAULT 0,
    preco_custo DECIMAL(10, 2) NOT NULL,
    preco_venda DECIMAL(10, 2) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS funcionarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    cargo VARCHAR(100) NOT NULL,
    salario_base DECIMAL(10, 2) NOT NULL,
    data_admissao DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS folha_pagamento (
    id SERIAL PRIMARY KEY,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id),
    data_pagamento DATE NOT NULL,
    valor_pago DECIMAL(10, 2) NOT NULL,
    sacas_colhidas DECIMAL(10, 2),
    bonus DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fluxo_caixa (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Receita', 'Despesa')),
    valor DECIMAL(12, 2) NOT NULL,
    categoria_financeira VARCHAR(100) NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS safras (
    id SERIAL PRIMARY KEY,
    nome_safra VARCHAR(100) NOT NULL,
    cultura VARCHAR(50) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    hectares_plantados DECIMAL(10, 2) NOT NULL,
    sacas_produzidas DECIMAL(10, 2),
    custo_total_acumulado DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alertas_estoque (
    id SERIAL PRIMARY KEY,
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    mensagem TEXT NOT NULL,
    tipo_alerta VARCHAR(50),
    resolvido BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'GERENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_usuarios_role CHECK (role IN ('ADMIN', 'GERENTE'))
);

-- Insert Categories
INSERT INTO categorias (nome) VALUES
('Sementes'),
('Defensivos Agrícolas'),
('Fertilizantes'),
('Implementos Agrícolas'),
('Combustíveis'),
('Equipamentos'),
('Produtos Veterinários'),
('Insumos Diversos');

-- Insert Suppliers
INSERT INTO fornecedores (nome, cnpj, email, telefone) VALUES
('Bayer CropScience Brasil', '03.897.280/0001-57', 'comercial@bayer.com.br', '1133334444'),
('Syngenta do Brasil', '61.049.628/0001-01', 'vendas@syngenta.com.br', '1144445555'),
('Agroceres Sementes', '25.061.050/0001-60', 'contato@agroceres.com.br', '1955556666'),
('Sabiazinho Insumos', '12.345.678/0001-90', 'vendas@sabiazinho.com.br', '1766667777'),
('JBS Alimentos', '17.343.446/0001-05', 'agro@jbs.com.br', '1877778888');

-- Insert Products (20 rows across categories)
INSERT INTO produtos (nome, categoria_id, fornecedor_id, estoque_atual, estoque_minimo, preco_custo, preco_venda, unidade_medida) VALUES
('Semente de Soja Premium', 1, 3, 500.00, 100.00, 250.00, 320.00, 'Saca'),
('Semente de Milho Híbrido', 1, 3, 300.00, 50.00, 180.00, 245.00, 'Saca'),
('Defensivo Herbicida 20L', 2, 1, 45.50, 10.00, 320.00, 450.00, 'Litro'),
('Inseticida Concentrado', 2, 2, 120.75, 20.00, 85.00, 125.00, 'Litro'),
('Fungicida Preventivo', 2, 1, 80.00, 15.00, 110.00, 160.00, 'Litro'),
('NPK Fertilizante 04-14-08', 3, 4, 1200.50, 200.00, 45.00, 65.00, 'Kg'),
('Calcário Dolomítico', 3, 4, 5000.00, 500.00, 15.00, 22.00, 'Kg'),
('Adubo Orgânico Composto', 3, 4, 2300.75, 300.00, 8.00, 12.00, 'Kg'),
('Sulco Aberto 4 Discos', 4, 5, 12.00, 2.00, 8500.00, 11000.00, 'Unidade'),
('Enxada Manual Premium', 4, 5, 85.00, 15.00, 45.00, 75.00, 'Unidade'),
('Óleo Diesel Premium', 5, 5, 2500.00, 500.00, 3.80, 4.50, 'Litro'),
('Gasolina Comum', 5, 5, 1800.00, 300.00, 4.20, 5.00, 'Litro'),
('Trator MF 4708 4x4', 6, 5, 3.00, 1.00, 185000.00, 215000.00, 'Unidade'),
('Pulverizador Costal 20L', 6, 4, 42.00, 8.00, 185.00, 280.00, 'Unidade'),
('Antiparasitário Bovino', 7, 1, 95.50, 20.00, 25.00, 45.00, 'Litro'),
('Vacina Aftosa 10ml', 7, 2, 210.00, 50.00, 12.00, 20.00, 'Aplicação'),
('Sal Mineral Bovina', 8, 4, 3500.00, 500.00, 1.50, 2.50, 'Kg'),
('Ração Concentrada 25kg', 8, 5, 450.00, 100.00, 65.00, 95.00, 'Saca'),
('Sementes de Capim Braquiária', 1, 3, 156.00, 30.00, 22.00, 35.00, 'Kg'),
('Corretivo de Solo Calcário', 3, 4, 8000.00, 1000.00, 18.00, 28.00, 'Kg');

-- Insert Employees
INSERT INTO funcionarios (nome, cpf, cargo, salario_base, data_admissao) VALUES
('João Silva Santos', '123.456.789-01', 'Tratorista', 3500.00, '2022-03-15'),
('Maria Oliveira Costa', '234.567.890-12', 'Gerente de Colheita', 5500.00, '2020-06-01'),
('Pedro Alves Rocha', '345.678.901-23', 'Técnico Agrícola', 4200.00, '2021-09-20'),
('Ana Paula Ferreira', '456.789.012-34', 'Operadora de Máquinas', 3800.00, '2023-01-10'),
('Carlos Mendes Dias', '567.890.123-45', 'Supervisor de Plantio', 6000.00, '2019-05-12'),
('Lucia Batista Ribeiro', '678.901.234-56', 'Auxiliar de Almoxarife', 2500.00, '2023-11-01');

-- Insert Payroll (Updated to current dates - August 2026)
INSERT INTO folha_pagamento (funcionario_id, data_pagamento, valor_pago, sacas_colhidas, bonus) VALUES
(1, '2026-08-31', 3500.00, 150.00, 200.00),
(2, '2026-08-31', 5500.00, 450.00, 500.00),
(3, '2026-08-31', 4200.00, 200.00, 150.00),
(4, '2026-08-31', 3800.00, 120.00, 100.00),
(5, '2026-08-31', 6000.00, 500.00, 300.00),
(6, '2026-08-31', 2500.00, 50.00, 50.00),
(1, '2026-07-31', 3500.00, 180.00, 250.00),
(2, '2026-07-31', 5500.00, 520.00, 600.00);

-- Insert Cash Flow (Updated to current dates - last 6 months from August 2026)
INSERT INTO fluxo_caixa (tipo, valor, categoria_financeira, descricao, data) VALUES
-- March 2026
('Receita', 15000.00, 'Vendas de Grãos', 'Venda 500 sacas de soja', '2026-03-10'),
('Receita', 8500.00, 'Vendas de Serviços', 'Aluguel de maquinário', '2026-03-12'),
('Despesa', 3200.00, 'Combustíveis', 'Compra de diesel para março', '2026-03-05'),
('Despesa', 5800.00, 'Insumos', 'Compra de sementes e fertilizantes', '2026-03-08'),
-- April 2026
('Receita', 12000.00, 'Vendas de Grãos', 'Venda 400 sacas de milho', '2026-04-15'),
('Despesa', 2100.00, 'Manutenção', 'Reparo de trator', '2026-04-18'),
('Despesa', 1500.00, 'Energia', 'Conta de energia rural', '2026-04-20'),
('Receita', 6200.00, 'Outros', 'Venda de resíduos orgânicos', '2026-04-25'),
-- May 2026
('Receita', 18500.00, 'Vendas de Grãos', 'Venda 550 sacas de soja', '2026-05-12'),
('Despesa', 4500.00, 'Folha de Pagamento', 'Pagamento de salários maio', '2026-05-31'),
('Despesa', 3300.00, 'Defensivos', 'Compra de fungicida premium', '2026-05-02'),
('Receita', 9800.00, 'Vendas de Serviços', 'Aluguel de pulverizador', '2026-05-18'),
-- June 2026
('Receita', 22000.00, 'Vendas de Grãos', 'Venda 600 sacas de milho', '2026-06-10'),
('Despesa', 5500.00, 'Insumos', 'Compra de fertilizantes', '2026-06-08'),
('Despesa', 2800.00, 'Combustíveis', 'Diesel para colheita', '2026-06-15'),
('Receita', 7600.00, 'Outros', 'Venda de palha de milho', '2026-06-20'),
-- July 2026
('Receita', 19200.00, 'Vendas de Grãos', 'Venda 480 sacas de soja', '2026-07-14'),
('Despesa', 4200.00, 'Folha de Pagamento', 'Pagamento de salários julho', '2026-07-31'),
('Despesa', 2950.00, 'Manutenção', 'Manutenção preventiva de máquinas', '2026-07-05'),
('Receita', 5400.00, 'Vendas de Serviços', 'Consultoria técnica', '2026-07-22'),
-- August 2026
('Receita', 25000.00, 'Vendas de Grãos', 'Venda 700 sacas de milho', '2026-08-03'),
('Despesa', 6100.00, 'Insumos', 'Compra de sementes para próxima safra', '2026-08-01'),
('Receita', 11500.00, 'Vendas de Serviços', 'Aluguel de maquinário - colheita', '2026-08-05'),
('Despesa', 4800.00, 'Folha de Pagamento', 'Pagamento de salários agosto', '2026-08-07'),
('Receita', 8900.00, 'Outros', 'Venda de subprodutos', '2026-08-06'),
('Despesa', 3100.00, 'Energia', 'Conta de energia rural agosto', '2026-08-02');

-- Insert Crops
INSERT INTO safras (nome_safra, cultura, data_inicio, data_fim, hectares_plantados, sacas_produzidas, custo_total_acumulado) VALUES
('Safra 2025/2026 - Soja', 'Soja', '2025-10-15', '2026-02-20', 450.00, 1800.00, 125000.00),
('Safra 2025/2026 - Milho', 'Milho', '2025-11-01', '2026-03-15', 300.00, 1200.00, 85000.00),
('Safra 2026 - Milho Safrinha', 'Milho', '2026-02-10', NULL, 200.00, NULL, 45000.00);

-- Insert Stock Alerts
INSERT INTO alertas_estoque (produto_id, mensagem, tipo_alerta) VALUES
(3, 'Estoque baixo de Herbicida - Apenas 10 litros', 'Baixo Estoque'),
(5, 'Estoque crítico de Fungicida', 'Crítico'),
(9, 'Verificar disponibilidade de Sulco Aberto', 'Aviso'),
(13, 'Manutenção preventiva de Trator agendada', 'Manutenção'),
(15, 'Renovar lote de Antiparasitário', 'Reposição');
