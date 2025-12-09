import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const autenticar = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ erro: "Token não fornecido" });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch {
    return res.status(403).json({ erro: "Token inválido" });
  }
};