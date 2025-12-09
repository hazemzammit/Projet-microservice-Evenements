const axios = require('axios');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

// Resolve tickets file path: prefer ticket-service/data/tickets.json, otherwise use workspace root data/tickets.json
const TICKETS_FILE = fsSync.existsSync(path.join(__dirname, '../data/tickets.json'))
  ? path.join(__dirname, '../data/tickets.json')
  : path.join(__dirname, '../../data/tickets.json');

// Helper: Lire les tickets
async function getTickets() {
  try {
    const data = await fs.readFile(TICKETS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    return [];
  }
}

// Helper: Sauvegarder les tickets
async function saveTickets(tickets) {
  await fs.writeFile(TICKETS_FILE, JSON.stringify(tickets, null, 2), 'utf8');
}

// Helper: Générer un numéro de ticket
function generateTicketNumber() {
  return `TKT-${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
}

// Endpoint principal: Traiter le paiement et créer le ticket
async function processPaymentAndCreateTicket(req, res) {
  const { reservationId, amount, paymentMethodId, userEmail } = req.body;

  // Validation
  if (!reservationId || !amount || !paymentMethodId || !userEmail) {
    return res.status(400).json({
      success: false,
      message: 'Données manquantes (reservationId, amount, paymentMethodId, userEmail requis)'
    });
  }

  try {
    console.log(`\n🎫 Début traitement pour réservation ${reservationId}`);
    console.log('📦 Body reçu:', { reservationId, amount, paymentMethodId, userEmail });

    // Étape 1: Récupérer la réservation
    console.log('1️⃣ Récupération de la réservation...');
    console.log('URL appelée:', `${process.env.RESERVATION_SERVICE_URL}/api/reservations/${reservationId}`);
    
    const reservationResponse = await axios.get(
      `${process.env.RESERVATION_SERVICE_URL}/api/reservations/${reservationId}`
    );

    console.log('Réponse réservation:', reservationResponse.data);
    
    if (!reservationResponse.data.success) {
      return res.status(404).json({
        success: false,
        message: 'Réservation non trouvée'
      });
    }

    const reservation = reservationResponse.data.reservation;
    console.log(`✅ Réservation trouvée:`, reservation);

    // Étape 2: Traiter le paiement
    console.log('2️⃣ Traitement du paiement Stripe...');
    console.log('Montant:', amount, 'Méthode:', paymentMethodId);
    
    const payment = await paymentService.processPayment(amount, 'eur', paymentMethodId);
    console.log('Résultat paiement:', payment);

    if (!payment.success) {
      console.error('❌ Paiement échoué:', payment.error);
      return res.status(400).json({
        success: false,
        message: 'Paiement échoué',
        error: payment.error
      });
    }

    console.log(`✅ Paiement réussi: ${payment.transactionId}`);

    // Étape 3: Créer le ticket
    console.log('3️⃣ Création du ticket...');
    const ticket = {
      ticketNumber: generateTicketNumber(),
      reservationId,
      userId: reservation.userId,
      eventId: reservation.eventId,
      nombrePlaces: reservation.nombrePlaces,
      transactionId: payment.transactionId,
      amount,
      dateCreation: new Date().toISOString(),
      dateReservation: reservation.dateReservation
    };

    console.log('Ticket créé:', ticket);

    const tickets = await getTickets();
    tickets.push(ticket);
    await saveTickets(tickets);
    console.log(`✅ Ticket sauvegardé: ${ticket.ticketNumber}`);

    // Étape 4: Confirmer la réservation
    console.log('4️⃣ Confirmation de la réservation...');
    try {
      const confirmResponse = await axios.put(
        `${process.env.RESERVATION_SERVICE_URL}/api/reservations/confirm/${reservationId}`
      );
      console.log('Confirmation réponse:', confirmResponse.data);
    } catch (confirmError) {
      console.warn('⚠️  Erreur confirmation réservation:', confirmError.message);
    }

    // Étape 5: Envoyer email de confirmation
    console.log('5️⃣ Envoi email de confirmation...');
    try {
      await emailService.sendConfirmationEmail(userEmail, reservation);
      console.log('✅ Email confirmation envoyé');
    } catch (emailError) {
      console.warn('⚠️  Erreur email confirmation:', emailError.message);
    }

    // Étape 6: Générer le PDF
    console.log('6️⃣ Génération du PDF...');
    let pdfBuffer;
    try {
      pdfBuffer = await pdfService.generateTicketPDF(ticket);
      console.log('✅ PDF généré');
    } catch (pdfError) {
      console.warn('⚠️  Erreur génération PDF:', pdfError.message);
      pdfBuffer = null;
    }

    // Étape 7: Envoyer le ticket par email
    console.log('7️⃣ Envoi du ticket par email...');
    try {
      if (pdfBuffer) {
        await emailService.sendTicketEmail(userEmail, pdfBuffer, ticket);
        console.log('✅ Email ticket envoyé');
      } else {
        console.log('⚠️  Pas de PDF, email non envoyé');
      }
    } catch (emailError) {
      console.warn('⚠️  Erreur email ticket:', emailError.message);
    }

    console.log('🎉 Processus terminé avec succès!\n');

    res.json({
      success: true,
      message: 'Ticket créé et envoyé par email',
      ticket: {
        ticketNumber: ticket.ticketNumber,
        reservationId: ticket.reservationId,
        transactionId: ticket.transactionId,
        amount: ticket.amount,
        dateCreation: ticket.dateCreation
      }
    });

  } catch (error) {
    console.error('❌ ERREUR GLOBALE:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement',
      error: error.message || 'Unknown error'
    });
  }
}

// Récupérer un ticket par son numéro
async function getTicket(req, res) {
  try {
    const { ticketNumber } = req.params;
    const tickets = await getTickets();
    const ticket = tickets.find(t => t.ticketNumber === ticketNumber);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// Télécharger le PDF d'un ticket
async function downloadTicketPDF(req, res) {
  try {
    const { ticketNumber } = req.params;
    const tickets = await getTickets();
    const ticket = tickets.find(t => t.ticketNumber === ticketNumber);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket non trouvé'
      });
    }

    const pdfBuffer = await pdfService.generateTicketPDF(ticket);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${ticketNumber}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// EXPORT DES FONCTIONS (TRÈS IMPORTANT !!!)
module.exports = {
  processPaymentAndCreateTicket,
  getTicket,
  downloadTicketPDF
};