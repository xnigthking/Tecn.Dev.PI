-- Criar banco de dados
CREATE DATABASE api_usuarios;

-- Usar o banco de dados
USE api_usuarios;

-- Criar tabela de usuários
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO usuarios (nome, email) VALUES
('João Silva', 'joao@example.com'),
('Maria Santos', 'maria@example.com'),
('Pedro Oliveira', 'pedro@example.com');