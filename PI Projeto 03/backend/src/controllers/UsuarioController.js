import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import dotenv from "dotenv";

dotenv.config();

export const registrar = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const hash = await bcrypt.hash(senha, 10);
    const novo = await Usuario.create({ nome, email, senha_hash: hash });
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ erro: "Falha ao registrar usuário", detalhe: err.message });
  }
};

export const login = async (req, res) => {
  const { email, senha } = req.body;
  const usuario = await Usuario.findOne({ where: { email } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

  const valido = await bcrypt.compare(senha, usuario.senha_hash);
  if (!valido) return res.status(401).json({ erro: "Senha incorreta" });

  const token = jwt.sign({ id: usuario.id, email: usuario.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
  res.json({ token });
};