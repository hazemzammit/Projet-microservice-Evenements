require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Catch JSON parse errors from body parser and return a friendly message
app.use((err, req, res, next) => {
  if (err && (err instanceof SyntaxError || err.type === 'entity.parse.failed')) {
    return res.status(400).json({ success: false, message: 'Invalid JSON body' });
  }
  next(err);
});

// Routes
const reservationRoutes = require('./routes/reservationRoutes');
app.use('/api/reservations', reservationRoutes);

app.get('/', (req, res) => {
  res.send(`
    <h1>Service Réservation (Fichier JSON) - En marche !</h1>
    <p>API Endpoints:</p>
    <ul>
      <li>POST /api/reservations/create - Créer une réservation</li>
      <li>GET /api/reservations/my - Mes réservations</li>
      <li>PUT /api/reservations/cancel/:id - Annuler</li>
      <li>GET /api/reservations/:id - Détail</li>
    </ul>
  `);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`✅ Service Réservation (JSON) → http://localhost:${PORT}`);
});