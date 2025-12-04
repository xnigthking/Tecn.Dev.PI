import Hidratacao from "../models/Hidratacao.js";

export const registrarAgua = async (req, res) => {
  try {
    const hidratacao = await Hidratacao.create(req.body);
    res.status(201).json(hidratacao);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

export const listarAgua = async (req, res) => {
  const lista = await Hidratacao.findAll({ where: { usuario_id: req.params.usuario_id } });
  res.json(lista);
};