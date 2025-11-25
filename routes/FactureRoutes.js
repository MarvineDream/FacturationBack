import express from 'express';
import { createInvoice, deleteInvoice, downloadInvoicePdf, getInvoiceById, getInvoices, updateInvoice } from '../controllers/FactureControllers.js';
import { requireAuth } from '../Middleware/proxy.js';


const router = express.Router();

router.post('/creer', requireAuth, createInvoice);
router.get('/', requireAuth, getInvoices);
router.get('/:id', requireAuth, getInvoiceById);
router.get('/:id/pdf', requireAuth, downloadInvoicePdf);
router.put('/:id', requireAuth, updateInvoice);
router.delete('/:id', requireAuth, deleteInvoice);

export default router;
