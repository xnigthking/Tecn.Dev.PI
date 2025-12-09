import express from "express";
import { registrarAgua, listarAgua } from "../controllers/HidratacaoController.js";

const router = express.Router();

router.post("/", registrarAgua);
router.get("/:usuario_id", listarAgua);

export default router;
