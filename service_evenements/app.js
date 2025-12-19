const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const dbConfig = require('./config/db.json');
const evenementRoutes = require('./routes/evenementRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();
const PORT = 3001;
const SERVICE_NAME = 'service-evenements';
const SERVICE_DISCOVERY_URL = process.env.SERVICE_DISCOVERY_URL || 'http://localhost:4000';

let serviceId = null;

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(dbConfig.url)
  .then(() => {
    console.log('Base de données connectée avec succès');
    registerService();
  })
  .catch(err => {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  });

// ============= ENREGISTREMENT AU SERVICE DISCOVERY =============

async function registerService() {
  try {
    const serviceInfo = {
      name: SERVICE_NAME,
      url: `http://service_evenements:${PORT}`,
      port: PORT,
      metadata: {
        description: 'Microservice de gestion des événements et avis',
        version: '1.0.0',
        endpoints: [
          '/api/evenements',
          '/api/reviews'
        ]
      }
    };

    const response = await axios.post(
      `${SERVICE_DISCOVERY_URL}/register`,
      serviceInfo
    );

    if (response.data.success) {
      // FIXED: Get serviceId from the correct location in response
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

// ============= ROUTES =============

app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur le service Événements',
    serviceId: serviceId || 'non-enregistré',
    version: '1.0.0'
  });
});

// Route de santé pour le Service Discovery
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/evenements', evenementRoutes);
app.use('/api/reviews', reviewRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

app.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   SERVICE ÉVÉNEMENTS DÉMARRÉ         ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                            ║`);
  console.log(`║   URL: http://service_evenements:${PORT}           ║`);
  console.log('╚═══════════════════════════════════════╝\n');
});

// Gestion de l'arrêt gracieux
process.on('SIGINT', async () => {
  console.log('\n⚠️  Arrêt du serveur...');
  
  // Désenregistrer du Service Discovery
  await unregisterService();
  
  // Fermer la connexion à la base de données
  await mongoose.connection.close();
  console.log('Connexion à la base de données fermée');
  
  process.exit(0);
});

module.exports = app;