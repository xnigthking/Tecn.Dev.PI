import express from "express";
import { inscrever } from "../controllers/NewsletterController.js";

const router = express.Router();

router.post("/inscrever", inscrever);

export default router;