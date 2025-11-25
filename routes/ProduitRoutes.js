import express from "express"
import { createProduct, deleteProduct, getAllProducts, getProductById, updateProduct } from "../controllers/ProduitControllers.js";
import { requireAuth } from "../Middleware/proxy.js";

const router = express.Router();

router.post("/creer", requireAuth, createProduct);
router.get("/", requireAuth, getAllProducts);
router.get("/:id", requireAuth, getProductById);
router.put("/:id", requireAuth, updateProduct);
router.patch("/:id", requireAuth, updateProduct);
router.delete("/:id", requireAuth, deleteProduct);


export default router;
