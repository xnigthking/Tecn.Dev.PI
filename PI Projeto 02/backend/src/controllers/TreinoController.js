import Treino from "../models/Treino.js";

export const criarTreino = async (req, res) => {
  try {
    const treino = await Treino.create(req.body);
    res.status(201).json(treino);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

export const listarTreinos = async (req, res) => {
  const lista = await Treino.findAll({ where: { usuario_id: req.params.usuario_id } });
  res.json(lista);
};