import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Refeicao = sequelize.define("refeicoes", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  titulo: { type: DataTypes.STRING(100), allowNull: false },
  calorias: { type: DataTypes.INTEGER },
  data_hora: { type: DataTypes.DATE, allowNull: false },
  observacao: { type: DataTypes.TEXT },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

export default Refeicao;