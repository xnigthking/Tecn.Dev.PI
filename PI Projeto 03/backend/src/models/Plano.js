import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Plano = sequelize.define("planos", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nome: { type: DataTypes.STRING(60), allowNull: false },
  preco: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
  descricao: { type: DataTypes.TEXT },
});

export default Plano;