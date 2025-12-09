const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

async function generateTicketPDF(ticketData) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(28)
         .fillColor('#2196F3')
         .text('🎫 TICKET DE RÉSERVATION', { align: 'center' });
      
      doc.moveDown();
      
      doc.fontSize(16)
         .fillColor('#000')
         .text('Merci pour votre réservation!', { align: 'center' });
      
      doc.moveDown(2);

      // Ligne de séparation
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .stroke();
      
      doc.moveDown();

      // Informations du ticket
      doc.fontSize(12).fillColor('#333');
      
      doc.text(`Numéro de ticket: ${ticketData.ticketNumber}`, { bold: true });
      doc.moveDown(0.5);
      
      doc.text(`Événement: ${ticketData.eventId}`);
      doc.moveDown(0.5);
      
      doc.text(`Nombre de places: ${ticketData.nombrePlaces}`);
      doc.moveDown(0.5);
      
      doc.text(`Date de réservation: ${new Date(ticketData.dateReservation).toLocaleString('fr-FR')}`);
      doc.moveDown(0.5);
      
      doc.text(`Montant payé: ${ticketData.amount}€`);
      doc.moveDown(0.5);
      
      doc.text(`Transaction ID: ${ticketData.transactionId}`);
      
      doc.moveDown(2);

      // QR Code
      const qrCodeData = await QRCode.toDataURL(ticketData.ticketNumber);
      const qrImage = Buffer.from(qrCodeData.split(',')[1], 'base64');
      
      doc.image(qrImage, {
        fit: [150, 150],
        align: 'center',
        valign: 'center'
      });

      doc.moveDown(2);

      // Footer
      doc.fontSize(10)
         .fillColor('#777')
         .text('Présentez ce ticket à l\'entrée de l\'événement', { align: 'center' });
      
      doc.text('Ce ticket est personnel et non transférable', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateTicketPDF };