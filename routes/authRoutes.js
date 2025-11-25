// routes/authRoutes.js
import express from 'express';
import { deleteUser, getCurrentUser, getUserById, getUsers, login, register, toggleUserStatus, updateUser } from '../controllers/authControllers.js';
import { isAdmin, requireAuth } from '../Middleware/proxy.js';


const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', getUsers);
router.get('/me', getCurrentUser);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);
router.put('/:id', updateUser);
router.patch("/:id/toggle-status", requireAuth, isAdmin, toggleUserStatus);


export default router;
