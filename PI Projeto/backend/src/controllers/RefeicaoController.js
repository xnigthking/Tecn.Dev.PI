import Refeicao from "../models/Refeicao.js";

export const criarRefeicao = async (req, res) => {
  try {
    const refeicao = await Refeicao.create(req.body);
    res.status(201).json(refeicao);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

export const listarRefeicoes = async (req, res) => {
  const lista = await Refeicao.findAll({ where: { usuario_id: req.params.usuario_id } });
  res.json(lista);
};