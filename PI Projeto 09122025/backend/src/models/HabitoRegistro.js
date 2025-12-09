import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const HabitoRegistro = sequelize.define("habitos_registros", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  habito_id: { type: DataTypes.INTEGER, allowNull: false },
  data: { type: DataTypes.DATEONLY, allowNull: false },
  concluido: { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

export default HabitoRegistro;