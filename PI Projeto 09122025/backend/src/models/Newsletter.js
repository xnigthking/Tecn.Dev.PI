import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Newsletter = sequelize.define("assinantes_newsletter", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(120), unique: true, allowNull: false },
  inscrito_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  cancelado: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export default Newsletter;