import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Champs FRONTEND
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Champs internes (calcul automatique)
    price: { type: Number, required: true, default: 0 }, 
    tva: { type: Number, required: true, default: 18 }, 
    
    // Champs calculés automatiquement
    priceHT: { type: Number, default: 0 }, // Hors Taxes
    priceTTC: { type: Number, default: 0 }, // Toutes Taxes Comprises
    montantTVA: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Middleware pour ajuster automatiquement les valeurs
ProductSchema.pre('save', function (next) {
  // Si le frontend envoie un prix TTC, on re-calcule le HT et montant TVA
  this.montantTVA = (this.price * this.tva) / (100 + this.tva);
  this.priceHT = this.price - this.montantTVA;
  this.priceTTC = this.price;

  next();
});

// Format JSON retourné au frontend
ProductSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;

    // Le frontend ne voit que ces champs
    delete ret.priceHT;
    delete ret.priceTTC;
    delete ret.montantTVA;
    delete ret.userId;
  },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
