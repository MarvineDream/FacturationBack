import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsControllers.js';
import { adminOnly, requireAuth } from '../Middleware/proxy.js';



const router = express.Router();

// Récupérer les paramètres
router.get('/', requireAuth, adminOnly, getSettings);

// Mettre à jour les paramètres
router.put('/', requireAuth, adminOnly, updateSettings);






export default router;
