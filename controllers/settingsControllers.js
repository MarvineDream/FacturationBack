import Settings from "../models/Settings.js"

/*  GET SETTINGS  */
/* ===================== GET SETTINGS ===================== */
export const getSettings = async (req, res) => {
  console.log("[SETTINGS][GET] Requête reçue")

  try {
    let settings = await Settings.findOne()

    // Si aucun paramètre n'existe encore
    if (!settings) {
      console.log("[SETTINGS][GET] Aucun paramètre trouvé, création par défaut…")
      settings = await Settings.create({})
      console.log("[SETTINGS][GET] Paramètres par défaut créés :", settings._id)
    } else {
      console.log("[SETTINGS][GET] Paramètres trouvés :", settings._id)
    }

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("[SETTINGS][GET][ERROR]", error)

    res.status(500).json({
      success: false,
      error: "Impossible de récupérer les paramètres",
    })
  }
}

/* ===================== UPDATE SETTINGS ===================== */
export const updateSettings = async (req, res) => {
  console.log("[SETTINGS][PUT] Requête reçue")
  console.log("[SETTINGS][PUT] Payload :", req.body)

  try {
    const { taxRate, invoicePrefix, footerText } = req.body

    /* -------- Validation -------- */
    if (taxRate < 0 || taxRate > 100) {
      console.warn("[SETTINGS][PUT] TVA invalide :", taxRate)
      return res.status(400).json({
        success: false,
        error: "Le taux de TVA doit être entre 0 et 100",
      })
    }

    if (!invoicePrefix) {
      console.warn("[SETTINGS][PUT] Préfixe de facture manquant")
      return res.status(400).json({
        success: false,
        error: "Le préfixe de facture est obligatoire",
      })
    }

    /* -------- Update -------- */
    console.log("[SETTINGS][PUT] Mise à jour des paramètres…")

    const settings = await Settings.findOneAndUpdate(
      {},
      {
        taxRate,
        invoicePrefix: invoicePrefix.toUpperCase(),
        footerText,
      },
      {
        new: true,
        upsert: true,
      }
    )

    console.log("[SETTINGS][PUT] Paramètres mis à jour :", settings._id)

    res.json({
      success: true,
      data: settings,
      message: "Paramètres mis à jour",
    })
  } catch (error) {
    console.error("[SETTINGS][PUT][ERROR]", error)

    res.status(500).json({
      success: false,
      error: "Impossible de mettre à jour les paramètres",
    })
  }
}
