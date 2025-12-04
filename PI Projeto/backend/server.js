// ========================================
// 💪 MundoFitness API - versão modular final
// ========================================

const express = require("express");
const cors = require("cors");
const db = require("./config/db"); // conexão importada
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ==============================
// 🏁 ROTA PRINCIPAL
// ==============================
app.get("/", (req, res) => {
  res.send("💪 API MundoFitness está rodando e conectada ao MySQL!");
});

// ===========================================================
// 👤 USUÁRIOS
// ===========================================================

// Listar todos os usuários
app.get("/usuarios", (req, res) => {
  db.query("SELECT * FROM usuarios", (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(results);
  });
});

// Criar novo usuário
app.post("/usuarios", (req, res) => {
  const { nome, email, senha_hash, plano_id } = req.body;
  db.query(
    "INSERT INTO usuarios (nome, email, senha_hash, plano_id) VALUES (?, ?, ?, ?)",
    [nome, email, senha_hash, plano_id || 1],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ id: result.insertId, nome, email });
    }
  );
});

// Atualizar usuário
app.put("/usuarios/:id", (req, res) => {
  const { nome, email, plano_id } = req.body;
  const { id } = req.params;
  db.query(
    "UPDATE usuarios SET nome=?, email=?, plano_id=? WHERE id=?",
    [nome, email, plano_id, id],
    (err) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json({ mensagem: "✅ Usuário atualizado com sucesso!" });
    }
  );
});

// Deletar usuário
app.delete("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM usuarios WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json({ mensagem: "🗑️ Usuário deletado com sucesso!" });
  });
});

// ===========================================================
// 🥗 REFEIÇÕES
// ===========================================================
app.get("/refeicoes", (req, res) => {
  db.query("SELECT * FROM refeicoes", (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(results);
  });
});

app.post("/refeicoes", (req, res) => {
  const { usuario_id, titulo, calorias, data_hora, observacao } = req.body;
  db.query(
    "INSERT INTO refeicoes (usuario_id, titulo, calorias, data_hora, observacao) VALUES (?, ?, ?, ?, ?)",
    [usuario_id, titulo, calorias, data_hora, observacao],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ id: result.insertId, titulo, calorias });
    }
  );
});

// ===========================================================
// 🏋️ TREINOS
// ===========================================================
app.get("/treinos", (req, res) => {
  db.query("SELECT * FROM treinos", (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(results);
  });
});

app.post("/treinos", (req, res) => {
  const { usuario_id, tipo, duracao_min, data_hora, observacao } = req.body;
  db.query(
    "INSERT INTO treinos (usuario_id, tipo, duracao_min, data_hora, observacao) VALUES (?, ?, ?, ?, ?)",
    [usuario_id, tipo, duracao_min, data_hora, observacao],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ id: result.insertId, tipo, duracao_min });
    }
  );
});

// ===========================================================
// 💧 HIDRATAÇÃO
// ===========================================================
app.get("/hidratacao", (req, res) => {
  db.query("SELECT * FROM hidratacao", (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(results);
  });
});

app.post("/hidratacao", (req, res) => {
  const { usuario_id, data, quantidade_ml } = req.body;
  db.query(
    "INSERT INTO hidratacao (usuario_id, data, quantidade_ml) VALUES (?, ?, ?)",
    [usuario_id, data, quantidade_ml],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ id: result.insertId, usuario_id, quantidade_ml });
    }
  );
});

// ===========================================================
// 📅 HÁBITOS
// ===========================================================
app.get("/habitos", (req, res) => {
  db.query("SELECT * FROM habitos", (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(results);
  });
});

app.post("/habitos", (req, res) => {
  const { usuario_id, titulo, horario } = req.body;
  db.query(
    "INSERT INTO habitos (usuario_id, titulo, horario) VALUES (?, ?, ?)",
    [usuario_id, titulo, horario],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ id: result.insertId, titulo, horario });
    }
  );
});

// ===========================================================
// 🔔 LEMBRETES
// ===========================================================
app.get("/lembretes", (req, res) => {
  db.query("SELECT * FROM lembretes", (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(results);
  });
});

app.post("/lembretes", (req, res) => {
  const { usuario_id, tipo, mensagem, horario } = req.body;
  db.query(
    "INSERT INTO lembretes (usuario_id, tipo, mensagem, horario) VALUES (?, ?, ?, ?)",
    [usuario_id, tipo, mensagem, horario],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ id: result.insertId, tipo, mensagem });
    }
  );
});

// ===========================================================
// 📰 NEWSLETTER
// ===========================================================
app.get("/newsletter", (req, res) => {
  db.query("SELECT * FROM assinantes_newsletter", (err, results) => {
    if (err) return res.status(500).json({ erro: err.message });
    res.json(results);
  });
});

app.post("/newsletter", (req, res) => {
  const { email } = req.body;
  db.query(
    "INSERT INTO assinantes_newsletter (email) VALUES (?)",
    [email],
    (err, result) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.status(201).json({ id: result.insertId, email });
    }
  );
});

// ===========================================================
// 🚀 Inicializar servidor
// ===========================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
