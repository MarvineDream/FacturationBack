import Product from "../models/Produit.js";



// Créer un produit
export const createProduct = async (req, res) => {
  console.log("[CREATE PRODUCT] Données reçues:", req.body);

  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié. Token manquant ou invalide."
      });
    }

    // Frontend envoie prix TTC → on le stocke directement
    const { name, description, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Les champs 'name' et 'price' sont obligatoires."
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      userId: req.user.id,
      // tva est automatiquement appliquée via default dans le modèle
    });

    console.log("[CREATION DU PRODUIT] Produit créé:", product);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error("[CREATION DU PRODUIT] Erreur:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Récuperer tous les produits
export const getAllProducts = async (req, res) => {
  console.log("[RECUPERATION DES PRODUITS] Récupération de tous les produits (sans filtrer par utilisateur)")

  try {
    // ⬇️ ENLEVER LE FILTRE userId
    const products = await Product.find()

    console.log(`[RECUPERATION DES PRODUITS] ${products.length} produits trouvés`)
    res.json({ success: true, data: products })
  } catch (err) {
    console.error("[RECUPERATION DES PRODUITS] Erreur:", err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

// Récuperer un produit par son ID
export const getProductById = async (req, res) => {
  console.log("[RECUPERATION DU PRODUIT PAR SON ID] ID demandé:", req.params.id)

  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      console.warn("[RECUPERATION DU PRODUIT PAR SON ID] Produit non trouvé")
      return res.status(404).json({ success: false, message: "Produit non trouvé" })
    }
    console.log("[RECUPERATION DU PRODUIT PAR SON ID] Produit trouvé:", product)
    res.json({ success: true, data: product })
  } catch (err) {
    console.error("[RECUPERATION DU PRODUIT PAR SON ID] Erreur:", err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}

// Mise à jour d'un produit
export const updateProduct = async (req, res) => {
  console.log("[MISE A JOUR D'UN PRODUIT] ID:", req.params.id, " | Données:", req.body)

  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) {
      console.warn("[MISE A JOUR D'UN PRODUIT] Produit non trouvé")
      return res.status(404).json({ success: false, message: "Produit non trouvé" })
    }
    console.log("[MISE A JOUR D'UN PRODUIT] Produit mis à jour:", product)
    res.json({ success: true, data: product })
  } catch (err) {
    console.error("[MISE A JOUR D'UN PRODUIT] Erreur:", err.message)
    res.status(400).json({ success: false, message: err.message })
  }
}

// Suppression d'un produit
export const deleteProduct = async (req, res) => {
  console.log("[SUPPRESSION D'UN PRODUIT] ID:", req.params.id)

  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      console.warn("[SUPPRESSION D'UN PRODUIT] Produit non trouvé")
      return res.status(404).json({ success: false, message: "Produit non trouvé" })
    }
    console.log("[SUPPRESSION D'UN PRODUIT] Produit supprimé:", product)
    res.json({ success: true, message: "Produit supprimé avec succès" })
  } catch (err) {
    console.error("[SUPPRESSION D'UN PRODUIT] Erreur:", err.message)
    res.status(500).json({ success: false, message: err.message })
  }
}