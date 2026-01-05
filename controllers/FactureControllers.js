import Invoice from "../models/Facture.js"
import Client from "../models/Client.js"
import Product from "../models/Produit.js"
import mongoose from "mongoose"
import InvoiceNumber from "../models/NumeroFacture.js"
import User from "../models/User.js"
import PDFDocument from "pdfkit"
import path from "path"



// --------------------
// Helper pour formater le JSON
// --------------------
const formatInvoice = (invoice) => {
  const obj = invoice.toObject()
  obj.id = obj._id.toString()
  delete obj._id
  delete obj.__v
  return obj
}

// ===============================
// CREATE INVOICE
// ===============================
export const createInvoice = async (req, res) => {
  console.log("\n[FACTURE] Création de facture")
  console.log("Payload reçu :", JSON.stringify(req.body, null, 2))

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const {
      clientId,
      items,
      subtotal,
      taxRate,
      taxAmount,
      total,
      issueDate,
      dueDate,
      notes,
      status,
    } = req.body

    if (!req.user?.id) {
      return res.status(401).json({ success: false, error: "Utilisateur non authentifié" })
    }

    if (!clientId) {
      return res.status(400).json({ success: false, error: "Client obligatoire" })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "La facture doit contenir au moins un article" })
    }

    const client = await Client.findById(clientId)
    if (!client) {
      return res.status(404).json({ success: false, error: "Client introuvable" })
    }

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Produit introuvable : ${item.productName || item.productId}`,
        })
      }
    }

    // --------------------------
    // Numéro de facture
    // --------------------------
    const year = new Date().getFullYear()
    const scope = `year-${year}`

    const numeroData = await InvoiceNumber.findOneAndUpdate(
      { scope },
      { $inc: { dernierNumero: 1 }, updatedAt: new Date() },
      { new: true, upsert: true, setDefaultsOnInsert: true, session }
    )

    const lastNumber = numeroData?.dernierNumero ?? 1
    const invoiceNumber = `FAC-${year}-${String(lastNumber).padStart(4, "0")}`

    console.log(`[FACTURE] Numéro généré : ${invoiceNumber}`)

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
    )

    await session.commitTransaction()
    session.endSession()

    const populatedInvoice = await Invoice.findById(invoiceDoc._id)
      .populate("clientId")
      .lean()

    if (!populatedInvoice) {
      throw new Error("Erreur lors du peuplement de la facture")
    }

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
        : null,
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
    }

    res.status(201).json({ success: true, data: responseInvoice })
  } catch (error) {
    console.error("[FACTURE] Erreur création :", error.message)

    if (session.inTransaction()) await session.abortTransaction()
    session.endSession()

    res.status(500).json({
      success: false,
      error: "Erreur serveur",
      details: error.message,
    })
  }
}

// ===============================
// GET ALL INVOICES
// ===============================
export const getInvoices = async (req, res) => {
  try {
    console.log("\n[GET INVOICES] Utilisateur :", req.user?.id)

    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Utilisateur non authentifié" })
    }

    const query = req.user.role === "admin" ? {} : { userId: req.user.id }

    const invoices = await Invoice.find(query)
      .populate("clientId")
      .sort({ createdAt: -1 })

    const data = invoices.map((invoice) => ({
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.clientId
        ? {
            id: invoice.clientId._id.toString(),
            name: invoice.clientId.name,
            email: invoice.clientId.email,
            phone: invoice.clientId.phone,
            address: invoice.clientId.address,
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
    }))

    console.log(`[GET INVOICES] ${data.length} trouvées`)
    res.json({ success: true, data })
  } catch (error) {
    console.error("[GET INVOICES] Erreur :", error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ===============================
// GET BY ID
// ===============================
export const getInvoiceById = async (req, res) => {
  try {
    console.log("[GET INVOICE BY ID] :", req.params.id)

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate("clientId")
      .lean()

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Facture introuvable" })
    }

    const formattedInvoice = {
      id: invoice._id.toString(),
      invoiceNumber: invoice.invoiceNumber,
      client: invoice.clientId
        ? {
            id: invoice.clientId._id.toString(),
            name: invoice.clientId.name,
            email: invoice.clientId.email,
            phone: invoice.clientId.phone,
            address: invoice.clientId.address,
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
    }

    res.json({ success: true, data: formattedInvoice })
  } catch (error) {
    console.error("[GET INVOICE BY ID] Erreur :", error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

// ===============================
// UPDATE INVOICE
// ===============================
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    )

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Facture introuvable" })
    }

    res.json({ success: true, data: formatInvoice(invoice) })
  } catch (error) {
    console.error("[UPDATE INVOICE] Erreur :", error.message)
    res.status(400).json({ success: false, message: error.message })
  }
}

// ===============================
// UPDATE STATUS
// ===============================
export const updateInvoiceStatus = async (req, res) => {
  console.log("\n========== [MISE A JOUR STATUT FACTURE] ==========")
  console.log("Facture ID :", req.params.id)
  console.log("Body :", req.body)

  try {
    const { status } = req.body
    const { id } = req.params

    const allowedStatus = ["draft", "sent", "paid", "cancelled"]

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ success: false, message: "Statut invalide" })
    }

    const invoice = await Invoice.findByIdAndUpdate(id, { status }, { new: true })

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Facture introuvable" })
    }

    res.json({
      success: true,
      message: "Statut mis à jour",
      data: invoice,
    })
  } catch (error) {
    console.error("[MISE A JOUR STATUT] Erreur :", error.message)
    res.status(500).json({ success: false, message: "Erreur serveur" })
  }

  console.log("============\n")
}


// Suprimer une facture
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Facture introuvable" })
    }

    res.json({ success: true, message: "Facture supprimée avec succès" })
  } catch (error) {
    console.error("[SUPPRIMER FACTURE] Erreur :", error.message)
    res.status(500).json({ success: false, message: error.message })
  }
}

// Télécharger la facture au format PDF
export const downloadInvoicePdf = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate("clientId")

    if (!invoice) {
      return res.status(404).send("Facture introuvable")
    }

    const user = await User.findById(req.user.id)

    const doc = new PDFDocument({ margin: 40 })

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename=${invoice.invoiceNumber}.pdf`)

    doc.pipe(res)

    const logoPath = path.join(process.cwd(), "public", "logo.png")

    try {
      doc.image(logoPath, 40, 40, { width: 120 })
    } catch (err) {
      console.warn("Logo introuvable :", err.message)
    }

    doc.moveDown(3)

    doc
      .fontSize(18)
      .text("FACTURE", { align: "right" })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Numéro : ${invoice.invoiceNumber}`, { align: "right" })
      .text(`Créée par : ${user?.name}`, { align: "right" })
      .text(`Email : ${user?.email}`, { align: "right" })
      .moveDown(2)

    doc.fontSize(14).text("Client :", { underline: true }).moveDown(0.5)
    doc.fontSize(12).text(invoice.clientId.name)
    if (invoice.clientId.email) doc.text(invoice.clientId.email)
    if (invoice.clientId.phone) doc.text(invoice.clientId.phone)
    if (invoice.clientId.address) doc.text(invoice.clientId.address)

    doc.moveDown(2)

    doc.fontSize(14).text("Articles :", { underline: true }).moveDown(0.5)
    invoice.items.forEach((item) => {
      doc.text(
        `${item.productName} — ${item.quantity} x ${item.unitPrice} = ${item.total} Fcfa`
      )
    })

    doc.moveDown(2)

    doc.fontSize(14).text("Résumé :", { underline: true }).moveDown(0.5)
    doc.text(`Sous-total : ${invoice.subtotal} Fcfa`)
    doc.text(`TVA (${invoice.taxRate}%) : ${invoice.taxAmount} Fcfa`)
    doc.text(`TOTAL : ${invoice.total} Fcfa`)

    if (invoice.notes) {
      doc.moveDown(2)
      doc.fontSize(14).text("Notes :", { underline: true }).moveDown(0.5)
      doc.fontSize(12).text(invoice.notes)
    }

    doc.end()
  } catch (error) {
    console.error("[PDF ERROR] :", error)
    res.status(500).send("Erreur lors de la génération du PDF")
  }
}

// ===============================
// ADMIN ANALYSES
// ===============================
export const getAdminAnalytics = async (req, res) => {
  console.log("\n================= [ADMIN ANALYTICS] =================")
  console.log("User :", req.user?.id || "—")
  console.log("Query reçue :", req.query)

  try {
    /* ================= PERIOD ================= */
    const { period = "month" } = req.query

    const now = new Date()
    let startDate = null

    switch (period) {
      case "day":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        )
        break

      case "week":
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break

      case "month":
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 1)
        break

      case "quarter":
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 3)
        break

      case "year":
        startDate = new Date(now)
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    const dateFilter = startDate
      ? { createdAt: { $gte: startDate } }
      : {}

    console.log("Start date :", startDate)
    console.log("Date filter :", dateFilter)

    /* ================= SUMMARY ================= */
    const summary = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$total" },
          totalSales: { $sum: 1 },
        },
      },
    ])

    const revenue = summary[0]?.revenue || 0
    const totalSales = summary[0]?.totalSales || 0

    /* ================= BEST CUSTOMER ================= */
    const bestCustomerAgg = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "clients",
          localField: "clientId",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: "$client" },
      {
        $group: {
          _id: "$clientId",
          customerName: { $first: "$client.name" },
          total: { $sum: "$total" },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ])

    const bestCustomer = bestCustomerAgg[0]
      ? {
          name: bestCustomerAgg[0].customerName,
          totalSpent: bestCustomerAgg[0].total,
          percentage: revenue
            ? Math.round(
                (bestCustomerAgg[0].total / revenue) * 100
              )
            : 0,
        }
      : null

    /* ================= TOP PRODUCTS ================= */
    const topProductsAgg = await Invoice.aggregate([
      { $match: dateFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productName",
          sales: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sales: -1 } },
      { $limit: 5 },
    ])

    /* ================= REVENUE TREND ================= */
    const revenueTrendAgg = await Invoice.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d/%m",
              date: "$createdAt",
            },
          },
          value: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ])

    /* ================= CLIENTS ================= */

    // 🔹 Total clients
    const totalClients = await Client.countDocuments()

    // 🔹 Nouveaux clients sur la période
    const newClients = startDate
      ? await Client.countDocuments({
          createdAt: { $gte: startDate },
        })
      : totalClients

    // 🔹 Trend nouveaux clients
    const newClientsTrendAgg = await Client.aggregate([
      ...(startDate
        ? [{ $match: { createdAt: { $gte: startDate } } }]
        : []),
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d/%m",
              date: "$createdAt",
            },
          },
          value: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    /* ================= RESPONSE ================= */
    return res.json({
      success: true,
      data: {
        revenue,
        totalSales,

        totalClients,
        newClients,

        bestCustomer,

        topProduct: topProductsAgg[0]?._id || "—",

        revenueTrend: revenueTrendAgg.map((r) => ({
          label: r._id,
          value: r.value,
        })),

        newClientsTrend: newClientsTrendAgg.map((c) => ({
          label: c._id,
          value: c.value,
        })),

        topProducts: topProductsAgg.map((p) => ({
          name: p._id,
          sales: p.sales,
        })),
      },
    })
  } catch (error) {
    console.error("\n[ADMIN ANALYTICS ERROR]")
    console.error(error)

    return res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des analytics",
    })
  }
}
