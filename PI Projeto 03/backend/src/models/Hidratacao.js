import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Hidratacao = sequelize.define("hidratacao", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  data: { type: DataTypes.DATEONLY, allowNull: false },
  quantidade_ml: { type: DataTypes.INTEGER, defaultValue: 0 },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

export default Hidratacao;