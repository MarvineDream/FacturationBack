import Client from "../models/Client.js";

// Helper pour transformer _id en id
const formatClient = (client) => {
  const obj = client.toObject();
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
};

// Créer un client
export const createClient = async (req, res) => {
  console.log("[CREATE CLIENT] Données reçues:", req.body);
  console.log("[CREATE CLIENT] Utilisateur connecté ID:", req.user?.id);

  try {
    const client = await Client.create({
      ...req.body,
      userId: req.user.id,
    });

    console.log("[CREATE client] Client créé:", client);
    res.status(201).json({ success: true, data: client });
  } catch (err) {
    console.error("[CREATE client] Erreur:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Récuperer tous les clients
export const getClients = async (req, res) => {
  console.log("[GET clients] Récupération de TOUS les clients");

  try {
    const clients = await Client.find().sort({ createdAt: -1 })

    console.log("[GET clients] Clients récupérés:", clients.length);

    res.json({ success: true, data: clients })
  } catch (err) {
    console.error("[GET clients] Erreur:", err.message)
    res.status(500).json({ success: false, message: err.message })
  }
};


// Récuperer un client par son ID
export const getClientById = async (req, res) => {
  console.log("[GET client] Recherche client ID:", req.params.id);
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.user.id });
    if (!client) {
      console.log("[GET client] Client introuvable");
      return res.status(404).json({ success: false, message: "Client introuvable" });
    }
    console.log("[GET client] Client trouvé:", client);
    res.json({ success: true, data: client });
  } catch (err) {
    console.error("[GET client] Erreur:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mise à jour d'un client
export const updateClient = async (req, res) => {
  console.log("[UPDATE client] ID:", req.params.id, "Données:", req.body);
  try {
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      console.log("[UPDATE client] Client introuvable");
      return res.status(404).json({ success: false, message: "Client introuvable" });
    }

    console.log("[UPDATE client] Client mis à jour:", client);
    res.json({ success: true, data: client });
  } catch (err) {
    console.error("[UPDATE client] Erreur:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
};

// Suppression d'un client
export const deleteClient = async (req, res) => {
  console.log("[DELETE client] ID:", req.params.id);
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!client) {
      console.log("[DELETE client] Client introuvable");
      return res.status(404).json({ success: false, message: "Client introuvable" });
    }
    console.log("[DELETE client] Client supprimé:", client._id);
    res.json({ success: true, message: "Client supprimé" });
  } catch (err) {
    console.error("[DELETE client] Erreur:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};