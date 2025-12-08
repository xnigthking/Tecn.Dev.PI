const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "senac",
  database: process.env.DB_NAME || "MundoFitnessDB",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao MySQL:", err.message);
  } else {
    console.log("✅ Conectado ao banco de dados MundoFitnessDB!");
  }
});

module.exports = db;