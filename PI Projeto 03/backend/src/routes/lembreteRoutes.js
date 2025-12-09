import express from "express";
import { criarLembrete, listarLembretes } from "../controllers/LembreteController.js";

const router = express.Router();

router.post("/", criarLembrete);
router.get("/:usuario_id", listarLembretes);

export default router;
