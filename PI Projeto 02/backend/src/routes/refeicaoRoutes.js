import express from "express";
import { criarRefeicao, listarRefeicoes } from "../controllers/RefeicaoController.js";

const router = express.Router();

router.post("/", criarRefeicao);
router.get("/:usuario_id", listarRefeicoes);

export default router;
