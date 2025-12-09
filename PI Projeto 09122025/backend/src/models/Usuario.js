import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Plano from "./Plano.js";

const Usuario = sequelize.define("usuarios", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  senha_hash: { type: DataTypes.STRING(255), allowNull: false },
  plano_id: { type: DataTypes.INTEGER, defaultValue: 1 },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

Usuario.belongsTo(Plano, { foreignKey: "plano_id" });

export default Usuario;