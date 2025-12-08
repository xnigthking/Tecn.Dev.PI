import Lembrete from "../models/Lembrete.js";

export const criarLembrete = async (req, res) => {
  try {
    const lembrete = await Lembrete.create(req.body);
    res.status(201).json(lembrete);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

export const listarLembretes = async (req, res) => {
  const lista = await Lembrete.findAll({ where: { usuario_id: req.params.usuario_id } });
  res.json(lista);
};