import Invoice from '../models/Facture.js';
import Client from '../models/Client.js';
import Product from '../models/Produit.js';
import mongoose from 'mongoose';
import InvoiceNumber from '../models/NumeroFacture.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);





// Helper pour formater le JSON
const formatInvoice = (invoice) => {
  const obj = invoice.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};


export const createInvoice = async (req, res) => {
  console.log("\n[FACTURE] Requête reçue pour création de facture");
  console.log("Payload reçu :", JSON.stringify(req.body, null, 2));

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { clientId, items, subtotal, taxRate, taxAmount, total, issueDate, dueDate, notes, status } = req.body;

    // Vérification utilisateur
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: "Utilisateur non authentifié" });
    }

    // Vérification payload 
    if (!clientId) return res.status(400).json({ success: false, error: "Client obligatoire" });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "La facture doit contenir au moins un article" });
    }

    // Vérification client 
    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ success: false, error: "Client introuvable" });

    // Vérification produits
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Produit introuvable : ${item.productName || item.productId}`,
        });
      }
    }

    // Génération numéro de facture annuel
    const year = new Date().getFullYear();
    const scope = `year-${year}`;

    const numeroData = await InvoiceNumber.findOneAndUpdate(
      { scope },
      { $inc: { dernierNumero: 1 }, updatedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true, session }
    );

    const lastNumber = numeroData?.dernierNumero ?? 1;
    const invoiceNumber = `FAC-${year}-${String(lastNumber).padStart(4, "0")}`;
    console.log(`[FACTURE] Numéro de facture généré : ${invoiceNumber}`);

    // Création facture 
    const [invoiceDoc] = await Invoice.create(
      [
        {
          invoiceNumber,
          userId: req.user.id,
          clientId,
          items,
          subtotal,
          taxRate,
          taxAmount,
          total,
          issueDate,
          dueDate,
          notes,
          status: status || "draft",
        },
      ],
      { session }
    );

    // Commit transaction 
    await session.commitTransaction();
    session.endSession();

    // Peuplement client 
    const populatedInvoice = await Invoice.findById(invoiceDoc._id).populate("clientId").lean();
    if (!populatedInvoice) throw new Error("Erreur lors du peuplement de la facture");

    // Transformation pour frontend
    const responseInvoice = {
      id: populatedInvoice._id.toString(),
      numero: populatedInvoice.invoiceNumber,
      userId: populatedInvoice.userId.toString(),
      client: populatedInvoice.clientId
        ? {
            id: populatedInvoice.clientId._id.toString(),
            name: populatedInvoice.clientId.name,
            email: populatedInvoice.clientId.email,
            phone: populatedInvoice.clientId.phone,
            address: populatedInvoice.clientId.address,
          }
        : undefined,
      items: populatedInvoice.items,
      subtotal: populatedInvoice.subtotal,
      taxRate: populatedInvoice.taxRate,
      taxAmount: populatedInvoice.taxAmount,
      total: populatedInvoice.total,
      issueDate: populatedInvoice.issueDate,
      dueDate: populatedInvoice.dueDate,
      notes: populatedInvoice.notes,
      status: populatedInvoice.status,
      createdAt: populatedInvoice.createdAt,
      updatedAt: populatedInvoice.updatedAt,
    };

    return res.status(201).json({ success: true, data: responseInvoice });

  } catch (error) {
    console.error("[FACTURE] Erreur serveur :", error);

    if (session.inTransaction()) await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
      details: error.message,
    });
  }
};

// Récuperer toutes les factures
export const getInvoices = async (req, res) => {
  try {
    console.log("[RECUPERATION DE TOUTES LES FACTURES] Début de la récupération des factures");
    console.log("[AUTH] Utilisateur authentifié:", req.user);

    if (!req.user || !req.user.id) {
      console.warn("[RECUPERATION DE TOUTES LES FACTURES] Utilisateur non authentifié");
      return res.status(401).json({ success: false, message: "Utilisateur non authentifié." });
    }

    // Déterminer la query selon le rôle
    const query = req.user.role === "admin" ? {} : { userId: req.user.id };
    console.log("[RECUPERATION DE TOUTES LES FACTURES] Query MongoDB:", query);

    // Récupération des factures
    const factures = await Invoice.find(query)
      .populate("clientId") // récupère tous les champs du client
      .sort({ createdAt: -1 });

    console.log(`[RECUPERATION DE TOUTES LES FACTURES] ${factures.length} factures trouvées`);

    // Mapping compatible avec le frontend
    const formatted = factures.map((facture) => {
      console.log("[RECUPERATION DE TOUTES LES FACTURES] Facture brute :", facture);
      return {
        id: facture._id.toString(),
        invoiceNumber: facture.invoiceNumber,
        client: facture.clientId
          ? {
              id: facture.clientId._id.toString(),
              name: facture.clientId.name,
              email: facture.clientId.email,
              phone: facture.clientId.phone,
              address: facture.clientId.address,
            }
          : { name: "N/A" }, // fallback si le client est supprimé
        items: facture.items,
        subtotal: facture.subtotal,
        taxRate: facture.taxRate,
        taxAmount: facture.taxAmount,
        total: facture.total,
        issueDate: facture.issueDate,
        dueDate: facture.dueDate,
        notes: facture.notes,
        status: facture.status,
        createdAt: facture.createdAt,
        updatedAt: facture.updatedAt,
      };
    });

    console.log("[RECUPERATION DE TOUTES LES FACTURES] Factures formatées pour le frontend :", formatted);

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error("[RECUPERATION DE TOUTES LES FACTURES] Erreur :", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Récupération d'un produit
export const getInvoiceById = async (req, res) => {
  try {
    console.log("[RECUPERATION DE LA FACTURE] Recherche facture ID:", req.params.id);

    // Recherche facture et population du client
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user.id })
      .populate("clientId") // <- indispensable pour récupérer le nom du client
      .lean();

    if (!invoice) {
      console.log("[RECUPERATION DE LA FACTURE] Facture introuvable");
      return res.status(404).json({ success: false, message: "Facture introuvable" });
    }

    // Transformation pour le frontend
    const formattedInvoice = {
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.clientId
        ? {
            id: invoice.clientId._id.toString(),
            name: invoice.clientId.name || invoice.clientId.nom, 
            email: invoice.clientId.email,
            phone: invoice.clientId.phone || invoice.clientId.telephone,
            address: invoice.clientId.address || invoice.clientId.adresse,
          }
        : { name: "N/A" },
      items: invoice.items,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      status: invoice.status,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    console.log("[RECUPERATION DE LA FACTURE] Facture trouvée et formatée:", formattedInvoice);

    res.json({ success: true, data: formattedInvoice });
  } catch (err) {
    console.error("[RECUPERATION DE LA FACTURE] Erreur:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mise à jour de la facture
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Facture introuvable" });
    }
    res.json({ success: true, data: formatInvoice(invoice) });
  } catch (err) {
    console.error("[MISE A JOUR DE LA FACTURE] Erreur:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Suppression de la facture
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Facture introuvable" });
    }
    res.json({ success: true, message: "Facture supprimée" });
  } catch (err) {
    console.error("[SUPPRESSION DE LA FACTURE] Erreur:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const downloadInvoicePdf = async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // 1️⃣ Récupérer la facture
    const invoice = await Invoice.findOne({
      _id: invoiceId,
      userId: req.user.id,
    }).populate("clientId");

    if (!invoice) {
      return res.status(404).send("Facture introuvable");
    }

    // 2️⃣ Récupérer l'utilisateur qui a créé la facture
    const user = await User.findById(req.user.id);

    // 3️⃣ Préparer le PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoiceNumber}.pdf`
    );

    doc.pipe(res);

    // -----------------------------
    // 🔹 LOGO DE L’ENTREPRISE
    // -----------------------------
    const logoPath = path.join(process.cwd(), "public", "logo.png");

    try {
      doc.image(logoPath, 40, 40, { width: 120 });
    } catch (err) {
      console.warn("⚠️ Logo introuvable :", err.message);
    }

    doc.moveDown(3);

    // -----------------------------
    // 🔹 Infos entreprise + créateur
    // -----------------------------
    doc
      .fontSize(18)
      .text("FACTURE", { align: "right" })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Numéro : ${invoice.invoiceNumber}`, { align: "right" })
      .text(`Créée par : ${user?.name}`, { align: "right" })
      .text(`Email créateur : ${user?.email}`, { align: "right" })
      .moveDown(2);

    // -----------------------------
    // 🔹 Infos client
    // -----------------------------
    doc
      .fontSize(14)
      .text("Client :", { underline: true })
      .moveDown(0.5);

    doc.fontSize(12).text(invoice.clientId.name);
    if (invoice.clientId.email) doc.text(invoice.clientId.email);
    if (invoice.clientId.phone) doc.text(invoice.clientId.phone);
    if (invoice.clientId.address) doc.text(invoice.clientId.address);

    doc.moveDown(2);

    // -----------------------------
    // 🔹 Articles
    // -----------------------------
    doc.fontSize(14).text("Articles :", { underline: true }).moveDown(0.5);

    invoice.items.forEach((item) => {
      doc.fontSize(12).text(
        `${item.productName} — ${item.quantity} × ${item.unitPrice} Fcfa = ${item.total} Fcfa`
      );
    });

    doc.moveDown(2);

    // -----------------------------
    // 🔹 Totaux
    // -----------------------------
    doc.fontSize(14).text("Résumé :", { underline: true }).moveDown(0.5);

    doc.fontSize(12).text(`Sous-total HT : ${invoice.subtotal} Fcfa`);
    doc.text(`TVA (${invoice.taxRate}%) : ${invoice.taxAmount} Fcfa`);
    doc.text(`TOTAL TTC : ${invoice.total} Fcfa`, { bold: true });

    doc.moveDown(2);

    // -----------------------------
    // 🔹 Notes
    // -----------------------------
    if (invoice.notes) {
      doc.fontSize(14).text("Notes :", { underline: true }).moveDown(0.5);
      doc.fontSize(12).text(invoice.notes);
    }

    doc.end();
  } catch (err) {
    console.error("[PDF ERROR] ", err);
    res.status(500).send("Erreur lors de la génération du PDF");
  }
};