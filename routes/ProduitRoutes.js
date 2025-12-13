import express from "express"
import { createProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from "../controllers/ProduitControllers.js";
import { requireAuth } from "../Middleware/proxy.js";

const router = express.Router();


// Créer un nouveau produit
router.post("/creer", requireAuth, createProduct);

// Récupérer tous les produits
router.get("/", requireAuth, getAllProducts);

// Récupérer un produit par ID
router.get("/:id", requireAuth, getProductById);

// Mettre à jour un produit
router.put("/:id", requireAuth, updateProduct);

// Mettre à jour un produit partiellement
router.patch("/:id", requireAuth, updateProduct);

// Supprimer un produit
router.delete("/:id", requireAuth, deleteProduct);


export default router;
