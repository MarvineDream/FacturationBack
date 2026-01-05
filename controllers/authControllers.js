import User from '../models/User.js';
import { comparePassword, hashPassword, signJwt } from '../utils/auth.js';

// Créer un compte Utilisateur
export const register = async (req, res) => {
  console.log("Requête reçue pour REGISTER :", req.body);
// comparePassword, hashPassword, signJwt
  try {
    const { name, email, password, role } = req.body;
    console.log("Hashing du mot de passe pour:", email);

    const hashed = await hashPassword(password);
    console.log("Mot de passe hashé avec succès");

    console.log("Création de l'utilisateur en base de données");
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || 'user',
    });

    console.log("Utilisateur créé :", user);

    res.status(201).json({ user });
  } catch (error) {
    console.error("Erreur dans REGISTER :", error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Connexion a son compte utilisateur
export const login = async (req, res) => {
  console.log("Requête reçue pour LOGIN :", req.body);

  try {
    const { email, password } = req.body;
    console.log(`Vérification de l'utilisateur avec email: ${email}`);

    const user = await User.findOne({ email });
    if (!user) {
      console.warn("Aucun utilisateur trouvé avec cet email");
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    console.log("Comparaison des mots de passe");
    const ok = await comparePassword(password, user.password);
    if (!ok) {
      console.warn("Mot de passe incorrect");
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    console.log("Authentification réussie, génération du token");
    const token = signJwt({ id: user._id, role: user.role });

    res.json({
      token,
      user: {
        id: user._id,
        nom: user.name,
        email: user.email,
        role: user.role,
      },
    });

    console.log("Réponse envoyée avec succès");
  } catch (error) {
    console.error("Erreur dans LOGIN :", error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récuperation de tous les utilisateurs
export const getUsers = async (req, res) => {
  console.log("[USERS] Requête reçue pour récupérer tous les utilisateurs...");

  try {
    // Sécurité : admin seulement (si pas déjà protégé par la route)
    if (req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux administrateurs",
      });
    }

    const users = await User.find().select(
      "name email role actif createdAt lastSeenAt"
    );

    console.log(`[USERS] ${users.length} utilisateur(s) trouvé(s).`);

    res.json({
      success: true,
      data: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.actif,
        createdAt: user.createdAt,
        lastSeenAt: user.lastSeenAt,
      })),
    });
  } catch (error) {
    console.error("[USERS] Erreur GET USERS :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};


// Récuperer un utilisateur par son ID
export const getUserById = async (req, res) => {
  const { id } = req.params;
  console.log(`[USER] Requête reçue pour récupérer l'utilisateur avec ID : ${id}`);
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      console.warn(`[USER] Aucun utilisateur trouvé avec ID : ${id}`);
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    console.log(`[USER] Utilisateur trouvé : ${user.nom || "Nom non défini"} (${user.email})`);
    res.json(user);
  } catch (error) {
    console.error("[USER] Erreur GET USER :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Mise à jour d'un Utilisateur
export const updateUser = async (req, res) => {
  const { id } = req.params;
  console.log(`[USER] Requête reçue pour mise à jour de l'utilisateur ${id}`);
  try {
    const { nom, email, password, role, actif } = req.body;
    console.log("[USER] Données reçues pour mise à jour :", { nom, email, role, actif });

    const updates = { nom, email, role, actif };

    if (password) {
      console.log("[USER] Nouveau mot de passe détecté — hash en cours...");
      updates.password = await hashPassword(password);
      console.log("[USER] Mot de passe re-hashé avec succès.");
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
    if (!user) {
      console.warn(`[USER] Utilisateur introuvable avec ID : ${id}`);
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    console.log(`[USER] Utilisateur mis à jour : ${user.nom || "Nom non défini"} (${user.email})`);
    res.json(user);
  } catch (error) {
    console.error("[USER] Erreur UPDATE USER :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Suppression d'un Utilisateur
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  console.log(`[USER] Requête reçue pour suppression de l'utilisateur ID : ${id}`);
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      console.warn(`[USER] Aucun utilisateur trouvé à supprimer (ID : ${id})`);
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    console.log(`[USER] Utilisateur supprimé : ${user.nom || "Nom non défini"} (${user.email})`);
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("[USER] Erreur DELETE USER :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Récuperer l'utilisateur connecté
export const getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Utilisateur non authentifié",
    });
  }

  return res.json({
    success: true,
    data: req.user,
  });
};


// Status d'un utilisateur
export const toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  console.log(`[USER] Requête reçue pour toggler le statut de l'utilisateur ID: ${id}`);

  try {
    const user = await User.findById(id);
    if (!user) {
      console.warn(`[USER] Utilisateur introuvable (ID: ${id})`);
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Inversion du statut actif/inactif
    user.actif = !user.actif;
    await user.save();

    console.log(`[USER] Statut utilisateur mis à jour : ${user.email} -> ${user.actif ? "🟢 Actif" : "🔴 Inactif"}`);

    res.json({
      success: true,
      message: `Utilisateur ${user.actif ? "activé" : "désactivé"} avec succès`,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role: user.role,
        actif: user.actif,
      },
    });
  } catch (error) {
    console.error("[USER] Erreur TOGGLE STATUS :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


