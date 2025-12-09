const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email 1: Confirmation de paiement
async function sendConfirmationEmail(userEmail, reservationDetails) {
  try {
    await transporter.sendMail({
      from: `"Système de Réservation" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '✅ Paiement confirmé - Réservation validée',
      html: `
        <h2 style="color: #4CAF50;">Votre paiement a été confirmé!</h2>
        <p>Bonjour,</p>
        <p>Votre réservation pour <strong>${reservationDetails.eventId}</strong> a été confirmée.</p>
        <p><strong>Nombre de places:</strong> ${reservationDetails.nombrePlaces}</p>
        <p><strong>Statut:</strong> ${reservationDetails.statut}</p>
        <p>Vous recevrez votre ticket par email dans quelques instants.</p>
        <hr>
        <p style="color: #777; font-size: 12px;">Merci de votre confiance!</p>
      `
    });
    console.log('✅ Email de confirmation envoyé');
  } catch (error) {
    console.error('❌ Erreur envoi email confirmation:', error.message);
    throw error;
  }
}

// Email 2: Envoi du ticket avec PDF
async function sendTicketEmail(userEmail, pdfBuffer, ticketDetails) {
  try {
    await transporter.sendMail({
      from: `"Système de Réservation" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '🎫 Votre ticket de réservation',
      html: `
        <h2 style="color: #2196F3;">Merci pour votre réservation!</h2>
        <p>Veuillez trouver ci-joint votre ticket électronique.</p>
        <p><strong>Numéro de ticket:</strong> ${ticketDetails.ticketNumber}</p>
        <p><strong>Montant payé:</strong> ${ticketDetails.amount}€</p>
        <p>Présentez ce ticket le jour de l'événement.</p>
        <hr>
        <p style="color: #777; font-size: 12px;">Conservez précieusement ce ticket.</p>
      `,
      attachments: [{
        filename: `ticket-${ticketDetails.ticketNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
    console.log('✅ Email avec PDF envoyé');
  } catch (error) {
    console.error('❌ Erreur envoi email ticket:', error.message);
    throw error;
  }
}

module.exports = { sendConfirmationEmail, sendTicketEmail };