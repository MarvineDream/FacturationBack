import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import FactureRoutes from './routes/FactureRoutes.js';
import ProduitRoutes from './routes/ProduitRoutes.js';
import ClientRoutes from './routes/ClientRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { connectToDatabase } from './Config/db.js';




dotenv.config();
const app = express();
const PORT = process.env.PORT;


connectToDatabase();



// Middleware pour permettre l'accès à l'API (CORS)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '1800');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, Origin, X-Requested-With, Content, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    
    // Gérer les requêtes OPTIONS
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204); 
    }
  
    next(); 
  });

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://facturationback.onrender.com"],
  credentials: true,
}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.use('/auth', authRoutes);
app.use('/factures', FactureRoutes);
app.use('/produit', ProduitRoutes);
app.use('/clients', ClientRoutes);
app.use('/settings', settingsRoutes);








app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});

