require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const ticketRoutes = require('./routes/ticketRoutes');
app.use('/api/tickets', ticketRoutes);

app.get('/', (req, res) => {
  res.send(`
    <h1>Service Ticket - En marche !</h1>
    <p>API Endpoints:</p>
    <ul>
      <li>POST /api/tickets/process-payment - Traiter le paiement et créer un ticket</li>
      <li>GET /api/tickets/:ticketNumber - Récupérer un ticket</li>
      <li>GET /api/tickets/pdf/:ticketNumber - Télécharger le PDF du ticket</li>
    </ul>
  `);
});

module.exports = app;