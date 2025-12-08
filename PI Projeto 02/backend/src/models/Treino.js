import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Treino = sequelize.define("treinos", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { type: DataTypes.STRING(80), allowNull: false },
  duracao_min: { type: DataTypes.INTEGER },
  data_hora: { type: DataTypes.DATE, allowNull: false },
  observacao: { type: DataTypes.TEXT },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

export default Treino;
