import express from "express"
import { createClient, deleteClient, getClientById, getClients, updateClient } from "../controllers/ClientControllers.js";
import { requireAuth } from "../Middleware/proxy.js";


const router = express.Router();


// Créer un nouveau client
router.post("/creer", requireAuth, createClient);

// Récupérer tous les clients
router.get("/", requireAuth, getClients);

// Récupérer un client par ID
router.get("/:id", requireAuth, getClientById);

// Mettre à jour un client
router.put("/:id", requireAuth, updateClient);

// Mettre à jour un client partiellement
router.patch("/:id", requireAuth, updateClient);

// Supprimer un client
router.delete("/:id", requireAuth, deleteClient);





export default router;