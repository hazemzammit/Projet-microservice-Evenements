const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const axios = require("axios");

const PORT = process.env.PORT || 3000;
const SERVICE_NAME = 'service-utilisateurs';
const SERVICE_DISCOVERY_URL = process.env.SERVICE_DISCOVERY_URL || 'http://localhost:4000';

let serviceId = null;

// ============= SERVICE DISCOVERY FUNCTIONS =============

async function registerService() {
  try {
    const serviceInfo = {
      name: SERVICE_NAME,
      url: `http://service_utilisateurs:${PORT}`,
      port: PORT,
      metadata: {
        description: 'Microservice de gestion des utilisateurs et authentification',
        version: '1.0.0',
        endpoints: [
          '/users',
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

// ============= SERVER STARTUP =============

async function startServer() {
  let attempt = 0;
  const baseDelay = 2000;
  
  while (true) {
    try {
      attempt++;
      console.log(`Attempting MongoDB connection (attempt ${attempt})...`);
      await connectDB();
      console.log("MongoDB connection established.");
      break;
    } catch (err) {
      console.error(`MongoDB connection failed: ${err.message}`);
      const delay = Math.min(baseDelay * attempt, 30000); 
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`\n╔═══════════════════════════════════════╗`);
    console.log(`║   SERVICE UTILISATEURS DÉMARRÉ        ║`);
    console.log(`╠═══════════════════════════════════════╣`);
    console.log(`║   Port: ${PORT}                            ║`);
    console.log(`║   URL: http://service_utilisateurs:${PORT}           ║`);
    console.log(`║   Environment: ${(process.env.NODE_ENV || "development").padEnd(23)} ║`);
    console.log(`╚═══════════════════════════════════════╝\n`);
    
    // Enregistrer auprès du Service Discovery
    registerService();
  });

  // Gestion de l'arrêt gracieux
  process.on('SIGINT', async () => {
    console.log('\n⚠️  Arrêt du serveur...');
    
    // Désenregistrer du Service Discovery
    await unregisterService();
    
    // Fermer Socket.IO
    io.close();
    
    // Fermer la connexion à la base de données
    await require('mongoose').connection.close();
    console.log('Connexion à la base de données fermée');
    
    process.exit(0);
  });
}

startServer();