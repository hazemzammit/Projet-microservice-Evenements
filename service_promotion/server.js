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

/**
 * Registers the service with the Service Discovery server
 */
async function registerService() {
  try {
    const serviceInfo = {
      name: SERVICE_NAME,
      url: `http://service_promotion:${PORT}`,
      port: PORT,
      metadata: {
        description: 'Microservice de gestion des promotions et coupons',
        version: '1.0.0',
        endpoints: [
          '/api/promotions',
          '/api/coupons',
          '/api/stats',
          '/health'
        ]
      }
    };

    console.log(`📡 Tentative d'enregistrement au Service Discovery...`);
    
    const response = await axios.post(
      `${SERVICE_DISCOVERY_URL}/register`,
      serviceInfo,
      { timeout: 5000 }
    );

    if (response.data.success) {
      serviceId = response.data.service?.id || response.data.serviceId;
      console.log(`✅ Service enregistré avec succès!`);
      console.log(`   ID: ${serviceId}`);
      console.log(`   Nom: ${SERVICE_NAME}`);
      console.log(`   URL: http://service_promotion:${PORT}`);
      
      // Start heartbeat interval (every 20 seconds)
      setInterval(() => {
        sendHeartbeat();
      }, 20000);
      
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement au Service Discovery:');
    console.error(`   Message: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   Le Service Discovery n\'est pas accessible');
      console.log(`   Vérifiez qu'il tourne sur ${SERVICE_DISCOVERY_URL}`);
    }
    console.log('⚠️  Le service fonctionne en mode standalone (sans Service Discovery)');
    return false;
  }
}

/**
 * Sends periodic heartbeat to maintain service registration
 */
async function sendHeartbeat() {
  if (!serviceId) return;
  
  try {
    await axios.post(
      `${SERVICE_DISCOVERY_URL}/heartbeat/${serviceId}`,
      {},
      { timeout: 3000 }
    );
    console.log(`💓 Heartbeat envoyé (${new Date().toLocaleTimeString()})`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du heartbeat:', error.message);
  }
}

/**
 * Unregisters the service from Service Discovery on shutdown
 */
async function unregisterService() {
  if (!serviceId) return;
  
  try {
    await axios.delete(
      `${SERVICE_DISCOVERY_URL}/unregister/${serviceId}`,
      { timeout: 3000 }
    );
    console.log('✅ Service désenregistré avec succès du Service Discovery');
  } catch (error) {
    console.error('❌ Erreur lors du désenregistrement:', error.message);
  }
}

// ============= DATABASE CONNECTION & SERVER STARTUP =============

async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connecté');
    
    // Start Express server
    app.listen(PORT, async () => {
      console.log('\n╔═══════════════════════════════════════════════╗');
      console.log('║   🚀 SERVICE PROMOTIONS DÉMARRÉ               ║');
      console.log('╠═══════════════════════════════════════════════╣');
      console.log(`║   📍 Port: ${PORT}                                 ║`);
      console.log(`║   🌐 URL: http://service_promotion:${PORT}                ║`);
      console.log('║   💾 MongoDB: Connecté ✓                      ║');
      console.log('╚═══════════════════════════════════════════════╝\n');
      
      // Register with Service Discovery
      await registerService();
      
      console.log('\n📋 Service prêt à recevoir des requêtes!\n');
    });
    
  } catch (err) {
    console.error('❌ Erreur de démarrage du serveur:');
    console.error(err);
    process.exit(1);
  }
}

// ============= GRACEFUL SHUTDOWN HANDLERS =============

/**
 * Handles SIGINT signal (Ctrl+C)
 */
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Signal SIGINT reçu (Ctrl+C)...');
  await gracefulShutdown();
});

/**
 * Handles SIGTERM signal (Docker, Kubernetes, etc.)
 */
process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Signal SIGTERM reçu...');
  await gracefulShutdown();
});

/**
 * Handles uncaught exceptions
 */
process.on('uncaughtException', async (error) => {
  console.error('\n\n❌ Exception non capturée:', error);
  await gracefulShutdown();
});

/**
 * Performs graceful shutdown of all services
 */
async function gracefulShutdown() {
  console.log('🛑 Arrêt gracieux du service...');
  
  try {
    // 1. Unregister from Service Discovery
    if (serviceId) {
      console.log('📡 Désenregistrement du Service Discovery...');
      await unregisterService();
    }
    
    // 2. Close database connection
    console.log('💾 Fermeture de la connexion MongoDB...');
    await mongoose.connection.close();
    console.log('✅ Connexion à la base de données fermée');
    
    console.log('✅ Arrêt terminé avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt gracieux:', error);
    process.exit(1);
  }
}

// ============= START THE SERVER =============

startServer();