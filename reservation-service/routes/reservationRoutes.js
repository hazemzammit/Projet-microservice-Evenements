const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const axios = require('axios');

const DATA_FILE = path.join(__dirname, '../data.json');

// Fonctions utilitaires
const getReservations = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
};

const saveReservations = (reservations) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(reservations, null, 2));
};

const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// 1. Créer une réservation
router.post('/create', auth, async (req, res) => {
  try {
    const { eventId, nombrePlaces } = req.body;
    
    if (!eventId || !nombrePlaces || nombrePlaces < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'eventId et nombrePlaces obligatoires' 
      });
    }

    const reservations = getReservations();
    
    const reservation = {
      id: generateId(),
      userId: req.user.id,
      eventId,
      nombrePlaces: parseInt(nombrePlaces),
      statut: 'en attente',
      dateReservation: new Date().toISOString()
    };

    reservations.push(reservation);
    saveReservations(reservations);

    res.status(201).json({ 
      success: true, 
      message: 'Réservation créée avec succès !', 
      reservation 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. Voir mes réservations
router.get('/my', auth, async (req, res) => {
  try {
    const reservations = getReservations();
    const mesReservations = reservations
      .filter(r => r.userId === req.user.id)
      .sort((a, b) => new Date(b.dateReservation) - new Date(a.dateReservation));

    res.json({ 
      success: true, 
      count: mesReservations.length, 
      reservations: mesReservations 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Annuler une réservation
router.put('/cancel/:id', auth, async (req, res) => {
  try {
    const reservations = getReservations();
    const reservation = reservations.find(r => r.id === req.params.id);

    if (!reservation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Réservation non trouvée' 
      });
    }

    if (reservation.userId !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accès refusé' 
      });
    }

    if (reservation.statut !== 'en attente') {
      return res.status(400).json({ 
        success: false, 
        message: 'Impossible d\'annuler (déjà confirmée ou annulée)' 
      });
    }

    reservation.statut = 'annulée';
    saveReservations(reservations);

    res.json({ 
      success: true, 
      message: 'Réservation annulée !', 
      reservation 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. Détail d'une réservation
router.get('/stats', auth, (req, res) => {
  try {
    const reservations = getReservations();
    const stats = {
      success: true,
      total: reservations.length,
      en_attente: reservations.filter(r => r.statut === 'en attente').length,
      confirmees: reservations.filter(r => r.statut === 'confirmée').length,
      annulees: reservations.filter(r => r.statut === 'annulée').length
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Confirmer une réservation (mettre avant '/:id' pour éviter shadowing)
router.put('/confirm/:id', auth, async (req, res) => {
  try {
    const reservations = getReservations();
    const reservation = reservations.find(r => r.id === req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Non trouvée' });
    }

    // Seul le propriétaire ou admin peut confirmer — ici on autorise si user id égal (ou role admin si present)
    if (reservation.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    reservation.statut = 'confirmée';
    saveReservations(reservations);

    // Appeler ticket-service webhook (ne bloque pas le succès si échoue)
    try {
      const ticketServiceUrl = process.env.TICKET_SERVICE_URL || 'http://localhost:3033';
      await axios.post(`${ticketServiceUrl}/api/tickets/reservation-confirmed`, reservation, { timeout: 5000 });
    } catch (err) {
      console.error('Erreur appel ticket-service:', err.message);
    }

    res.json({ success: true, message: 'Réservation confirmée', reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const reservations = getReservations();
    const reservation = reservations.find(r => r.id === req.params.id);

    if (!reservation || reservation.userId !== req.user.id) {
      return res.status(404).json({ 
        success: false, 
        message: 'Non trouvée ou accès refusé' 
      });
    }

    res.json({ success: true, reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. [BONUS] Toutes les réservations (pour admin/debug)
router.get('/', (req, res) => {
  try {
    const reservations = getReservations();
    res.json({ 
      success: true, 
      count: reservations.length, 
      reservations 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;