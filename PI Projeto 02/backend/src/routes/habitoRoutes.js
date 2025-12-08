import express from "express";
import { criarHabito, listarHabitos, registrarHabito } from "../controllers/HabitoController.js";

const router = express.Router();

router.post("/", criarHabito);
router.get("/:usuario_id", listarHabitos);
router.post("/registro", registrarHabito);

export default router;
