import express from "express";
import { criarTreino, listarTreinos } from "../controllers/TreinoController.js";

const router = express.Router();

router.post("/", criarTreino);
router.get("/:usuario_id", listarTreinos);

export default router;
