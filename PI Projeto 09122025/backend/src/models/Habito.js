import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Habito = sequelize.define("habitos", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  titulo: { type: DataTypes.STRING(120), allowNull: false },
  horario: { type: DataTypes.TIME },
  ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

export default Habito;
