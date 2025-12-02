const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const connectDB = require('./config/db');

dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3004;
const SERVICE_NAME = 'service-shop';
const SERVICE_DISCOVERY_URL = process.env.SERVICE_DISCOVERY_URL || 'http://localhost:4000';

let serviceId = null;

// ============= SERVICE DISCOVERY FUNCTIONS =============

async function registerService() {
  try {
    const serviceInfo = {
      name: SERVICE_NAME,
      url: `http://localhost:${PORT}`,
      port: PORT,
      metadata: {
        description: 'Microservice de gestion des produits et catégories',
        version: '1.0.0',
        endpoints: [
          '/api/categories',
          '/api/products',
          '/health'
        ]
      }
    };

    const response = await axios.post(
      `${SERVICE_DISCOVERY_URL}/register`,
      serviceInfo
    );

    if (response.data.success) {
      serviceId = response.data.serviceId || response.data.service?.id;
      
      if (!serviceId) {
        console.error('❌ Service ID non trouvé dans la réponse:', response.data);
        return;
      }
      
      console.log(`✅ Service enregistré avec l'ID: ${serviceId}`);
      
      // Envoyer un heartbeat toutes les 20 secondes
      setInterval(() => {
        sendHeartbeat();
      }, 20000);
    } else {
      console.error('❌ Échec de l\'enregistrement:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement au Service Discovery:', error.message);
    console.log('⚠️  Le service fonctionne en mode standalone');
  }
}

async function sendHeartbeat() {
  if (!serviceId) {
    console.log('⚠️  Impossible d\'envoyer heartbeat: serviceId non défini');
    return;
  }
  
  try {
    await axios.post(`${SERVICE_DISCOVERY_URL}/heartbeat/${serviceId}`);
    console.log('💓 Heartbeat envoyé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du heartbeat:', error.message);
  }
}

async function unregisterService() {
  if (!serviceId) return;
  
  try {
    await axios.delete(`${SERVICE_DISCOVERY_URL}/unregister/${serviceId}`);
    console.log('✅ Service désenregistré avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du désenregistrement:', error.message);
  }
}

// ============= HEALTH CHECK ROUTE =============

app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============= ROOT ROUTE =============

app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur le service Shop',
    serviceId: serviceId || 'non-enregistré',
    version: '1.0.0',
    endpoints: {
      categories: '/api/categories',
      products: '/api/products',
      health: '/health'
    }
  });
});

// ============= ROUTES =============

app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));

// ============= 404 HANDLER =============

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// ============= ERROR HANDLER =============

app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

// ============= DATABASE CONNECTION & SERVER STARTUP =============

connectDB()
  .then(() => {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   SERVICE SHOP DÉMARRÉ                ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║   Port: ${PORT}                            ║`);
    console.log(`║   URL: http://localhost:${PORT}           ║`);
    console.log('║   MongoDB: Connecté ✓                 ║');
    console.log('╚═══════════════════════════════════════╝\n');
    
    app.listen(PORT, () => {
      console.log(`Serveur sur http://localhost:${PORT}`);
      
      // Enregistrer auprès du Service Discovery
      registerService();
    });
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MongoDB:', err);
    process.exit(1);
  });

// ============= ARRÊT GRACIEUX =============

process.on('SIGINT', async () => {
  console.log('\n⚠️  Arrêt du serveur...');
  
  // Désenregistrer du Service Discovery
  await unregisterService();
  
  // Fermer la connexion à la base de données
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  console.log('Connexion à la base de données fermée');
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Signal SIGTERM reçu...');
  await unregisterService();
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  process.exit(0);
});