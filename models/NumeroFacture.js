import mongoose from 'mongoose';

const InvoiceNumberSchema = new mongoose.Schema({
  scope: { type: String, required: true }, // ex: "global" ou userId string
  dernierNumero: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

InvoiceNumberSchema.index({ scope: 1 }, { unique: true });

export default mongoose.models.InvoiceNumber || mongoose.model('InvoiceNumber', InvoiceNumberSchema);
