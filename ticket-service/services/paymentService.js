require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function processPayment(amount, currency = 'eur', paymentMethodId) {
  try {
    console.log('🔑 Clé Stripe utilisée:', process.env.STRIPE_SECRET_KEY?.substring(0, 20) + '...');
    console.log('💰 Processing payment:', { amount, currency, paymentMethodId });

    const amountInCents = Math.round(amount * 100);

    // CORRECTION ICI : Ajoute allow_redirects: 'never'
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'  // <-- IMPORTANT
      }
    });

    console.log('✅ Payment successful:', paymentIntent.id);
    
    return {
      success: true,
      transactionId: paymentIntent.id,
      status: paymentIntent.status
    };
  } catch (error) {
    console.error('❌ Stripe payment error:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { processPayment };