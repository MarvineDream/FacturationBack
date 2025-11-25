import express from "express"
import { createClient, deleteClient, getClientById, getClients, updateClient } from "../controllers/ClientControllers.js";
import { requireAuth } from "../Middleware/proxy.js";


const router = express.Router();

router.post("/creer", requireAuth, createClient);
router.get("/", requireAuth, getClients);
router.get("/:id", requireAuth, getClientById);
router.put("/:id", requireAuth, updateClient);
router.patch("/:id", requireAuth, updateClient);
router.delete("/:id", requireAuth, deleteClient);


export default router;