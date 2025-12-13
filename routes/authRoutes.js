// routes/authRoutes.js
import express from 'express';
import { deleteUser, getCurrentUser, getUserById, getUsers, login, register, toggleUserStatus, updateUser } from '../controllers/authControllers.js';
import { isAdmin, requireAuth } from '../Middleware/proxy.js';


const router = express.Router();


// Enregistrement d'un nouvel utilisateur
router.post('/register', register);


// Connexion d'un utilisateur
router.post('/login', login);


// Récupérer tous les utilisateurs
router.get('/users', getUsers);


// Récupérer l'utilisateur actuel
router.get('/me', getCurrentUser);


// Récupérer un utilisateur par ID
router.get('/:id', getUserById);


// Supprimer un utilisateur
router.delete('/:id', deleteUser);


// Mettre à jour un utilisateur
router.put('/:id', updateUser);


// Activer/Désactiver un utilisateur
router.patch("/:id/toggle-status", requireAuth, isAdmin, toggleUserStatus);


export default router;
