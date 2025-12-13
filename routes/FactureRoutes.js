import express from 'express';
import { createInvoice, deleteInvoice, downloadInvoicePdf, getInvoiceById, getInvoices, updateInvoice, updateInvoiceStatus } from '../controllers/FactureControllers.js';
import { requireAuth } from '../Middleware/proxy.js';


const router = express.Router();


// Créer une nouvelle facture
router.post('/creer', requireAuth, createInvoice);

// Récupérer toutes les factures
router.get('/', requireAuth, getInvoices);

// Récupérer une facture par ID
router.get('/:id', requireAuth, getInvoiceById);

// Télécharger la facture au format PDF
router.get('/:id/pdf', requireAuth, downloadInvoicePdf);

// Mettre à jour une facture
router.put('/:id', requireAuth, updateInvoice);

// Mettre à jour le statut d'une facture
router.patch('/:id/status', requireAuth, updateInvoiceStatus,)

// Supprimer une facture
router.delete('/:id', requireAuth, deleteInvoice);




export default router;
