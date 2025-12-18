const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3003;

// Middleware
app.use(express.json());

// Lire les données
const getReservations = () => {
  const data = fs.readFileSync('data.json');
  return JSON.parse(data);
};

// Sauvegarder les données
const saveReservations = (data) => {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
};

// GET - Toutes les réservations (ou mes réservations)
app.get('/api/reservations', (req, res) => {
  const reservations = getReservations();
  const userId = req.headers.userid || "666666666666666666666666"; // simulation
  const mesReservations = reservations.filter(r => r.userId === userId);
  res.json({
    success: true,
    count: mesReservations.length,
    reservations: mesReservations
  });
});

// GET - Une réservation par ID
app.get('/api/reservations/:id', (req, res) => {
  const reservations = getReservations();
  const reservation = reservations.find(r => r.id == req.params.id);
  
  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: "Réservation non trouvée"
    });
  }
  
  res.json({
    success: true,
    reservation: reservation
  });
});

// POST - Créer une réservation
app.post('/api/reservations', (req, res) => {
  const reservations = getReservations();
  const { eventId, nombrePlaces } = req.body;

  if (!eventId || !nombrePlaces) {
    return res.status(400).json({ success: false, message: "Données manquantes" });
  }

  const nouvelle = {
    id: reservations.length ? Math.max(...reservations.map(r => r.id)) + 1 : 1,
    userId: "666666666666666666666666",
    eventId,
    nombrePlaces,
    statut: "en attente",
    dateReservation: new Date().toISOString()
  };

  reservations.push(nouvelle);
  saveReservations(reservations);

  res.status(201).json({
    success: true,
    message: "Réservation créée !",
    reservation: nouvelle
  });
});

// POST - Créer une réservation (alias)
app.post('/api/reservations/create', (req, res) => {  // CORRIGÉ: 'reservations' pas 'areservations'
  const reservations = getReservations();
  const { eventId, nombrePlaces } = req.body;

  if (!eventId || !nombrePlaces) {
    return res.status(400).json({ success: false, message: "Données manquantes" });
  }

  const nouvelle = {
    id: reservations.length ? Math.max(...reservations.map(r => r.id)) + 1 : 1,
    userId: "666666666666666666666666",
    eventId,
    nombrePlaces,
    statut: "en attente",
    dateReservation: new Date().toISOString()
  };

  reservations.push(nouvelle);
  saveReservations(reservations);

  res.status(201).json({
    success: true,
    message: "Réservation créée !",
    reservation: nouvelle
  });
});

// PUT - Confirmer une réservation (NOUVEAU - pour ticket service)
app.put('/api/reservations/confirm/:id', (req, res) => {
  const reservations = getReservations();
  const reservation = reservations.find(r => r.id == req.params.id);
  
  if (!reservation) {
    return res.status(404).json({ 
      success: false, 
      message: "Réservation non trouvée" 
    });
  }
  
  if (reservation.statut === "annulée") {
    return res.status(400).json({
      success: false,
      message: "Impossible de confirmer une réservation annulée"
    });
  }
  
  reservation.statut = "confirmée";
  saveReservations(reservations);
  
  res.json({
    success: true,
    message: "Réservation confirmée",
    reservation
  });
});

// PUT - Annuler une réservation
app.put('/api/reservations/cancel/:id', (req, res) => {
  const reservations = getReservations();
  const id = parseInt(req.params.id);
  const reservation = reservations.find(r => r.id === id);

  if (!reservation) {
    return res.status(404).json({ success: false, message: "Réservation non trouvée" });
  }

  reservation.statut = "annulée";
  saveReservations(reservations);

  res.json({
    success: true,
    message: "Réservation annulée",
    reservation
  });
});

// Page d'accueil
app.get('/', (req, res) => {
  res.send(`
    <h1>Service Réservation - CRUD avec fichier JSON</h1>
    <p>Comme dans l'atelier officiel</p>
    <ul>
      <li>GET /api/reservations → mes réservations</li>
      <li>GET /api/reservations/:id → une réservation</li>
      <li>POST /api/reservations → créer</li>
      <li>PUT /api/reservations/confirm/:id → confirmer</li>
      <li>PUT /api/reservations/cancel/:id → annuler</li>
    </ul>
  `);
});

app.listen(PORT, () => {
  console.log(`Service Réservation (fichier JSON) → http://localhost:${PORT}`);
});