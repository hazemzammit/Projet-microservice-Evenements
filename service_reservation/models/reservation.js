// reservation-service/models/reservation.js
const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  eventId: { type: String, required: true },
  nombrePlaces: { type: Number, required: true, min: 1 },
  statut: { 
    type: String, 
    enum: ['en attente', 'confirmée', 'annulée'], 
    default: 'en attente' 
  },
  dateReservation: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reservation', reservationSchema);