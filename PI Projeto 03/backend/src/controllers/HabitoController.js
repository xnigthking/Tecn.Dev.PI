import Habito from "../models/Habito.js";
import HabitoRegistro from "../models/HabitoRegistro.js";

export const criarHabito = async (req, res) => {
  try {
    const habito = await Habito.create(req.body);
    res.status(201).json(habito);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};

export const listarHabitos = async (req, res) => {
  const lista = await Habito.findAll({ where: { usuario_id: req.params.usuario_id } });
  res.json(lista);
};

export const registrarHabito = async (req, res) => {
  try {
    const log = await HabitoRegistro.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};