import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


dotenv.config();

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[AUTH] Aucun token fourni");
    return res.status(401).json({ success: false, message: "Token manquant ou invalide" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(decoded.id).select("_id name email role actif");
    if (!user) {
      console.log("[AUTH] Utilisateur introuvable pour l'ID:", decoded.id);
      return res.status(401).json({ success: false, message: "Utilisateur introuvable" });
    }

    if (!user.actif) {
      console.log("[AUTH] Utilisateur désactivé");
      return res.status(403).json({ success: false, message: "Compte désactivé" });
    }

    // Injecter exactement ce que le frontend attend
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    console.log("[AUTH] Utilisateur authentifié:", req.user);
    next();
  } catch (err) {
    console.error("[AUTH] Erreur de vérification du token:", err.message);
    return res.status(401).json({ success: false, message: "Token invalide ou expiré" });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    console.warn("[AUTH] Aucune session utilisateur active");
    return res.status(401).json({ message: "Non authentifié" });
  }

  if (req.user.role !== "admin") {
    console.warn(`[AUTH] Accès refusé à ${req.user.email} (rôle: ${req.user.role})`);
    return res.status(403).json({ message: "Accès réservé aux administrateurs" });
  }

  console.log(`[AUTH] Accès administrateur autorisé : ${req.user.email}`);
  next();
};