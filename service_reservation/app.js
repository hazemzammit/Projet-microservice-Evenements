require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'service-reservation';
const SERVICE_DISCOVERY_URL = process.env.SERVICE_DISCOVERY_URL || 'http://localhost:4000';

let serviceId = null;

app.use(cors());
app.use(express.json());

// Register with service discovery
async function registerService() {
  try {
    const serviceInfo = {
      name: SERVICE_NAME,
      url: `http://service_reservation:${PORT}`,
      port: PORT,
      metadata: {
        description: 'Microservice de gestion des réservations',
        version: '1.0.0',
        endpoints: [
          '/api/reservations',
          '/api/reservations/create',
          '/api/reservations/my',
          '/api/reservations/confirm/:id',
          '/api/reservations/cancel/:id',
          '/api/reservations/stats'
        ]
      }
    };

    const response = await axios.post(
      `${SERVICE_DISCOVERY_URL}/register`,
      serviceInfo
    );

    if (response.data.success) {
      serviceId = response.data.serviceId || response.data.service?.id;
      console.log(`✅ Service enregistré avec l'ID: ${serviceId}`);
      
      // Send heartbeat every 20 seconds
      setInterval(sendHeartbeat, 20000);
    }
  } catch (error) {
    console.error('❌ Erreur d\'enregistrement:', error.message);
  }
}

async function sendHeartbeat() {
  if (!serviceId) return;
  
  try {
    await axios.post(`${SERVICE_DISCOVERY_URL}/heartbeat/${serviceId}`);
    console.log('💓 Heartbeat envoyé');
  } catch (error) {
    console.error('❌ Erreur heartbeat:', error.message);
  }
}

// Routes
const reservationRoutes = require('./routes/reservationRoutes');
app.use('/api/reservations', reservationRoutes);

// Health check for service discovery
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send(`
    <h1>Service Réservation - Microservice</h1>
    <p>Service ID: ${serviceId || 'non-enregistré'}</p>
    <ul>
      <li>POST /api/reservations/create - Créer une réservation</li>
      <li>GET /api/reservations/my - Mes réservations</li>
      <li>PUT /api/reservations/cancel/:id - Annuler</li>
      <li>GET /api/reservations/:id - Détail</li>
      <li>PUT /api/reservations/confirm/:id - Confirmer</li>
    </ul>
  `);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === 'entity.parse.failed')) {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n✅ Service Réservation (Microservice) → http://localhost:${PORT}`);
  registerService();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Arrêt du service Réservation...');
  process.exit(0);
});