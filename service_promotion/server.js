import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3005;
const SERVICE_NAME = 'service-promotions';
const SERVICE_DISCOVERY_URL = process.env.SERVICE_DISCOVERY_URL || 'http://localhost:4000';

let serviceId = null;

// ============= SERVICE DISCOVERY FUNCTIONS =============

// ============= SERVICE DISCOVERY FUNCTIONS =============

async function registerService() {
  try {
    const serviceInfo = {
      name: SERVICE_NAME,
      url: `http://localhost:${PORT}`,
      port: PORT,
      metadata: {
        description: 'Microservice de gestion des promotions et coupons',
        version: '1.0.0',
        endpoints: [
          '/promotions',
          '/coupons',
          '/health'
        ]
      }
    };

    const response = await axios.post(
      `${SERVICE_DISCOVERY_URL}/register`,
      serviceInfo
    );

    if (response.data.success) {
      // FIX: Get the ID from response.data.service.id
      serviceId = response.data.service.id;
      console.log(`✅ Service enregistré avec l'ID: ${serviceId}`);
      
      // Envoyer un heartbeat toutes les 20 secondes
      setInterval(() => {
        sendHeartbeat();
      }, 20000);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement au Service Discovery:', error.message);
    console.log('⚠️  Le service fonctionne en mode standalone');
  }
}

async function sendHeartbeat() {
  if (!serviceId) return;
  
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

// ============= DATABASE CONNECTION & SERVER STARTUP =============

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   SERVICE PROMOTIONS DÉMARRÉ          ║');
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
  await mongoose.connection.close();
  console.log('Connexion à la base de données fermée');
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Signal SIGTERM reçu...');
  await unregisterService();
  await mongoose.connection.close();
  process.exit(0);
});