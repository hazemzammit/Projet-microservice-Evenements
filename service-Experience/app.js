const http = require('http');
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const testRouter = require('./routes/test');
const userRouter = require('./routes/userRoutes');
const experienceRouter = require('./routes/experienceRoutes');
const dbconnection = require('./config/db.json');

const app = express();
const PORT = 3002;
const SERVICE_NAME = 'service-experiences';
const SERVICE_DISCOVERY_URL = process.env.SERVICE_DISCOVERY_URL || 'http://localhost:4000';

let serviceId = null;

// Middleware
app.use(express.json());

// Connect to MongoDB
mongoose.connect(dbconnection.url)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

// ============= SERVICE DISCOVERY FUNCTIONS =============

async function registerService() {
  try {
    const serviceInfo = {
      name: SERVICE_NAME,
      url: `http://service-experience:${PORT}`,
      port: PORT,
      metadata: {
        description: 'Microservice de gestion des expériences utilisateurs',
        version: '1.0.0',
        endpoints: [
          '/experience',
          '/user',
          '/test',
          '/health'
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

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur le service Expériences',
    serviceId: serviceId || 'non-enregistré',
    version: '1.0.0'
  });
});

// Routes de l'application
app.use('/test', testRouter);
app.use('/user', userRouter);
app.use('/experience', experienceRouter);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
  });
});

// ============= DÉMARRAGE DU SERVEUR =============

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   SERVICE EXPÉRIENCES DÉMARRÉ         ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                            ║`);
  console.log(`║   URL: http://service-experience:${PORT}           ║`);
  console.log('╚═══════════════════════════════════════╝\n');
  
  // Enregistrer auprès du Service Discovery
  registerService();
});

// ============= ARRÊT GRACIEUX =============

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