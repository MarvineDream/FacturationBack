import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import FactureRoutes from "./routes/FactureRoutes.js";
import ProduitRoutes from "./routes/ProduitRoutes.js";
import ClientRoutes from "./routes/ClientRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import { connectToDatabase } from "./Config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connexion DB
connectToDatabase();

/* =======================
   MIDDLEWARES GLOBAUX
======================= */

// Compression HTTP
app.use(
  compression({
    level: 6,
    threshold: 1024,
  })
);

// CORS
app.use(
  cors({
    origin: ["http://localhost:3000", "https://facturationback.onrender.com"],
    credentials: true,
  })
);

// Headers manuels (optionnel mais ok)
/* app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "1800");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, Origin, X-Requested-With, Content, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}); */

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



// Routes
app.use("/auth", authRoutes);
app.use("/factures", FactureRoutes);
app.use("/produit", ProduitRoutes);
app.use("/clients", ClientRoutes);
app.use("/settings", settingsRoutes);


// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur connecté sur http://localhost:${PORT}`);
});
