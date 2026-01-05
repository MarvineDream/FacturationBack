import mongoose from "mongoose";

const InvoiceItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    items: [InvoiceItemSchema],

    invoiceNumber: { type: String, required: true, unique: true },

    subtotal: { type: Number, required: true },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    issueDate: { type: Date, required: true },
    dueDate: { type: Date },
    notes: { type: String },
    status: { type: String, enum: ["draft", "sent", "paid"], default: "draft" },
  },
  { timestamps: true }
);

// Transformation pour le frontend
InvoiceSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;

    // Si le client a été peuplé, on le restructure pour le frontend
    if (ret.clientId && ret.clientId._id) {
      ret.clientId = {
        id: ret.clientId._id.toString(),
        name: ret.clientId.name,
        email: ret.clientId.email,
        phone: ret.clientId.phone,
        address: ret.clientId.address,
      };
    }

    // Supprime clientId pour ne pas exposer l'ID brut (optionnel)
    delete ret.clientId;

    return ret;
  },
});

export default mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
