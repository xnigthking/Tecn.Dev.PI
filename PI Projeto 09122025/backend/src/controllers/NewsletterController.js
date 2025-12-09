import Newsletter from "../models/Newsletter.js";

export const inscrever = async (req, res) => {
  try {
    const { email } = req.body;
    const existente = await Newsletter.findOne({ where: { email } });
    if (existente) return res.status(400).json({ erro: "Email já inscrito" });
    const novo = await Newsletter.create({ email });
    res.status(201).json(novo);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
};