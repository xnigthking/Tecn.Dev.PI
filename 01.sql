-- ======================================
-- BANCO DE DADOS: MundoFitnessDB
-- ======================================

CREATE DATABASE IF NOT EXISTS MundoFitnessDB
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE MundoFitnessDB;

-- ======================================
-- TABELA: Planos
-- ======================================
CREATE TABLE planos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(60) NOT NULL,
  preco DECIMAL(10,2) DEFAULT 0.00,
  descricao TEXT
);

-- Inserir plano padrão para evitar FK inválida
INSERT INTO planos (nome, preco, descricao)
VALUES ('Gratuito', 0.00, 'Plano básico gratuito com recursos limitados');

-- ======================================
-- TABELA: Usuários
-- ======================================
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  plano_id INT DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plano_id) REFERENCES planos(id)
);

CREATE INDEX idx_usuario_plano ON usuarios(plano_id);

-- ======================================
-- TABELA: Hábitos
-- ======================================
CREATE TABLE habitos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  horario TIME,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_habitos_usuario ON habitos(usuario_id);

-- ======================================
-- TABELA: Registros de Hábitos (Logs)
-- ======================================
CREATE TABLE habitos_registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  habito_id INT NOT NULL,
  data DATE NOT NULL,
  concluido BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (habito_id) REFERENCES habitos(id) ON DELETE CASCADE,
  UNIQUE (habito_id, data)
);

CREATE INDEX idx_registros_data ON habitos_registros(data);

-- ======================================
-- TABELA: Refeições
-- ======================================
CREATE TABLE refeicoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  titulo VARCHAR(100) NOT NULL,
  calorias INT,
  data_hora DATETIME NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_refeicoes_usuario ON refeicoes(usuario_id);
CREATE INDEX idx_refeicoes_data ON refeicoes(data_hora);

-- ======================================
-- TABELA: Treinos
-- ======================================
CREATE TABLE treinos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  duracao_min INT,
  data_hora DATETIME NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_treinos_usuario ON treinos(usuario_id);

-- ======================================
-- TABELA: Hidratação
-- ======================================
CREATE TABLE hidratacao (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  data DATE NOT NULL,
  quantidade_ml INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE (usuario_id, data)
);

CREATE INDEX idx_hidratacao_usuario ON hidratacao(usuario_id);

-- ======================================
-- TABELA: Assinantes da Newsletter
-- ======================================
CREATE TABLE assinantes_newsletter (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  inscrito_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelado BOOLEAN DEFAULT FALSE
);

-- ======================================
-- TABELA: Lembretes
-- ======================================
CREATE TABLE lembretes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo ENUM('refeicao', 'hidratacao', 'treino', 'habito', 'personalizado') DEFAULT 'personalizado',
  mensagem TEXT,
  horario TIME,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_lembretes_usuario ON lembretes(usuario_id);

-- ======================================
-- VIEW: Resumo Diário (para relatórios)
-- ======================================
CREATE OR REPLACE VIEW resumo_diario AS
SELECT 
  u.id AS usuario_id,
  COALESCE(
    DATE(r.data_hora),
    DATE(t.data_hora),
    h.data,
    hr.data
  ) AS data,
  COALESCE(SUM(r.calorias), 0) AS total_calorias,
  COALESCE(SUM(h.quantidade_ml), 0) AS total_agua_ml,
  COUNT(DISTINCT t.id) AS total_treinos,
  COUNT(DISTINCT hr.id) AS habitos_concluidos
FROM usuarios u
LEFT JOIN refeicoes r 
  ON u.id = r.usuario_id
LEFT JOIN treinos t 
  ON u.id = t.usuario_id
LEFT JOIN hidratacao h 
  ON u.id = h.usuario_id 
LEFT JOIN habitos hb 
  ON u.id = hb.usuario_id
LEFT JOIN habitos_registros hr 
  ON hb.id = hr.habito_id 
  AND hr.concluido = TRUE
GROUP BY 
  u.id,
  COALESCE(
    DATE(r.data_hora),
    DATE(t.data_hora),
    h.data,
    hr.data
  );
  

USE MundoFitnessDB;

SELECT * FROM treinos;
