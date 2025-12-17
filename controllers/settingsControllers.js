import Settings from "../models/Settings.js"

/*  GET SETTINGS  */
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne()

    // Si aucun paramètre n'existe encore, on les crée
    if (!settings) {
      settings = await Settings.create({})
    }

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("[SETTINGS][GET]", error)

    res.status(500).json({
      success: false,
      error: "Impossible de récupérer les paramètres",
    })
  }
}

/*  UPDATE SETTINGS  */
export const updateSettings = async (req, res) => {
  try {
    const { taxRate, invoicePrefix, footerText } = req.body

    // Validation simple
    if (taxRate < 0 || taxRate > 100) {
      return res.status(400).json({
        success: false,
        error: "Le taux de TVA doit être entre 0 et 100",
      })
    }

    if (!invoicePrefix) {
      return res.status(400).json({
        success: false,
        error: "Le préfixe de facture est obligatoire",
      })
    }

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

    res.json({
      success: true,
      data: settings,
      message: "Paramètres mis à jour",
    })
  } catch (error) {
    console.error("[SETTINGS][PUT]", error)

    res.status(500).json({
      success: false,
      error: "Impossible de mettre à jour les paramètres",
    })
  }
}
