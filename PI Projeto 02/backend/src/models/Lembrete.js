import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Lembrete = sequelize.define("lembretes", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  tipo: { 
    type: DataTypes.ENUM("refeicao", "hidratacao", "treino", "habito", "personalizado"), 
    defaultValue: "personalizado"
  },
  mensagem: { type: DataTypes.TEXT },
  horario: { type: DataTypes.TIME },
  ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

export default Lembrete;