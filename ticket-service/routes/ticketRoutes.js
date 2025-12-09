const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// POST - Traiter le paiement et créer un ticket
router.post('/process-payment', ticketController.processPaymentAndCreateTicket);

// GET - Récupérer un ticket
router.get('/:ticketNumber', ticketController.getTicket);

// GET - Télécharger le PDF d'un ticket
router.get('/pdf/:ticketNumber', ticketController.downloadTicketPDF);

module.exports = router;